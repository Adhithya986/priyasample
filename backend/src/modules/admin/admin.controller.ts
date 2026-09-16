import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../utils/prisma';
import { ShopStatus } from '@prisma/client';

export class AdminController {
  static async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const [
        totalUsers,
        totalShops,
        activeShops,
        pendingShops,
        totalBookings,
        completedPickups,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.shop.count(),
        prisma.shop.count({ where: { status: ShopStatus.APPROVED } }),
        prisma.shop.count({ where: { status: ShopStatus.PENDING } }),
        prisma.booking.count(),
        prisma.booking.count({ where: { status: 'COLLECTED' } }),
      ]);

      res.json({
        success: true,
        data: {
          stats: {
            totalUsers,
            totalShops,
            activeShops,
            pendingShops,
            totalBookings,
            completedPickups,
          },
        },
      });
    } catch (err) {
      next(err);
    }
  }

  static async listUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          isActive: true,
          createdAt: true,
          _count: { select: { bookings: true, ownedShops: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
      res.json({ success: true, data: { users } });
    } catch (err) {
      next(err);
    }
  }

  static async toggleUserStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { isActive } = req.body;
      const user = await prisma.user.update({
        where: { id: req.params.id },
        data: { isActive },
        select: { id: true, email: true, isActive: true },
      });
      res.json({ success: true, message: `User status updated`, data: { user } });
    } catch (err) {
      next(err);
    }
  }

  static async listAllShops(req: Request, res: Response, next: NextFunction) {
    try {
      const shops = await prisma.shop.findMany({
        include: {
          owner: { select: { id: true, name: true, email: true } },
          category: true,
          _count: { select: { bookings: true, offerings: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
      res.json({ success: true, data: { shops } });
    } catch (err) {
      next(err);
    }
  }

  static async updateShopStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { status } = req.body;
      if (!Object.values(ShopStatus).includes(status)) {
        return res.status(400).json({ success: false, error: 'Invalid shop status' });
      }

      const shop = await prisma.shop.update({
        where: { id: req.params.id },
        data: { status },
      });

      res.json({
        success: true,
        message: `Shop status updated to ${status}`,
        data: { shop },
      });
    } catch (err) {
      next(err);
    }
  }

  static async listAllBookings(req: Request, res: Response, next: NextFunction) {
    try {
      const bookings = await prisma.booking.findMany({
        include: {
          customer: { select: { name: true, email: true } },
          shop: { select: { name: true } },
          slot: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
      res.json({ success: true, data: { bookings } });
    } catch (err) {
      next(err);
    }
  }

  static async listCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await prisma.shopCategory.findMany({
        include: { _count: { select: { shops: true } } },
        orderBy: { name: 'asc' },
      });
      res.json({ success: true, data: { categories } });
    } catch (err) {
      next(err);
    }
  }

  static async createCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, description, icon } = req.body;
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      const category = await prisma.shopCategory.create({
        data: { name, slug, description, icon },
      });
      res.status(201).json({ success: true, data: { category } });
    } catch (err) {
      next(err);
    }
  }
}
