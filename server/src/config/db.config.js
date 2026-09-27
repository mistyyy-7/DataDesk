const mysql = require('mysql2/promise');
require('dotenv').config();
console.log("DB password loaded:", !!process.env.DB_PASSWORD);
console.log("DB password length:", process.env.DB_PASSWORD?.length);

// Create MySQL Connection Pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'datadesk_db',
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

module.exports = pool;
