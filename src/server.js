import 'dotenv/config';
import app from './app.js';
import { logger } from './utils/logger.js';

const port = process.env.PORT || 3000;
app.listen(port, () => {
  logger.info({ port }, 'SMA API listening');
});