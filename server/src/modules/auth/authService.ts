import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { db } from '../../db/database';
import { redis } from '../../redis/redisService';
import { config } from '../../config';
import { User, UserRole } from '../../../../shared/types';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  // E.164 validation
  isValidPhoneNumber(phone: string): boolean {
    return /^\+[1-9]\d{1,14}$/.test(phone);
  }

  // Request OTP per Section 6.1
  async requestOtp(phoneNumber: string, ip: string): Promise<{ success: boolean; errorStatus?: number; errorMessage?: string; devOtp?: string }> {
    if (!this.isValidPhoneNumber(phoneNumber)) {
      return { success: false, errorStatus: 400, errorMessage: 'Invalid phone number format. Must be E.164 (e.g. +919876543210).' };
    }

    // Rate limiting: max 3 OTP requests per phone number per 10-minute window
    const rateKey = `ratelimit:otp:${phoneNumber}`;
    const attempts = await redis.incr(rateKey, config.rateLimits.otpWindowMs / 1000);
    if (attempts > config.rateLimits.otpPerPhone) {
      return { success: false, errorStatus: 429, errorMessage: 'Too many OTP requests. Please wait 10 minutes.' };
    }

    // Generate 6-digit OTP
    const rawOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(rawOtp, 10);

    // Store in Redis (TTL 5 minutes)
    await redis.set(`otp:${phoneNumber}`, { otpHash, attempts: 0 }, 300);

    // SMS Gateway call (Section 6.1 Step 5)
    console.log(`[SMS Gateway] Delivering OTP ${rawOtp} to ${phoneNumber}`);

    return { success: true, devOtp: config.nodeEnv === 'development' || config.nodeEnv === 'test' ? rawOtp : undefined };
  }

  // Verify OTP per Section 6.1
  async verifyOtp(phoneNumber: string, otpCode: string): Promise<{
    user?: User;
    tokens?: TokenPair;
    errorStatus?: number;
    errorMessage?: string;
  }> {
    const entry = await redis.get<{ otpHash: string; attempts: number }>(`otp:${phoneNumber}`);
    if (!entry) {
      return { errorStatus: 410, errorMessage: 'OTP has expired or does not exist. Please request a new OTP.' };
    }

    if (entry.attempts >= 5) {
      await redis.del(`otp:${phoneNumber}`);
      return { errorStatus: 429, errorMessage: 'Too many incorrect attempts. Please request a new OTP.' };
    }

    const isMatch = await bcrypt.compare(otpCode, entry.otpHash);
    if (!isMatch) {
      entry.attempts += 1;
      await redis.set(`otp:${phoneNumber}`, entry, 300);
      return { errorStatus: 401, errorMessage: 'Invalid OTP code.' };
    }

    // Single-use: delete OTP entry
    await redis.del(`otp:${phoneNumber}`);

    // Check or create user
    let user = await db.findUserByPhone(phoneNumber);
    if (!user) {
      user = await db.createUser({
        phoneNumber,
        displayName: `User ${phoneNumber.slice(-4)}`,
        preferredUiLanguage: 'en-IN',
        role: 'consumer_owner',
        status: 'active',
      });
    }

    const tokens = await this.generateTokens(user.id, user.role);
    return { user, tokens };
  }

  // Email/Password login for org staff (Section 8.1)
  async loginWithEmail(email: string, password: string): Promise<{
    user?: User;
    tokens?: TokenPair;
    errorStatus?: number;
    errorMessage?: string;
  }> {
    const user = await db.findUserByEmail(email);
    if (!user || !user.passwordHash) {
      return { errorStatus: 401, errorMessage: 'Invalid email or password.' };
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return { errorStatus: 401, errorMessage: 'Invalid email or password.' };
    }

    const tokens = await this.generateTokens(user.id, user.role);
    return { user, tokens };
  }

  // Generate 15-minute access token and 30-day refresh token (Section 8.2)
  async generateTokens(userId: string, role: UserRole): Promise<TokenPair> {
    const accessToken = jwt.sign({ userId, role }, config.jwtSecret, {
      expiresIn: '15m',
    });

    const rawRefreshToken = crypto.randomBytes(32).toString('hex');
    const refreshHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');

    // Store in Redis with 30-day expiry
    await redis.set(`session:refresh:${refreshHash}`, { userId, role }, 30 * 24 * 3600);

    return {
      accessToken,
      refreshToken: rawRefreshToken,
    };
  }

  async refreshToken(rawRefreshToken: string): Promise<{
    tokens?: TokenPair;
    errorStatus?: number;
    errorMessage?: string;
  }> {
    const refreshHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');
    const session = await redis.get<{ userId: string; role: UserRole }>(`session:refresh:${refreshHash}`);

    if (!session) {
      return { errorStatus: 401, errorMessage: 'Invalid or expired refresh token.' };
    }

    // Rotate refresh token (Section 8.2)
    await redis.del(`session:refresh:${refreshHash}`);
    const newTokens = await this.generateTokens(session.userId, session.role);
    return { tokens: newTokens };
  }

  verifyAccessToken(token: string): { userId: string; role: UserRole } | null {
    try {
      const decoded = jwt.verify(token, config.jwtSecret) as any;
      return { userId: decoded.userId, role: decoded.role };
    } catch {
      return null;
    }
  }
}

export const authService = new AuthService();
