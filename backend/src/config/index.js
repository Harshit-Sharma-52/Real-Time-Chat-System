import dotenv from 'dotenv';
dotenv.config();

const nodeEnv = process.env.NODE_ENV || 'development';

const rawConfig = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv,
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/chatapp',
  jwtSecret: process.env.JWT_SECRET || 'your_secret_key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  uploadDir: process.env.UPLOAD_DIR || './uploads',
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 52428800,
  allowedOrigins: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim())
    : (nodeEnv === 'production'
        ? ['http://localhost:80']
        : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:80']),
  aiProvider: (process.env.AI_PROVIDER || 'none').toLowerCase(),
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
};

export function validateConfig(cfg = rawConfig) {
  const errors = [];

  if (!cfg.mongoUri) {
    errors.push('MONGODB_URI is required');
  }
  if (Number.isNaN(cfg.port)) {
    errors.push('PORT must be a valid number');
  }
  if (Number.isNaN(cfg.maxFileSize)) {
    errors.push('MAX_FILE_SIZE must be a valid number');
  }

  if (cfg.nodeEnv === 'production') {
    const secret = process.env.JWT_SECRET;
    if (!secret || secret === 'your_secret_key' || secret === 'your_super_secret_jwt_key_change_in_production') {
      errors.push('JWT_SECRET must be set to a strong, unique value in production');
    }
  }

  if (errors.length) {
    throw new Error(`Config validation failed:\n- ${errors.join('\n- ')}`);
  }

  return cfg;
}

const config = rawConfig;

export default config;
