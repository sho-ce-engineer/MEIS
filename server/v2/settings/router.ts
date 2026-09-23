import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { Variables } from '~/server/v2/auth';
import { updateUserRole } from '~/server/v2/settings/admin/role-change/service';
import { updateUserRoleRequestSchema } from './admin/role-change/domain';

const app = new Hono<{ Variables: Variables }>().put(
  '/role-change',
  zValidator('json', updateUserRoleRequestSchema),
  async (c) => {
    const facilityCode = c.get('facilityCode');
    const { newUserRole, targetUserId } = c.req.valid('json');

    let result: Awaited<ReturnType<typeof updateUserRole>>;

    try {
      result = await updateUserRole({
        facilityCode,
        newUserRole,
        targetUserId,
      });
    } catch (error) {
      console.error(
        '[settings/role-change]Error occurred while changing User Role:',
        error,
      );
      throw new HTTPException(500, {
        message: 'サーバーエラーが発生しました。',
      });
    }

    if (!result) {
      throw new HTTPException(404, {
        message: 'Record not found or no changes made',
      });
    }

    return c.body(null, 204);
  },
);

export default app;
