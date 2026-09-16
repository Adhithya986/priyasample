import { Router } from 'express';
import { NotificationsController } from './notifications.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.get('/', authenticate, NotificationsController.listUserNotifications);
router.patch('/:id/read', authenticate, NotificationsController.markAsRead);
router.post('/read-all', authenticate, NotificationsController.markAllAsRead);

export default router;
