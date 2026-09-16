import { prisma } from '../../utils/prisma';
import { logger } from '../../utils/logger';

export interface CreateNotificationParams {
  userId: string;
  bookingId?: string;
  title: string;
  message: string;
  type?: 'INFO' | 'SUCCESS' | 'WARNING' | 'ALERT';
}

export class NotificationService {
  static async send(params: CreateNotificationParams) {
    try {
      const notif = await prisma.notification.create({
        data: {
          userId: params.userId,
          bookingId: params.bookingId,
          title: params.title,
          message: params.message,
          type: params.type || 'INFO',
        },
      });
      logger.info(`Notification created for user ${params.userId}: "${params.title}"`);
      return notif;
    } catch (err: any) {
      logger.error(`Failed to create notification for user ${params.userId}:`, err);
    }
  }

  static async notifyBookingCreated(booking: {
    id: string;
    bookingNumber: string;
    shopId: string;
    customerId: string;
    shopName?: string;
  }) {
    // Notify customer
    await this.send({
      userId: booking.customerId,
      bookingId: booking.id,
      title: 'Booking Placed Successfully',
      message: `Your booking #${booking.bookingNumber} at ${booking.shopName || 'the shop'} has been placed. Waiting for shop confirmation.`,
      type: 'SUCCESS',
    });

    // Notify shop owner
    const shop = await prisma.shop.findUnique({
      where: { id: booking.shopId },
      select: { ownerId: true, name: true },
    });
    if (shop) {
      await this.send({
        userId: shop.ownerId,
        bookingId: booking.id,
        title: 'New Booking Received',
        message: `New booking #${booking.bookingNumber} is waiting for your review.`,
        type: 'INFO',
      });
    }
  }

  static async notifyStatusChange(booking: {
    id: string;
    bookingNumber: string;
    customerId: string;
    status: string;
    shopName: string;
  }) {
    let title = `Booking #${booking.bookingNumber} Update`;
    let message = `Your booking status changed to ${booking.status}`;
    let type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ALERT' = 'INFO';

    switch (booking.status) {
      case 'ACCEPTED':
        title = 'Booking Accepted!';
        message = `${booking.shopName} accepted your booking #${booking.bookingNumber}. Preparation will begin soon.`;
        type = 'SUCCESS';
        break;
      case 'PREPARING':
        title = 'Order Is Being Prepared';
        message = `${booking.shopName} has started printing your order #${booking.bookingNumber}.`;
        type = 'INFO';
        break;
      case 'READY':
        title = 'Order Ready for Pickup!';
        message = `Your prints for booking #${booking.bookingNumber} are ready! Please bring your QR code to the shop counter.`;
        type = 'SUCCESS';
        break;
      case 'COLLECTED':
        title = 'Order Collected';
        message = `Booking #${booking.bookingNumber} has been handed over. Thank you for using Local Pickup!`;
        type = 'SUCCESS';
        break;
      case 'REJECTED':
        title = 'Booking Declined';
        message = `${booking.shopName} was unable to accept booking #${booking.bookingNumber}.`;
        type = 'WARNING';
        break;
      case 'CANCELLED':
        title = 'Booking Cancelled';
        message = `Booking #${booking.bookingNumber} was cancelled.`;
        type = 'ALERT';
        break;
    }

    await this.send({
      userId: booking.customerId,
      bookingId: booking.id,
      title,
      message,
      type,
    });
  }
}
