import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { DatabaseError, DrizzleQueryError } from '~/server/db';
import type { Variables } from '~/server/v2/auth';
import {
  listUsers,
  type SortOrder,
  type SortRow,
} from '~/server/v2/settings/admin/list-users/service';
import { updateUserRole } from '~/server/v2/settings/admin/role-change/service';
import { listUsersRequestSchema } from './admin/list-users/domain';
import { updateUserRoleRequestSchema } from './admin/role-change/domain';
import { deleteUserRequestSchema } from './admin/user-delete/domain';
import { deleteUser } from './admin/user-delete/service';
import { updateUserDataRequestSchema } from './users/edit-userdata/domain';
import { updateUserData } from './users/edit-userdata/service';

const ALLOWED_SORT_KEYS: SortRow[] = ['userName', 'userRole'];

const app = new Hono<{ Variables: Variables }>()
  //admin
  .post('/users', zValidator('json', listUsersRequestSchema), async (c) => {
    const facilityCode = c.get('facilityCode');
    const {
      page = 1,
      itemsPerPage = 10,
      sortRow,
      sortByOrder,
    } = c.req.valid('json');

    const sortByKey = ALLOWED_SORT_KEYS.includes(sortRow as SortRow)
      ? (sortRow as SortRow)
      : 'userName';
    const sortOrderValue: SortOrder =
      sortByOrder === 'asc' || sortByOrder === 'desc' ? sortByOrder : 'asc';

    try {
      const result = await listUsers({
        facilityCode,
        page,
        itemsPerPage,
        sortRow: sortByKey,
        sortByOrder: sortOrderValue,
      });

      return c.json(result);
    } catch (error) {
      console.error('[settings/users]Error executing query:', error);
      throw new HTTPException(500, {
        message: 'データの取得に失敗しました。',
      });
    }
  })
  .put(
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
  )
  .delete('/', zValidator('json', deleteUserRequestSchema), async (c) => {
    const facilityCode = c.get('facilityCode');
    const { targetUserId } = c.req.valid('json');

    let result: Awaited<ReturnType<typeof deleteUser>>;

    try {
      result = await deleteUser({ facilityCode, targetUserId });
    } catch (error) {
      console.error('[settings/delete]Error deleting User:', error);
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
  })
  //general
  .patch(
    '/edit-userdata',
    zValidator('json', updateUserDataRequestSchema),
    async (c) => {
      const facilityCode = c.get('facilityCode');
      const userId = c.get('jwtPayload');

      const { userName, userEmail, password } = c.req.valid('json');
      let result: Awaited<ReturnType<typeof updateUserData>>;

      try {
        result = await updateUserData({
          userId: userId.user_id,
          facilityCode,
          userName,
          userEmail,
          password,
        });
      } catch (error) {
        if (
          error instanceof DrizzleQueryError &&
          error.cause instanceof DatabaseError &&
          error.cause.code === '23505'
        ) {
          throw new HTTPException(409, {
            message: 'そのメールアドレスはすでに登録されています。',
          });
        }

        console.error(
          '[settings/update]Error occurred while updating user data:',
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
