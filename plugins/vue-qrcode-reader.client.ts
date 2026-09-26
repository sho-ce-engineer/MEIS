import { VueQrcodeReader } from 'vue-qrcode-reader';
import { defineNuxtPlugin } from '#app';

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(VueQrcodeReader);
});
