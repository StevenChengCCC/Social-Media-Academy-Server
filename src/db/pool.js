import mysql from 'mysql2/promise';
import { logger } from '../utils/logger.js';

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: +(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 5,
  idleTimeout: 60000,
  queueLimit: 0
});

pool.getConnection().then(conn => {
  logger.info('MySQL pool created and tested');
  conn.release();
}).catch(err => {
  logger.error({ err }, 'MySQL pool connection failed');
});

export default pool;