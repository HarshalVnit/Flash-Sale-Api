const pool = require('../config/db');

// @desc    Create a new event (Concert)
// @route   POST /api/events
const createEvent = async (req, res) => {
  try {
    const { name, total_seats } = req.body;

    // 1. Validation
    if (!name || !total_seats) {
      return res.status(400).json({ error: 'Please provide name and total_seats' });
    }

    // 2. The Raw SQL Query
    const query = `
      INSERT INTO events (name, total_seats)
      VALUES ($1, $2)
      RETURNING *;
    `;

    // 3. Execute the query using our connection pool
    const result = await pool.query(query, [name, total_seats]);

    // 4. Send the created event back to the client
    res.status(201).json({
      message: 'Event created successfully',
      event: result.rows[0]
    });

  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Server error while creating event' });
  }
};

module.exports = {
  createEvent
};