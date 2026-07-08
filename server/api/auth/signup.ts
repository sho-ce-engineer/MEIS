import bcrypt from 'bcrypt';
import pool from '~/server/config/db';
import { format } from 'date-fns';
import { toRomaji } from 'wanakana';
import { Resend } from 'resend';

//ToDo：将来Verify式のメアド認証を導入する

// ユーザーID生成関数
const generateUserId = (facilityCode: string): string => {
  return `${facilityCode}${format(new Date(), 'yyyyMMddHHmmss')}`;
};

// サインアップリクエストボディの型定義
interface SignupRequestBody {
  email: string;
  password: string;
  user_name: string;
  facility_name?: string;
  inviteCode?: string;
  recaptchaToken: string;
}

interface InvitationRecord {
  email: string;
  facility_code: string;
  facility_name: string;
  user_role: string;
  expires_at: Date;
}

const resendApiKey = process.env.RESEND_API_KEY;
if (!resendApiKey) {
  console.error('[signup] RESEND_API_KEY is not configured');
  throw createError({
    statusCode: 500,
    statusText: 'Internal Server Error',
    data: { message: 'サーバー設定エラー' },
  });
}
const resend = new Resend(resendApiKey);

const ownerEmail = process.env.EMAIL_SERVICE_OWNER;
if (!ownerEmail) {
  console.error('[signup] EMAIL_SERVICE_OWNER is not configured');
  throw createError({
    statusCode: 500,
    statusText: 'Internal Server Error',
    data: { message: 'サーバー設定エラー' },
  });
}

