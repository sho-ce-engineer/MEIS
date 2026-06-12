<template>
  <div>
    <h2><v-icon>mdi-content-copy</v-icon> 点検項目の複製</h2>
    <v-card
      class="my-5"
      title="点検項目の複製について"
      prependIcon="mdi-information-outline"
    >
      <v-divider></v-divider
      ><v-card-text>
        <p>
          この機能では、特定の機器に登録されている点検内容を、別の機器の点検内容として複製することができます。
        </p>
        <p>ただし、各点検項目を個別に複製することはできません。</p></v-card-text
      ></v-card
    >
    <v-row>
      <v-col cols="12" md="5">
        <v-card
          title="複製元の機器"
          prependIcon="mdi-state-machine"
          :loading="loading"
        >
          <v-divider></v-divider>
          <v-card-text
            ><h3>点検機器の種類</h3>
            <v-select
              v-model="selectedEquipmentType"
              :items="equipmentTypes"
              label="機器の種類を選択してください。"
              item-title="equipment_type"
              item-value="equipment_type"
              @update:modelValue="fetchEquipmentModels"
              hint="台帳に登録されている機器種別をもとに表示されます。"
              persistent-hint
              :disabled="equipmentTypes_disabled"
              class="mb-3" />

            <h3>点検機器の型番</h3>
            <v-select
              v-model="selectedEquipmentModel"
              :items="equipmentModel"
              label="機器の型番を選択してください。"
              item-title="equipment_model"
              item-value="equipment_model"
              @update:modelValue="fetchInspectionTypes"
              hint="ここは機器台帳に登録されている機器の型番が表示されます。"
              persistent-hint
              :disabled="equipmentModel_disabled"
              class="mb-3" />
            <h3>点検区分</h3>
            <v-select
              v-model="selectedInspectionType"
              :items="inspectionType"
              label="点検区分を選択してください。"
              item-title="inspection_type"
              item-value="inspection_type"
              :disabled="inspectionType_disabled"
              persistent-hint
              no-data-text="登録されている点検データはありません。先に点検内容を作成してください。"
              @update:modelValue="inspectionType_disabled = true"
          /></v-card-text> </v-card
      ></v-col>
      <v-col cols="12" md="2" class="d-flex justify-center flex-column"
        ><v-btn
          text="複製する"
          color="primary"
          class="mb-4"
          :disabled="copyBtn_disabled"
          @click="
            {
              ((copyConfirmationDialog = true), checkEquipmentDetails());
            }
          "
        ></v-btn>
        <v-dialog v-model="copyConfirmationDialog" width="auto">
          <v-card
            title="点検項目複製の確認"
            prependIcon="mdi-information-outline"
            ><v-divider></v-divider
            ><v-card-text>
              <p>
                点検内容の複製は即時に実行され、一度実行すると取り消すことはできません。
              </p>
              <p>よろしいですか？</p>
              <span
                v-if="Object.keys(checkEquipmentDetailsMessages).length > 0"
              >
                <v-divider class="my-4"></v-divider>
                <span class="d-flex align-center"
                  ><v-icon color="red-accent-4">mdi-alert-outline</v-icon>
                  <p class="my-2 ml-2 text-h5 text-red-accent-4">注意</p></span
                >
                <ul
                  v-for="(message, index) in checkEquipmentDetailsMessages"
                  :key="index"
                  class="ml-6 mb-4 text-red-accent-4"
                >
                  <li>{{ message }}</li>
                </ul>
                <p>
                  これらの相違が意図されたものである場合は、無視していただいて構いません。
                </p>
                <p>意図しない場合は、修正の上で再度実行してください。</p></span
              ></v-card-text
            ><v-divider></v-divider
            ><v-card-actions
              ><v-btn
                text="戻る"
                @click="copyConfirmationDialog = false"
              ></v-btn
              ><v-spacer></v-spacer
              ><v-btn
                text="複製する"
                color="primary"
                variant="elevated"
                :disabled="copyConfirmationBtn_disabled"
                @click="handleCopyData()"
              ></v-btn></v-card-actions
          ></v-card> </v-dialog
        ><v-btn
          text="リセットする"
          variant="tonal"
          @click="resetAllData()"
        ></v-btn>
      </v-col>
      <v-col cols="12" md="5">
        <v-card
          title="複製先の機器"
          prependIcon="mdi-content-copy"
          :loading="loading"
        >
          <v-divider></v-divider>
          <v-card-text
            ><h3>点検機器の種類</h3>
            <v-select
              v-model="selectedTargetEquipmentType"
              :items="targetEquipmentTypes"
              label="機器の種類を選択してください。"
              item-title="equipment_type"
              item-value="equipment_type"
              @update:modelValue="fetchTargetEquipmentModels"
              hint="台帳に登録されている機器種別をもとに表示されます。"
              persistent-hint
              :disabled="targetEquipmentTypes_disabled"
              class="mb-3" />

            <h3>点検機器の型番</h3>
            <v-select
              v-model="selectedTargetEquipmentModel"
              :items="targetEquipmentModel"
              label="機器の型番を選択してください。"
              item-title="equipment_model"
              item-value="equipment_model"
              @update:modelValue="
                {
                  targetInspectionType_disabled = false;
                  targetEquipmentModel_disabled = true;
                }
              "
              hint="ここは機器台帳に登録されている機器の型番が表示されます。"
              persistent-hint
              :disabled="targetEquipmentModel_disabled"
              class="mb-3" />
            <h3>点検区分</h3>
            <v-select
              v-model="selectedTargetInspectionType"
              :items="['日常点検', '定期点検']"
              label="点検区分を選択してください。"
              item-title="inspection_type"
              item-value="inspection_type"
              :disabled="targetInspectionType_disabled"
              @update:modelValue="targetInspectionType_disabled = true"
          /></v-card-text> </v-card
      ></v-col>
    </v-row>
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

