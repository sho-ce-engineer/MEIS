import resend from '~/server/mail/index';

const serviceAddress = process.env.EMAIL_SERVICE_USER;
if (!serviceAddress) {
  console.error('[send-mail] EMAIL_SERVICE_USER is not configured');
  throw new Error('[send-mail] EMAIL_SERVICE_USER is not configured');
}

export const sendMail = async (
  toAddress: string,
  subject: string,
  text: string,
  html: string,
) => {
  const mailOptions = {
    from: `MEIS|医療機器点検記録管理アプリ<${serviceAddress}>`,
    to: [toAddress],
    subject,
    text: `${text}\n\n※万が一このメールに身に覚えがない場合は、削除いただくようお願いいたします。`,
    html: `${html}
            <br>
            <p>※万が一このメールに身に覚えがない場合は、削除いただくようお願いいたします。</p>
      `,
  };

  await resend.emails.send(mailOptions);
};
