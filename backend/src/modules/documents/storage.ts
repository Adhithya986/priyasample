import fs from 'fs';
import path from 'path';
import { config } from '../../config';
import { logger } from '../../utils/logger';
import { prisma } from '../../utils/prisma';

// Ensure storage directory exists with private permissions
export const initStorage = () => {
  if (!fs.existsSync(config.uploadDir)) {
    fs.mkdirSync(config.uploadDir, { recursive: true, mode: 0o700 });
    logger.info(`Initialized secure upload directory at ${config.uploadDir}`);
  }
};

export const getFilePath = (storageKey: string): string => {
  // Prevent directory traversal
  const safeKey = path.basename(storageKey);
  return path.join(config.uploadDir, safeKey);
};

export const fileExists = (storageKey: string): boolean => {
  const fullPath = getFilePath(storageKey);
  return fs.existsSync(fullPath);
};

export const deleteFile = async (storageKey: string): Promise<boolean> => {
  try {
    const fullPath = getFilePath(storageKey);
    if (fs.existsSync(fullPath)) {
      await fs.promises.unlink(fullPath);
      logger.info(`Deleted document file: ${storageKey}`);
      return true;
    }
  } catch (err: any) {
    logger.error(`Failed to delete document file ${storageKey}:`, err);
  }
  return false;
};

/**
 * Sweeps expired documents past their retention window and deletes them.
 * Collect less. Keep it for less time. Give access only to those who need it.
 */
export const purgeExpiredDocuments = async (): Promise<number> => {
  try {
    const now = new Date();
    const expiredDocs = await prisma.printDocument.findMany({
      where: {
        expiresAt: { lte: now },
        isDeleted: false,
      },
    });

    let purgedCount = 0;
    for (const doc of expiredDocs) {
      await deleteFile(doc.storageKey);
      await prisma.printDocument.update({
        where: { id: doc.id },
        data: { isDeleted: true },
      });
      purgedCount++;
    }

    if (purgedCount > 0) {
      logger.info(`Purged ${purgedCount} expired documents past retention window.`);
    }
    return purgedCount;
  } catch (err: any) {
    logger.error('Error during document retention purge:', err);
    return 0;
  }
};
