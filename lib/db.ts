import mysql from "mysql2/promise";

const db = mysql.createPool({
  host: process.env.DB_HOST || "indomart-indomart.g.aivencloud.com",
  port: Number(process.env.DB_PORT) || 10948,
  user: process.env.DB_USER || "avnadmin",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "defaultdb",

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,

  ssl: {
    rejectUnauthorized: false,
  },
});

export default db;