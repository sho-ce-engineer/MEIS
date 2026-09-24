import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;
if (!resendApiKey) {
  console.error('[invite] RESEND_API_KEY is not configured');
  throw new Error('[invite] RESEND_API_KEY is not configured');
}

const resend = new Resend(resendApiKey);

export default resend;
