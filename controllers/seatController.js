const pool = require('../config/db');

const redisClient = require('../config/redis'); 


// @desc    Generate seats for an event
// @route   POST /api/events/:id/generate-seats
const generateSeats = async (req, res) => {
  const eventId = req.params.id; // The ID from the URL
  const { total_seats } = req.body; // e.g., 5000

  if (!total_seats) return res.status(400).json({ error: 'Please provide total_seats' });

  // 1. Get a dedicated client for a strict transaction
  const client = await pool.connect();

  try {
    // 2. Start Transaction
    await client.query('BEGIN');

    console.log(`Generating ${total_seats} seats for event ${eventId}...`);
    
    // We will assume a flat pricing model for now
    const defaultPrice = 150.00;
    
    // 3. Build the massive query string dynamically
    // We want it to look like: INSERT INTO seats (event_id, seat_number, price) VALUES (1, 'Seat_1', 150.00), (1, 'Seat_2', 150.00)...
    let query = 'INSERT INTO seats (event_id, seat_number, price) VALUES ';
    const values = [];
    
    for (let i = 1; i <= total_seats; i++) {
      const seatNumber = `Seat_${i}`; // Simple naming for now
      
      // Calculate the offsets for the $1, $2, $3 variables
      const offset = (i - 1) * 3;
      query += `($${offset + 1}, $${offset + 2}, $${offset + 3})`;
      
      // Add a comma unless it's the last item
      if (i < total_seats) query += ', ';
      
      // Push the actual values into the array
      values.push(eventId, seatNumber, defaultPrice);
    }

    // 4. Execute the giant query!
    await client.query(query, values);

    // 5. Save the transaction
    await client.query('COMMIT');

    res.status(201).json({ message: `Successfully generated ${total_seats} seats!` });

  } catch (error) {
    // If it fails, rollback everything so we don't get half-generated seats
    await client.query('ROLLBACK');
    console.error('Error generating seats:', error);
    res.status(500).json({ error: 'Failed to generate seats' });
  } finally {
    // Release the client back to the pool
    client.release();
  }
};




const getSeatsForEvent = async (req, res) => {
  try {
    const eventId = req.params.id;
    
    // 2. Define a unique string name for this specific data in Redis
    const cacheKey = `seats_event_${eventId}`;

    // 3. CACHE HIT: Check if Redis already has the data
    const cachedSeats = await redisClient.get(cacheKey);

    if (cachedSeats) {
      console.log('⚡ Serving from Redis Cache');
      // Redis stores data as simple text strings, so we must parse it back into JSON
      return res.status(200).json({
        source: 'Redis Cache',
        total_seats: JSON.parse(cachedSeats).length,
        seats: JSON.parse(cachedSeats)
      });
    }

    // 4. CACHE MISS: Redis is empty. We must ask the PostgreSQL Librarian.
    console.log('🐢 Serving from PostgreSQL Database');
    const query = `
      SELECT id, seat_number, price 
      FROM seats 
      WHERE event_id = $1 
      ORDER BY id ASC;
    `;
    const result = await pool.query(query, [eventId]);

    // 5. CACHE WARMING: Save the result into Redis for the NEXT user
    // { EX: 3600 } means "Expire this cache in 3600 seconds (1 hour)"
    await redisClient.set(cacheKey, JSON.stringify(result.rows), {
      EX: 3600 
    });

    res.status(200).json({
      source: 'PostgreSQL Database',
      total_seats: result.rowCount,
      seats: result.rows
    });

  } catch (error) {
    console.error('Error fetching seats:', error);
    res.status(500).json({ error: 'Failed to fetch seats' });
  }
};




module.exports = { generateSeats, getSeatsForEvent };