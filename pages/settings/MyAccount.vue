<template>
  <div>
    <h2><v-icon>mdi-account</v-icon> マイアカウント設定</h2>
    <v-card class="my-5">
      <v-card-text>
        <v-row
          ><v-col
            cols="12"
            sm="4"
            class="d-flex flex-column align-center justify-center"
          >
            <v-avatar size="80" variant="elevated" color="primary" class="mb-4"
              >ME</v-avatar
            >
            <p class="text-caption">{{ facility_name }}</p>
            <p class="text-h5">{{ input_user_name }}</p>
          </v-col>
          <v-divider vertical class="d-none d-sm-flex my-3"></v-divider>
          <v-divider class="d-sm-none d-flex mx-3"></v-divider>
          <v-col cols="12" sm="8">
            <v-row class="mt-3">
              <v-col sm="6" cols="12">
                <v-text-field
                  label="ユーザー名"
                  v-model="input_user_name"
                  variant="underlined"
                  density="compact"
                  :rules="[rules.required]"
                ></v-text-field>
                <v-text-field
                  label="メールアドレス"
                  v-model="input_user_email"
                  variant="underlined"
                  density="compact"
                  :rules="[rules.required, rules.email]"
                  required
                ></v-text-field>
              </v-col>
              <v-col sm="6" cols="12">
                <v-text-field
                  v-model="password"
                  label="パスワード"
                  type="password"
                  variant="underlined"
                  density="compact"
                  :rules="[rules.required, rules.password]"
                  hint="６文字以上の英数字を入力してください。"
                />
                <v-text-field
                  v-model="confirmPassword"
                  label="パスワード確認"
                  type="password"
                  variant="underlined"
                  density="compact"
                  :rules="[rules.required, rules.matchPassword]"
                />
              </v-col>
            </v-row>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn
                color="primary"
                text="保存する"
                variant="flat"
                @click="updateUserInfo"
                :loading="loading"
              ></v-btn> </v-card-actions></v-col></v-row
      ></v-card-text>
    </v-card>
    <UiAlert
      :showAlert="showAlert"
      :alertMessage="alertMessage"
      :alertType="alertType"
      @update:showAlert="updateShowAlert"
    />
  </div>
</template>
<script setup lang="ts">
const loading = ref(false);

//ユーザーデータ
const { data } = useAuth();
const sessionData = computed(() => data.value as SessionData | null);
const user_name = computed(() => sessionData.value?.name);
const user_email = computed(() => sessionData.value?.email);
const facility_name = computed(() => sessionData.value?.facility_name);

//アラート
const alertMessage = ref('');
const alertType = ref<'success' | 'info' | 'warning' | 'error'>('info');
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

const input_user_name = ref<string>(user_name.value ?? '');
const input_user_email = ref<string>(user_email.value ?? '');
const password = ref('');
const confirmPassword = ref('');

const updateUserInfo = async () => {
  loading.value = true;
  if (password.value !== confirmPassword.value) {
    alertMessage.value = 'パスワードが一致しません';
    alertType.value = 'error';
    showAlert.value = true;
    loading.value = false;
    return;
  }

  try {
    await $fetch(`/api/settings/users/edit-userdata`, {
      method: 'PATCH',
      body: {
        user_name: input_user_name.value,
        user_email: input_user_email.value,
        password: password.value,
      },
    });
    alertMessage.value = 'アカウント情報を更新しました。';
    alertType.value = 'success';
    showAlert.value = true;
  } catch (error) {
    console.error('[edit-userdata]Load error:', error);
    alertMessage.value =
      (error as any).data?.data?.message ||
      'ユーザーデータを登録中にエラーが発生しました。';
    alertType.value = 'error';
    showAlert.value = true;
  } finally {
    loading.value = false;
  }
};
</script>
