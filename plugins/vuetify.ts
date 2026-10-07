import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { VDateInput } from 'vuetify/labs/VDateInput';
import { en, ja } from 'vuetify/locale';

export default defineNuxtPlugin((nuxtApp) => {
  const vuetify = createVuetify({
    ssr: true,
    components: {
      ...components,
      VDateInput,
    },
    directives,
    defaults: {
      VDateInput: {
        placeholder: 'yyyy/mm/dd',
      },
    },
    locale: {
      locale: 'ja',
      fallback: 'en',
      messages: { ja, en },
    },
  });
  nuxtApp.vueApp.use(vuetify);
});
