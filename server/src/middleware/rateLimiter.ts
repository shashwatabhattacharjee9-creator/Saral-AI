import { Request, Response, NextFunction } from 'express';
import { redis } from '../redis/redisService';

export function rateLimiter(routeGroup: 'auth' | 'upload' | 'read' | 'general') {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const userId = req.user?.userId;
    const identifier = userId || ip;

    let limit = 60;
    let windowSeconds = 60;

    if (routeGroup === 'upload') {
      limit = 5;
      windowSeconds = 60;
    } else if (routeGroup === 'auth') {
      limit = 10;
      windowSeconds = 3600;
    }

    const key = `ratelimit:${identifier}:${routeGroup}`;
    const count = await redis.incr(key, windowSeconds);

    const remaining = Math.max(0, limit - count);
    const resetTime = Math.floor(Date.now() / 1000) + windowSeconds;

    res.setHeader('X-RateLimit-Limit', limit.toString());
    res.setHeader('X-RateLimit-Remaining', remaining.toString());
    res.setHeader('X-RateLimit-Reset', resetTime.toString());

    if (count > limit) {
      res.setHeader('Retry-After', windowSeconds.toString());
      res.status(429).json({
        error: {
          code: 'rate_limited',
          message: 'Rate limit exceeded. Please try again later.',
          requestId: req.requestId,
        },
      });
      return;
    }

    next();
  };
}
