import bcrypt from 'bcrypt';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { sign, verify } from 'hono/jwt';
import { toRomaji } from 'wanakana';
import { sendMail } from '~/server/mail/send-mail';
import {
  makeSignupMailText,
  makeSignupNotificationMailText,
} from '~/server/utils/makeSignupMailText';
import { zValidator } from '~/server/v2/lib/zValidator';
import { addSessionRequestSchema } from './add-session/domain';
import { getUserCredential } from './add-session/service';
import { addUserRequestSchema } from './add-user/domain';
import {
  addFacility,
  addUser,
  getInvitation,
  getUserByEmail,
  updateInvitationAsUsed,
} from './add-user/service';
import { getSessionUser } from './get-session/service';
import { generateUserId } from './lib/generateUserId';
import { verifyRecaptcha } from './lib/verifyRecaptcha';

const TOKEN_EXPIRES_IN_SECONDS = 60 * 60;

const ownerEmail = process.env.EMAIL_SERVICE_OWNER;
if (!ownerEmail) {
  console.error('[auth] EMAIL_SERVICE_OWNER is not configured');
  throw new Error('[auth] EMAIL_SERVICE_OWNER is not configured');
}

const getSecretKey = () => {
  const secretKey = process.env.SECRET_KEY;
  if (!secretKey) {
    console.error('[auth] SECRET_KEY is not configured');
    throw new HTTPException(500, { message: 'サーバー設定エラー' });
  }
  return secretKey;
};

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

const app = new Hono()
  .post('/login', zValidator('json', addSessionRequestSchema), async (c) => {
    const { email, password, recaptchaToken } = c.req.valid('json');

    await ensureRecaptcha(recaptchaToken);

    const user = await withDbError('login', () => getUserCredential({ email }));

    const isValidPassword = user
      ? await bcrypt.compare(password, user.password)
      : false;
    if (!user || !isValidPassword) {
      throw new HTTPException(401, {
        message: 'メールアドレスまたはパスワードが正しくありません',
      });
    }

    const now = Math.floor(Date.now() / 1000);
    const token = await sign(
      { user_id: user.userId, iat: now, exp: now + TOKEN_EXPIRES_IN_SECONDS },
      getSecretKey(),
      'HS256',
    );

    return c.json({ token });
  })
  .get('/session', async (c) => {
    const authHeaderValue = c.req.header('Authorization');
    if (!authHeaderValue) {
      throw new HTTPException(401, {
        message: 'Authorizationヘッダーが見つかりません。',
      });
    }

    const secretKey = getSecretKey();
    const [, token] = authHeaderValue.split('Bearer ');

    let userId: string;
    try {
      const payload = await verify(token, secretKey, 'HS256');
      userId = payload.user_id as string;
    } catch (error) {
      console.error('[auth/session]JWT verification failed:', error);
      throw new HTTPException(401, { message: 'ログインが必要です。' });
    }

    const user = await withDbError('session', () => getSessionUser({ userId }));
    if (!user) {
      throw new HTTPException(404, { message: 'ユーザーが見つかりません。' });
    }

    return c.json({
      userId: user.userId,
      email: user.userEmail,
      name: user.userName,
      role: user.userRole,
      facilityCode: user.facilityCode,
      facilityName: user.facilityName,
    });
  })
  .post('/logout', (c) => c.json({ message: 'logout successfully' }))
  .post('/signup', zValidator('json', addUserRequestSchema), async (c) => {
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
  });

export default app;
