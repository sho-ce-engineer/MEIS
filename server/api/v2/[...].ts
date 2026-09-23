import { Hono } from 'hono';
import {
  adminUserOnlyMiddleware,
  authMiddleware,
  facilityMiddleware,
} from '~/server/v2/auth';
import equipmentRouter from '~/server/v2/equipment/router';
import inspectionRouter from '~/server/v2/inspection/router';
import issuesRouter from '~/server/v2/issues/router';
import notificationsRouter from '~/server/v2/notifications/router';
import settingsRouter from '~/server/v2/settings/router';

const app = new Hono()
  .basePath('/api/v2')
  .use('*', authMiddleware)
  .use('/issues/*', facilityMiddleware)
  .use('/inspection/*', facilityMiddleware)
  .use('/equipment/*', facilityMiddleware)
  .use('/settings/*', facilityMiddleware)
  .use('/settings/users', adminUserOnlyMiddleware)
  .use('/settings/role', adminUserOnlyMiddleware)
  .use('/settings/user', adminUserOnlyMiddleware)
  .route('/notifications', notificationsRouter)
  .route('/issues', issuesRouter)
  .route('/inspection', inspectionRouter)
  .route('/equipment', equipmentRouter)
  .route('/settings', settingsRouter);

export default defineEventHandler((event) => {
  return app.fetch(toWebRequest(event));
});
