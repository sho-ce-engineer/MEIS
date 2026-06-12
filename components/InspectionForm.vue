<template>
  <v-form>
    <v-card
      class="mt-4"
      :loading="loading"
      prepend-icon="mdi-text-search-variant"
      title="基本情報"
    >
      <v-divider></v-divider>
      <v-card-text>
        <v-date-input
          label="点検日を選択してください。"
          v-model="date"
          variant="underlined"
          :rules="[rules.required]"
        ></v-date-input>
        <v-select
          label="点検者を選択してください。"
          :items="users"
          prepend-icon="mdi-human-greeting-variant"
          variant="underlined"
          :rules="[rules.required]"
          v-model="userName"
          item-title="name"
          item-text="name"
        ></v-select>
        <v-autocomplete
          label="院内IDを入力してください。"
          prepend-icon="mdi-barcode-scan"
          variant="underlined"
          hint="院内IDは機器に貼られているバーコードのIDです。"
          :rules="[rules.idreg]"
          v-model="inputEquipmentId"
          @update:modelValue="fetchEquipmentDetails"
          @click:prepend="dialog = true"
          :items="equipmentIdItems"
          no-data-text="該当データがありません。機器台帳から登録してください。"
        ></v-autocomplete>
        <v-dialog v-model="dialog" width="auto">
          <v-card
            max-width="400"
            prepend-icon="mdi-barcode-scan"
            title="院内IDをスキャンしてください。"
          >
            <v-divider></v-divider>
            <v-card-text>
              <p>院内IDのバーコードをスキャンしてください。</p>
              <p class="mt-4 text-caption">
                ※読み込めない場合、ピントが合う位置までゆっくり前後させてください。
              </p>
              {{ inputEquipmentId }}
              <QrcodeStream
                @detect="onDetect"
                :formats="['qr_code', 'linear_codes']"
              />
            </v-card-text>
            <v-divider></v-divider>
            <v-card-actions
              ><v-btn
                @click="
                  {
                    fetchEquipmentDetails();
                  }
                "
                variant="tonal"
                color="info"
                >点検を開始する</v-btn
              ></v-card-actions
            >
          </v-card>
        </v-dialog>

        <div v-if="equipment">
          <v-list lines="one" class="ml-5">
            <v-list-item
              title="機器種別"
              :subtitle="equipment.equipment_type"
            ></v-list-item>
            <v-list-item
              title="機器名"
              :subtitle="equipment.equipment_name"
            ></v-list-item>
            <v-list-item
              title="型番"
              :subtitle="equipment.equipment_model"
            ></v-list-item>
            <v-list-item
              title="シリアル番号"
              :subtitle="equipment.equipment_serial_number"
            ></v-list-item>
          </v-list>
          <p class="text-right">上記内容で間違いありませんか？</p>
        </div>
      </v-card-text>
      <v-card-actions>
        <v-btn
          text="閉じる"
          @click="formDataReset()"
          color="grey-darken-4"
          variant="plain"
        ></v-btn>
        <v-spacer></v-spacer>
        <v-btn
          text="点検を開始する"
          append-icon="mdi-chevron-down"
          variant="tonal"
          @click="fetchInspectionItems()"
          color="info"
          :disabled="disabled"
        ></v-btn>
      </v-card-actions>
    </v-card>

    <v-card
      v-for="(items, category) in groupedInspectionItems"
      :key="category"
      class="mt-5"
      prepend-icon="mdi-progress-wrench"
      :title="category"
    >
      <v-divider></v-divider>
      <v-list>
        <v-list-item v-for="item in items" :key="item.inspection_item_id">
          <component
            :is="getComponent(item.inspection_component_type)"
            :inspection_item="item.inspection_item"
            :inspection_item_description="item.inspection_item_description"
            :suffix="item.suffix"
            :min="item.min"
            :max="item.max"
            :lowerLimit="Number(item.lowerlimit)"
            :upperLimit="Number(item.upperlimit)"
            v-model="input_result[item.inspection_item_id]"
            @update:notesFieldValue="
              (value: string) =>
                handleNotesFieldValue(item.inspection_item_id, value)
            "
          ></component>
        </v-list-item>
      </v-list>
    </v-card>

    <v-card-actions v-if="inspectionItems">
      <v-btn
        text="RESET"
        @click="formDataReset()"
        color="grey-darken-4"
        variant="plain"
        class="mr-md-4"
      ></v-btn>
      <v-btn
        text="AllTrue"
        @click="setAllItemsTrue()"
        color="grey-darken-4"
        variant="plain"
      ></v-btn>
      <v-spacer></v-spacer>
      <v-btn
        class="my-5"
        color="primary"
        append-icon="mdi-checkbox-marked-circle-plus-outline"
        :loading="loading"
        variant="flat"
        @click="confirmationDialog = true"
      >
        保存する
      </v-btn>
    </v-card-actions>
    <v-dialog v-model="confirmationDialog">
      <v-card title="保存確認" prepend-icon="mdi-information-outline">
        <v-divider></v-divider>
        <v-card-text
          ><p class="mb-2">「保存する」を押すと直ちに保存処理が行われます。</p>
          <p>保存処理を行なってもよろしいですか？</p></v-card-text
        >
        <v-divider></v-divider>
        <v-card-actions>
          <v-btn
            text="戻る"
            @click="confirmationDialog = false"
            color="grey-darken-4"
            variant="plain"
          ></v-btn>
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            append-icon="mdi-checkbox-marked-circle-plus-outline"
            variant="flat"
            @click="
              {
                (saveInspectionResults(), (confirmationDialog = false));
              }
            "
          >
            保存する
          </v-btn></v-card-actions
        >
      </v-card>
    </v-dialog>
  </v-form>
