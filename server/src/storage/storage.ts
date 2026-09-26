import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { config } from '../config';

export class StorageService {
  private baseDir: string;

  constructor(baseDir: string = config.storageDir) {
    this.baseDir = path.resolve(baseDir);
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  computeHash(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  async savePhoto(patientProfileId: string, scanId: string, pageNumber: number, buffer: Buffer): Promise<string> {
    const key = `photos/${patientProfileId}/${scanId}/page-${pageNumber}.jpg`;
    const fullPath = path.join(this.baseDir, key);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, buffer);
    return key;
  }

  async saveAudio(scanId: string, languageCode: string, buffer: Buffer): Promise<string> {
    const key = `audio/${scanId}/${languageCode}.wav`;
    const fullPath = path.join(this.baseDir, key);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, buffer);
    return key;
  }

  async saveExport(userId: string, exportId: string, data: string): Promise<string> {
    const key = `exports/${userId}/${exportId}.json`;
    const fullPath = path.join(this.baseDir, key);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, data, 'utf-8');
    return key;
  }

  async getFile(key: string): Promise<Buffer | null> {
    const fullPath = path.join(this.baseDir, key);
    if (!fs.existsSync(fullPath)) return null;
    return fs.readFileSync(fullPath);
  }

  async deleteFile(key: string): Promise<boolean> {
    const fullPath = path.join(this.baseDir, key);
    if (fs.existsSync(fullPath)) {
      try {
        fs.unlinkSync(fullPath);
        return true;
      } catch {
        return false;
      }
    }
    return true;
  }

  getSignedUrl(key: string, expiryMinutes: number = 15): string {
    // Generate signed, time-limited URL per Section 3.9
    const expires = Date.now() + expiryMinutes * 60 * 1000;
    const hmac = crypto.createHmac('sha256', config.jwtSecret);
    const signature = hmac.update(`${key}:${expires}`).digest('hex');
    return `${config.baseUrl}/api/v1/storage/file?key=${encodeURIComponent(key)}&expires=${expires}&sig=${signature}`;
  }

  verifySignedUrl(key: string, expiresStr: string, sig: string): boolean {
    const expires = parseInt(expiresStr, 10);
    if (isNaN(expires) || Date.now() > expires) return false;
    const hmac = crypto.createHmac('sha256', config.jwtSecret);
    const expectedSig = hmac.update(`${key}:${expires}`).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(signatureCompareClean(sig)), Buffer.from(signatureCompareClean(expectedSig)));
  }
}

function signatureCompareClean(s: string): string {
  return s.padEnd(64, '0').slice(0, 64);
}

export const storage = new StorageService();
