// config/redis.js
const redis = require('redis');
require('dotenv').config();

// 1. Initialize the Redis Client
const redisClient = redis.createClient({
  url: process.env.REDIS_URL
});

// 2. Set up Event Listeners for logging and error handling
redisClient.on('connect', () => {
  console.log('✅ Connected to Redis Cache');
});

redisClient.on('error', (err) => {
  console.error('❌ Redis Connection Error:', err);
});

// 3. Export it so our controllers can use it
module.exports = redisClient;