</template>

<script setup lang="ts">
import InspectionCustomCheck from '../components/Ui/InspectionCustomCheck.vue';
import InspectionCustomNumber from '../components/Ui/InspectionCustomNumber.vue';
import InspectionCustomDate from '../components/Ui/InspectionCustomDate.vue';
import { format } from 'date-fns';

interface equipmentDetails {
  equipment_type: string;
  equipment_name: string;
  equipment_model: string;
  equipment_serial_number: string;
}

interface InspectionItem {
  inspection_item_id: string;
  inspection_item: string;
  inspection_item_description: string;
  inspection_component_type: string;
  suffix?: string;
  min?: number;
  max?: number;
  lowerlimit?: number;
  upperlimit?: number;
  inspection_item_category?: string;
}

// Props
const props = defineProps({
  tabIndex: Number,
  users: {
    type: Array as PropType<{ id: string; name: string }[]>,
    required: true,
  },
  inspectionType: String,
  suffix: String,
  min: Number,
  max: Number,
  lowerLimit: Number,
  upperLimit: Number,
});

const Alert = defineEmits(['alert']);

// Reactive references
const inputEquipmentId = ref('');
const equipment = ref<equipmentDetails | null>(null);
const inspectionItems = ref<InspectionItem[] | null>(null);
const input_result = ref<Record<string, any>>({});
const userId = ref(props.users[0].id);
const userName = ref(props.users[0].name);
const loading = ref(false);
const disabled = ref(true);
const confirmationDialog = ref(false);

//点検日取得
const date = ref(new Date());
const inspection_date = () => {
  const selectDate = date.value;
  const japanDate = new Date(selectDate.getTime() + 9 * 60 * 60 * 1000);
  const yyyymmddhhmmss = japanDate.toISOString().slice(0, 19);
  return yyyymmddhhmmss;
};

// Form validation rules
const rules = {
  required: (value: string) => !!value || '入力必須項目です。',
  idreg: (value: string) =>
    (!!value && /^[a-zA-Z0-9\-]+$/.test(value)) ||
    '半角英数字とハイフンのみ使用できます。',
};

//バーコードリーダー機能
//機能変更予定
import { QrcodeStream } from 'vue-qrcode-reader';
const dialog = ref(false);
const onDetect = (detectedCodes: any[]) => {
  inputEquipmentId.value = detectedCodes[0].rawValue;
  fetchEquipmentDetails();
  dialog.value = false;
};

//機器IDのオートコンプリート
const equipmentIdItems = ref<string[]>([]);
const fetchEquipmentIdItems = async () => {
  loading.value = true;
  try {
    const response = await $fetch('/api/equipment/equipment-id', {
      method: 'GET',
    });
    equipmentIdItems.value = response;
  } catch (error) {
    Alert(
      'alert',
      (error as any).data?.data?.message || '機器IDの取得に失敗しました。',
      'error',
    );
    console.error('[InspectionForm] Error fetching equipment ID items:', error);
  } finally {
    loading.value = false;
  }
};

// APIから機器情報を取得する関数
const fetchEquipmentDetails = async () => {
  loading.value = true;
  try {
    const response = await $fetch('/api/equipment/equipment-details', {
      method: 'POST',
      body: {
        equipment_id: inputEquipmentId.value,
      },
    });
    equipment.value = response || null;
    disabled.value = false;
  } catch (error) {
    Alert(
      'alert',
      (error as any).data?.data?.message ||
        '機器が見つかりません。正しい院内IDを入力してください。',
      'error',
    );
    console.error('[InspectionForm] Error fetching equipment details:', error);
    disabled.value = true;
  } finally {
    loading.value = false;
  }
};

