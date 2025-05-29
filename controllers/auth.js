const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getConnection } = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET; 

// User registration with password hashing and duplicate prevention
// Creates new user account with encrypted password storage
async function signup({ req, res, next }) {
  const { username, email, password } = req.body;
  // Validate required fields are provided
  if (!username || !email || !password) {
    res.status(400);
    throw new Error('Please provide username, email and password');
  }

  const conn = await getConnection();

  try {
    // Check for existing user with same username or email
    // Prevents duplicate accounts and maintains uniqueness
    const [existing] = await conn.query(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );
    if (existing.length > 0) {
      res.status(400);
      throw new Error('User already exists with this username or email');
    }

    // Hash password with bcrypt (salt rounds: 10)
    // Never store plain text passwords in database
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user record with hashed password
    const [result] = await conn.query(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email, hashedPassword]
    );
    return { message: 'User created successfully', userId: result.insertId };
  } finally {
    // Always release database connection back to pool
    conn.release();
  }
}

// User authentication with password verification and JWT generation
// Returns JWT token for authenticated sessions
async function login({ req, res, next }) {
  const { username, password } = req.body;
  
  // Validate required login credentials
  if (!username || !password) {
    res.status(400);
    throw new Error('Please provide username and password');
  }

  const conn = await getConnection();

  try {
    // Retrieve user record by username for authentication
    const [users] = await conn.query(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );

    // User not found - use generic error message for security
    if (users.length === 0) {
      res.status(401);
      throw new Error('Invalid username or password');
    }

    const user = users[0];

    // Verify password against stored hash using bcrypt
    // bcrypt.compare handles salt extraction and comparison
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401);
      throw new Error('Invalid username or password'); // Same error message to prevent user enumeration
    }

    // Generate JWT token with user payload and 1-hour expiration
    // Token contains user ID and username for subsequent requests
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, {
      expiresIn: '24h',
    });

    return { token };
  } finally {
    // Always release database connection back to pool
    conn.release();
  }
}

module.exports = { signup, login };