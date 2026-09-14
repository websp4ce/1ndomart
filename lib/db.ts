import mysql from 'mysql2/promise';

// Connection pool — dipakai bareng oleh semua API route, jadi tidak
// buka-tutup koneksi baru tiap request (lebih hemat & cepat).
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'indomart_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default pool;