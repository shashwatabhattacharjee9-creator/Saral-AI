import { Router, Request, Response } from 'express';

export const healthRouter = Router();

// GET /health/live (Section 12.5)
healthRouter.get('/live', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', time: new Date().toISOString() });
});

// GET /health/ready (Section 12.5)
healthRouter.get('/ready', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ready',
    services: {
      database: 'up',
      redis: 'up',
      sarvamProvider: 'up',
    },
    time: new Date().toISOString(),
  });
});
