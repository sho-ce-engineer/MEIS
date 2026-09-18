import { Hono } from 'hono';
import type { Variables } from '~/server/v2/auth';
import itemsRouter from '~/server/v2/inspection/items/router';
import resultsRouter from '~/server/v2/inspection/results/router';

const app = new Hono<{ Variables: Variables }>()
  .route('/items', itemsRouter)
  .route('/results', resultsRouter);

export default app;
