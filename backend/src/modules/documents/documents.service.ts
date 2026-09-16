import { prisma } from '../../utils/prisma';
import { getFilePath, fileExists, deleteFile } from './storage';
import { config } from '../../config';

export class DocumentsService {
  static async createDocumentRecord(data: {
    customerId: string;
    originalFileName: string;
    mimeType: string;
    fileSize: number;
    storageKey: string;
    retentionHours?: number;
  }) {
    const retentionHours = data.retentionHours || config.documentRetentionHours;
    const expiresAt = new Date(Date.now() + retentionHours * 60 * 60 * 1000);

    return prisma.printDocument.create({
      data: {
        customerId: data.customerId,
        originalFileName: data.originalFileName,
        mimeType: data.mimeType,
        fileSize: data.fileSize,
        storageKey: data.storageKey,
        retentionHours,
        expiresAt,
      },
    });
  }

  static async getDocumentById(id: string) {
    const doc = await prisma.printDocument.findUnique({
      where: { id },
      include: {
        booking: {
          select: {
            id: true,
            shopId: true,
            customerId: true,
            status: true,
          },
        },
      },
    });

    if (!doc) {
      throw new Error('Document record not found.');
    }

    return doc;
  }

  static async attachToBooking(documentId: string, bookingId: string) {
    return prisma.printDocument.update({
      where: { id: documentId },
      data: { bookingId },
    });
  }

  static async canUserAccessDocument(
    document: any,
    user: { id: string; role: string }
  ): Promise<boolean> {
    // Admin always allowed
    if (user.role === 'ADMIN') return true;

    // Customer who uploaded it
    if (document.customerId === user.id) return true;

    // If attached to a booking, check if user is shop owner or staff
    if (document.booking?.shopId) {
      const shop = await prisma.shop.findUnique({
        where: { id: document.booking.shopId },
        include: { staff: true },
      });

      if (shop) {
        if (shop.ownerId === user.id) return true;
        if (shop.staff.some((s) => s.userId === user.id)) return true;
      }
    }

    return false;
  }
}
