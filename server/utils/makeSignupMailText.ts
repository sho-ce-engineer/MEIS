export interface MakeSignupMailTextParams {
  userName: string;
  userEmail: string;
}

export interface MakeSignupNotificationMailTextParams {
  userName: string;
  facilityName: string;
}

const frontendUrl = process.env.FRONTEND_URL;
if (!frontendUrl) {
  console.error('[signup] FRONTEND_URL is not configured');
  throw new Error('[signup] FRONTEND_URL is not configured');
}

export const makeSignupMailText = ({
  userName,
  userEmail,
}: MakeSignupMailTextParams) => {
  const text = `こんにちは、${userName}さん！\n\nこのたびは【M.E.I.S｜クラウド医療機器管理サービス】にご登録いただき、誠にありがとうございます。あなたのアカウントが無事に作成されました。\n\n以下の情報でログインできます。\n\n- メールアドレス: ${userEmail}\n- パスワード: ＊＊セキュリティ保護の観点から伏せています＊＊\n- URL: ${frontendUrl}\n\nログイン後は、さまざまな機能をご利用いただけます。ぜひご活用ください。\n\n何かご不明な点や問題がございましたら、お気軽にお問い合わせください。\n\nこれからもM.E.I.Sをよろしくお願いいたします。\nM.E.I.S開発チーム URL: ${frontendUrl}`;
  const html = `<p>こんにちは、${userName}さん！</p>
        <p>このたびは【M.E.I.S｜クラウド医療機器管理サービス】にご登録いただき、誠にありがとうございます。あなたのアカウントが無事に作成されました。</p>
        <p>以下の情報でログインできます：</p>
        <ul>
            <li><strong>メールアドレス:</strong> ${userEmail}</li>
            <li><strong>パスワード：</strong>＊＊セキュリティ保護の観点から伏せています＊＊</li>
            <li><strong>URL：</strong> <a href="${frontendUrl}">${frontendUrl}</a></li>
        </ul>
        <p>ログイン後は、さまざまな機能をご利用いただけます。ぜひご活用ください。</p>
        <p>何かご不明な点や問題がございましたら、お気軽にお問い合わせください。</p>
        <p>これからもM.E.I.Sをよろしくお願いいたします。</p>
        <p>M.E.I.S開発チーム<br>
        <a href="${frontendUrl}">${frontendUrl}</a></p>`;

  return { text, html };
};

export const makeSignupNotificationMailText = ({
  userName,
  facilityName,
}: MakeSignupNotificationMailTextParams) => {
  const registeredAt = new Date().toLocaleString();

  const text = `新規ユーザーが登録されました！\n\n- ユーザー名: ${userName}\n- 施設名：${facilityName}\n- 登録日時: ${registeredAt}\n\n詳細はシステムをご確認ください。`;
  const html = `<p>新規ユーザーが登録されました！</p>
        <ul>
            <li><strong>ユーザー名:</strong> ${userName}</li>
            <li><strong>施設名：</strong> ${facilityName}</li>
            <li><strong>登録日時:</strong> ${registeredAt}</li>
        </ul>
        <p>詳細はシステムをご確認ください。</p>`;

  return { text, html };
};
