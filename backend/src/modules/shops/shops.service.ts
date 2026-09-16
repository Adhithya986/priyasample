import { prisma } from '../../utils/prisma';
import { ShopStatus } from '@prisma/client';

export interface ShopFilterParams {
  search?: string;
  area?: string;
  category?: string;
  service?: string;
}

export class ShopsService {
  static async listShops(filters: ShopFilterParams = {}) {
    const where: any = {
      status: ShopStatus.APPROVED,
    };

    if (filters.area) {
      where.area = { contains: filters.area, mode: 'insensitive' };
    }

    if (filters.search) {
      const q = filters.search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { area: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        {
          offerings: {
            some: {
              name: { contains: q, mode: 'insensitive' },
            },
          },
        },
      ];
    }

    if (filters.category) {
      where.category = {
        OR: [
          { slug: filters.category },
          { name: { contains: filters.category, mode: 'insensitive' } },
        ],
      };
    }

    return prisma.shop.findMany({
      where,
      include: {
        category: { select: { id: true, name: true, slug: true } },
        offerings: {
          where: { isActive: true },
          select: { id: true, name: true, type: true, basePrice: true, pricingConfig: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  static async getShopById(id: string) {
    const shop = await prisma.shop.findUnique({
      where: { id },
      include: {
        category: true,
        offerings: {
          where: { isActive: true },
          select: { id: true, name: true, description: true, type: true, basePrice: true, pricingConfig: true },
        },
        pickupSlots: {
          where: {
            isAvailable: true,
            date: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
          },
          orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
          take: 30,
        },
      },
    });

    if (!shop) {
      throw new Error('Shop not found.');
    }

    return shop;
  }

  static async createShop(data: {
    ownerId: string;
    name: string;
    description?: string;
    address: string;
    area: string;
    phone: string;
    email?: string;
    openingHours: string;
    slotDurationMinutes?: number;
    slotCapacity?: number;
    categoryId?: string;
  }) {
    const slug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') + `-${Date.now().toString().slice(-4)}`;

    return prisma.shop.create({
      data: {
        ...data,
        slug,
        slotDurationMinutes: data.slotDurationMinutes || 10,
        slotCapacity: data.slotCapacity || 5,
        status: ShopStatus.APPROVED, // auto-approve for seed/owner in MVP
      },
    });
  }

  static async updateShop(id: string, data: Partial<{
    name: string;
    description: string;
    address: string;
    area: string;
    phone: string;
    email: string;
    openingHours: string;
    slotDurationMinutes: number;
    slotCapacity: number;
    status: ShopStatus;
  }>) {
    return prisma.shop.update({
      where: { id },
      data,
    });
  }

  static async getShopStats(shopId: string) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [totalBookings, todayBookings, newBookings, preparing, ready, collected] = await Promise.all([
      prisma.booking.count({ where: { shopId } }),
      prisma.booking.count({
        where: { shopId, createdAt: { gte: todayStart } },
      }),
      prisma.booking.count({ where: { shopId, status: 'BOOKED' } }),
      prisma.booking.count({ where: { shopId, status: 'PREPARING' } }),
      prisma.booking.count({ where: { shopId, status: 'READY' } }),
      prisma.booking.count({ where: { shopId, status: 'COLLECTED' } }),
    ]);

    return {
      totalBookings,
      todayBookings,
      newBookings,
      preparing,
      ready,
      collected,
    };
  }
}