export default defineEventHandler(async (event) => {
  const {
    email: user_email,
    password,
    user_name,
    facility_name,
    inviteCode,
    recaptchaToken,
  } = await readBody<SignupRequestBody>(event);

  // 必須フィールドのバリデーション
  if (!user_email || !password || !user_name) {
    throw createError({
      statusCode: 400,
      statusText: 'Bad Request',
      data: { message: '全ての必須フィールドを入力してください。' },
    });
  }

  // reCAPTCHA 検証
  const recaptchaSecret = process.env.RECAPTCHA_SECRET_KEY;
  if (!recaptchaSecret) {
    console.error('[signup] RECAPTCHA_SECRET_KEY is not configured');
    throw createError({
      statusCode: 500,
      statusText: 'Internal Server Error',
      data: { message: 'サーバー設定エラー' },
    });
  }

  const recaptchaResponse = await fetch(
    `https://www.google.com/recaptcha/api/siteverify`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
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
      data: { message: 'reCAPTCHA 検証に失敗しました。' },
    });
  }

  // メールアドレスの重複チェック
  const emailQuery = 'SELECT user_id FROM users WHERE user_email = $1';
  const emailCheck = await pool.query(emailQuery, [user_email]);
  if (emailCheck.rows.length > 0) {
    throw createError({
      statusCode: 400,
      statusText: 'Bad Request',
      data: { message: 'このメールアドレスは既に使用されています。' },
    });
  }

  // 分岐で施設コードとユーザーロールを決定
  let facilityCode: string;
  let userRole: string;
  let resolvedFacilityName: string;

  // inviteCode がある場合、invitations テーブルから情報を取得
  if (inviteCode) {
    const inviteQuery = `
    SELECT i.email, i.facility_code, i.user_role, i.expires_at, f.facility_name
    FROM invitations i
    LEFT JOIN facilities f ON i.facility_code = f.facility_code
    WHERE i.invite_code = $1
      `;
    const inviteResult = await pool.query<InvitationRecord>(inviteQuery, [
      inviteCode,
    ]);

    if (inviteResult.rows.length === 0) {
      throw createError({
        statusCode: 404,
        statusText: 'Not Found',
        data: { message: '無効な招待コードです。' },
      });
    }

    const inviteData = inviteResult.rows[0];

    // 招待の有効期限をチェック
    if (new Date() > new Date(inviteData.expires_at)) {
      throw createError({
        statusCode: 400,
        statusText: 'Bad Request',
        data: { message: '招待コードの有効期限が切れています。' },
      });
    }

    // 招待コードに登録されているメールと一致しているか確認
    if (user_email !== inviteData.email) {
      throw createError({
        statusCode: 400,
        statusText: 'Bad Request',
        data: { message: '招待コードとメールアドレスが一致しません。' },
      });
    }

    // 招待コードの施設情報と役割を使用
    facilityCode = inviteData.facility_code;
    userRole = inviteData.user_role;
    resolvedFacilityName = inviteData.facility_name;
  } else {
    // 招待コードがない場合は新しい施設を作成
    if (!facility_name) {
      throw createError({
        statusCode: 400,
        statusText: 'Bad Request',
        data: { message: '登録には、施設名の入力が必要です。' },
      });
    }

    facilityCode = `facility${toRomaji(facility_name)}`;
    userRole = 'admin'; // 新規作成者は管理者
    resolvedFacilityName = facility_name;

    // 施設を登録
    const facilityInsertQuery = `
        INSERT INTO facilities (facility_code, facility_name)
        VALUES ($1, $2)
        ON CONFLICT (facility_code) DO NOTHING
        RETURNING facility_code
      `;
    await pool.query(facilityInsertQuery, [facilityCode, facility_name]);
  }

  // パスワードをハッシュ化してユーザーを登録
  const hashedPassword = await bcrypt.hash(password, 10);
  const userId = generateUserId(facilityCode);
  const userInsertQuery = `
      INSERT INTO users (user_id, user_email, password, user_name, facility_code, user_role)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING user_id, user_email, user_name, facility_code, user_role
    `;
  const result = await pool.query(userInsertQuery, [
    userId,
    user_email,
    hashedPassword,
    user_name,
    facilityCode,
    userRole,
  ]);
  // 招待コードを使用済みにする（inviteCode の頭に 'USED_' を追記）
  if (inviteCode) {
    const updateInviteQuery = `
        UPDATE invitations
        SET invite_code = CONCAT('USED_', invite_code)
        WHERE invite_code = $1
      `;
    await pool.query(updateInviteQuery, [inviteCode]);
  }

  // メール送信処理は将来的にservice層に切り出す予定だが、現状はここで直接resendを使用して送信する
  // ユーザー向けのメールオプション
  const userMailOptions = {
    from: `MEIS|医療機器点検記録管理アプリ<${process.env.EMAIL_SERVICE_USER}>`,
    to: [user_email],
    subject: 'クラウド医療機器管理M.E.I.S｜ユーザー登録が完了しました！',
    text: `こんにちは、${user_name}さん！\n
        \n
        このたびは【M.E.I.S｜クラウド医療機器管理サービス】にご登録いただき、誠にありがとうございます。あなたのアカウントが無事に作成されました。\n
        \n
        以下の情報でログインできます。\n
        \n
        - メールアドレス: ${user_email} \n
        - パスワード: ＊＊セキュリティ保護の観点から伏せています＊＊ \n
        - URL: ${process.env.FRONTEND_URL} \n
        \n
        ログイン後は、さまざまな機能をご利用いただけます。ぜひご活用ください。\n
        \n
        何かご不明な点や問題がございましたら、お気軽にお問い合わせください。\n
        \n
        これからもM.E.I.Sをよろしくお願いいたします。\n
        M.E.I.S開発チーム URL: ${process.env.FRONTEND_URL}\n
        ※万が一このメールに身に覚えがない場合は、削除いただくようお願いいたします。`,
    html: `<p>こんにちは、${user_name}さん！</p>
        <p>このたびは【M.E.I.S｜クラウド医療機器管理サービス】にご登録いただき、誠にありがとうございます。あなたのアカウントが無事に作成されました。</p>
        <p>以下の情報でログインできます：</p>
        <ul>
            <li><strong>メールアドレス:</strong> ${user_email}</li>
            <li><strong>パスワード：</strong>＊＊セキュリティ保護の観点から伏せています＊＊</li>
            <li><strong>URL：</strong> <a href="${process.env.FRONTEND_URL}">${process.env.FRONTEND_URL}</a></li>
        </ul>
        <p>ログイン後は、さまざまな機能をご利用いただけます。ぜひご活用ください。</p>
        <p>何かご不明な点や問題がございましたら、お気軽にお問い合わせください。</p>
        <p>これからもM.E.I.Sをよろしくお願いいたします。</p>
        <p>M.E.I.S開発チーム<br>
        <a href="${process.env.FRONTEND_URL}">${process.env.FRONTEND_URL}</a></p>
        <p>※万が一このメールに身に覚えがない場合は、削除いただくようお願いいたします。</p>`,
  };

  // 管理者向けのメールオプション
  const adminMailOptions = {
    from: `MEIS|医療機器点検記録管理アプリ<${process.env.EMAIL_SERVICE_USER}>`,
    to: [ownerEmail],
    subject: 'M.E.I.Sに新規ユーザーが登録されました',
    text: `新規ユーザーが登録されました！\n
        \n
        - ユーザー名: ${user_name}\n
        - 施設名：${resolvedFacilityName}\n
        - 登録日時: ${new Date().toLocaleString()}\n
        \n
        詳細はシステムをご確認ください。`,
    html: `<p>新規ユーザーが登録されました！</p>
        <ul>
            <li><strong>ユーザー名:</strong> ${user_name}</li>
            <li><strong>施設名：</strong> ${resolvedFacilityName}</li>
            <li><strong>登録日時:</strong> ${new Date().toLocaleString()}</li>
        </ul>
        <p>詳細はシステムをご確認ください。</p>`,
  };

  try {
    await resend.emails.send(userMailOptions);
  } catch (userMailError) {
    console.error('[signup]登録ユーザー宛メール送信エラー:', userMailError);
  }

  try {
    await resend.emails.send(adminMailOptions);
  } catch (adminMailError) {
    console.error('[signup]管理者宛メール送信エラー:', adminMailError);
    // メール送信に失敗してもユーザー登録は成功とする
  }

  const newUser = result.rows[0];
  return {
    data: {
      message: 'アカウントが作成されました',
      user: {
        user_id: newUser.user_id,
        email: newUser.user_email,
        name: newUser.user_name,
        facility_code: newUser.facility_code,
        role: newUser.user_role,
      },
    },
  };
});
