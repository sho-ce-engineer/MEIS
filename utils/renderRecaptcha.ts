let recaptchaLoaded: Promise<void> | undefined;

const waitForRecaptcha = () => {
  recaptchaLoaded ??= new Promise((resolve) => {
    if (typeof window.grecaptcha?.render === 'function') {
      resolve();
      return;
    }
    window.onRecaptchaLoad = () => resolve();
  });
  return recaptchaLoaded;
};

export const renderRecaptcha = async (containerId: string, sitekey: string) => {
  await waitForRecaptcha();
  if (!document.getElementById(containerId)) return;
  grecaptcha.render(containerId, { sitekey });
};
