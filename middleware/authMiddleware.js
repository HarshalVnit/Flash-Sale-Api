const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const protect = async (req, res, next) => {
  let token;

  // 1. Look for the token in the Headers: "Authorization: Bearer <token>"
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // 2. Crack the token open
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 3. Fetch the user from PostgreSQL (excluding the password)
      const result = await pool.query('SELECT id, name, email FROM users WHERE id = $1', [decoded.id]);
      
      // 4. Attach the user to the request object so the controller can use it!
      req.user = result.rows[0];
      
      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ error: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ error: 'Not authorized, no token' });
  }
};

module.exports = { protect };