// APIから点検項目を取得する関数
const fetchInspectionItems = async () => {
  if (!equipment.value) {
    Alert(
      'alert',
      '先に院内IDを入力し、機器情報を取得してください。',
      'warning',
    );
    return;
  }

  loading.value = true;
  try {
    const response = await $fetch('/api/inspection/inspection-items', {
      method: 'POST',
      body: {
        equipmentModel: equipment.value?.equipment_model,
        inspectionType: props.inspectionType,
      },
    });

    inspectionItems.value = response;
  } catch (error) {
    console.error('[InspectionForm] Error fetching inspection items:', error);
    Alert(
      'alert',
      (error as any).data?.data?.message || '点検項目が見つかりません。',
      'error',
    );
  } finally {
    loading.value = false;
  }
};

// 点検項目をカテゴリごとにグループ化
const groupedInspectionItems = computed(() => {
  if (!inspectionItems.value) return {};
  return inspectionItems.value.reduce(
    (group, item) => {
      const category = item.inspection_item_category || 'その他';
      if (!group[category]) group[category] = [];
      group[category].push(item);
      return group;
    },
    {} as Record<string, InspectionItem[]>,
  );
});

//Componentの動的読み込み
const getComponent = (type: string) => {
  switch (type) {
    case 'InspectionCustomNumber':
      return InspectionCustomNumber;
    case 'InspectionCustomCheck':
      return InspectionCustomCheck;
    case 'InspectionCustomDate':
      return InspectionCustomDate;
    default:
      return null; // デフォルトは null または他のコンポーネント
  }
};

//点検結果IDの生成
const generateInspectionResultId = (inspectionItemId: string) => {
  const inspectionDate = inspection_date().replace(/[-:T]/g, '');
  const randomNumber = Math.floor(100000 + Math.random() * 900000);
  return `${inspectionItemId}Result${inspectionDate}R${randomNumber}`;
};

//Notesの読み取り
const input_notes = ref<Record<string, { notes: string }>>({});

// 初期化時に各点検項目IDに対する備考を空のオブジェクトで初期化
if (inspectionItems.value) {
  for (const item of inspectionItems.value) {
    input_notes.value[item.inspection_item_id] = { notes: '' };
  }
}

const handleNotesFieldValue = (inspectionItemId: string, value: string) => {
  // 初期化されていない場合に備えて確認
  if (!input_notes.value[inspectionItemId]) {
    input_notes.value[inspectionItemId] = { notes: '' };
  }
  input_notes.value[inspectionItemId].notes = value;
};

const setAllItemsTrue = () => {
  Object.values(groupedInspectionItems.value).forEach((items) => {
    items.forEach((item) => {
      if (item.inspection_component_type === 'InspectionCustomCheck') {
        input_result.value[item.inspection_item_id] = true;
      }
    });
  });
};

//点検結果のデータを生成
const generateResultData = (item: InspectionItem) => {
  const inspectionResultId = generateInspectionResultId(
    item.inspection_item_id,
  );

  // 点検結果を判定（OK/NG/日付/未入力）
  let result;
  const value = input_result.value[item.inspection_item_id];
  if (value === true) {
    result = 'OK';
  } else if (value === undefined || value === false) {
    result = 'NG';
  } else if (value instanceof Date) {
    result = format(value, 'yyyy-MM-dd'); // Date型の場合、yyyy-MM-dd形式にフォーマット
  } else {
    result = value;
  }

  const notes = input_notes.value[item.inspection_item_id]?.notes || '';

  // 送信するデータを整形
  return {
    result_id: inspectionResultId,
    user_id: userId.value,
    inspection_item_id: item.inspection_item_id,
    equipment_id: inputEquipmentId.value,
    equipment_serial_number: equipment.value?.equipment_serial_number,
    result: result,
    notes: notes,
    inspection_date: inspection_date(),
  };
};

// 点検結果を保存する関数
const saveInspectionResults = async () => {
  loading.value = true;
  if (!inspectionItems.value || inspectionItems.value.length === 0) {
    Alert('alert', '保存する点検項目がありません。', 'warning');
    loading.value = false;
    return;
  }
  try {
    const resultDataList = inspectionItems.value.map(generateResultData);
    await $fetch('/api/inspection/inspection-items-save-result', {
      method: 'POST',
      body: { results: resultDataList },
    });
    formDataReset();
    Alert('alert', '点検結果が正常に保存されました。', 'success');
  } catch (error) {
    console.error(
      '[inspection-items-save-result]:点検結果の保存に失敗しました',
      error,
    );
    Alert(
      'alert',
      '点検結果の保存に失敗しました。再度保存してください。',
      'error',
    );
  } finally {
    loading.value = false;
  }
};

// タブごとの独立したフォームデータリセット
const formDataReset = () => {
  date.value = new Date();
  inputEquipmentId.value = '';
  equipment.value = null;
  inspectionItems.value = null;
  input_result.value = {};
  disabled.value = true;
};
onMounted(() => {
  fetchEquipmentIdItems();
});
</script>

<style scoped></style>
