import { Router } from 'express';
import { AdminController } from './admin.controller';
import { authenticate, requireRole } from '../../middleware/auth.middleware';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(authenticate);
router.use(requireRole(UserRole.ADMIN));

router.get('/stats', AdminController.getStats);
router.get('/users', AdminController.listUsers);
router.patch('/users/:id/status', AdminController.toggleUserStatus);
router.get('/shops', AdminController.listAllShops);
router.patch('/shops/:id/status', AdminController.updateShopStatus);
router.get('/bookings', AdminController.listAllBookings);
router.get('/categories', AdminController.listCategories);
router.post('/categories', AdminController.createCategory);

export default router;
