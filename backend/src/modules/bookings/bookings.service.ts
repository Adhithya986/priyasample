import { prisma } from '../../utils/prisma';
import { BookingStatus, UserRole } from '@prisma/client';
import { calculatePrintingPrice, PrintOrderOptions } from '../pricing/pricing.service';
import { validateTransition } from './state-machine';
import { generatePickupToken } from '../../utils/qr';
import { NotificationService } from '../notifications/notifications.service';
import { logger } from '../../utils/logger';

export interface CreateBookingInput {
  customerId: string;
  shopId: string;
  slotId?: string;
  offeringId?: string;
  documentId?: string;
  options: PrintOrderOptions;
  notes?: string;
}

export class BookingsService {
  /**
   * Atomically creates a booking, checks capacity, recalculates & locks price.
   */
  static async createBooking(input: CreateBookingInput) {
    return prisma.$transaction(async (tx) => {
      // 1. Verify Shop
      const shop = await tx.shop.findUnique({
        where: { id: input.shopId },
        include: { offerings: true },
      });

      if (!shop || shop.status !== 'APPROVED') {
        throw new Error('Selected shop is currently unavailable or inactive.');
      }

      // 2. Verify and reserve Pickup Slot atomically
      let slot = null;
      let targetPickupTime: Date | null = null;

      if (input.slotId) {
        slot = await tx.pickupSlot.findUnique({
          where: { id: input.slotId },
        });

        if (!slot || slot.shopId !== input.shopId) {
          throw new Error('Invalid pickup slot selected.');
        }

        if (slot.reservedCount >= slot.capacity) {
          throw new Error('This pickup slot was just filled by another customer. Please choose an alternative time.');
        }

        // Increment capacity atomically
        const newReserved = slot.reservedCount + 1;
        await tx.pickupSlot.update({
          where: { id: slot.id },
          data: {
            reservedCount: newReserved,
            isAvailable: newReserved < slot.capacity,
          },
        });

        // Calculate pickup datetime
        const [hours, mins] = slot.startTime.split(':').map(Number);
        targetPickupTime = new Date(slot.date);
        targetPickupTime.setHours(hours, mins, 0, 0);
      }

      // 3. Verify Offering & Calculate Price
      let offering = null;
      if (input.offeringId) {
        offering = await tx.offering.findUnique({
          where: { id: input.offeringId },
        });
      } else if (shop.offerings.length > 0) {
        offering = shop.offerings[0];
      }

      const pricingBreakdown = calculatePrintingPrice(
        offering?.pricingConfig || null,
        input.options
      );

      // 4. Verify Document if provided
      if (input.documentId) {
        const doc = await tx.printDocument.findUnique({
          where: { id: input.documentId },
        });

        if (!doc || doc.customerId !== input.customerId || doc.isDeleted) {
          throw new Error('Uploaded document is invalid, deleted, or unauthorized.');
        }
      }

      // 5. Generate human readable Booking Number
      const randSuffix = Math.floor(1000 + Math.random() * 9000);
      const bookingNumber = `LP-${randSuffix}`;

      // 6. Create Booking Record
      const booking = await tx.booking.create({
        data: {
          bookingNumber,
          customerId: input.customerId,
          shopId: input.shopId,
          slotId: slot?.id || null,
          status: BookingStatus.BOOKED,
          subtotal: pricingBreakdown.subtotal,
          tax: pricingBreakdown.tax,
          totalPrice: pricingBreakdown.total,
          notes: input.notes?.trim() || null,
          pickupTime: targetPickupTime,
          items: {
            create: {
              offeringId: offering?.id || null,
              quantity: input.options.copies || 1,
              unitPrice: pricingBreakdown.subtotal / (input.options.copies || 1),
              totalPrice: pricingBreakdown.total,
              configuration: JSON.stringify({
                ...input.options,
                priceBreakdown: pricingBreakdown,
              }),
            },
          },
        },
        include: {
          items: true,
          shop: { select: { name: true, address: true, phone: true } },
          slot: true,
        },
      });

      // 7. Attach Document to Booking
      if (input.documentId) {
        await tx.printDocument.update({
          where: { id: input.documentId },
          data: { bookingId: booking.id },
        });
      }

      logger.info(`Booking created successfully: #${booking.bookingNumber} for user ${input.customerId}`);

      // 8. Fire in-app notifications
      NotificationService.notifyBookingCreated({
        id: booking.id,
        bookingNumber: booking.bookingNumber,
        shopId: shop.id,
        customerId: input.customerId,
        shopName: shop.name,
      });

      return booking;
    });
  }

