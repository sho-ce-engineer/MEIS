import bcrypt from 'bcrypt';
import type { AuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { addSessionRequestSchema } from './add-session/domain';
import { getUserCredential } from './add-session/service';
import { getSessionUser } from './get-session/service';
import { verifyRecaptcha } from './lib/verifyRecaptcha';

export const AUTH_COOKIE_NAME = 'auth.token';
const SESSION_MAX_AGE_SECONDS = 60 * 60;

const secretKey = process.env.SECRET_KEY;
if (!secretKey) {
  console.error('[auth] SECRET_KEY is not configured');
  throw new Error('[auth] SECRET_KEY is not configured');
}
export const authSecret = secretKey;

const Credentials =
  (CredentialsProvider as unknown as { default?: typeof CredentialsProvider })
    .default ?? CredentialsProvider;

export const authOptions: AuthOptions = {
  secret: authSecret,
  session: { strategy: 'jwt', maxAge: SESSION_MAX_AGE_SECONDS },
  jwt: { maxAge: SESSION_MAX_AGE_SECONDS },
  cookies: {
    sessionToken: {
      name: AUTH_COOKIE_NAME,
      options: {
        httpOnly: true,
        sameSite: 'strict',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  pages: { signIn: '/' },
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { type: 'email' },
        password: { type: 'password' },
        recaptchaToken: { type: 'text' },
      },
      async authorize(credentials) {
        const parsed = addSessionRequestSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }
        const { email, password, recaptchaToken } = parsed.data;

        let isHuman: boolean;
        try {
          isHuman = await verifyRecaptcha(recaptchaToken);
        } catch (error) {
          console.error('[auth/recaptcha]Error verifying reCAPTCHA:', error);
          throw new Error('サーバー設定エラー');
        }
        if (!isHuman) {
          throw new Error('reCAPTCHA検証に失敗しました。');
        }

        let user: Awaited<ReturnType<typeof getUserCredential>>;
        try {
          user = await getUserCredential({ email });
        } catch (error) {
          console.error('[auth/login]Error executing query:', error);
          throw new Error('サーバーエラーが発生しました。');
        }

        const isValidPassword = user
          ? await bcrypt.compare(password, user.password)
          : false;
        if (!user || !isValidPassword) {
          return null;
        }

        return { id: user.userId };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        return { sub: user.id, userId: user.id };
      }
      return token;
    },
    async session({ session, token }) {
      if (typeof token.userId !== 'string') {
        throw new Error('[auth/session] userId is missing in token');
      }
      const user = await getSessionUser({ userId: token.userId });
      if (!user) {
        throw new Error('[auth/session] user not found');
      }

      return {
        expires: session.expires,
        userId: user.userId,
        email: user.userEmail,
        name: user.userName,
        role: user.userRole,
        facilityCode: user.facilityCode,
        facilityName: user.facilityName,
      };
    },
  },
};
