import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { DatabaseError, DrizzleQueryError } from '~/server/db';
import { sendMail } from '~/server/mail/send-mail';
import { generateInviteCode } from '~/server/utils/generateInviteCode';
import { makeInvitationMailTxt } from '~/server/utils/makeInviteMailText';
import type { Variables } from '~/server/v2/auth';
import { zValidator } from '~/server/v2/lib/zValidator';
import {
  listUsers,
  type SortOrder,
  type SortRow,
} from '~/server/v2/settings/admin/list-users/service';
import { updateUserRole } from '~/server/v2/settings/admin/update-role/service';
import { deleteUserRequestSchema } from './admin/delete-user/domain';
import { deleteUser } from './admin/delete-user/service';
import { inviteUserRequestSchema } from './admin/invite-user/domain';
import { addInvitation } from './admin/invite-user/service';
import { listUsersRequestSchema } from './admin/list-users/domain';
import { updateUserRoleRequestSchema } from './admin/update-role/domain';
import { updateUserDataRequestSchema } from './users/update-user-data/domain';
import { updateUserData } from './users/update-user-data/service';

const ALLOWED_SORT_KEYS: SortRow[] = ['userName', 'userRole'];

const app = new Hono<{ Variables: Variables }>()
  //admin
  .post('/users', zValidator('json', listUsersRequestSchema), async (c) => {
    const facilityCode = c.get('facilityCode');
    const {
      page = 1,
      itemsPerPage = 10,
      sortRow,
      sortOrder,
    } = c.req.valid('json');

    const sortByKey = ALLOWED_SORT_KEYS.includes(sortRow as SortRow)
      ? (sortRow as SortRow)
      : 'userName';
    const sortOrderValue: SortOrder =
      sortOrder === 'asc' || sortOrder === 'desc' ? sortOrder : 'asc';

    try {
      const result = await listUsers({
        facilityCode,
        page,
        itemsPerPage,
        sortRow: sortByKey,
        sortOrder: sortOrderValue,
      });

      return c.json(result);
    } catch (error) {
      console.error('[settings/users]Error executing query:', error);
      throw new HTTPException(500, {
        message: 'データの取得に失敗しました。',
      });
    }
  })
  .put('/role', zValidator('json', updateUserRoleRequestSchema), async (c) => {
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
        '[settings/role]Error occurred while changing User Role:',
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
  })
  .delete('/user', zValidator('json', deleteUserRequestSchema), async (c) => {
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
  .post(
    '/invitations',
    zValidator('json', inviteUserRequestSchema),
    async (c) => {
      const facilityCode = c.get('facilityCode');
      const facilityName = c.get('facilityName');

      const { invitedByUserId, invitedByUserName, email } = c.req.valid('json');

      const inviteCode = generateInviteCode();

      try {
        await addInvitation({
          email,
          facilityCode,
          userRole: 'admin',
          invitedByUserId,
          inviteCode,
        });
      } catch (error) {
        console.error('[settings/invite]Error invite User:', error);
        throw new HTTPException(500, {
          message: 'サーバーエラーが発生しました。',
        });
      }

      const inviteMailOption = makeInvitationMailTxt({
        facilityName,
        invitedByUserName,
        inviteCode,
      });

      const subject =
        'クラウド医療機器管理M.E.I.S｜施設から招待状が届きました！';
      try {
        await sendMail(
          email,
          subject,
          inviteMailOption.text,
          inviteMailOption.html,
        );
      } catch (error) {
        console.error(
          '[settings/sendMail]Error send invite mail to User:',
          error,
        );
        throw new HTTPException(500, {
          message:
            '招待メールの送信に失敗しました。招待情報は保存されています。管理者に連絡してください。',
        });
      }
      return c.body(null, 204);
    },
  )
  //general
  .patch(
    '/user-data',
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
