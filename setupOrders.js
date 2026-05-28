// setupOrders.js
const pool = require('./config/db');

const createReservationsTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS reservations (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id),
        event_id INT REFERENCES events(id),
        seat_id INT REFERENCES seats(id) UNIQUE, 
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Reservations table created!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

createReservationsTable();