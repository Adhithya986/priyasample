import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../utils/prisma';

export class NotificationsController {
  static async listUserNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });

      const notifications = await prisma.notification.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' },
        take: 25,
      });

      const unreadCount = await prisma.notification.count({
        where: { userId: req.user.id, isRead: false },
      });

      res.json({
        success: true,
        data: { notifications, unreadCount },
      });
    } catch (err) {
      next(err);
    }
  }

  static async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });

      await prisma.notification.updateMany({
        where: { id: req.params.id, userId: req.user.id },
        data: { isRead: true },
      });

      res.json({ success: true, message: 'Notification marked as read' });
    } catch (err) {
      next(err);
    }
  }

  static async markAllAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });

      await prisma.notification.updateMany({
        where: { userId: req.user.id, isRead: false },
        data: { isRead: true },
      });

      res.json({ success: true, message: 'All notifications marked as read' });
    } catch (err) {
      next(err);
    }
  }
}
