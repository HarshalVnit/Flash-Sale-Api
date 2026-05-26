const pool = require('../config/db');

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

module.exports = { generateSeats };