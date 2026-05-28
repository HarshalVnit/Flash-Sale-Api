const express = require('express');
const router = express.Router();
const { generateSeats, getSeatsForEvent } = require('../controllers/seatController');

router.post('/events/:id/generate-seats', generateSeats);
router.get('/events/:id/seats', getSeatsForEvent); 

module.exports = router;