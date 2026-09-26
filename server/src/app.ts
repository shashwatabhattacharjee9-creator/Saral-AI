import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { correlationIdMiddleware } from './middleware/correlationId';
import { authRouter } from './routes/authRoutes';
import { profileRouter } from './routes/profileRoutes';
import { scanRouter } from './routes/scanRoutes';
import { shareRouter } from './routes/shareRoutes';
import { userRouter } from './routes/userRoutes';
import { orgRouter } from './routes/orgRoutes';
import { storageRouter } from './routes/storageRoutes';
import { healthRouter } from './routes/healthRoutes';

export const app = express();

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Attach X-Request-Id to every request
app.use(correlationIdMiddleware);

// Structured logging per Section 12.1
// Hard rule: clinical text and medicine names are never logged.
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const durationMs = Date.now() - start;
    const logPayload = {
      timestamp: new Date().toISOString(),
      level: res.statusCode >= 500 ? 'ERROR' : res.statusCode >= 400 ? 'WARN' : 'INFO',
      requestId: req.requestId,
      userId: req.user?.userId || 'anonymous',
      route: `${req.method} ${req.originalUrl || req.url}`,
      status: res.statusCode,
      durationMs,
      message: `Request processed with status ${res.statusCode}`,
    };
    if (res.statusCode >= 400) {
      console.log(JSON.stringify(logPayload));
    }
  });
  next();
});

// Health routes
app.use('/health', healthRouter);

// API v1 routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/patient-profiles', profileRouter);
app.use('/api/v1/scans', scanRouter);
app.use('/api/v1/share-grants', shareRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/organizations', orgRouter);
app.use('/api/v1/storage', storageRouter);

// 404 Handler per Section 7.1 envelope
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: {
      code: 'not_found',
      message: `Route ${req.method} ${req.originalUrl} not found.`,
      requestId: req.requestId,
    },
  });
});

// Centralized error handler per Section 7.1
app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({
    error: {
      code: err.code || 'internal_error',
      message: err.message || 'An internal server error occurred.',
      requestId: req.requestId,
    },
  });
});
