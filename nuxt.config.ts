export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },
  app: {
    head: {
      charset: 'utf-8',
      viewport: 'width=device-width',
      title: 'M.E.I.S｜クラウド型医療機器管理アプリ',
      link: [
        {
          rel: 'apple-touch-icon',
          href: '/favicons/apple-touch-icon.png',
        },
        { rel: 'icon', type: 'image/png', href: '/favicons/favicon.ico' },
      ],
      htmlAttrs: {
        lang: 'ja',
        prefix: 'og: https://ogp.me/ns#',
      },
      script: [
        {
          src: 'https://www.google.com/recaptcha/api.js',
          async: true,
          defer: true,
        },
      ],
    },
    pageTransition: { name: 'page', mode: 'out-in' },
    layoutTransition: { name: 'layout', mode: 'out-in' },
  },
  css: [
    'vuetify/lib/styles/main.sass',
    '@mdi/font/css/materialdesignicons.min.css',
    'assets/style.css',
  ],
  build: {
    transpile: ['vuetify'],
  },
  modules: ['@sidebase/nuxt-auth', 'nuxt-security'],
  auth: {
    globalAppMiddleware: true,
    provider: {
      type: 'local',
      endpoints: {
        signUp: { path: '/signup', method: 'post' },
      },
      token: {
        cookieName: 'auth.token',
        maxAgeInSeconds: 3600,
        sameSiteAttribute: 'strict',
      },
      pages: {
        login: '/',
      },
    },
  },
  security: {
    headers: {
      contentSecurityPolicy: {},
      permissionsPolicy: {
        camera: ['self'], //スキャン機能に使用
      },
    },
    rateLimiter: {
      // 開発フェーズのため一律設定。
      //TODO:本番可動ではルートにより分割する
      tokensPerInterval: 50,
      interval: 60000,
    },
  },
  runtimeConfig: {
    public: {
      recaptchaSiteKey: process.env.NUXT_PUBLIC_RECAPTCHA_SITEKEY,
    },
  },
});
