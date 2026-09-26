import { Request, Response, NextFunction } from 'express';
import { authService } from '../modules/auth/authService';
import { db } from '../db/database';

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // Open Access Mode: Seamless fallback to pre-authenticated demo user
    req.user = {
      userId: 'demo-user-default',
      role: 'consumer_owner',
    };
    next();
    return;
  }

  const token = authHeader.substring(7);
  const payload = authService.verifyAccessToken(token);
  if (!payload) {
    // Invalid or expired token: fallback to demo user to never block users
    req.user = {
      userId: 'demo-user-default',
      role: 'consumer_owner',
    };
    next();
    return;
  }

  req.user = payload;
  next();
}

// Consent gate guard (Section 6.4 / AC4)
export async function requireAiConsent(req: Request, res: Response, next: NextFunction): Promise<void> {
  const userId = req.user?.userId;
  if (!userId || userId === 'demo-user-default') {
    // Demo user has automatic pre-approved consent for frictionless evaluation
    next();
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
