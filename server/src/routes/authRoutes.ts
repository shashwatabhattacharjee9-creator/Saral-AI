import { Router, Request, Response } from 'express';
import { authService } from '../modules/auth/authService';
import { rateLimiter } from '../middleware/rateLimiter';

export const authRouter = Router();

// POST /api/v1/auth/otp/request
authRouter.post('/otp/request', rateLimiter('auth'), async (req: Request, res: Response) => {
  const { phoneNumber } = req.body || {};
  if (!phoneNumber) {
    res.status(400).json({
      error: {
        code: 'validation_error',
        message: 'Phone number is required.',
        requestId: req.requestId,
      },
    });
    return;
  }

  const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
  const result = await authService.requestOtp(phoneNumber, ip);

  if (!result.success) {
    res.status(result.errorStatus || 400).json({
      error: {
        code: result.errorStatus === 429 ? 'rate_limited' : 'validation_error',
        message: result.errorMessage || 'Failed to send OTP.',
        requestId: req.requestId,
      },
    });
    return;
  }

  // Response 202 per PRD Section 7.6
  res.status(202).json({
    status: 'accepted',
    message: 'OTP has been sent to your phone number.',
    devOtp: result.devOtp, // available for test convenience in dev
  });
});

// POST /api/v1/auth/otp/verify
authRouter.post('/otp/verify', rateLimiter('auth'), async (req: Request, res: Response) => {
  const { phoneNumber, otpCode } = req.body || {};
  if (!phoneNumber || !otpCode) {
    res.status(400).json({
      error: {
        code: 'validation_error',
        message: 'Both phoneNumber and otpCode are required.',
        requestId: req.requestId,
      },
    });
    return;
  }

  const result = await authService.verifyOtp(phoneNumber, otpCode);
  if (result.errorStatus || !result.user || !result.tokens) {
    res.status(result.errorStatus || 401).json({
      error: {
        code: result.errorStatus === 410 ? 'expired_otp' : result.errorStatus === 429 ? 'rate_limited' : 'unauthenticated',
        message: result.errorMessage || 'OTP verification failed.',
        requestId: req.requestId,
      },
    });
    return;
  }

  res.status(200).json({
    accessToken: result.tokens.accessToken,
    refreshToken: result.tokens.refreshToken,
    user: result.user,
  });
});

// POST /api/v1/auth/login (email/password for org staff)
authRouter.post('/login', rateLimiter('auth'), async (req: Request, res: Response) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    res.status(400).json({
      error: {
        code: 'validation_error',
        message: 'Email and password are required.',
        requestId: req.requestId,
      },
    });
    return;
  }

  const result = await authService.loginWithEmail(email, password);
  if (result.errorStatus || !result.user || !result.tokens) {
    res.status(result.errorStatus || 401).json({
      error: {
        code: 'unauthenticated',
        message: result.errorMessage || 'Invalid credentials.',
        requestId: req.requestId,
      },
    });
    return;
  }

  res.status(200).json({
    accessToken: result.tokens.accessToken,
    refreshToken: result.tokens.refreshToken,
    user: result.user,
  });
});

// POST /api/v1/auth/refresh
authRouter.post('/refresh', async (req: Request, res: Response) => {
  const { refreshToken } = req.body || {};
  if (!refreshToken) {
    res.status(400).json({
      error: {
        code: 'validation_error',
        message: 'refreshToken is required.',
        requestId: req.requestId,
      },
    });
    return;
  }

  const result = await authService.refreshToken(refreshToken);
  if (result.errorStatus || !result.tokens) {
    res.status(result.errorStatus || 401).json({
      error: {
        code: 'unauthenticated',
        message: result.errorMessage || 'Could not refresh session.',
        requestId: req.requestId,
      },
    });
    return;
  }

  res.status(200).json(result.tokens);
});
