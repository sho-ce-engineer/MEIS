import VueDraggable from 'vuedraggable';
import { defineNuxtPlugin } from '#app';

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.component('draggable', VueDraggable);
});
