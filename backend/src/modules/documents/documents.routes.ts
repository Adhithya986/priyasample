import { Router } from 'express';
import { DocumentsController } from './documents.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { documentUpload } from '../../middleware/upload.middleware';

const router = Router();

router.post(
  '/',
  authenticate,
  documentUpload.single('file'),
  DocumentsController.uploadDocument
);

router.get(
  '/:id',
  authenticate,
  DocumentsController.getDocumentMetadata
);

router.get(
  '/:id/download',
  authenticate,
  DocumentsController.downloadDocument
);

export default router;
