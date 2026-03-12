// src/db/pool.js

const { Pool } = require('pg');
require('dotenv').config();

// Konfigurasi koneksi menggunakan variabel dari .env
const pool = new Pool({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
});

// Uji Koneksi Database
pool.connect((err, client, done) => {
  if (err) {
    console.error('Database connection error:', err.stack);
  } else {
    console.log('Database connected successfully!');
    done();
  }
});

// Ekspor pool agar bisa digunakan di router lain
module.exports = pool;