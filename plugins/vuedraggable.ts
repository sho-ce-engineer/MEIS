import { defineNuxtPlugin } from '#app';
import VueDraggable from 'vuedraggable';

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.component('draggable', VueDraggable);
});
