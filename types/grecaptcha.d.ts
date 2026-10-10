declare global {
  const grecaptcha: {
    getResponse: () => string;
    reset: () => void;
    ready: (callback: () => void) => void;
    render: (
      container: string | HTMLElement,
      options: { sitekey: string },
    ) => void;
  };

  interface Window {
    grecaptcha?: typeof grecaptcha;
    onRecaptchaLoad?: () => void;
  }
}

export {};