//Alert
const alertMessage = ref('');
const alertType = ref<'success' | 'info' | 'warning' | 'error'>('info');
const showAlert = ref(false);
const updateShowAlert = (value: boolean) => {
  showAlert.value = value;
};

////既に登録されている機器・点検情報の取得

// 機器種類の取得
const equipmentTypes = ref<string[]>([]);
const equipmentTypes_disabled = ref(false);
const selectedEquipmentType = ref<string>('');
const fetchEquipmentTypes = async () => {
  try {
    const response = await $fetch('/api/equipment/equipment-types', {
      method: 'GET',
    });
    equipmentTypes.value = response;
  } catch (error) {
    alertMessage.value =
      (error as any).data?.data?.message ||
      '機器種類の取得中にエラーが発生しました。';
    alertType.value = 'error';
    showAlert.value = true;
    console.error('[equipment-types]Load error:', error);
  }
};

// 機器型番の取得
const equipmentModel = ref<{ equipment_model: string }[]>([]);
const equipmentModel_disabled = ref(true);
const selectedEquipmentModel = ref<string>('');
const fetchEquipmentModels = async () => {
  if (!selectedEquipmentType.value) return;

  try {
    const response = await $fetch('/api/equipment/equipment-models', {
      method: 'POST',
      body: {
        equipmentType: selectedEquipmentType.value,
      },
    });
    equipmentModel.value = response.map((model) => ({
      equipment_model: model.equipment_model,
    }));
    equipmentModel_disabled.value = false;
    equipmentTypes_disabled.value = true;
  } catch (error) {
    alertMessage.value =
      (error as any).data?.data?.message ||
      '機器型番の取得中にエラーが発生しました。';
    alertType.value = 'error';
    showAlert.value = true;
    console.error(
      '[equipment-models] Error occurred while fetching equipment models:',
      error,
    );
  }
};

// 点検区分の取得
const inspectionType = ref<string[]>([]);
const inspectionType_disabled = ref(true);
const selectedInspectionType = ref<string>('');
const fetchInspectionTypes = async () => {
  if (!selectedEquipmentModel.value) return;

  try {
    const response = await $fetch('/api/inspection/inspection-types', {
      method: 'POST',
      body: {
        equipmentModel: selectedEquipmentModel.value,
      },
    });
    inspectionType.value = response.map((item) => item.inspection_type);
    inspectionType_disabled.value = false;
    equipmentModel_disabled.value = true;
  } catch (error) {
    alertMessage.value =
      (error as any).data?.data?.message ||
      '点検区分の取得中にエラーが発生しました。';
    alertType.value = 'error';
    showAlert.value = true;
    console.error('[inspection-types]Load error:', error);
  }
};

////複製対象の機器・点検情報の取得
const targetInspectionType = ref<string[]>([]);
const selectedTargetInspectionType = ref<string>('');
const targetInspectionType_disabled = ref(true);

// 機器種類の取得
const targetEquipmentTypes = ref<string[]>([]);
const selectedTargetEquipmentType = ref<string>('');
const targetEquipmentTypes_disabled = ref(false);
const fetchTargetEquipmentTypes = async () => {
  try {
    const response = await $fetch('/api/equipment/equipment-types', {
      method: 'GET',
    });
    targetEquipmentTypes.value = response;
  } catch (error) {
    alertMessage.value =
      (error as any).data?.data?.message ||
      '機器種類の取得中にエラーが発生しました。';
    alertType.value = 'error';
    showAlert.value = true;
    console.error('[equipment-types]Load error:', error);
  }
};