  static async getBookingById(id: string, user: { id: string; role: UserRole }) {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, name: true, email: true, phone: true } },
        shop: {
          select: {
            id: true,
            ownerId: true,
            name: true,
            address: true,
            area: true,
            phone: true,
            staff: true,
          },
        },
        slot: true,
        items: true,
        documents: {
          where: { isDeleted: false },
          select: {
            id: true,
            originalFileName: true,
            fileSize: true,
            mimeType: true,
            expiresAt: true,
            createdAt: true,
          },
        },
      },
    });

    if (!booking) {
      throw new Error('Booking not found.');
    }

    // Authorization check
    const isCustomer = booking.customerId === user.id;
    const isOwner = booking.shop.ownerId === user.id;
    const isStaff = booking.shop.staff.some((s) => s.userId === user.id);
    const isAdmin = user.role === UserRole.ADMIN;

    if (!isCustomer && !isOwner && !isStaff && !isAdmin) {
      throw new Error('Access denied. You are not authorized to view this booking.');
    }

    return booking;
  }

  static async listBookings(user: { id: string; role: UserRole }, filters: {
    shopId?: string;
    status?: BookingStatus;
  }) {
    const where: any = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (user.role === UserRole.CUSTOMER) {
      where.customerId = user.id;
    } else if (user.role === UserRole.SHOP_OWNER || user.role === UserRole.SHOP_STAFF) {
      if (filters.shopId) {
        where.shopId = filters.shopId;
      } else {
        // Find all shops owned or staffed by this user
        const ownedShops = await prisma.shop.findMany({
          where: { ownerId: user.id },
          select: { id: true },
        });
        const staffedShops = await prisma.shopStaff.findMany({
          where: { userId: user.id },
          select: { shopId: true },
        });
        const shopIds = [...ownedShops.map((s) => s.id), ...staffedShops.map((s) => s.shopId)];
        where.shopId = { in: shopIds };
      }
    } else if (user.role === UserRole.ADMIN) {
      if (filters.shopId) {
        where.shopId = filters.shopId;
      }
    }

    return prisma.booking.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        shop: { select: { id: true, name: true, area: true, address: true, phone: true } },
        slot: true,
        items: true,
        documents: {
          where: { isDeleted: false },
          select: { id: true, originalFileName: true, fileSize: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Handles state machine transitions with security verification.
   */
  static async transitionStatus(
    bookingId: string,
    targetStatus: BookingStatus,
    user: { id: string; role: UserRole },
    options: { isTokenVerified?: boolean; reason?: string } = {}
  ) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        shop: { include: { staff: true } },
      },
    });

    if (!booking) {
      throw new Error('Booking not found.');
    }

    const isCustomer = booking.customerId === user.id;
    const isOwner = booking.shop.ownerId === user.id;
    const isStaff = booking.shop.staff.some((s) => s.userId === user.id);

    const validation = validateTransition(booking.status, targetStatus, {
      role: user.role,
      isOwnerOrStaff: isOwner || isStaff,
      isCustomer,
      isTokenVerified: options.isTokenVerified,
    });

    if (!validation.allowed) {
      throw new Error(validation.reason || 'Invalid state transition.');
    }

    const updateData: any = {
      status: targetStatus,
    };

    // If transitioning to READY, generate secure random pickup token
    if (targetStatus === BookingStatus.READY && !booking.pickupToken) {
      updateData.pickupToken = generatePickupToken();
    }

    // If transitioning to COLLECTED, record timestamp
    if (targetStatus === BookingStatus.COLLECTED) {
      updateData.collectedAt = new Date();
    }

    // If cancelled or rejected, release slot capacity
    if (
      [BookingStatus.CANCELLED, BookingStatus.REJECTED].includes(targetStatus) &&
      booking.slotId
    ) {
      await prisma.pickupSlot.update({
        where: { id: booking.slotId },
        data: {
          reservedCount: { decrement: 1 },
          isAvailable: true,
        },
      });
    }

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: updateData,
      include: {
        shop: { select: { name: true } },
      },
    });

    logger.info(
      `Booking #${booking.bookingNumber} transitioned from ${booking.status} to ${targetStatus} by user ${user.id}`
    );

    // Notify customer of status update
    NotificationService.notifyStatusChange({
      id: updated.id,
      bookingNumber: booking.bookingNumber,
      customerId: booking.customerId,
      status: targetStatus,
      shopName: updated.shop.name,
    });

    return updated;
  }
}
