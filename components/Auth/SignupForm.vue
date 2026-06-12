<template>
  <v-form @submit.prevent="register()">
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
    />
    <v-text-field
      v-model="confirmPassword"
      label="パスワード確認"
      type="password"
      :rules="[rules.required, rules.matchPassword]"
      required
    />
    <v-divider class="mb-4"></v-divider>
    <v-text-field
      label="ユーザー名"
      v-model="user_name"
      type="text"
      :rules="[rules.required]"
      required
    ></v-text-field>
    <v-text-field
      label="施設名"
      v-model="facility_name"
      type="text"
      :rules="[rules.required]"
      required
      v-tooltip="
        '導入済みの施設で利用する場合、管理者からの「招待」が必要です。'
      "
    ></v-text-field>
    <div id="g-recaptcha" class="g-recaptcha" :data-sitekey="siteKey"></div>
    <v-btn type="submit" color="primary" block :loading="loading" class="mb-4">
      登録
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
const loading = ref(false);

const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const user_name = ref('');
const facility_name = ref('');

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

//signUp処理
const { signUp } = useAuth();
const register = async () => {
  if (password.value !== confirmPassword.value) {
    alertMessage.value = 'パスワードが一致しません。';
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
        email: email.value,
        password: password.value,
        user_name: user_name.value,
        facility_name: facility_name.value,
        recaptchaToken: recaptchaToken,
      },
      { callbackUrl: '/Dashboard', redirect: true },
    );
  } catch (error) {
    console.error('サインアップエラー:', error);
    alertMessage.value =
      (error as any).data?.data?.message ||
      'サインアップ中にエラーが発生しました。';
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
