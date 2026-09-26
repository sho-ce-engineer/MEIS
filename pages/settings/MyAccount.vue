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
            <p class="text-caption">{{ facilityName }}</p>
            <p class="text-h5">{{ inputUserName }}</p>
          </v-col>
          <v-divider vertical class="d-none d-sm-flex my-3"></v-divider>
          <v-divider class="d-sm-none d-flex mx-3"></v-divider>
          <v-col cols="12" sm="8">
            <v-row class="mt-3">
              <v-col sm="6" cols="12">
                <v-text-field
                  label="ユーザー名"
                  v-model="inputUserName"
                  variant="underlined"
                  density="compact"
                  :rules="[rules.required]"
                ></v-text-field>
                <v-text-field
                  label="メールアドレス"
                  v-model="inputUserEmail"
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
const userName = computed(() => sessionData.value?.name);
const userEmail = computed(() => sessionData.value?.email);
const facilityName = computed(() => sessionData.value?.facilityName);

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

const inputUserName = ref<string>(userName.value ?? '');
const inputUserEmail = ref<string>(userEmail.value ?? '');
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
    await $fetch('/api/v2/settings/user-data', {
      method: 'PATCH',
      body: {
        userName: inputUserName.value,
        userEmail: inputUserEmail.value,
        password: password.value,
      },
    });
    alertMessage.value = 'アカウント情報を更新しました。';
    alertType.value = 'success';
    showAlert.value = true;
  } catch (error) {
    console.error('[edit-userdata]Load error:', error);
    alertMessage.value = getApiErrorMessage(
      error,
      'ユーザーデータを登録中にエラーが発生しました。',
    );
    alertType.value = 'error';
    showAlert.value = true;
  } finally {
    loading.value = false;
  }
};
</script>
