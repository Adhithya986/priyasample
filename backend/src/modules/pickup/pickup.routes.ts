import { Router } from 'express';
import { PickupController } from './pickup.controller';
import { authenticate, requireRole } from '../../middleware/auth.middleware';
import { UserRole } from '@prisma/client';

const router = Router();

router.post(
  '/verify',
  authenticate,
  requireRole(UserRole.SHOP_OWNER, UserRole.SHOP_STAFF, UserRole.ADMIN),
  PickupController.verify
);

export default router;
