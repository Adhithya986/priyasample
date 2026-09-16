import { Router } from 'express';
import { ShopsController } from './shops.controller';
import { authenticate, requireRole, requireShopAccess } from '../../middleware/auth.middleware';
import { UserRole } from '@prisma/client';

const router = Router();

router.get('/', ShopsController.listShops);
router.get('/:id', ShopsController.getShopById);

router.post(
  '/',
  authenticate,
  requireRole(UserRole.SHOP_OWNER, UserRole.ADMIN),
  ShopsController.createShop
);

router.patch(
  '/:shopId',
  authenticate,
  requireShopAccess,
  ShopsController.updateShop
);

router.get(
  '/:shopId/stats',
  authenticate,
  requireShopAccess,
  ShopsController.getShopStats
);

export default router;
