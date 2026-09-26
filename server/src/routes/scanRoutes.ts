import { Router, Request, Response } from 'express';
import multer from 'multer';
import crypto from 'crypto';
import { db } from '../db/database';
import { redis } from '../redis/redisService';
import { storage } from '../storage/storage';
import { scanQueue } from '../modules/worker/queue';
import { extractionWorker } from '../modules/worker/extractionWorker';
import { requireAuth, requireAiConsent } from '../middleware/authGuard';
import { rateLimiter } from '../middleware/rateLimiter';
import { SUPPORTED_LANGUAGES, DocumentType, SupportedLanguageCode } from '../../../shared/types';
import { config } from '../config';

const upload = multer({
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit per Section 6.2 Step 5
  storage: multer.memoryStorage(),
});

export const scanRouter = Router();

// POST /api/v1/scans (creates Scan shell)
scanRouter.post('/', requireAuth, requireAiConsent, rateLimiter('upload'), async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const userRole = req.user!.role;
  const { patientProfileId, documentType, pageCount, targetLanguageCode } = req.body || {};

  // 1. Validation
  if (!patientProfileId || !documentType || !targetLanguageCode) {
    res.status(400).json({
      error: {
        code: 'validation_error',
        message: 'patientProfileId, documentType, and targetLanguageCode are required.',
        requestId: req.requestId,
      },
    });
    return;
  }

  const validDocTypes: DocumentType[] = ['prescription', 'discharge_summary'];
  if (!validDocTypes.includes(documentType)) {
    res.status(400).json({
      error: {
        code: 'validation_error',
        message: `Invalid documentType. Must be one of: ${validDocTypes.join(', ')}`,
        requestId: req.requestId,
      },
    });
    return;
  }

  const pages = parseInt(pageCount || '1', 10);
  if (isNaN(pages) || pages < 1 || pages > 10) {
    res.status(422).json({
      error: {
        code: 'unprocessable',
        message: 'pageCount must be between 1 and 10.',
        requestId: req.requestId,
      },
    });
    return;
  }

  const isValidLang = SUPPORTED_LANGUAGES.some((l) => l.code === targetLanguageCode);
  if (!isValidLang) {
    res.status(400).json({
      error: {
        code: 'validation_error',
        message: `Unsupported targetLanguageCode: ${targetLanguageCode}`,
        requestId: req.requestId,
      },
    });
    return;
  }

  // 2. Authorization check against patient profile (AC6: org member outside caseload gets 404)
  const profile = await db.findPatientProfileById(patientProfileId);
  if (!profile) {
    res.status(404).json({
      error: {
        code: 'not_found',
        message: 'Patient profile not found.',
        requestId: req.requestId,
      },
    });
    return;
  }

  if (userRole === 'org_member') {
    const isAssigned = await db.isCaseloadAssigned(patientProfileId, userId);
    if (!isAssigned) {
      res.status(404).json({
        error: {
          code: 'not_found',
          message: 'Patient profile not in your assigned caseload.',
          requestId: req.requestId,
        },
      });
      return;
    }
  } else if (profile.ownerUserId !== userId && userRole !== 'platform_admin') {
    res.status(404).json({
      error: {
        code: 'not_found',
        message: 'Patient profile not found.',
        requestId: req.requestId,
      },
    });
    return;
  }

  // 3. Quota check & decrement in single transaction (Section 4.8 / AC7)
  const quotaReserved = await db.reserveScanQuota('user', userId, 10);
  if (!quotaReserved) {
    res.status(422).json({
      error: {
        code: 'quota_exceeded',
        message: 'Monthly scan quota limit reached for free tier. Please upgrade your plan.',
        requestId: req.requestId,
      },
    });
    return;
  }

  // 4. Create Scan with status 'pending_upload'
  const scan = await db.createScan({
    patientProfileId,
    uploadedByUserId: userId,
    documentType,
    pageCount: pages,
    targetLanguageCode: targetLanguageCode as SupportedLanguageCode,
    sarvamKeySource: 'platform_pooled',
  });

  res.status(201).json({
    scanId: scan.id,
    status: scan.status,
  });
});

