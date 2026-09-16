import { prisma } from '../../utils/prisma';
import { BookingStatus, UserRole } from '@prisma/client';
import { BookingsService } from '../bookings/bookings.service';
import { logger } from '../../utils/logger';

export class PickupService {
  /**
   * Authoritatively verifies a pickup token presented by the customer.
   * Atomically transitions the booking from READY to COLLECTED if valid.
   */
  static async verifyAndCollect(token: string, shopId: string, user: { id: string; role: UserRole }) {
    const cleanToken = token.trim().toUpperCase();

    // 1. Find booking by pickup token
    const booking = await prisma.booking.findUnique({
      where: { pickupToken: cleanToken },
      include: {
        shop: { select: { id: true, name: true, ownerId: true } },
        customer: { select: { name: true, phone: true } },
      },
    });

    if (!booking) {
      logger.warn(`Pickup verification failed: Unknown token "${cleanToken}"`);
      throw new Error('Invalid pickup token. No booking found with this code.');
    }

    // 2. Verify shop match
    if (booking.shopId !== shopId && user.role !== UserRole.ADMIN) {
      logger.warn(
        `Pickup verification rejected: Token belongs to shop ${booking.shopId} ("${booking.shop.name}"), but was scanned by shop ${shopId}`
      );
      throw new Error(
        `This booking belongs to "${booking.shop.name}". It cannot be picked up at this shop.`
      );
    }

    // 3. Verify status
    if (booking.status === BookingStatus.COLLECTED) {
      logger.warn(`Pickup verification rejected: Duplicate scan for booking #${booking.bookingNumber}`);
      throw new Error(
        `This order has already been collected on ${booking.collectedAt ? booking.collectedAt.toLocaleString() : 'earlier'}. Duplicate pickup rejected.`
      );
    }

    if (booking.status !== BookingStatus.READY) {
      logger.warn(
        `Pickup verification rejected: Booking #${booking.bookingNumber} is in status ${booking.status}, not READY`
      );
      throw new Error(
        `Order is not yet ready for pickup. Current status: ${booking.status}.`
      );
    }

    // 4. Atomically mark COLLECTED
    const collectedBooking = await BookingsService.transitionStatus(
      booking.id,
      BookingStatus.COLLECTED,
      user,
      { isTokenVerified: true }
    );

    logger.info(
      `Pickup verified and collected successfully for Booking #${booking.bookingNumber}`
    );

    return {
      success: true,
      bookingNumber: booking.bookingNumber,
      customerName: booking.customer.name,
      totalPrice: booking.totalPrice,
      collectedAt: collectedBooking.collectedAt,
    };
  }
}
