import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { toRomaji } from 'wanakana';
import { sendMail } from '~/server/mail/send-mail';
import {
  makeSignupMailText,
  makeSignupNotificationMailText,
} from '~/server/utils/makeSignupMailText';
import { zValidator } from '~/server/v2/lib/zValidator';
import { addUserRequestSchema } from './add-user/domain';
import {
  addFacility,
  addUser,
  getInvitation,
  getUserByEmail,
  updateInvitationAsUsed,
} from './add-user/service';
import { generateUserId } from './lib/generateUserId';
import { verifyRecaptcha } from './lib/verifyRecaptcha';

const ownerEmail = process.env.EMAIL_SERVICE_OWNER;
if (!ownerEmail) {
  console.error('[auth] EMAIL_SERVICE_OWNER is not configured');
  throw new Error('[auth] EMAIL_SERVICE_OWNER is not configured');
}

const ensureRecaptcha = async (recaptchaToken: string) => {
  let isHuman: boolean;
  try {
    isHuman = await verifyRecaptcha(recaptchaToken);
  } catch (error) {
    console.error('[auth/recaptcha]Error verifying reCAPTCHA:', error);
    throw new HTTPException(500, { message: 'サーバー設定エラー' });
  }
  if (!isHuman) {
    throw new HTTPException(400, { message: 'reCAPTCHA検証に失敗しました。' });
  }
};

const withDbError = async <T>(label: string, query: () => Promise<T>) => {
  try {
    return await query();
  } catch (error) {
    console.error(`[auth/${label}]Error executing query:`, error);
    throw new HTTPException(500, { message: 'サーバーエラーが発生しました。' });
  }
};

const app = new Hono().post(
  '/',
  zValidator('json', addUserRequestSchema),
  async (c) => {
    const {
      email,
      password,
      userName,
      facilityName,
      inviteCode,
      recaptchaToken,
    } = c.req.valid('json');

    await ensureRecaptcha(recaptchaToken);

    const existingUser = await withDbError('signup', () =>
      getUserByEmail({ email }),
    );
    if (existingUser) {
      throw new HTTPException(400, {
        message: 'このメールアドレスは既に使用されています。',
      });
    }

    let facilityCode: string;
    let userRole: string;
    let resolvedFacilityName: string;

    if (inviteCode) {
      const invitation = await withDbError('signup', () =>
        getInvitation({ inviteCode }),
      );
      if (!invitation) {
        throw new HTTPException(404, { message: '無効な招待コードです。' });
      }
      if (new Date() > new Date(invitation.expiresAt ?? 0)) {
        throw new HTTPException(400, {
          message: '招待コードの有効期限が切れています。',
        });
      }
      if (email !== invitation.email) {
        throw new HTTPException(400, {
          message: '招待コードとメールアドレスが一致しません。',
        });
      }

      facilityCode = invitation.facilityCode;
      userRole = invitation.userRole ?? 'general';
      resolvedFacilityName = invitation.facilityName ?? '';
    } else {
      if (!facilityName) {
        throw new HTTPException(400, {
          message: '登録には、施設名の入力が必要です。',
        });
      }

      facilityCode = `facility${toRomaji(facilityName)}`;
      userRole = 'admin';
      resolvedFacilityName = facilityName;

      await withDbError('signup', () =>
        addFacility({ facilityCode, facilityName }),
      );
    }

    const newUser = await withDbError('signup', () =>
      addUser({
        userId: generateUserId(facilityCode),
        userEmail: email,
        password,
        userName,
        facilityCode,
        userRole,
      }),
    );
    if (!newUser) {
      console.error('[auth/signup]Inserted user was not returned');
      throw new HTTPException(500, {
        message: 'サーバーエラーが発生しました。',
      });
    }

    if (inviteCode) {
      await withDbError('signup', () => updateInvitationAsUsed({ inviteCode }));
    }

    const userMail = makeSignupMailText({ userName, userEmail: email });
    try {
      await sendMail(
        email,
        'クラウド医療機器管理M.E.I.S｜ユーザー登録が完了しました！',
        userMail.text,
        userMail.html,
      );
    } catch (error) {
      console.error('[auth/signup]Error sending signup mail to user:', error);
    }

    const notificationMail = makeSignupNotificationMailText({
      userName,
      facilityName: resolvedFacilityName,
    });
    try {
      await sendMail(
        ownerEmail,
        'M.E.I.Sに新規ユーザーが登録されました',
        notificationMail.text,
        notificationMail.html,
      );
    } catch (error) {
      console.error('[auth/signup]Error sending signup mail to owner:', error);
    }

    return c.json({
      data: {
        message: 'アカウントが作成されました',
        user: {
          userId: newUser.userId,
          email: newUser.userEmail,
          name: newUser.userName,
          facilityCode: newUser.facilityCode,
          role: newUser.userRole,
        },
      },
    });
  },
);

export default app;