// POST /api/v1/scans/:scanId/pages (uploads page images)
scanRouter.post('/:scanId/pages', requireAuth, upload.single('file'), async (req: Request, res: Response) => {
  const scanId = String(req.params.scanId);
  const pageNumber = parseInt(req.body.pageNumber || '1', 10);

  const scan = await db.findScanById(scanId);
  if (!scan) {
    res.status(404).json({
      error: {
        code: 'not_found',
        message: 'Scan not found.',
        requestId: req.requestId,
      },
    });
    return;
  }

  if (scan.status !== 'pending_upload') {
    res.status(409).json({
      error: {
        code: 'conflict',
        message: `Cannot upload pages to scan in status: ${scan.status}`,
        requestId: req.requestId,
      },
    });
    return;
  }

  if (!req.file || !req.file.buffer) {
    res.status(400).json({
      error: {
        code: 'validation_error',
        message: 'Image file is required.',
        requestId: req.requestId,
      },
    });
    return;
  }

  // Magic-byte check (Section 8.4)
  const header = req.file.buffer.subarray(0, 4);
  const isJpg = header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
  const isPng = header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4e && header[3] === 0x47;
  const isWebp = req.file.buffer.subarray(8, 12).toString() === 'WEBP';

  if (!isJpg && !isPng && !isWebp && req.file.mimetype.indexOf('image') === -1) {
    res.status(400).json({
      error: {
        code: 'validation_error',
        message: 'Only image/jpeg, image/png, and image/webp are allowed.',
        requestId: req.requestId,
      },
    });
    return;
  }

  const contentHash = storage.computeHash(req.file.buffer);
  const s3ObjectKey = await storage.savePhoto(scan.patientProfileId, scan.id, pageNumber, req.file.buffer);
  const scanPage = await db.addScanPage(scan.id, pageNumber, s3ObjectKey, contentHash);

  res.status(201).json({
    pageId: scanPage.id,
    pageNumber: scanPage.pageNumber,
  });
});

// POST /api/v1/scans/:scanId/finalize (requires Idempotency-Key)
scanRouter.post('/:scanId/finalize', requireAuth, async (req: Request, res: Response) => {
  const scanId = String(req.params.scanId);
  const idempotencyKey = req.headers['idempotency-key'] as string;

  if (!idempotencyKey) {
    res.status(400).json({
      error: {
        code: 'validation_error',
        message: 'Idempotency-Key header is required for finalize.',
        requestId: req.requestId,
      },
    });
    return;
  }

  // Check 24-hour idempotency lock (PRD Section 4.9 & 7.3)
  const lockKey = `idempotency:finalize:${idempotencyKey}`;
  const existingJob = await redis.get<any>(lockKey);
  if (existingJob) {
    res.status(202).json(existingJob);
    return;
  }

  const scan = await db.findScanById(scanId);
  if (!scan) {
    res.status(404).json({
      error: {
        code: 'not_found',
        message: 'Scan not found.',
        requestId: req.requestId,
      },
    });
    return;
  }

  // Check data consistency rule (Section 4.5): scan_pages count matches declared page_count
  const pages = await db.getPagesForScan(scanId);
  if (pages.length !== scan.pageCount) {
    res.status(422).json({
      error: {
        code: 'unprocessable',
        message: `Declared pageCount is ${scan.pageCount}, but uploaded pages count is ${pages.length}.`,
        requestId: req.requestId,
      },
    });
    return;
  }

  // Transition to queued
  await db.updateScanStatus(scanId, 'queued');

  // Enqueue job to worker queue
  await scanQueue.enqueue({
    scanId: scan.id,
    patientProfileId: scan.patientProfileId,
    targetLanguageCode: scan.targetLanguageCode,
    requestedBy: req.user!.userId,
  });

  const responsePayload = {
    scanId: scan.id,
    status: 'queued',
  };

  // Cache in Redis for 24 hours (86400s)
  await redis.set(lockKey, responsePayload, 86400);

  res.status(202).json(responsePayload);
});

