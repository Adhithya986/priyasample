import { Router } from 'express';
import { BookingsController } from './bookings.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.post('/', authenticate, BookingsController.createBooking);
router.get('/', authenticate, BookingsController.listBookings);
router.get('/:id', authenticate, BookingsController.getBookingById);

// State transition endpoints
router.post('/:id/accept', authenticate, BookingsController.accept);
router.post('/:id/reject', authenticate, BookingsController.reject);
router.post('/:id/start-preparing', authenticate, BookingsController.startPreparing);
router.post('/:id/ready', authenticate, BookingsController.markReady);
router.post('/:id/cancel', authenticate, BookingsController.cancel);

export default router;
