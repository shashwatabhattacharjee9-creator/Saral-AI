import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'saral-super-secret-jwt-key-for-development-32chars!',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'saral-super-secret-refresh-key-32chars!',
  databaseUrl: process.env.DATABASE_URL || '',
  sarvamApiKey: process.env.SARVAM_API_KEY || '',
  useMockSarvam: process.env.NODE_ENV === 'test' || process.env.USE_MOCK_SARVAM === 'true' || !process.env.SARVAM_API_KEY,
  ocrLowConfidenceRatioThreshold: parseFloat(process.env.OCR_LOW_CONFIDENCE_RATIO_THRESHOLD || '0.34'),
  storageDir: process.env.STORAGE_DIR || './data/storage',
  baseUrl: process.env.BASE_URL || 'http://localhost:4000',
  rateLimits: {
    otpPerPhone: 3,
    otpWindowMs: 10 * 60 * 1000, // 10 minutes
    otpPerIpPerHour: 10,
    scanUploadPerUserPerMin: 5,
    scanReadPerUserPerMin: 60,
    generalPerUserPerMin: 60,
  },
};
