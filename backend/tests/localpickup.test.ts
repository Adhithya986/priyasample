import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/utils/prisma';
import { seed } from '../src/seed';
import path from 'path';
import fs from 'fs';

const app = createApp();

let customerToken: string;
let customerId: string;
let customer2Token: string;
let customer2Id: string;
let shop1OwnerToken: string;
let shop2OwnerToken: string;
let adminToken: string;
let shop1Id: string;
let shop2Id: string;
let slotId: string;
let uploadedDocId: string;
let createdBookingId: string;
let pickupTokenForOrder: string;

beforeAll(async () => {
  await seed();

  // Login demo customer
  const resCust = await request(app)
    .post('/api/auth/login')
    .send({ email: 'customer@localpickup.test', password: 'Password123!' });
  customerToken = resCust.body.data.token;
  customerId = resCust.body.data.user.id;

  // Register a second customer to test cross-customer isolation
  const resCust2 = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Bob Test',
      email: 'bob@localpickup.test',
      password: 'Password123!',
      role: 'CUSTOMER',
    });
  customer2Token = resCust2.body.data.token;
  customer2Id = resCust2.body.data.user.id;

  // Login shop 1 owner (Campus Print Hub)
  const resShop1 = await request(app)
    .post('/api/auth/login')
    .send({ email: 'campus@localpickup.test', password: 'Password123!' });
  shop1OwnerToken = resShop1.body.data.token;

  // Login shop 2 owner (QuickCopy Center)
  const resShop2 = await request(app)
    .post('/api/auth/login')
    .send({ email: 'quickcopy@localpickup.test', password: 'Password123!' });
  shop2OwnerToken = resShop2.body.data.token;

  // Login admin
  const resAdmin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@localpickup.test', password: 'Password123!' });
  adminToken = resAdmin.body.data.token;

  // Fetch shop IDs
  const shopsRes = await request(app).get('/api/shops');
  const shops = shopsRes.body.data.shops;
  shop1Id = shops.find((s: any) => s.slug.includes('campus-print-hub')).id;
  shop2Id = shops.find((s: any) => s.slug.includes('quickcopy-center')).id;

  // Fetch pickup slots for shop 1
  const slotsRes = await request(app).get(`/api/shops/${shop1Id}/pickup-slots`);
  slotId = slotsRes.body.data.slots[0].id;
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('1. Authentication & Security', () => {
  it('should reject login with invalid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'customer@localpickup.test', password: 'WrongPassword!' });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should reject unauthenticated access to protected routes', async () => {
    const res = await request(app).get('/api/bookings');
    expect(res.status).toBe(401);
  });

  it('should authenticate user and return profile', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${customerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe('customer@localpickup.test');
  });
});

