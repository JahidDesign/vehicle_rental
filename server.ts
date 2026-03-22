import app from './src/app';
import { config } from './src/config/env';
import { pool } from './src/config/database';
import cron from 'node-cron';
import { autoReturnExpiredBookings } from './src/modules/bookings/bookings.service';

const startServer = async () => {
  // Test DB connection
  try {
    const client = await pool.connect();
    console.log('Database connection verified.');
    client.release();
  } catch (err) {
    console.error('Failed to connect to database:', err);
    process.exit(1);
  }

  // Cron job: auto-return expired bookings every day at midnight
  cron.schedule('0 0 * * *', async () => {
    console.log('[CRON] Running auto-return for expired bookings...');
    try {
      const count = await autoReturnExpiredBookings();
      if (count > 0) {
        console.log(`[CRON] Auto-returned ${count} expired booking(s).`);
      }
    } catch (err) {
      console.error('[CRON] Auto-return failed:', err);
    }
  });

  app.listen(config.port, () => {
    console.log(`
====================================
  Vehicle Rental API
====================================
  Environment : ${config.nodeEnv}
  Server      : http://localhost:${config.port}
  Health      : http://localhost:${config.port}/health
  API Base    : http://localhost:${config.port}/api/v1
====================================
    `);
  });
};

startServer();
