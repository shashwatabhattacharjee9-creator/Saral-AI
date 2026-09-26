import { Router, Request, Response } from 'express';
import { storage } from '../storage/storage';

export const storageRouter = Router();

// GET /api/v1/storage/file?key=...&expires=...&sig=...
storageRouter.get('/file', async (req: Request, res: Response) => {
  const key = req.query.key as string;
  const expires = req.query.expires as string;
  const sig = req.query.sig as string;

  if (!key || !expires || !sig) {
    res.status(403).json({
      error: {
        code: 'forbidden',
        message: 'Missing signed URL parameters.',
        requestId: req.requestId,
      },
    });
    return;
  }

  const isValid = storage.verifySignedUrl(key, expires, sig);
  if (!isValid) {
    res.status(403).json({
      error: {
        code: 'forbidden',
        message: 'Signed URL is invalid or has expired.',
        requestId: req.requestId,
      },
    });
    return;
  }

  const buffer = await storage.getFile(key);
  if (!buffer) {
    res.status(404).json({
      error: {
        code: 'not_found',
        message: 'File not found.',
        requestId: req.requestId,
      },
    });
    return;
  }

  // Set appropriate content type
  if (key.endsWith('.jpg') || key.endsWith('.jpeg')) {
    res.setHeader('Content-Type', 'image/jpeg');
  } else if (key.endsWith('.png')) {
    res.setHeader('Content-Type', 'image/png');
  } else if (key.endsWith('.wav')) {
    res.setHeader('Content-Type', 'audio/wav');
  } else if (key.endsWith('.json')) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="saral_export.json"`);
  }

  res.send(buffer);
});
