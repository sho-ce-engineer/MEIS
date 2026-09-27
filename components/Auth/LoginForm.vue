<template>
  <v-form @submit.prevent="handleSubmit">
    <v-text-field
      v-model="email"
      label="メールアドレス"
      type="email"
      :rules="[rules.required, rules.email]"
      required
    ></v-text-field>
    <v-text-field
      v-model="password"
      label="パスワード"
      type="password"
      :rules="[rules.required]"
      required
    />
    <div id="g-recaptcha" class="g-recaptcha" :data-sitekey="siteKey"></div>
    <v-btn type="submit" color="primary" block :loading="loading" class="mb-4">
      ログイン
    </v-btn>
  </v-form>
  <UiAlert
    :showAlert="showAlert"
    :alertMessage="alertMessage"
    :alertType="alertType"
    @update:showAlert="updateShowAlert"
  />
</template>

<script setup lang="ts">
const props = defineProps<{ notice?: string }>();

const email = ref('');
const password = ref('');
const loading = ref(false);

// アラートの設定
const alertMessage = ref('');
const alertType = ref<'success' | 'info' | 'warning' | 'error'>('info');
const showAlert = ref(false);
const updateShowAlert = (value: boolean) => {
  showAlert.value = value;
};

const rules = {
  required: (value: string) => !!value || '必須項目です',
  email: (value: string) =>
    /.+@.+\..+/.test(value) || '有効なメールアドレスを入力してください',
};

const { signIn } = useAuth();

// reCAPTCHAトークン
const config = useRuntimeConfig();
const siteKey = config.public.recaptchaSiteKey;

const showLoginError = (message: string) => {
  alertMessage.value = message;
  alertType.value = 'error';
  showAlert.value = true;
  grecaptcha.reset();
};

const handleSubmit = async () => {
  const recaptchaToken = grecaptcha.getResponse();
  if (!recaptchaToken) {
    alertMessage.value = 'reCAPTCHAの確認を完了してください。';
    alertType.value = 'error';
    showAlert.value = true;
    return;
  }

  loading.value = true;
  try {
    const result = await signIn('credentials', {
      email: email.value,
      password: password.value,
      recaptchaToken,
      redirect: false,
      callbackUrl: '/Dashboard',
    });
    if (result?.error) {
      showLoginError(
        result.error === 'CredentialsSignin'
          ? 'メールアドレスまたはパスワードが正しくありません'
          : result.error,
      );
      return;
    }
    await navigateTo('/Dashboard');
  } catch (error) {
    console.error('Login error:', error);
    showLoginError(
      getApiErrorMessage(error, 'ログイン中にエラーが発生しました。'),
    );
  } finally {
    loading.value = false;
  }
};
onMounted(() => {
  if (props.notice) {
    alertMessage.value = props.notice;
    alertType.value = 'success';
    showAlert.value = true;
  }
  if (grecaptcha) {
    grecaptcha.ready(() => {
      grecaptcha.render('g-recaptcha', {
        sitekey: siteKey,
      });
    });
  } else {
    console.error('reCAPTCHA is not loaded');
  }
  localStorage.removeItem('hasLoggedIn');
});
</script>
<style scoped>
.g-recaptcha {
  display: flex;
  justify-content: center;
  margin-bottom: 1.5rem;
}
</style>
