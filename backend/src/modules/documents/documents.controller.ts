import { Request, Response, NextFunction } from 'express';
import { DocumentsService } from './documents.service';
import { getFilePath, fileExists } from './storage';
import fs from 'fs';

export class DocumentsController {
  static async uploadDocument(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No document uploaded or invalid file format. Please upload a PDF file.',
        });
      }

      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const doc = await DocumentsService.createDocumentRecord({
        customerId: req.user.id,
        originalFileName: req.file.originalname,
        mimeType: req.file.mimetype,
        fileSize: req.file.size,
        storageKey: req.file.filename,
      });

      res.status(201).json({
        success: true,
        message: 'Document uploaded successfully to secure storage',
        data: {
          document: {
            id: doc.id,
            originalFileName: doc.originalFileName,
            fileSize: doc.fileSize,
            mimeType: doc.mimeType,
            expiresAt: doc.expiresAt,
          },
        },
      });
    } catch (err) {
      next(err);
    }
  }

  static async getDocumentMetadata(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const doc = await DocumentsService.getDocumentById(req.params.id);
      const hasAccess = await DocumentsService.canUserAccessDocument(doc, req.user);

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          error: 'Access denied. You do not have permission to view this document.',
        });
      }

      res.json({
        success: true,
        data: {
          document: {
            id: doc.id,
            originalFileName: doc.originalFileName,
            fileSize: doc.fileSize,
            mimeType: doc.mimeType,
            isDeleted: doc.isDeleted,
            expiresAt: doc.expiresAt,
            createdAt: doc.createdAt,
          },
        },
      });
    } catch (err) {
      next(err);
    }
  }

  static async downloadDocument(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const doc = await DocumentsService.getDocumentById(req.params.id);
      const hasAccess = await DocumentsService.canUserAccessDocument(doc, req.user);

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          error: 'Access denied. You do not have permission to download this document.',
        });
      }

      if (doc.isDeleted || !fileExists(doc.storageKey)) {
        return res.status(410).json({
          success: false,
          error: 'Document has expired and was purged per security retention policy.',
        });
      }

      const filePath = getFilePath(doc.storageKey);

      res.setHeader('Content-Type', doc.mimeType);
      res.setHeader(
        'Content-Disposition',
        `inline; filename="${encodeURIComponent(doc.originalFileName)}"`
      );
      res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');

      const stream = fs.createReadStream(filePath);
      stream.pipe(res);
    } catch (err) {
      next(err);
    }
  }
}
