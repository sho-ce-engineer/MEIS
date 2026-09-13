import { Hono } from 'hono';
//import { authMiddleware, facilityMiddleware } from '~/server/v2/auth';
import { authMiddleware } from '~/server/v2/auth';
import notificationsRouter from '~/server/v2/notifications/router';

const app = new Hono()
  .basePath('/api/v2')
  .use('*', authMiddleware)
  //  .use('*', facilityMiddleware)
  .route('/notifications', notificationsRouter);

export default defineEventHandler((event) => {
  return app.fetch(toWebRequest(event));
});
