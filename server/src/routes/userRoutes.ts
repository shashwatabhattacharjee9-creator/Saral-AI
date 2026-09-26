import { Router, Request, Response } from 'express';
import { db } from '../db/database';
import { storage } from '../storage/storage';
import { requireAuth } from '../middleware/authGuard';
import { v4 as uuidv4 } from 'uuid';

export const userRouter = Router();

// GET /api/v1/users/me/consent-status (PRD Section 6.4 & 7.6)
userRouter.get('/me/consent-status', requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.userId;

  const dataProcessing = await db.getLatestConsentForUser(userId, 'data_processing');
  const aiProcessing = await db.getLatestConsentForUser(userId, 'ai_processing_third_party');
  const marketing = await db.getLatestConsentForUser(userId, 'marketing_communication');

  res.status(200).json({
    dataProcessing: Boolean(dataProcessing?.granted),
    aiProcessingThirdParty: Boolean(aiProcessing?.granted),
    marketingCommunication: Boolean(marketing?.granted),
  });
});

// POST /api/v1/users/me/consent (PRD Section 6.4 & 7.6)
userRouter.post('/me/consent', requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { consentType, granted } = req.body || {};

  const validTypes = ['data_processing', 'ai_processing_third_party', 'marketing_communication'];
  if (!consentType || !validTypes.includes(consentType) || typeof granted !== 'boolean') {
    res.status(400).json({
      error: {
        code: 'validation_error',
        message: 'consentType must be one of data_processing, ai_processing_third_party, marketing_communication and granted must be a boolean.',
        requestId: req.requestId,
      },
    });
    return;
  }

  const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
  const record = await db.addConsentRecord({
    userId,
    consentType,
    granted,
    consentVersion: 'dpdp-v1.0-2026',
    ipAddress: ip,
  });

  res.status(201).json(record);
});

// GET /api/v1/users/me/data-export (PRD Section 4.6 & 7.6)
userRouter.get('/me/data-export', requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const user = await db.findUserById(userId);
  if (!user) {
    res.status(404).json({
      error: { code: 'not_found', message: 'User not found.', requestId: req.requestId },
    });
    return;
  }

  const profiles = await db.listPatientProfilesByOwner(userId);
  const allScans = [];
  for (const prof of profiles) {
    const scans = await db.listScansByProfile(prof.id);
    for (const scan of scans) {
      const result = await db.findExtractionResultByScanId(scan.id);
      allScans.push({ scan, result });
    }
  }

  const userConsents = db.consentRecords.filter((r) => r.userId === userId);

  const exportPayload = {
    exportedAt: new Date().toISOString(),
    user: {
      id: user.id,
      phoneNumber: user.phoneNumber,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
    },
    profiles,
    scans: allScans,
    consents: userConsents,
  };

  const exportId = uuidv4();
  const exportKey = await storage.saveExport(userId, exportId, JSON.stringify(exportPayload, null, 2));
  const downloadUrl = storage.getSignedUrl(exportKey, 60); // 1 hour valid

  res.status(202).json({
    status: 'enqueued',
    exportId,
    downloadUrl,
    exportData: exportPayload, // Return inline for immediate convenience
  });
});

// DELETE /api/v1/users/me (DPDP Right to Erasure Cascade, Section 4.7 / AC5)
userRouter.delete('/me', requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.userId;

  try {
    const erasureResult = await db.executeUserErasure(userId);

    // Also delete S3/local files for removed scans
    for (const scanId of erasureResult.deletedScans) {
      // Clean audio if any
      await storage.deleteFile(`audio/${scanId}/hi-IN.wav`);
      await storage.deleteFile(`audio/${scanId}/ta-IN.wav`);
      await storage.deleteFile(`audio/${scanId}/en-IN.wav`);
    }

    res.status(202).json({
      status: 'erasure_completed',
      message: 'User account and solely-owned medical data have been erased per DPDP Act retention requirements. Regulatory consent logs are retained anonymized.',
      deletedProfilesCount: erasureResult.deletedProfiles.length,
      deletedScansCount: erasureResult.deletedScans.length,
    });
  } catch (err: any) {
    res.status(500).json({
      error: {
        code: 'internal_error',
        message: err.message || 'Erasure execution failed.',
        requestId: req.requestId,
      },
    });
  }
});
