const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET ;

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authorization token required' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // contains e.g. { id, username }
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

module.exports = { authenticate };
