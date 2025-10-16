import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import pool from './pool.js';

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const sql = fs.readFileSync(path.join(__dirname, 'schema.mysql.sql'), 'utf8');

async function run() {
  const conn = await pool.getConnection();
  try {
    await conn.query(sql);
    console.log('Migration completed');
  } finally {
    conn.release();
    await pool.end();
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});