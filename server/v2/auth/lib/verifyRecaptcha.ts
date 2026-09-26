const RECAPTCHA_VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';

export const verifyRecaptcha = async (recaptchaToken: string) => {
  const recaptchaSecret = process.env.RECAPTCHA_SECRET_KEY;
  if (!recaptchaSecret) {
    throw new Error('[auth] RECAPTCHA_SECRET_KEY is not configured');
  }

  const response = await fetch(RECAPTCHA_VERIFY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      secret: recaptchaSecret,
      response: recaptchaToken,
    }),
  });
  const result: { success: boolean } = await response.json();

  return result.success;
};
