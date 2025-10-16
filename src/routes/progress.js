import { Router } from 'express';
import pool from '../db/pool.js';

const router = Router();

router.get('/me', async (req, res) => {
  res.json({ sub: req.user.sub, email: req.user.email, name: req.user.name || null });
});

router.get('/progress/:lessonId', async (req, res, next) => {
  try {
    const { lessonId } = req.params;
    const [users] = await pool.query(`SELECT id FROM users WHERE cognito_sub=?`, [req.user.sub]);
    const userId = users.length ? users[0].id : (await pool.query(
      `INSERT INTO users (cognito_sub, display_name) VALUES (?, ?)`,
      [req.user.sub, req.user.email || null]
    ))[0].insertId;

    const [rows] = await pool.query(
      `SELECT last_step_index, completed FROM progress WHERE user_id=? AND lesson_id=?`,
      [userId, lessonId]
    );
    res.json(rows[0] || { last_step_index: 0, completed: 0 });
  } catch (err) { next(err); }
});

router.put('/progress/:lessonId', async (req, res, next) => {
  try {
    const { lessonId } = req.params;
    const { lastStepIndex, completed } = req.body;

    const [users] = await pool.query(`SELECT id FROM users WHERE cognito_sub=?`, [req.user.sub]);
    const userId = users.length ? users[0].id : (await pool.query(
      `INSERT INTO users (cognito_sub, display_name) VALUES (?, ?)`,
      [req.user.sub, req.user.email || null]
    ))[0].insertId;

    await pool.query(
      `INSERT INTO progress (user_id, lesson_id, last_step_index, completed) 
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE last_step_index=VALUES(last_step_index), completed=VALUES(completed), updated_at=NOW()`,
      [userId, lessonId, Number(lastStepIndex) || 0, completed ? 1 : 0]
    );
    res.json({ ok: true });
  } catch (err) { next(err); }
});

export default router;