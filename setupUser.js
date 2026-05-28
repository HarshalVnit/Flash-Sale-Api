const pool = require('./config/db');

const createDummyUser = async () => {
  try {
    await pool.query(`
      INSERT INTO users (name, email, password) 
      VALUES ('John Doe', 'john@example.com', 'password123')
    `);
    console.log('✅ Dummy user created! You are now officially User #1.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

createDummyUser();