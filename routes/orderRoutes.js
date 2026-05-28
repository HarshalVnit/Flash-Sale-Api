const express = require('express');
const router = express.Router();
const { reserveSeat,confirmPayment } = require('../controllers/orderController');

// Notice we need BOTH the event ID and the seat ID in the URL
router.post('/events/:eventId/seats/:seatId/reserve', reserveSeat);

router.post('/orders/:reservationId/pay', confirmPayment);

module.exports = router;