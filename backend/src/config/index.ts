import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env located in project root or backend
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config(); // fallback to current dir

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/localpickup?schema=public',
  jwtSecret: process.env.JWT_SECRET || 'localpickup-default-jwt-secret-key-32chars',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  uploadDir: path.resolve(process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads')),
  maxFileSizeMb: parseInt(process.env.MAX_FILE_SIZE_MB || '25', 10),
  documentRetentionHours: parseInt(process.env.DOCUMENT_RETENTION_HOURS || '24', 10),
};
