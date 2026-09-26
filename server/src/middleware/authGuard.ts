import { Request, Response, NextFunction } from 'express';
import { authService } from '../modules/auth/authService';
import { db } from '../db/database';

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: {
        code: 'unauthenticated',
        message: 'Missing or malformed Authorization header.',
        requestId: req.requestId,
      },
    });
    return;
  }

  const token = authHeader.substring(7);
  const payload = authService.verifyAccessToken(token);
  if (!payload) {
    res.status(401).json({
      error: {
        code: 'unauthenticated',
        message: 'Invalid or expired access token.',
        requestId: req.requestId,
      },
    });
    return;
  }

  req.user = payload;
  next();
}

// Consent gate guard (Section 6.4 / AC4)
export async function requireAiConsent(req: Request, res: Response, next: NextFunction): Promise<void> {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({
      error: {
        code: 'unauthenticated',
        message: 'Authentication required.',
        requestId: req.requestId,
      },
    });
    return;
  }

  const hasConsent = await db.hasActiveThirdPartyConsent(userId);
  if (!hasConsent) {
    res.status(403).json({
      error: {
        code: 'consent_required',
        message: 'Third-party AI processing consent is required to upload and analyze documents.',
        requestId: req.requestId,
      },
    });
    return;
  }

  next();
}
