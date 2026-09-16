import { Router } from 'express';
import { OfferingsController } from './offerings.controller';
import { authenticate, requireShopAccess } from '../../middleware/auth.middleware';

const router = Router({ mergeParams: true });

router.get('/shops/:shopId/offerings', OfferingsController.listByShop);

router.post(
  '/shops/:shopId/offerings',
  authenticate,
  requireShopAccess,
  OfferingsController.create
);

router.patch(
  '/offerings/:id',
  authenticate,
  OfferingsController.update
);

router.delete(
  '/offerings/:id',
  authenticate,
  OfferingsController.delete
);

export default router;
