import bcrypt from 'bcryptjs';
import { prisma } from './utils/prisma';
import { UserRole, ShopStatus, OfferingType } from '@prisma/client';
import { SchedulingService } from './modules/scheduling/scheduling.service';
import { logger } from './utils/logger';

export async function seed() {
  logger.info('🌱 Starting Local Pickup database seed...');

  // 1. Clean existing records in reverse dependency order
  await prisma.notification.deleteMany();
  await prisma.printDocument.deleteMany();
  await prisma.bookingItem.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.pickupSlot.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.offering.deleteMany();
  await prisma.shopStaff.deleteMany();
  await prisma.shop.deleteMany();
  await prisma.shopCategory.deleteMany();
  await prisma.user.deleteMany();

  const defaultPassword = await bcrypt.hash('Password123!', 10);

  // 2. Create Users
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@localpickup.test',
      name: 'Platform Administrator',
      passwordHash: defaultPassword,
      role: UserRole.ADMIN,
      phone: '+1 555-0100',
    },
  });

  const demoCustomer = await prisma.user.create({
    data: {
      email: 'customer@localpickup.test',
      name: 'Alex Johnson',
      passwordHash: defaultPassword,
      role: UserRole.CUSTOMER,
      phone: '+1 555-0199',
    },
  });

  const owner1 = await prisma.user.create({
    data: {
      email: 'campus@localpickup.test',
      name: 'Priya Sharma (Campus Hub)',
      passwordHash: defaultPassword,
      role: UserRole.SHOP_OWNER,
      phone: '+1 555-0101',
    },
  });

  const owner2 = await prisma.user.create({
    data: {
      email: 'quickcopy@localpickup.test',
      name: 'Marcus Vance (QuickCopy)',
      passwordHash: defaultPassword,
      role: UserRole.SHOP_OWNER,
      phone: '+1 555-0102',
    },
  });

  const owner3 = await prisma.user.create({
    data: {
      email: 'citydoc@localpickup.test',
      name: 'Elena Rostova (City Document)',
      passwordHash: defaultPassword,
      role: UserRole.SHOP_OWNER,
      phone: '+1 555-0103',
    },
  });

  // 3. Create Categories
  const printCategory = await prisma.shopCategory.create({
    data: {
      name: 'Printing & Xerox',
      slug: 'printing',
      description: 'Document printing, spiral binding, colour flyers and laminations.',
      icon: 'Printer',
    },
  });

  const stationeryCategory = await prisma.shopCategory.create({
    data: {
      name: 'Stationery & Office',
      slug: 'stationery',
      description: 'Notebooks, engineering paper, pens, and art supplies.',
      icon: 'PenTool',
    },
  });

  // 4. Create Sample Shops
  const shop1 = await prisma.shop.create({
    data: {
      ownerId: owner1.id,
      categoryId: printCategory.id,
      name: 'Campus Print Hub',
      slug: 'campus-print-hub',
      description: 'High-speed student prints, thesis spiral binding, and project posters right next to North Gate.',
      address: 'Shop 4, University Plaza, North Gate Road',
      area: 'University Campus',
      phone: '+1 555-0111',
      email: 'info@campusprinthub.test',
      openingHours: '08:00 - 20:00',
      slotDurationMinutes: 10,
      slotCapacity: 6,
      status: ShopStatus.APPROVED,
    },
  });

  const shop2 = await prisma.shop.create({
    data: {
      ownerId: owner2.id,
      categoryId: printCategory.id,
      name: 'QuickCopy Center',
      slug: 'quickcopy-center',
      description: 'Commercial high-volume laser copying, architecture blueprints, legal documents and laminations.',
      address: '142 Business Bay Arcade, 2nd Floor',
      area: 'Business Bay',
      phone: '+1 555-0122',
      email: 'orders@quickcopy.test',
      openingHours: '09:00 - 21:00',
      slotDurationMinutes: 15,
      slotCapacity: 5,
      status: ShopStatus.APPROVED,
    },
  });

  const shop3 = await prisma.shop.create({
    data: {
      ownerId: owner3.id,
      categoryId: printCategory.id,
      name: 'City Document Point',
      slug: 'city-document-point',
      description: 'Certified document prints, color photo prints, spiral and thermal hardcover binding.',
      address: '77 Metro Station Concourse, Central Avenue',
      area: 'Central Metro',
      phone: '+1 555-0133',
      email: 'desk@citydocument.test',
      openingHours: '08:30 - 19:30',
      slotDurationMinutes: 10,
      slotCapacity: 4,
      status: ShopStatus.APPROVED,
    },
  });

  // 5. Create Configured Offerings for each shop
  // Shop 1 Offerings
  await prisma.offering.create({
    data: {
      shopId: shop1.id,
      name: 'Document Printing & Photocopy',
      type: OfferingType.SERVICE,
      description: 'Standard black & white and colour laser printing on premium 75gsm/85gsm sheets.',
      basePrice: 0.0,
      pricingConfig: JSON.stringify({
        basePrice: 0.0,
        pagePrices: { A4: 2.0, A3: 5.0 },
        colorSurchargePerPage: 5.0,
        doubleSidedDiscountOrSurcharge: 0.0,
        addons: {
          binding: 30.0,
          lamination: 15.0,
          photocopy: 2.0,
          scanning: 5.0,
        },
      }),
      isActive: true,
    },
  });

  // Shop 2 Offerings
  await prisma.offering.create({
    data: {
      shopId: shop2.id,
      name: 'Express Laser Printing',
      type: OfferingType.SERVICE,
      description: 'Ultra sharp monochrome and color prints with thermal lamination.',
      basePrice: 5.0,
      pricingConfig: JSON.stringify({
        basePrice: 5.0,
        pagePrices: { A4: 2.5, A3: 6.0 },
        colorSurchargePerPage: 4.5,
        doubleSidedDiscountOrSurcharge: 0.0,
        addons: {
          binding: 40.0,
          lamination: 20.0,
          photocopy: 2.5,
          scanning: 5.0,
        },
      }),
      isActive: true,
    },
  });

  // Shop 3 Offerings
  await prisma.offering.create({
    data: {
      shopId: shop3.id,
      name: 'Pro Document Printing',
      type: OfferingType.SERVICE,
      description: 'Legal and executive grade prints on ultra-white paper.',
      basePrice: 0.0,
      pricingConfig: JSON.stringify({
        basePrice: 0.0,
        pagePrices: { A4: 2.0, A3: 5.0 },
        colorSurchargePerPage: 5.0,
        doubleSidedDiscountOrSurcharge: 0.0,
        addons: {
          binding: 35.0,
          lamination: 25.0,
          photocopy: 2.0,
          scanning: 10.0,
        },
      }),
      isActive: true,
    },
  });

  // 6. Generate Pickup Slots for today and tomorrow for all 3 shops
  const today = new Date().toISOString();
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  for (const shop of [shop1, shop2, shop3]) {
    await SchedulingService.ensureSlotsForDate(shop.id, today);
    await SchedulingService.ensureSlotsForDate(shop.id, tomorrow);
  }

  // 7. Seed an initial sample booking for testing demonstration
  const todaySlots = await prisma.pickupSlot.findMany({
    where: { shopId: shop1.id },
    orderBy: { startTime: 'asc' },
  });

  if (todaySlots.length > 0) {
    const slot = todaySlots[0];
    await prisma.booking.create({
      data: {
        bookingNumber: 'LP-1001',
        customerId: demoCustomer.id,
        shopId: shop1.id,
        slotId: slot.id,
        status: 'BOOKED',
        subtotal: 24.0,
        tax: 0.0,
        totalPrice: 24.0,
        notes: 'Please double staple on the top-left corner.',
        items: {
          create: {
            quantity: 1,
            unitPrice: 24.0,
            totalPrice: 24.0,
            configuration: JSON.stringify({
              paperSize: 'A4',
              colorMode: 'BW',
              sides: 'DOUBLE',
              copies: 2,
              pages: 6,
              optionalServices: ['binding'],
            }),
          },
        },
      },
    });

    await prisma.pickupSlot.update({
      where: { id: slot.id },
      data: { reservedCount: 1 },
    });
  }

  logger.info('✅ Seed finished successfully!');
  logger.info('----------------------------------------------------');
  logger.info('Demo Credentials (all passwords: "Password123!"):');
  logger.info('Admin:    admin@localpickup.test');
  logger.info('Customer: customer@localpickup.test');
  logger.info('Shop 1:   campus@localpickup.test  (Campus Print Hub)');
  logger.info('Shop 2:   quickcopy@localpickup.test (QuickCopy Center)');
  logger.info('Shop 3:   citydoc@localpickup.test (City Document Point)');
  logger.info('----------------------------------------------------');
}

if (require.main === module) {
  seed()
    .catch((err) => {
      console.error(err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
