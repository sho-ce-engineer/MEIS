import { Hono } from 'hono';
import { except } from 'hono/combine';
import {
  adminUserOnlyMiddleware,
  authMiddleware,
  facilityMiddleware,
} from '~/server/v2/auth';
import authRouter from '~/server/v2/auth/router';
import equipmentRouter from '~/server/v2/equipment/router';
import inspectionRouter from '~/server/v2/inspection/router';
import issuesRouter from '~/server/v2/issues/router';
import { errorHandler } from '~/server/v2/lib/errorHandler';
import notificationsRouter from '~/server/v2/notifications/router';
import settingsRouter from '~/server/v2/settings/router';

const app = new Hono()
  .basePath('/api/v2')
  .use('*', except('/api/v2/auth/*', authMiddleware))
  .use('/issues/*', facilityMiddleware)
  .use('/inspection/*', facilityMiddleware)
  .use('/equipment/*', facilityMiddleware)
  .use('/settings/*', facilityMiddleware)
  .use('/settings/users', adminUserOnlyMiddleware)
  .use('/settings/role', adminUserOnlyMiddleware)
  .use('/settings/user', adminUserOnlyMiddleware)
  .use('/settings/invitations', adminUserOnlyMiddleware)
  .route('/auth', authRouter)
  .route('/notifications', notificationsRouter)
  .route('/issues', issuesRouter)
  .route('/inspection', inspectionRouter)
  .route('/equipment', equipmentRouter)
  .route('/settings', settingsRouter)
  .onError(errorHandler);

export default defineEventHandler((event) => {
  return app.fetch(toWebRequest(event));
});
