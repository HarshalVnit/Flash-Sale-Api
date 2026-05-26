const express = require('express');
const router = express.Router();
const { generateSeats } = require('../controllers/seatController');

// Notice we use :id to know which event we are generating seats for
router.post('/events/:id/generate-seats', generateSeats);

module.exports = router;