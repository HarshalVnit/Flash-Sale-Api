const express = require('express');
const cors = require('cors');
require('dotenv').config();
const startCleanupWorker = require('./workers/cleanupWorker');
// Import our raw SQL connection
const pool = require('./config/db');

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // Allows us to accept JSON data in the body
// ... existing middleware ...
app.use(express.json());

// Import and use our Event Routes
const eventRoutes = require('./routes/eventRoutes');
app.use('/api/events', eventRoutes);
const seatRoutes = require('./routes/seatRoutes');
app.use('/api', seatRoutes); // Mount it on /api
const orderRoutes = require('./routes/orderRoutes');
app.use('/api', orderRoutes);
// ... existing /api/health route ...
// A simple test route to make sure it works
app.get('/api/health', async (req, res) => {
  try {
    // Testing our raw SQL connection!
    const result = await pool.query('SELECT NOW()');
    res.status(200).json({ 
      status: 'API is running', 
      db_time: result.rows[0].now 
    });
  } catch (error) {
    res.status(500).json({ error: 'Database connection failed' });
  }
});

const PORT = process.env.PORT || 5000;



// Import the Redis client we just created
const redisClient = require('./config/redis');



// Create an asynchronous startup function
const startServer = async () => {
  try {
    // 1. Force Node.js to connect to Redis FIRST
    await redisClient.connect();
    
    // 2. ONLY start listening for user traffic AFTER Redis is ready
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      //here is where we start the cleanup worker after the server is up and running
      startCleanupWorker();
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Execute the function to boot the app
startServer();