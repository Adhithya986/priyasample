import { prisma } from '../../utils/prisma';

export class SchedulingService {
  /**
   * Generates standard pickup slots for a shop for a specific date if they don't already exist.
   */
  static async ensureSlotsForDate(shopId: string, dateStr: string) {
    const targetDate = new Date(dateStr);
    targetDate.setHours(0, 0, 0, 0);

    const existingSlots = await prisma.pickupSlot.findMany({
      where: {
        shopId,
        date: targetDate,
      },
    });

    if (existingSlots.length > 0) {
      return existingSlots;
    }

    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      select: { openingHours: true, slotDurationMinutes: true, slotCapacity: true },
    });

    if (!shop) throw new Error('Shop not found');

    // Parse opening hours: format e.g. "09:00 - 20:00"
    let startHour = 9;
    let endHour = 20;

    const parts = shop.openingHours.split('-');
    if (parts.length === 2) {
      const startMatch = parts[0].trim().match(/^(\d{1,2}):?(\d{2})?/);
      const endMatch = parts[1].trim().match(/^(\d{1,2}):?(\d{2})?/);
      if (startMatch) startHour = parseInt(startMatch[1], 10);
      if (endMatch) endHour = parseInt(endMatch[1], 10);
    }

    const slotDuration = shop.slotDurationMinutes || 15;
    const capacity = shop.slotCapacity || 5;

    const slotsToCreate = [];
    let currentMinutes = startHour * 60;
    const endMinutes = endHour * 60;

    while (currentMinutes + slotDuration <= endMinutes) {
      const startH = Math.floor(currentMinutes / 60).toString().padStart(2, '0');
      const startM = (currentMinutes % 60).toString().padStart(2, '0');
      const endSlotMin = currentMinutes + slotDuration;
      const endH = Math.floor(endSlotMin / 60).toString().padStart(2, '0');
      const endM = (endSlotMin % 60).toString().padStart(2, '0');

      slotsToCreate.push({
        shopId,
        date: targetDate,
        startTime: `${startH}:${startM}`,
        endTime: `${endH}:${endM}`,
        capacity,
        reservedCount: 0,
        isAvailable: true,
      });

      currentMinutes += slotDuration;
    }

    if (slotsToCreate.length > 0) {
      await prisma.pickupSlot.createMany({
        data: slotsToCreate,
        skipDuplicates: true,
      });
    }

    return prisma.pickupSlot.findMany({
      where: { shopId, date: targetDate },
      orderBy: { startTime: 'asc' },
    });
  }

  static async getAvailableSlots(shopId: string, dateStr?: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const targetDate = dateStr ? new Date(dateStr) : today;
    targetDate.setHours(0, 0, 0, 0);

    // Auto-generate if not present
    await this.ensureSlotsForDate(shopId, targetDate.toISOString());

    return prisma.pickupSlot.findMany({
      where: {
        shopId,
        date: targetDate,
      },
      orderBy: { startTime: 'asc' },
    });
  }
}
