import { Request, Response, NextFunction } from 'express';
import { ShopsService } from './shops.service';
import { z } from 'zod';

const createShopSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  address: z.string().min(5),
  area: z.string().min(2),
  phone: z.string().min(5),
  email: z.string().email().optional(),
  openingHours: z.string().min(3),
  slotDurationMinutes: z.number().min(5).max(60).optional(),
  slotCapacity: z.number().min(1).max(50).optional(),
  categoryId: z.string().optional(),
});

export class ShopsController {
  static async listShops(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = {
        search: req.query.search as string,
        area: req.query.area as string,
        category: req.query.category as string,
        service: req.query.service as string,
      };
      const shops = await ShopsService.listShops(filters);
      res.json({ success: true, data: { shops } });
    } catch (err) {
      next(err);
    }
  }

  static async getShopById(req: Request, res: Response, next: NextFunction) {
    try {
      const shop = await ShopsService.getShopById(req.params.id);
      res.json({ success: true, data: { shop } });
    } catch (err) {
      next(err);
    }
  }

  static async createShop(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }
      const validated = createShopSchema.parse(req.body);
      const shop = await ShopsService.createShop({
        ...validated,
        ownerId: req.user.id,
      });
      res.status(201).json({ success: true, data: { shop } });
    } catch (err) {
      next(err);
    }
  }

  static async updateShop(req: Request, res: Response, next: NextFunction) {
    try {
      const shop = await ShopsService.updateShop(req.params.id, req.body);
      res.json({ success: true, data: { shop } });
    } catch (err) {
      next(err);
    }
  }

  static async getShopStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await ShopsService.getShopStats(req.params.id);
      res.json({ success: true, data: { stats } });
    } catch (err) {
      next(err);
    }
  }
}
