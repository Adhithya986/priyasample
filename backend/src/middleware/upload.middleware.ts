import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';
import { initStorage } from '../modules/documents/storage';
import { BadRequestError } from '../utils/errors';

initStorage();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, config.uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueKey = `${uuidv4()}${ext}`;
    cb(null, uniqueKey);
  },
});

const fileFilter = (
  _req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedExtensions = ['.pdf'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (!allowedExtensions.includes(ext)) {
    return cb(new BadRequestError('Invalid file type. Only PDF documents (.pdf) are allowed.'));
  }

  if (file.mimetype !== 'application/pdf') {
    return cb(new BadRequestError('Invalid MIME type. Uploaded file must be an authentic application/pdf.'));
  }

  cb(null, true);
};

export const documentUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.maxFileSizeMb * 1024 * 1024, // in bytes
  },
});
