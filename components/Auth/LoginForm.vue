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
const email = ref('');
const password = ref('');
const loading = ref(false);

// アラートの設定
const alertMessage = ref('');
const alertType = ref('');
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

const handleSubmit = async () => {
  loading.value = true;
  const recaptchaToken = grecaptcha.getResponse();
  if (!recaptchaToken) {
    alertMessage.value = 'reCAPTCHAの確認を完了してください。';
    alertType.value = 'error';
    showAlert.value = true;
    loading.value = false;
    return;
  }

  try {
    const result = await signIn(
      {
        email: email.value,
        password: password.value,
        recaptchaToken: recaptchaToken,
      },
      { callbackUrl: '/Dashboard' },
    );
    if (result?.error) {
      alertMessage.value =
        result.error || 'ログインに失敗しました。内容を確認してください。';
      alertType.value = 'error';
      showAlert.value = true;
    }
  } catch (error) {
    alertMessage.value =
      (error as any).data?.data?.message ||
      'ログイン中にエラーが発生しました。';
    alertType.value = 'error';
    showAlert.value = true;
    console.error('Login error:', error);
  } finally {
    loading.value = false;
    grecaptcha.reset();
  }
};
onMounted(() => {
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
