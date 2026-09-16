import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config';
import { errorHandler } from './middleware/error.middleware';

// Module routes
import authRoutes from './modules/auth/auth.routes';
import shopsRoutes from './modules/shops/shops.routes';
import offeringsRoutes from './modules/offerings/offerings.routes';
import documentsRoutes from './modules/documents/documents.routes';
import schedulingRoutes from './modules/scheduling/scheduling.routes';
import bookingsRoutes from './modules/bookings/bookings.routes';
import pickupRoutes from './modules/pickup/pickup.routes';
import notificationsRoutes from './modules/notifications/notifications.routes';
import adminRoutes from './modules/admin/admin.routes';

export const createApp = () => {
  const app = express();

  // Basic security and parsing middleware
  app.use(
    cors({
      origin: [config.frontendUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'],
      credentials: true,
    })
  );

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'Local Pickup API',
      timestamp: new Date().toISOString(),
    });
  });

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/shops', shopsRoutes);
  app.use('/api', offeringsRoutes);
  app.use('/api/documents', documentsRoutes);
  app.use('/api', schedulingRoutes);
  app.use('/api/bookings', bookingsRoutes);
  app.use('/api/pickup', pickupRoutes);
  app.use('/api/notifications', notificationsRoutes);
  app.use('/api/admin', adminRoutes);

  // Global error handler
  app.use(errorHandler);

  return app;
};
