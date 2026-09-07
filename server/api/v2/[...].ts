import { Hono } from 'hono';
import { authMiddleware, facilityMiddleware } from '~/server/v2/auth';

const app = new Hono()
  .basePath('/api/v2')
  .use('*', authMiddleware)
  .use('*', facilityMiddleware);

export default defineEventHandler((event) => {
  return app.fetch(toWebRequest(event));
});
