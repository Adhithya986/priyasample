import { Request, Response, NextFunction } from 'express';
import { SchedulingService } from './scheduling.service';

export class SchedulingController {
  static async getSlots(req: Request, res: Response, next: NextFunction) {
    try {
      const { shopId } = req.params;
      const { date } = req.query;
      const slots = await SchedulingService.getAvailableSlots(shopId, date as string);
      res.json({ success: true, data: { slots } });
    } catch (err) {
      next(err);
    }
  }
}
