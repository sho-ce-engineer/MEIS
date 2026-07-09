import pool from '~/server/config/db';
import crypto from 'crypto';
import { Resend } from 'resend';

// TODO: 現状はSMTPへの送信成功までしか検知できない。
// 不達検知の必要性など、今後検討

interface inviteRequestBody {
  invited_by_user_id: string;
  invited_by_user_name: string;
  email: string;
}

const generateInviteCode = (length = 16) => {
  return crypto.randomBytes(length).toString('hex');
};

const createInvitation = async (
  email: string,
  facility_code: string,
  user_role: string,
  invited_by: string,
  inviteCode: string,
) => {
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // 7日間有効

  const query = `
    INSERT INTO invitations (invite_code, email, facility_code, user_role, invited_by_user_id, expires_at)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *;
  `;
  const values = [
    inviteCode,
    email,
    facility_code,
    user_role,
    invited_by,
    expiresAt,
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
};

const resendApiKey = process.env.RESEND_API_KEY;
if (!resendApiKey) {
  console.error('[invite] RESEND_API_KEY is not configured');
  throw new Error('[invite] RESEND_API_KEY is not configured');
}
const resend = new Resend(resendApiKey);

export default defineEventHandler(async (event) => {
  // 認証ユーザーの取得
  const authenticatedUser = getAuthenticatedUser(event);

  // 認証情報からデータを取得
  const authenticatedUserQuery = `
  SELECT
    u.facility_code,
    f.facility_name,
    u.user_role
  FROM users u
  LEFT JOIN facilities f ON u.facility_code = f.facility_code
  WHERE u.user_id = $1
  `;

  const AuthenticatedUserFacilityResult = await pool.query(
    authenticatedUserQuery,
    [authenticatedUser.user_id],
  );
  if (AuthenticatedUserFacilityResult.rowCount === 0) {
    console.error(
      `[invite] Facility code not found for user_id: ${authenticatedUser.user_id}`,
    );
    throw createError({
      statusCode: 404,
      statusText: 'Not Found',
      data: { message: '施設コードが見つかりません。' },
    });
  }

  const facilityCode: string =
    AuthenticatedUserFacilityResult.rows[0].facility_code;

  const userRole: string = AuthenticatedUserFacilityResult.rows[0].user_role;

  if (userRole !== 'admin') {
    throw createError({
      statusCode: 403,
      statusText: 'Forbidden',
      data: { message: '変更権限がありません。' },
    });
  }

  const facilityName: string =
    AuthenticatedUserFacilityResult.rows[0].facility_name;

  if (!facilityName) {
    throw createError({
      statusCode: 404,
      statusText: 'Not Found',
      data: { message: '施設名が見つかりません。' },
    });
  }

  const body = await readBody<inviteRequestBody>(event);
  const { invited_by_user_id, invited_by_user_name, email } = body;

  if (!invited_by_user_id || !invited_by_user_name || !email) {
    throw createError({
      statusCode: 400,
      statusText: 'Bad Request',
      data: { message: '必須項目が不足しています。' },
    });
  }

  const inviteCode = generateInviteCode();
  const frontendUrl = process.env.FRONTEND_URL;
  const inviteUrl = `${frontendUrl}/?invite=${inviteCode}`;

  const mailOptions = {
    from: `MEIS|医療機器点検記録管理アプリ<${process.env.EMAIL_SERVICE_USER}>`,
    to: [email],
    subject: 'クラウド医療機器管理M.E.I.S｜施設から招待状が届きました！',
    text: `クラウド医療機器管理サービス< M.E.I.S >\n\nこんにちは！\nあなたに ${facilityName} の${invited_by_user_name}様から招待状が発行されました！以下のリンクからサインアップして、業務を開始してください！\n\n${inviteUrl}\n\n※万が一このメールに身に覚えがない場合は、削除いただくようお願いいたします。`,
    html: `<p>クラウド医療機器管理サービス &lt; M.E.I.S &gt;</p>
            <br>
            <p>こんにちは！</p>
            <p>あなたに <strong>${facilityName}の${invited_by_user_name}様</strong> から招待状が発行されました！以下のリンクからサインアップして、業務を開始してください！</p>
            <p><a href="${inviteUrl}">${inviteUrl}</a></p>
            <br>
            <p>※万が一このメールに身に覚えがない場合は、削除いただくようお願いいたします。</p>
      `,
  };

  // DB書き込み
  try {
    await createInvitation(
      email,
      facilityCode,
      userRole,
      invited_by_user_id,
      inviteCode,
    );
  } catch (error) {
    console.error('[invite] DB error:', error);
    throw createError({
      statusCode: 500,
      statusText: 'Internal Server Error',
      data: { message: '招待情報の保存に失敗しました。' },
    });
  }

  // メール送信
  try {
    await resend.emails.send(mailOptions);
  } catch (error) {
    console.error('[invite] Mail error:', error);
    throw createError({
      statusCode: 500,
      statusText: 'Internal Server Error',
      data: {
        message:
          '招待メールの送信に失敗しました。招待情報は保存されています。管理者に連絡してください。',
      },
    });
  }

  return sendNoContent(event);
});
