import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../utils/prisma';
import { z } from 'zod';
import { OfferingType } from '@prisma/client';

const createOfferingSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  type: z.enum(['SERVICE', 'PRODUCT']).default('SERVICE'),
  basePrice: z.number().min(0),
  pricingConfig: z.string().optional(), // JSON string
  isActive: z.boolean().default(true),
});

export class OfferingsController {
  static async listByShop(req: Request, res: Response, next: NextFunction) {
    try {
      const offerings = await prisma.offering.findMany({
        where: { shopId: req.params.shopId, isActive: true },
        orderBy: { createdAt: 'asc' },
      });
      res.json({ success: true, data: { offerings } });
    } catch (err) {
      next(err);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = createOfferingSchema.parse(req.body);
      const offering = await prisma.offering.create({
        data: {
          ...validated,
          shopId: req.params.shopId,
        },
      });
      res.status(201).json({ success: true, data: { offering } });
    } catch (err) {
      next(err);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const offering = await prisma.offering.update({
        where: { id: req.params.id },
        data: req.body,
      });
      res.json({ success: true, data: { offering } });
    } catch (err) {
      next(err);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await prisma.offering.update({
        where: { id: req.params.id },
        data: { isActive: false },
      });
      res.json({ success: true, message: 'Offering deactivated' });
    } catch (err) {
      next(err);
    }
  }
}
