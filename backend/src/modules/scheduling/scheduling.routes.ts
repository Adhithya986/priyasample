import { Router } from 'express';
import { SchedulingController } from './scheduling.controller';

const router = Router();

router.get('/shops/:shopId/pickup-slots', SchedulingController.getSlots);

export default router;
