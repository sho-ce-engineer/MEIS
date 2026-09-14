import { Hono } from 'hono';
import { authMiddleware, facilityMiddleware } from '~/server/v2/auth';
import inspectionRouter from '~/server/v2/inspection/router';
import issuesRouter from '~/server/v2/issues/router';
import notificationsRouter from '~/server/v2/notifications/router';

const app = new Hono()
  .basePath('/api/v2')
  .use('*', authMiddleware)
  .use('/issues/*', facilityMiddleware)
  .use('/inspection/*', facilityMiddleware)
  .route('/notifications', notificationsRouter)
  .route('/issues', issuesRouter)
  .route('/inspection', inspectionRouter);

export default defineEventHandler((event) => {
  return app.fetch(toWebRequest(event));
});
