import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '~/server/config/db';

// リクエストボディの型定義
interface LoginRequestBody {
  email: string;
  password: string;
  recaptchaToken: string;
}

// DBから取得するユーザーの型定義
interface UserRecord {
  user_id: string;
  user_email: string;
  password: string;
  user_name: string;
  user_role: string;
  facility_code: string;
}

export default defineEventHandler(async (event) => {
  const { email, password, recaptchaToken } =
    await readBody<LoginRequestBody>(event);

  if (!email || !password) {
    throw createError({
      statusCode: 400,
      statusText: 'Bad Request',
      data: { message: 'メールアドレスとパスワードは必須です' },
    });
  }

  // reCAPTCHA検証
  const recaptchaSecret = process.env.RECAPTCHA_SECRET_KEY;
  if (!recaptchaSecret) {
    console.error('[login] RECAPTCHA_SECRET_KEY is not configured');
    throw createError({
      statusCode: 500,
      statusText: 'Internal Server Error',
      data: { message: 'サーバー設定エラー' },
    });
  }

  const recaptchaResponse = await fetch(
    'https://www.google.com/recaptcha/api/siteverify',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret: recaptchaSecret,
        response: recaptchaToken,
      }),
    },
  );
  const recaptchaResult = await recaptchaResponse.json();
  if (!recaptchaResult.success) {
    throw createError({
      statusCode: 400,
      statusText: 'Bad Request',
      data: { message: 'reCAPTCHA検証に失敗しました' },
    });
  }

  const result = await pool.query<UserRecord>(
    // SELECT * は避けて必要なカラムのみ取得
    'SELECT user_id, user_email, password, user_name, user_role, facility_code FROM users WHERE user_email = $1',
    [email],
  );

  if (!result.rowCount) {
    throw createError({
      statusCode: 401,
      statusText: 'Unauthorized',
      data: { message: 'メールアドレスまたはパスワードが正しくありません' },
    });
  }

  // rows[0] の型が UserRecord として保証される
  const user: UserRecord = result.rows[0];

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    throw createError({
      statusCode: 401,
      statusText: 'Unauthorized',
      data: { message: 'メールアドレスまたはパスワードが正しくありません' },
    });
  }

  const secretKey = process.env.SECRET_KEY;
  if (!secretKey) {
    console.error('[login] SECRET_KEY is not configured');
    throw createError({
      statusCode: 500,
      statusText: 'Internal Server Error',
      data: { message: 'サーバー設定エラー' },
    });
  }

  const token = jwt.sign(
    {
      user_id: user.user_id,
    },
    secretKey,
    { expiresIn: '1h' },
  );

  return { token };
});
