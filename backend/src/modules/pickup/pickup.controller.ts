import { Request, Response, NextFunction } from 'express';
import { PickupService } from './pickup.service';
import { z } from 'zod';

const verifySchema = z.object({
  token: z.string().min(4, 'Pickup token is required'),
  shopId: z.string().uuid('Shop ID is required'),
});

export class PickupController {
  static async verify(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const validated = verifySchema.parse(req.body);
      const result = await PickupService.verifyAndCollect(
        validated.token,
        validated.shopId,
        req.user
      );

      res.json({
        success: true,
        message: `Pickup verified! Order #${result.bookingNumber} collected.`,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}
