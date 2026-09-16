import { createApp } from './app';
import { config } from './config';
import { logger } from './utils/logger';
import { purgeExpiredDocuments, initStorage } from './modules/documents/storage';

initStorage();

const app = createApp();

const server = app.listen(config.port, () => {
  logger.info(`🚀 Local Pickup Server running on port ${config.port} [${config.nodeEnv}]`);
  logger.info(`👉 Frontend origin allowed: ${config.frontendUrl}`);

  // Background sweep for expired documents past retention period (runs every 30 minutes)
  setInterval(() => {
    purgeExpiredDocuments().catch((err) =>
      logger.error('Background document purge failed:', err)
    );
  }, 30 * 60 * 1000);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Closing HTTP server gracefully.');
  server.close(() => {
    logger.info('HTTP server closed.');
    process.exit(0);
  });
});