// GET /api/v1/scans/:scanId (polling / retrieval endpoint per Section 7.6)
scanRouter.get('/:scanId', requireAuth, rateLimiter('read'), async (req: Request, res: Response) => {
  const scanId = String(req.params.scanId);
  const userId = req.user!.userId;
  const userRole = req.user!.role;

  const scan = await db.findScanById(scanId);
  if (!scan) {
    res.status(404).json({
      error: {
        code: 'not_found',
        message: 'Scan not found.',
        requestId: req.requestId,
      },
    });
    return;
  }

  // Authorization check (Section 8.3)
  const profile = await db.findPatientProfileById(scan.patientProfileId);
  const isOwner = scan.uploadedByUserId === userId || (profile && profile.ownerUserId === userId);
  let isAuthorized = isOwner || userRole === 'platform_admin';

  if (!isAuthorized && userRole === 'org_member') {
    isAuthorized = await db.isCaseloadAssigned(scan.patientProfileId, userId);
  }

  if (!isAuthorized) {
    // Check share grants
    const grants = await db.listShareGrantsForScan(scanId);
    isAuthorized = grants.some((g) => g.grantedToUserId === userId && g.status === 'accepted');
  }

  if (!isAuthorized) {
    res.status(404).json({
      error: {
        code: 'not_found',
        message: 'Scan not found.',
        requestId: req.requestId,
      },
    });
    return;
  }

  let resultPayload = null;
  if (scan.status === 'completed') {
    const extraction = await db.findExtractionResultByScanId(scanId);
    if (extraction) {
      let audioUrl = null;
      if (extraction.audioS3Key) {
        audioUrl = storage.getSignedUrl(extraction.audioS3Key, 15);
      }

      resultPayload = {
        medicines: extraction.medicines,
        plainExplanationEn: extraction.plainExplanationEn,
        translatedExplanation: extraction.translatedExplanation,
        translationAvailable: extraction.translatedExplanation !== null,
        audioUrl,
        audioAvailable: extraction.audioS3Key !== null,
        ocrConfidence: extraction.ocrConfidence,
        safetyFlags: extraction.safetyFlags,
      };
    }
  }

  res.status(200).json({
    scanId: scan.id,
    status: scan.status,
    documentType: scan.documentType,
    targetLanguageCode: scan.targetLanguageCode,
    pageCount: scan.pageCount,
    failureReason: scan.failureReason,
    createdAt: scan.createdAt,
    processingStartedAt: scan.processingStartedAt,
    processingCompletedAt: scan.processingCompletedAt,
    result: resultPayload,
  });
});

// POST /api/v1/scans/:scanId/audio/retry (retries TTS Step 5 per Section 7.6)
scanRouter.post('/:scanId/audio/retry', requireAuth, async (req: Request, res: Response) => {
  const scanId = String(req.params.scanId);
  const success = await extractionWorker.retryAudio(scanId);

  if (!success) {
    res.status(400).json({
      error: {
        code: 'upstream_error',
        message: 'Failed to synthesize audio retry.',
        requestId: req.requestId,
      },
    });
    return;
  }

  res.status(202).json({
    status: 'accepted',
    message: 'Audio retry synthesized successfully.',
  });
});

// POST /api/v1/scans/:scanId/share (creates 7-day share link per Section 7.6)
scanRouter.post('/:scanId/share', requireAuth, async (req: Request, res: Response) => {
  const scanId = String(req.params.scanId);
  const userId = req.user!.userId;

  const scan = await db.findScanById(scanId);
  if (!scan || scan.uploadedByUserId !== userId) {
    res.status(404).json({
      error: {
        code: 'not_found',
        message: 'Scan not found or not owned by you.',
        requestId: req.requestId,
      },
    });
    return;
  }

  // Check pending invites cap: max 10 per Section 8.8
  const existingGrants = await db.listShareGrantsForScan(scanId);
  const pendingCount = existingGrants.filter((g) => g.status === 'pending').length;
  if (pendingCount >= 10) {
    res.status(429).json({
      error: {
        code: 'rate_limited',
        message: 'Maximum limit of 10 pending share invites reached for this scan.',
        requestId: req.requestId,
      },
    });
    return;
  }

  const rawToken = crypto.randomBytes(24).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(); // 7 days per Section 4.2

  const grant = await db.createShareGrant({
    scanId,
    grantedByUserId: userId,
    inviteTokenHash: tokenHash,
    expiresAt,
  });

  res.status(201).json({
    shareGrantId: grant.id,
    inviteToken: rawToken,
    expiresAt: grant.expiresAt,
    shareUrl: `${config.baseUrl}/share/${rawToken}`,
  });
});
