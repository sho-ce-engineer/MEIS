import { Hono } from 'hono';
import { authMiddleware, facilityMiddleware } from '~/server/v2/auth';
import issuesRouter from '~/server/v2/issues/router';
import notificationsRouter from '~/server/v2/notifications/router';

const app = new Hono()
  .basePath('/api/v2')
  .use('*', authMiddleware)
  .use('/issues/*', facilityMiddleware)
  .route('/notifications', notificationsRouter)
  .route('/issues', issuesRouter);

export default defineEventHandler((event) => {
  return app.fetch(toWebRequest(event));
});
