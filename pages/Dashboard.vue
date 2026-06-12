<template>
  <div class="wrapper__homelayout">
    <div class="homelayout__title">
      <v-icon>mdi-home</v-icon>
      <h2>ダッシュボード</h2>
    </div>
    <div class="homelayout__body">
      <div class="homelayout__body--info">
        <v-card
          max-width="400"
          subtitle="実績を確認"
          title="トラブル対応件数"
          :loading="loading"
          :disabled="disabled"
          to="/issues/issuesReport"
          class="mr-10"
        >
          <p class="homelayout__body-troubleshooting">
            <span class="homelayout__body-troubleshooting--complete">{{
              troubleIssuesTotal ?? '---'
            }}</span
            >件
          </p>
        </v-card>
        <v-card
          max-width="400"
          subtitle="実績を確認"
          title="機器点検件数"
          :loading="loading"
          :disabled="disabled"
          to="/inspection/InspectionHistory"
        >
          <p class="homelayout__body-inspection">
            <span class="homelayout__body-inspection--total">{{
              inspectionTotal ?? '---'
            }}</span
            >件
          </p>
        </v-card>
      </div>
    </div>
    <UiAlert
      :showAlert="showAlert"
      :alertMessage="alertMessage"
      :alertType="alertType"
      @update:showAlert="updateShowAlert"
    />
  </div>
</template>

<script setup lang="ts">
import { changeUTCtoJPN } from '~/utils/changeUTCtoJPN';

const loading = ref(false);
const disabled = ref(false);

// アラートの設定
const alertMessage = ref('');
const alertType = ref<'success' | 'info' | 'warning' | 'error'>('info');
const showAlert = ref(false);
const updateShowAlert = (value: boolean) => {
  showAlert.value = value;
};

//点検件数の表示
const inspectionTotal = ref<number | null>(null);
const getInspectionCount = async () => {
  loading.value = true;
  disabled.value = true;
  const nowDate = new Date();
  const jpyDate = changeUTCtoJPN(nowDate);
  try {
    const response = await $fetch<{ count: number }>(
      '/api/inspection/inspection-results-count',
      {
        method: 'POST',
        body: {
          jpyDate,
        },
      },
    );
    inspectionTotal.value = response.count;
    disabled.value = false;
  } catch (error) {
    console.error(
      '[inspection-results-count]:Error fetching inspection count',
      error,
    );
    alertMessage.value =
      (error as any).data?.data?.message ||
      '点検結果のカウント中にエラーが発生しました。';
    alertType.value = 'error';
    showAlert.value = true;
    disabled.value = true;
  } finally {
    loading.value = false;
  }
};

//トラブル対応件数
const troubleIssuesTotal = ref<number | null>(null);
const getIssuesCount = async () => {
  loading.value = true;
  disabled.value = true;
  try {
    const response = await $fetch<{ count: number }>(
      '/api/issues/issues-count',
      {
        method: 'GET',
      },
    );
    troubleIssuesTotal.value = response.count;
    disabled.value = false;
  } catch (error) {
    alertMessage.value =
      (error as any).data?.data?.message ||
      'トラブル対応報告数の取得中にエラーが発生しました。';
    alertType.value = 'error';
    showAlert.value = true;
    console.error('[issues-count]Error fetching issues count:', error);
    disabled.value = true;
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  getInspectionCount();
  getIssuesCount();
});
</script>

<style scoped>
.homelayout__title {
  display: flex;
  align-items: center;
  color: var(--sub-color-navygray);
}
.homelayout__title > h2 {
  font-size: 2rem;
  font-weight: 300;
}
.homelayout__title > .v-icon {
  font-size: 2rem;
  margin-right: 0.5rem;
}
.homelayout__body {
  margin-top: 2rem;
  margin-bottom: 4rem;
}
.homelayout__body--info {
  display: flex;
  max-width: 1280px;
}
.homelayout__body--info > .v-card {
  width: 30%;
}
.homelayout__body-troubleshooting {
  text-align: right;
  padding-right: 1rem;
  padding-left: 1rem;
  line-height: 2rem;
  margin-bottom: 1rem;
}
.homelayout__body-troubleshooting--complete {
  font-size: 4rem;
}
.homelayout__body-troubleshooting--total {
  margin-right: 0.2rem;
}
.homelayout__body-inspection {
  text-align: right;
  padding-right: 1rem;
  padding-left: 1rem;
  line-height: 2rem;
  margin-bottom: 1rem;
}
.homelayout__body-inspection--total {
  font-size: 4rem;
}
@media (max-width: 768px) {
  .homelayout__body--info {
    flex-direction: column-reverse;
  }
  .homelayout__body--info > .v-card {
    width: 100%;
    margin-bottom: 1rem;
  }
}
.fab__add-inspection-1,
.fab__add-inspection-2 {
  position: absolute;
  bottom: 35px;
  right: 20px;
}
.nested-fab {
  position: absolute;
  bottom: 80px;
  right: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
</style>
