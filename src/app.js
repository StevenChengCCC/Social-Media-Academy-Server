import express from 'express';
import cors from 'cors';
import pinoHttp from 'pino-http';
import { logger } from './utils/logger.js';
import publicRoutes from './routes/public.js';
import progressRoutes from './routes/progress.js';
import { verifyJwt } from './auth/cognitoJwt.js';

const app = express();

const corsOrigins = (process.env.CORS_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
app.use(cors({ origin: corsOrigins.length ? corsOrigins : true }));
app.use(express.json());
app.use(pinoHttp({ logger }));

app.get('/healthz', (_req, res) => res.json({ ok: true }));

app.use('/api', publicRoutes);
app.use('/api', verifyJwt, progressRoutes);

// error handler
app.use((err, _req, res, _next) => {
  req?.log?.error({ err }, 'Unhandled error');
  res.status(500).json({ error: 'internal_error' });
});

export default app;