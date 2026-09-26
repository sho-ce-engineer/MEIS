export interface MakeInvitationMailTxtParams {
  facilityName: string;
  invitedByUserName: string;
  inviteCode: string;
}

const frontendUrl = process.env.FRONTEND_URL;
if (!frontendUrl) {
  console.error('[invite-user] FRONTEND_URL is not configured');
  throw new Error('[invite-user] FRONTEND_URL is not configured');
}

export const makeInvitationMailTxt = ({
  facilityName,
  invitedByUserName,
  inviteCode,
}: MakeInvitationMailTxtParams) => {
  const inviteUrl = `${frontendUrl}/?invite=${inviteCode}`;

  const text = `クラウド医療機器管理サービス< M.E.I.S >\n\nこんにちは！\nあなたに ${facilityName} の${invitedByUserName}様から招待状が発行されました！以下のリンクからサインアップして、業務を開始してください！\n\n${inviteUrl}`;
  const html = `<p>クラウド医療機器管理サービス &lt; M.E.I.S &gt;</p>
            <br>
            <p>こんにちは！</p>
            <p>あなたに <strong>${facilityName}の${invitedByUserName}様</strong> から招待状が発行されました！以下のリンクからサインアップして、業務を開始してください！</p>
            <p><a href="${inviteUrl}">${inviteUrl}</a></p>
      `;

  return { text, html };
};
