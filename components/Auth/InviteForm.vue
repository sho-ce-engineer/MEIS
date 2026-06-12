<template>
  <v-card-title>新規登録</v-card-title>
  <v-card-subtitle
    >招待が届きました。登録して業務を開始しましょう！</v-card-subtitle
  >
  <v-card-text>
    <v-form @submit.prevent="registerWithInvite">
      <v-text-field
        v-model="user_name"
        label="ユーザー名"
        type="text"
        :rules="[rules.required]"
        required
        hint="英数字で入力してください。"
      ></v-text-field>
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
        :rules="[rules.required, rules.password]"
        required
        hint="６文字以上の英数字を入力してください。"
      ></v-text-field>
      <v-text-field
        v-model="confirmPassword"
        label="パスワード確認"
        type="password"
        :rules="[rules.required, rules.matchPassword]"
        required
      ></v-text-field>
      <v-divider></v-divider>
      <v-text-field
        label="招待コード"
        type="text"
        required
        readonly
        :model-value="inviteCode"
        persistent-hint
        hint="招待コードを変更すると登録できなくなる可能性があります。"
        class="mb-4"
      ></v-text-field>
      <div id="g-recaptcha" class="g-recaptcha" :data-sitekey="siteKey"></div>
      <v-btn
        type="submit"
        color="primary"
        block
        :loading="loading"
        class="mb-4"
      >
        登録する</v-btn
      >
    </v-form>
  </v-card-text>
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
const confirmPassword = ref('');
const user_name = ref('');
const loading = ref(false);
const route = useRoute();
const inviteCode = ref(route.query.invite);

// アラートの設定
const alertMessage = ref('');
const alertType = ref('');
const showAlert = ref(false);
const updateShowAlert = (value: boolean) => {
  showAlert.value = value;
};
//バリデーション
const rules = {
  required: (value: string) => !!value || '必須項目です',
  email: (value: string) =>
    /.+@.+\..+/.test(value) || '有効なメールアドレスを入力してください',
  password: (value: string) =>
    /^[a-zA-Z0-9]{6,}$/.test(value) ||
    'パスワードは6文字以上の英数字である必要があります',
  matchPassword: (value: string) =>
    value === password.value || 'パスワードが一致しません',
};

// reCAPTCHAトークン
const config = useRuntimeConfig();
const siteKey = config.public.recaptchaSiteKey;

const { signUp } = useAuth();
const registerWithInvite = async () => {
  if (password.value !== confirmPassword.value) {
    alertMessage.value = 'パスワードが一致しません。';
    alertType.value = 'error';
    showAlert.value = true;
    return;
  } else if (!inviteCode.value) {
    alertMessage.value = '招待コードを入力してください。';
    alertType.value = 'error';
    showAlert.value = true;
    return;
  }

  const recaptchaToken = grecaptcha.getResponse();
  if (!recaptchaToken) {
    alertMessage.value = 'reCAPTCHAの確認を完了してください。';
    alertType.value = 'error';
    showAlert.value = true;
    return;
  }

  loading.value = true;
  try {
    await signUp(
      {
        user_name: user_name.value,
        email: email.value,
        password: password.value,
        inviteCode: inviteCode.value,
        recaptchaToken: recaptchaToken,
      },
      { callbackUrl: '/Dashboard', redirect: true },
    );
  } catch (error) {
    console.error('サインアップエラー:', error);
    alertMessage.value =
      (error as any).data?.data?.message || '登録中にエラーが発生しました。';
    alertType.value = 'error';
    showAlert.value = true;
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
});
</script>
<style scoped>
.g-recaptcha {
  display: flex;
  justify-content: center;
  margin-bottom: 1.5rem;
}
</style>