describe('2. Document Upload & Storage Security', () => {
  const dummyPdfPath = path.join(__dirname, 'test-doc.pdf');

  beforeAll(() => {
    // Create a mock PDF file with valid PDF magic bytes
    fs.writeFileSync(dummyPdfPath, '%PDF-1.4 Mock PDF Content For Testing\n%%EOF');
  });

  afterAll(() => {
    if (fs.existsSync(dummyPdfPath)) {
      fs.unlinkSync(dummyPdfPath);
    }
  });

  it('should reject non-PDF file upload', async () => {
    const txtPath = path.join(__dirname, 'test.txt');
    fs.writeFileSync(txtPath, 'Not a pdf');
    const res = await request(app)
      .post('/api/documents')
      .set('Authorization', `Bearer ${customerToken}`)
      .attach('file', txtPath);
    if (fs.existsSync(txtPath)) fs.unlinkSync(txtPath);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should allow customer to upload a valid PDF document to private storage', async () => {
    const res = await request(app)
      .post('/api/documents')
      .set('Authorization', `Bearer ${customerToken}`)
      .attach('file', dummyPdfPath);

    expect(res.status).toBe(201);
    expect(res.body.data.document.id).toBeDefined();
    uploadedDocId = res.body.data.document.id;
  });

  it('should allow the owner customer to view document metadata', async () => {
    const res = await request(app)
      .get(`/api/documents/${uploadedDocId}`)
      .set('Authorization', `Bearer ${customerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.document.id).toBe(uploadedDocId);
  });

  it('should block another customer from viewing or downloading the document', async () => {
    const res = await request(app)
      .get(`/api/documents/${uploadedDocId}`)
      .set('Authorization', `Bearer ${customer2Token}`);
    expect(res.status).toBe(403);

    const downloadRes = await request(app)
      .get(`/api/documents/${uploadedDocId}/download`)
      .set('Authorization', `Bearer ${customer2Token}`);
    expect(downloadRes.status).toBe(403);
  });
});

describe('3. Booking Engine & Pricing Calculation', () => {
  it('should calculate price and create a valid booking with atomic slot reservation', async () => {
    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        shopId: shop1Id,
        slotId: slotId,
        documentId: uploadedDocId,
        options: {
          paperSize: 'A4',
          colorMode: 'BW',
          sides: 'SINGLE',
          copies: 2,
          pages: 5,
          optionalServices: ['binding'],
        },
        notes: 'Testing booking creation',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.booking.bookingNumber).toBeDefined();
    expect(res.body.data.booking.status).toBe('BOOKED');
    // Price check: 5 pages * 2 copies * 2.0 pagePrice = 20.0 + (30 binding * 2 copies) = 80.0
    expect(res.body.data.booking.totalPrice).toBe(80.0);
    createdBookingId = res.body.data.booking.id;
  });

  it('should prevent Customer 2 from accessing Customer 1 booking', async () => {
    const res = await request(app)
      .get(`/api/bookings/${createdBookingId}`)
      .set('Authorization', `Bearer ${customer2Token}`);
    expect(res.status).toBe(500); // Controller catches error thrown by service
    expect(res.body.success).toBe(false);
  });

  it('should allow Shop 1 owner to view the booking and document for their shop', async () => {
    const res = await request(app)
      .get(`/api/bookings/${createdBookingId}`)
      .set('Authorization', `Bearer ${shop1OwnerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.booking.id).toBe(createdBookingId);

    // Shop 1 owner can download the customer document for preparation
    const docRes = await request(app)
      .get(`/api/documents/${uploadedDocId}/download`)
      .set('Authorization', `Bearer ${shop1OwnerToken}`);
    expect(docRes.status).toBe(200);
  });

  it('should prevent Shop 2 owner from accessing Shop 1 booking', async () => {
    const res = await request(app)
      .get(`/api/bookings/${createdBookingId}`)
      .set('Authorization', `Bearer ${shop2OwnerToken}`);
    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});

describe('4. Booking State Machine & Strict Transitions', () => {
  it('should reject illegal status jump from BOOKED directly to READY', async () => {
    const res = await request(app)
      .post(`/api/bookings/${createdBookingId}/ready`)
      .set('Authorization', `Bearer ${shop1OwnerToken}`);
    expect(res.status).toBe(500);
    expect(res.body.error).toContain('Illegal state transition');
  });

  it('should allow shop owner to transition BOOKED -> ACCEPTED', async () => {
    const res = await request(app)
      .post(`/api/bookings/${createdBookingId}/accept`)
      .set('Authorization', `Bearer ${shop1OwnerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.booking.status).toBe('ACCEPTED');
  });

  it('should allow shop owner to transition ACCEPTED -> PREPARING', async () => {
    const res = await request(app)
      .post(`/api/bookings/${createdBookingId}/start-preparing`)
      .set('Authorization', `Bearer ${shop1OwnerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.booking.status).toBe('PREPARING');
  });

  it('should allow shop owner to transition PREPARING -> READY and generate secure pickup token', async () => {
    const res = await request(app)
      .post(`/api/bookings/${createdBookingId}/ready`)
      .set('Authorization', `Bearer ${shop1OwnerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.booking.status).toBe('READY');

    // Customer inspects booking and gets secure pickup token and QR code
    const custView = await request(app)
      .get(`/api/bookings/${createdBookingId}`)
      .set('Authorization', `Bearer ${customerToken}`);
    expect(custView.body.data.booking.status).toBe('READY');
    expect(custView.body.data.booking.pickupToken).toBeDefined();
    expect(custView.body.data.qrCodeDataUrl).toBeDefined();

    pickupTokenForOrder = custView.body.data.booking.pickupToken;
  });
});

describe('5. QR Verification & Pickup Workflow', () => {
  it('should reject verification if scanned by the wrong shop', async () => {
    const res = await request(app)
      .post('/api/pickup/verify')
      .set('Authorization', `Bearer ${shop2OwnerToken}`)
      .send({
        token: pickupTokenForOrder,
        shopId: shop2Id,
      });
    expect(res.status).toBe(500);
    expect(res.body.error).toContain('cannot be picked up at this shop');
  });

  it('should reject invalid / non-existent pickup tokens', async () => {
    const res = await request(app)
      .post('/api/pickup/verify')
      .set('Authorization', `Bearer ${shop1OwnerToken}`)
      .send({
        token: 'PK-FAKE1234567890',
        shopId: shop1Id,
      });
    expect(res.status).toBe(500);
    expect(res.body.error).toContain('Invalid pickup token');
  });

  it('should successfully verify valid QR token and atomically transition to COLLECTED', async () => {
    const res = await request(app)
      .post('/api/pickup/verify')
      .set('Authorization', `Bearer ${shop1OwnerToken}`)
      .send({
        token: pickupTokenForOrder,
        shopId: shop1Id,
      });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.collectedAt).toBeDefined();
  });

  it('should reject duplicate scan on already collected order', async () => {
    const res = await request(app)
      .post('/api/pickup/verify')
      .set('Authorization', `Bearer ${shop1OwnerToken}`)
      .send({
        token: pickupTokenForOrder,
        shopId: shop1Id,
      });
    expect(res.status).toBe(500);
    expect(res.body.error).toContain('already been collected');
  });
});

describe('6. Scheduling Capacity & Concurrency Protection', () => {
  it('should reject booking when slot capacity is full', async () => {
    // Find slot with capacity 4, fill it to capacity
    const slots = await prisma.pickupSlot.findMany({ where: { shopId: shop1Id } });
    const targetSlot = slots[1];

    await prisma.pickupSlot.update({
      where: { id: targetSlot.id },
      data: { capacity: 1, reservedCount: 1, isAvailable: false },
    });

    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        shopId: shop1Id,
        slotId: targetSlot.id,
        options: {
          paperSize: 'A4',
          colorMode: 'BW',
          sides: 'SINGLE',
          copies: 1,
          pages: 1,
        },
      });

    expect(res.status).toBe(500);
    expect(res.body.error).toContain('This pickup slot was just filled by another customer');
  });
});