// 機器型番の取得
const targetEquipmentModel = ref<{ equipment_model: string }[]>([]);
const selectedTargetEquipmentModel = ref<string>('');
const targetEquipmentModel_disabled = ref(true);
const fetchTargetEquipmentModels = async () => {
  if (!selectedTargetEquipmentType.value) return;

  try {
    const response = await $fetch('/api/equipment/equipment-models', {
      method: 'POST',
      body: {
        equipmentType: selectedTargetEquipmentType.value,
      },
    });
    targetEquipmentModel.value = response.map((model) => ({
      equipment_model: model.equipment_model,
    }));
    targetEquipmentModel_disabled.value = false;
    targetEquipmentTypes_disabled.value = true;
  } catch (error) {
    alertMessage.value =
      (error as any).data?.data?.message ||
      '機器型番の取得中にエラーが発生しました。';
    alertType.value = 'error';
    showAlert.value = true;
    console.error(
      '[equipment-models] Error occurred while fetching equipment models:',
      error,
    );
  }
};

// 入力内容のチェック
const checkEquipmentDetailsMessages = ref<string[]>([]);
const checkEquipmentDetails = () => {
  checkEquipmentDetailsMessages.value = [];
  const checks = [
    {
      key: '機器の種類',
      source: selectedEquipmentType,
      target: selectedTargetEquipmentType,
    },
    {
      key: '点検区分',
      source: selectedInspectionType,
      target: selectedTargetInspectionType,
    },
  ];

  for (const check of checks) {
    if (check.source.value !== check.target.value) {
      checkEquipmentDetailsMessages.value.push(
        `${check.key}が一致していません。`,
      );
      if (checkEquipmentDetailsMessages.value.length >= 2) break;
    }
  }
};

//複製ボタンの制御
const copyConfirmationDialog = ref(false);
const copyBtn_disabled = computed(() => {
  return !selectedInspectionType.value || !selectedTargetInspectionType.value;
});
const copyConfirmationBtn_disabled = ref(false);
const handleCopyData = async () => {
  loading.value = true;
  copyConfirmationDialog.value = false;
  copyConfirmationBtn_disabled.value = true;
  const baseInspectionData = {
    baseEquipmentType: selectedEquipmentType.value,
    baseEquipmentModel: selectedEquipmentModel.value,
    baseInspectionType: selectedInspectionType.value,
  };
  const targetInspectionData = {
    targetEquipmentType: selectedTargetEquipmentType.value,
    targetEquipmentModel: selectedTargetEquipmentModel.value,
    targetInspectionType: selectedTargetInspectionType.value,
  };
  try {
    await $fetch('/api/inspection/inspection-items-copy', {
      method: 'POST',
      body: {
        baseInspectionData,
        targetInspectionData,
      },
    });
    alertMessage.value = '正常に複製されました。点検内容を確認してください。';
    alertType.value = 'success';
    showAlert.value = true;
    resetAllData();
  } catch (error) {
    console.error('[inspection-items-copy] Error:', error);
    alertMessage.value =
      (error as any).data?.data?.message ||
      '点検項目の保存中にエラーが発生しました。';
    alertType.value = 'error';
    showAlert.value = true;
  } finally {
    loading.value = false;
    copyConfirmationBtn_disabled.value = false;
  }
};

//リセットボタンの制御
const resetAllData = () => {
  selectedEquipmentType.value = '';
  selectedEquipmentModel.value = '';
  selectedInspectionType.value = '';
  equipmentTypes.value = [];
  equipmentModel.value = [];
  inspectionType.value = [];
  equipmentModel_disabled.value = true;
  inspectionType_disabled.value = true;
  equipmentTypes_disabled.value = false;
  fetchEquipmentTypes();
  selectedTargetEquipmentType.value = '';
  selectedTargetEquipmentModel.value = '';
  selectedTargetInspectionType.value = '';
  targetEquipmentTypes.value = [];
  targetEquipmentModel.value = [];
  targetInspectionType.value = [];
  targetEquipmentModel_disabled.value = true;
  targetInspectionType_disabled.value = true;
  targetEquipmentTypes_disabled.value = false;
  fetchTargetEquipmentTypes();
  copyConfirmationBtn_disabled.value = false;
};
onMounted(() => {
  fetchEquipmentTypes();
  fetchTargetEquipmentTypes();
});
</script>
