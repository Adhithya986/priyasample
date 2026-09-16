import { Request, Response, NextFunction } from 'express';
import { BookingsService } from './bookings.service';
import { BookingStatus, UserRole } from '@prisma/client';
import { z } from 'zod';
import { generateQRCodeDataUrl } from '../../utils/qr';

const createBookingSchema = z.object({
  shopId: z.string().uuid(),
  slotId: z.string().uuid().optional(),
  offeringId: z.string().uuid().optional(),
  documentId: z.string().uuid().optional(),
  options: z.object({
    paperSize: z.string().default('A4'),
    colorMode: z.string().default('BW'),
    sides: z.string().default('SINGLE'),
    copies: z.number().min(1).default(1),
    pages: z.number().min(1).default(1),
    optionalServices: z.array(z.string()).optional(),
  }),
  notes: z.string().optional(),
});

export class BookingsController {
  static async createBooking(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const validated = createBookingSchema.parse(req.body);
      const booking = await BookingsService.createBooking({
        ...validated,
        customerId: req.user.id,
      });

      res.status(201).json({
        success: true,
        message: 'Booking placed successfully',
        data: { booking },
      });
    } catch (err) {
      next(err);
    }
  }

  static async listBookings(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const filters = {
        shopId: req.query.shopId as string,
        status: req.query.status as BookingStatus,
      };

      const bookings = await BookingsService.listBookings(req.user, filters);
      res.json({ success: true, data: { bookings } });
    } catch (err) {
      next(err);
    }
  }

  static async getBookingById(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const booking = await BookingsService.getBookingById(req.params.id, req.user);

      // If booking is READY or COLLECTED, generate QR code data URL for customer
      let qrCodeDataUrl: string | null = null;
      if (booking.pickupToken) {
        qrCodeDataUrl = await generateQRCodeDataUrl(booking.pickupToken);
      }

      res.json({
        success: true,
        data: {
          booking,
          qrCodeDataUrl,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  static async accept(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
      const booking = await BookingsService.transitionStatus(
        req.params.id,
        BookingStatus.ACCEPTED,
        req.user
      );
      res.json({ success: true, message: 'Booking accepted', data: { booking } });
    } catch (err) {
      next(err);
    }
  }

  static async reject(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
      const booking = await BookingsService.transitionStatus(
        req.params.id,
        BookingStatus.REJECTED,
        req.user,
        { reason: req.body.reason }
      );
      res.json({ success: true, message: 'Booking rejected', data: { booking } });
    } catch (err) {
      next(err);
    }
  }

  static async startPreparing(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
      const booking = await BookingsService.transitionStatus(
        req.params.id,
        BookingStatus.PREPARING,
        req.user
      );
      res.json({ success: true, message: 'Preparation started', data: { booking } });
    } catch (err) {
      next(err);
    }
  }

  static async markReady(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
      const booking = await BookingsService.transitionStatus(
        req.params.id,
        BookingStatus.READY,
        req.user
      );
      res.json({ success: true, message: 'Booking marked ready for pickup', data: { booking } });
    } catch (err) {
      next(err);
    }
  }

  static async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
      const booking = await BookingsService.transitionStatus(
        req.params.id,
        BookingStatus.CANCELLED,
        req.user
      );
      res.json({ success: true, message: 'Booking cancelled', data: { booking } });
    } catch (err) {
      next(err);
    }
  }
}
