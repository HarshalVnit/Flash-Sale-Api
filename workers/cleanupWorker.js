// workers/cleanupWorker.js
const cron = require('node-cron');
const pool = require('../config/db');

const startCleanupWorker = () => {
  // This cron expression '* * * * *' means "Run this function exactly every 1 minute"
  cron.schedule('* * * * *', async () => {
    try {
      console.log('🧹 [Sweeper] Checking for expired reservations...');

      // The SQL Magic: Delete reservations that are STILL 'pending' AND older than 5 minutes
      const query = `
        DELETE FROM reservations 
        WHERE status = 'pending' 
        AND created_at < NOW() - INTERVAL '5 minutes'
        RETURNING id, seat_id;
      `;
      
      const result = await pool.query(query);

      if (result.rowCount > 0) {
        console.log(`🗑️ [Sweeper] Deleted ${result.rowCount} expired reservations. Seats are free again!`);
      }

    } catch (error) {
      console.error('❌ [Sweeper] Error cleaning up reservations:', error);
    }
  });

  console.log('⏱️ Cleanup worker initialized. Sweeping every minute.');
};

module.exports = startCleanupWorker;