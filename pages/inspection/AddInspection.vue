<template>
  <div>
    <UiAlert
      :showAlert="showAlert"
      :alertMessage="alertMessage"
      :alertType="alertType"
      @update:showAlert="updateShowAlert"
    />
    <h2><v-icon>mdi-wrench-check-outline</v-icon>日常点検</h2>
    <!-- タブのナビゲーション -->
    <v-tabs v-model="activeTab" color="primary" dark>
      <v-tab value="0">フォーム 1</v-tab>
      <v-tab value="1">フォーム 2</v-tab>
      <v-tab value="2">フォーム 3</v-tab>
    </v-tabs>

    <v-row>
      <v-col cols="12" md="9">
        <!-- タブのコンテンツ -->
        <v-tabs-window v-model="activeTab">
          <v-tabs-window-item v-for="index in 3" :key="index" :value="index">
            <InspectionForm
              :key="index"
              :tabIndex="index"
              :users="users"
              :inspectionType="inspectionType"
              @alert="handleAlert"
            />
          </v-tabs-window-item>
        </v-tabs-window>
      </v-col>
      <v-col cols="12" md="3"></v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
//ユーザーデータ
const { data } = useAuth();
const sessionData = computed(() => data.value as SessionData | null);
const users = computed(() => {
  const user_id = sessionData.value?.user_id;
  const user_name = sessionData.value?.name;
  if (!user_id || !user_name) return [];
  return [{ id: user_id, name: user_name }];
});

//アラート
const alertMessage = ref('');
const alertType = ref<'success' | 'info' | 'warning' | 'error'>('info');
const showAlert = ref(false);
const updateShowAlert = (value: boolean) => {
  showAlert.value = value;
};

const activeTab = ref(0);
const inspectionType = '日常点検';

const handleAlert = (
  message: string,
  type: 'success' | 'info' | 'warning' | 'error',
) => {
  alertMessage.value = message;
  alertType.value = type;
  showAlert.value = true;
};
</script>

<style scoped></style>
