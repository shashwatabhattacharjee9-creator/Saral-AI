import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { db } from '../db/database';
import { requireAuth } from '../middleware/authGuard';

export const shareRouter = Router();

// POST /api/v1/share-grants/:token/accept (PRD Section 7.6 & AC9)
shareRouter.post('/:token/accept', requireAuth, async (req: Request, res: Response) => {
  const token = String(req.params.token);
  const userId = req.user!.userId;

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const grant = await db.findShareGrantByTokenHash(tokenHash);

  if (!grant) {
    res.status(404).json({
      error: {
        code: 'not_found',
        message: 'Share grant not found or invalid token.',
        requestId: req.requestId,
      },
    });
    return;
  }

  // Check expiration (AC9: returns 410 and updates status to expired)
  const isExpired = new Date() > new Date(grant.expiresAt) || grant.status === 'expired';
  if (isExpired) {
    await db.updateShareGrant(grant.id, { status: 'expired' });
    res.status(410).json({
      error: {
        code: 'expired',
        message: 'This share link has expired.',
        requestId: req.requestId,
      },
    });
    return;
  }

  if (grant.status === 'revoked') {
    res.status(403).json({
      error: {
        code: 'forbidden',
        message: 'This share link has been revoked by the owner.',
        requestId: req.requestId,
      },
    });
    return;
  }

  // Accept grant
  await db.updateShareGrant(grant.id, {
    status: 'accepted',
    grantedToUserId: userId,
  });

  res.status(200).json({
    status: 'accepted',
    scanId: grant.scanId,
    message: 'Access granted to shared scan.',
  });
});

// GET /api/v1/share-grants/:token (inspect metadata)
shareRouter.get('/:token', async (req: Request, res: Response) => {
  const token = String(req.params.token);
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const grant = await db.findShareGrantByTokenHash(tokenHash);

  if (!grant) {
    res.status(404).json({
      error: {
        code: 'not_found',
        message: 'Share grant not found.',
        requestId: req.requestId,
      },
    });
    return;
  }

  const isExpired = new Date() > new Date(grant.expiresAt);
  res.status(200).json({
    scanId: grant.scanId,
    isExpired,
    status: isExpired ? 'expired' : grant.status,
    expiresAt: grant.expiresAt,
  });
});
