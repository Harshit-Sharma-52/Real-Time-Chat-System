import dotenv from 'dotenv';
dotenv.config();

const nodeEnv = process.env.NODE_ENV || 'development';

export default {
  port: process.env.PORT || 5000,
  nodeEnv,
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/chatapp',
  jwtSecret: process.env.JWT_SECRET || 'your_secret_key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  uploadDir: process.env.UPLOAD_DIR || './uploads',
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 52428800,
  allowedOrigins: nodeEnv === 'production'
    ? (process.env.ALLOWED_ORIGINS || 'http://localhost:80').split(',').map(s => s.trim())
    : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:80']
};
