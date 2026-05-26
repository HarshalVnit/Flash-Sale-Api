// setupDB.js
const pool = require('./config/db');

const setupDatabase = async () => {
  try {
    console.log('⏳ Creating database tables...');

    // 1. Create Users Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('  - Users table verified');

    // 2. Create Events Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        total_seats INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('  - Events table verified');

    // 3. Create Seats Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS seats (
        id SERIAL PRIMARY KEY,
        event_id INT REFERENCES events(id) ON DELETE CASCADE,
        seat_number VARCHAR(10) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        UNIQUE(event_id, seat_number)
      );
    `);
    console.log('  - Seats table verified');

    console.log('✅ All tables successfully created!');
    process.exit(0); // Closes the terminal process when done
  } catch (error) {
    console.error('❌ Error executing schema setup:', error);
    process.exit(1);
  }
};

// Run the function
setupDatabase();