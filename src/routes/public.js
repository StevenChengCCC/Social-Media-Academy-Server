import { Router } from 'express';
import pool from '../db/pool.js';

const router = Router();

router.get('/courses', async (_req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, title, slug, summary, cover_image_url FROM courses WHERE is_published=1 ORDER BY id DESC`
    );
    res.json(rows);
  } catch (err) { next(err); }
});

router.get('/courses/:slug', async (req, res, next) => {
  try {
    const { slug } = req.params;
    const [courses] = await pool.query(`SELECT * FROM courses WHERE slug=? AND is_published=1 LIMIT 1`, [slug]);
    if (!courses.length) return res.status(404).json({ error: 'not found' });
    const course = courses[0];
    const [lessons] = await pool.query(`SELECT * FROM lessons WHERE course_id=? ORDER BY order_index ASC`, [course.id]);

    for (const lesson of lessons) {
      const [steps] = await pool.query(
        `SELECT id, order_index, text_md, image_url, est_seconds FROM steps WHERE lesson_id=? ORDER BY order_index ASC`,
        [lesson.id]
      );
      lesson.steps = steps;
    }

    res.json({ ...course, lessons });
  } catch (err) { next(err); }
});

export default router;