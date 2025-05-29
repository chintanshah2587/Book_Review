const mysql = require('mysql2/promise');
require('dotenv').config();

const config = {
  host: process.env.DB_SERVER,       // e.g., 'localhost'
  user: process.env.DB_USER,         // your DB user
  password: process.env.DB_PASSWORD, // your DB password
  database: process.env.DB_DATABASE, // your DB name
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

let pool;

async function getConnection() {
  if (!pool) {
    try {
      pool = mysql.createPool(config);
    } catch (err) {
      throw err;
    }
  }
  return pool.getConnection();
}

module.exports = {
  getConnection,
  pool: () => pool,
};
