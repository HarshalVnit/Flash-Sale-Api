const pool = require("../config/db");
const redisClient = require("../config/redis");

// @desc    Reserve a seat for 5 minutes
// @route   POST /api/events/:eventId/seats/:seatId/reserve
const reserveSeat = async (req, res) => {
  const { eventId, seatId } = req.params;//so that both try and catch blocks can access them for the lock key cleanup in case of an error.
  try {
    // const { user_id } = req.body; // In a real app, this comes from a login token
    const user_id = req.user.id;

    if (!user_id) {
      return res.status(400).json({ error: "user_id is required in the body" });
    }

    // 1. The Redis Lock Key (e.g., "seat_lock_5")
    //   const lockKey = `seat_lock_${seatId}`;
    //       The Database Reality: Because we used SERIAL PRIMARY KEY when we built the seats table, the id of the seat is globally unique.

    // Event 1 might have Seat IDs 1 to 5000.

    // Event 2 will have Seat IDs 5001 to 10000.
    // So, seat_lock_5 will technically only ever apply to Event 1.

    // HOWEVER, you are 100% correct on Best Practices. Relying purely on the database ID for cache keys can get messy. It is an industry standard to make cache keys explicitly clear. We should include the Event ID in the lock so any developer reading the Redis logs knows exactly what is happening.

    const lockKey = `event_${eventId}_seat_lock_${seatId}`;
    // 2. THE BOUNCER: Try to grab the lock in Redis
    const lockAcquired = await redisClient.set(lockKey, String(user_id), {
      EX: 360, // Expires in 360 seconds (6 minutes)
      NX: true, // NX means "Only set this IF IT DOES NOT EXIST"
    });

    // 3. If lockAcquired is null, someone else beat us to it!
    if (!lockAcquired) {
      return res.status(409).json({
        error:
          "Seat is currently reserved by someone else. Please choose another seat.",
      });
    }

    // 4. We passed the Bouncer! Save the pending reservation in PostgreSQL
    const query = `
      INSERT INTO reservations (user_id, event_id, seat_id, status)
      VALUES ($1, $2, $3, 'pending')
      RETURNING *;
    `;
    const result = await pool.query(query, [user_id, eventId, seatId]);

    // 5. Send success response to start the 5-minute checkout timer on the frontend
    res.status(200).json({
      message: "Seat temporarily reserved for 5 minutes! Proceed to payment.",
      reservation: result.rows[0],
    });
  }
  catch (error) {
    const lockKey = `event_${eventId}_seat_lock_${seatId}`;
    await redisClient.del(lockKey);
    
    // THE FIX: Check if it's a PostgreSQL Unique Violation Error
    if (error.code === '23505') {
      return res.status(400).json({ 
        error: "Sorry, this seat was just purchased by someone else!" 
      });
    }

    console.error('❌ Error reserving seat:', error);
    res.status(500).json({ error: "Server error while reserving seat." });
  }
};




const confirmPayment = async (req, res) => {
  try {
    const { reservationId } = req.params;
    // const { user_id } = req.body; // Again, usually comes from a JWT token
    const user_id = req.user.id;

    if (!user_id) {
      return res.status(400).json({ error: "user_id is required" });
    }

    // 1. (In a real app, you would verify the Stripe payment token right here)
    
    // 2. The Atomic Update
    // We specifically check that status = 'pending' so they can't pay for an expired or already-paid ticket
    const query = `
      UPDATE reservations
      SET status = 'confirmed'
      WHERE id = $1 AND user_id = $2 AND status = 'pending'
      RETURNING *;
    `;
    
    const result = await pool.query(query, [reservationId, user_id]);

    // 3. What if it fails?
    if (result.rowCount === 0) {
      return res.status(400).json({ 
        error: "Payment failed: Reservation not found, already paid, or 5-minute timer expired." 
      });
    }

    // 4. Success! The user officially owns the ticket.
    res.status(200).json({
      message: "🎉 Payment successful! You're going to the concert!",
      ticket: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Error confirming payment:', error);
    res.status(500).json({ error: "Server error during checkout." });
  }
};


module.exports = { reserveSeat, confirmPayment };
// module.exports = { reserveSeat };
