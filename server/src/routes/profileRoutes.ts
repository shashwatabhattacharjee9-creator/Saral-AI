import { Router, Request, Response } from 'express';
import { db } from '../db/database';
import { requireAuth } from '../middleware/authGuard';
import { SupportedLanguageCode, SUPPORTED_LANGUAGES } from '../../../shared/types';

export const profileRouter = Router();

// GET /api/v1/patient-profiles
profileRouter.get('/', requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const userRole = req.user!.role;

  let profiles = [];
  if (userRole === 'org_member') {
    profiles = await db.listCaseloadForMember(userId);
  } else {
    profiles = await db.listPatientProfilesByOwner(userId);
  }

  res.status(200).json({
    data: profiles,
    nextCursor: null,
  });
});

// POST /api/v1/patient-profiles
profileRouter.post('/', requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { displayName, dateOfBirth, defaultTargetLanguageCode } = req.body || {};

  if (!displayName || typeof displayName !== 'string' || displayName.trim().length === 0) {
    res.status(400).json({
      error: {
        code: 'validation_error',
        message: 'displayName is required.',
        requestId: req.requestId,
      },
    });
    return;
  }

  const langCode: SupportedLanguageCode = defaultTargetLanguageCode || 'hi-IN';
  const isValidLang = SUPPORTED_LANGUAGES.some((l) => l.code === langCode);
  if (!isValidLang) {
    res.status(400).json({
      error: {
        code: 'validation_error',
        message: `Unsupported language code: ${langCode}`,
        requestId: req.requestId,
      },
    });
    return;
  }

  const profile = await db.createPatientProfile({
    ownerUserId: userId,
    organizationId: null,
    displayName: displayName.trim(),
    dateOfBirth: dateOfBirth || null,
    defaultTargetLanguage: langCode,
  });

  res.status(201).json(profile);
});

// GET /api/v1/patient-profiles/:profileId/scans
profileRouter.get('/:profileId/scans', requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const userRole = req.user!.role;
  const profileId = String(req.params.profileId);

  const profile = await db.findPatientProfileById(profileId);
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

  // Authorization check (AC6)
  if (userRole === 'org_member') {
    const isAssigned = await db.isCaseloadAssigned(profileId, userId);
    if (!isAssigned) {
      res.status(404).json({
        error: {
          code: 'not_found',
          message: 'Patient profile not found in your assigned caseload.',
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

  const scans = await db.listScansByProfile(profileId);
  res.status(200).json({
    data: scans,
    nextCursor: null,
  });
});
