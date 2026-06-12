<template>
  <div>
    <UiAlert
      :showAlert="showAlert"
      :alertMessage="alertMessage"
      :alertType="alertType"
      @update:showAlert="updateShowAlert"
    />
    <v-row>
      <v-col cols="12" md="6">
        <div class="d-flex">
          <h2 class="mb-5">作成対象機器</h2>
          <v-spacer></v-spacer>
          <v-btn
            text="点検項目の複製"
            prepend-icon="mdi-content-copy"
            variant="plain"
            to="/inspection/InspectionMenuCopy"
          ></v-btn>
        </div>
        <h3>点検機器の種類</h3>
        <v-select
          v-model="selectedEquipmentType"
          :items="equipmentTypes"
          label="点検内容を作成する機器の種類を選択してください。"
          item-title="equipment_type"
          item-value="equipment_type"
          @update:modelValue="fetchEquipmentModels"
          hint="台帳に登録されている機器種別をもとに表示されます。"
          persistent-hint
          :disabled="equipmentTypes_disabled"
          class="mb-3"
        />

        <h3>点検機器の型番</h3>
        <v-select
          v-model="selectedEquipmentModel"
          :items="equipmentModel"
          label="点検内容を作成する機器の型番を選択してください。"
          item-title="equipment_model"
          item-value="equipment_model"
          @update:modelValue="fetchInspectionTypes"
          hint="ここは機器台帳に登録されている機器の型番が表示されます。"
          persistent-hint
          :disabled="equipmentModel_disabled"
          class="mb-3"
        />
        <h3>点検区分</h3>
        <v-select
          v-model="selectedInspectionType"
          :items="inspectionType"
          label="点検内容を作成する点検区分を選択してください。"
          item-title="inspection_type"
          item-value="inspection_type"
          @update:modelValue="fetchInspectionItems"
          :disabled="inspectionType_disabled"
          persistent-hint
          no-data-text="登録されている点検データはありません。右のフォームから作成してください。"
        />
        <v-divider class="mb-4"></v-divider>
        <!-- 点検項目の一覧表示 -->
        <div v-if="Object.keys(groupedInspectionItems).length > 0">
          <h2>点検項目一覧</h2>
          <v-list
            v-for="(inspectionItems, category) in groupedInspectionItems"
            :key="category"
            style="background-color: var(--bg-gray)"
          >
            <v-list-subheader>{{ category }}</v-list-subheader>
            <draggable
              v-model="groupedInspectionItems[category]"
              group="inspection-items"
              item-key="inspection_item_id"
              tag="div"
              :data-category="category"
              @end="handleEnd"
              :move="checkMove"
            >
              <template #item="{ element }">
                <v-list-item
                  :key="element.inspection_item_id"
                  @click="editInspectionItem(element)"
                  :title="element.inspection_item"
                  :subtitle="element.inspection_item_description"
                  :prepend-icon="getIcon(element.inspection_component_type)"
                  :data-id="element.inspection_item_id"
                >
                </v-list-item>
              </template>
            </draggable>
          </v-list>
        </div>
        <v-btn
          text="入力をリセットする"
          prepend-icon="mdi-format-clear"
          variant="plain"
          @click="resetEquipmentData"
          class="mt-2"
        >
        </v-btn>
      </v-col>

      <v-col cols="12" md="6">
        <v-card class="sticky-sidebar" :disabled="inspectionItemFormDisabled">
          <v-card-title class="text-primary d-flex"
            ><v-icon>mdi-format-list-group-plus</v-icon>点検項目の追加/編集
          </v-card-title>
          <v-divider></v-divider>
          <v-card-text class="text-primary">
            <h3>点検区分</h3>
            <v-select
              v-model="newInspectionItem.inspection_type"
              :items="['日常点検', '定期点検']"
              label="点検区分を選択してください。"
              class="mb-3"
            />
            <h3>点検項目のカテゴリ</h3>
            <v-select
              v-model="newInspectionItem.inspection_item_category"
              :items="inspectionItemCategorys"
              label="点検項目のカテゴリを選択してください。"
              class="mb-3"
            />
            <h3>点検項目</h3>
            <v-text-field
              v-model="newInspectionItem.inspection_item"
              label="点検項目を入力してください。"
              hint="１行での入力がおすすめです"
              class="mb-3"
            />
            <h4>点検内容の補足</h4>
            <v-textarea
              v-model="newInspectionItem.inspection_item_description"
              label="点検内容を入力してください。"
              rows="3"
              hint="点検項目を補足する情報を入力してください。"
              class="mb-3"
            />
            <h3>点検結果の入力タイプ</h3>
            <v-select
              v-model="newInspectionItem.inspection_component_type"
              :items="inputTypes"
              item-title="label"
              item-value="input_type"
              label="入力タイプを選択してください。"
            />
            <!-- "InspectionCustomNumber" が選択された場合にのみ追加のフォームを表示 -->
            <div
              v-if="
                newInspectionItem.inspection_component_type ===
                'InspectionCustomNumber'
              "
            >
              <h3>数値入力の詳細設定</h3>
              <v-text-field
                :model-value="newInspectionItem.upperlimit"
                @update:model-value="
                  newInspectionItem.upperlimit =
                    $event === '' ? null : Number($event)
                "
                label="上限値"
                type="number"
                hint="基準値に対する上限値を入力してください。設定すると、設定値を超えた値が入力された場合、アラート文が表示されます。"
              />
              <v-text-field
                :model-value="newInspectionItem.lowerlimit"
                @update:model-value="
                  newInspectionItem.lowerlimit =
                    $event === '' ? null : Number($event)
                "
                label="下限値"
                type="number"
                hint="基準値に対する下限値を入力してください。設定すると、設定値を下回った値が入力された場合、アラート文が表示されます。"
              />
              <v-text-field
                v-model="newInspectionItem.suffix"
                label="単位"
                type="text"
                hint="数値入力の単位を入力してください。"
                :suffix="newInspectionItem.suffix"
              />
              <v-text-field
                :model-value="newInspectionItem.max"
                @update:model-value="
                  newInspectionItem.max = $event === '' ? null : Number($event)
                "
                label="最大値"
                type="number"
                hint="数値入力できる最大値を入力してください。"
              />
              <v-text-field
                :model-value="newInspectionItem.min"
                @update:model-value="
                  newInspectionItem.min = $event === '' ? null : Number($event)
                "
                label="最小値"
                type="number"
                hint="数値入力できる最小値を入力してください。"
              />
            </div>
          </v-card-text>
          <v-divider></v-divider>
          <v-card-actions>
            <v-btn
              text="削除する"
              append-icon="mdi-delete-empty-outline"
              @click="inspectionItemDeleteDialog = true"
              variant="plain"
              color="red-darken-3"
              v-if="newInspectionItem.inspection_item_id"
            ></v-btn>
            <v-spacer></v-spacer>
            <v-btn
              color="primary"
              text="保存する"
              prepend-icon="mdi-plus"
              variant="elevated"
              :loading="addOrUpdateInspectionItemLoading"
              @click="addOrUpdateInspectionItem()"
            >
            </v-btn
          ></v-card-actions>
          <v-dialog
            v-model="inspectionItemDeleteDialog"
            width="auto"
            scrollable
          >
            <v-card title="削除確認" prepend-icon="mdi-information-outline">
              <v-divider></v-divider>
              <v-card-text
                ><p class="mb-2">
                  「削除する」を押すと直ちに削除処理が行われます。
                </p>
                <p class="my-4 font-weight-bold text-red-darken-3">
                  削除処理が行われたデータは、復元できません。
                </p>
                <p>本当に削除処理を行なってもよろしいですか？</p></v-card-text
              >
              <v-divider></v-divider>
              <v-card-actions>
                <v-btn
                  color="red-darken-3"
                  append-icon="mdi-delete-empty-outline"
                  @click="
                    inspectionItemDelete(newInspectionItem.inspection_item_id)
                  "
                  variant="plain"
                  :loading="inspectionItemDeleteloading"
                >
                  削除する
                </v-btn>
                <v-spacer></v-spacer>
                <v-btn
                  text="戻る"
                  @click="inspectionItemDeleteDialog = false"
                  color="primary"
                  variant="flat"
                ></v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import InspectionCustomCheck from '../../components/Ui/InspectionCustomCheck.vue';
import InspectionCustomNumber from '../../components/Ui/InspectionCustomNumber.vue';
import InspectionCustomDate from '../../components/Ui/InspectionCustomDate.vue';

interface InspectionItem {
  inspection_type: string;
  inspection_item_id: string;
  inspection_item_category: string;
  inspection_item: string;
  inspection_item_description: string;
  inspection_component_type: string;
  equipment_type: string;
  equipment_model: string;
  suffix?: string;
  min?: number | null;
  max?: number | null;
  lowerlimit?: number | null;
  upperlimit?: number | null;
  inspection_sort_number: number | null;
}

//Alert機能
const alertMessage = ref('');
const alertType = ref<'success' | 'info' | 'warning' | 'error'>('info');
const showAlert = ref(false);
const updateShowAlert = (value: boolean) => {
  showAlert.value = value;
};

// 機器種類の取得
const equipmentTypes = ref<string[]>([]);
const equipmentTypes_disabled = ref(false);
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
const selectedEquipmentType = ref<string>('');
const fetchEquipmentModels = async () => {
  if (!selectedEquipmentType.value) {
    alertMessage.value = '機器種類を選択してください。';
    alertType.value = 'error';
    showAlert.value = true;
    return;
  }
  try {
    const response = await $fetch('/api/equipment/equipment-models', {
      method: 'POST',
      body: {
        equipmentType: selectedEquipmentType.value,
      },
    });
    equipmentModel.value = response;
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
const selectedEquipmentModel = ref<string>('');
const inspectionType = ref<string[]>([]);
const inspectionType_disabled = ref(true);
const fetchInspectionTypes = async () => {
  if (!selectedEquipmentModel.value) {
    alertMessage.value = '機器型番を選択してください。';
    alertType.value = 'error';
    showAlert.value = true;
    return;
  }

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

// 点検項目の取得
const selectedInspectionType = ref<string>('');
const inspectionItems = ref<InspectionItem[]>([]);
const inspectionItemFormDisabled = ref(true);
const fetchInspectionItems = async () => {
  if (!selectedEquipmentModel.value || !selectedInspectionType.value) {
    alertMessage.value = '機器型番と点検区分を選択してください。';
    alertType.value = 'error';
    showAlert.value = true;
    return;
  }

  try {
    const response = await $fetch<InspectionItem[]>(
      '/api/inspection/inspection-items',
      {
        method: 'POST',
        body: {
          equipmentModel: selectedEquipmentModel.value,
          inspectionType: selectedInspectionType.value,
        },
      },
    );
    inspectionItems.value = response;
    inspectionType_disabled.value = true;
    inspectionItemFormDisabled.value = false;
  } catch (error) {
    alertMessage.value =
      (error as any).data?.data?.message ||
      '点検項目の取得中にエラーが発生しました。';
    alertType.value = 'error';
    showAlert.value = true;
    console.error('[inspection-items]Load error:', error);
  }
};

// カテゴリごとにデータをグループ化
const computedGroupedItems = computed(() => {
  if (!Array.isArray(inspectionItems.value)) {
    console.error(
      '[InspectionMenuAdd]computedGroupItems():inspectionItems.valueが配列ではありません:',
      inspectionItems.value,
    );
    alertMessage.value = '点検データの取得中にエラーが発生しました。';
    alertType.value = 'error';
    showAlert.value = true;
    return {};
  }

  return inspectionItems.value.reduce(
    (groups, item) => {
      const category = item.inspection_item_category || 'その他';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(item);
      return groups;
    },
    {} as Record<string, InspectionItem[]>,
  );
});

// アイコンを切り替える関数
const getIcon = (componentType: string) => {
  switch (componentType) {
    case 'InspectionCustomNumber':
      return 'mdi-numeric';
    case 'InspectionCustomCheck':
      return 'mdi-toggle-switch-outline';
    case 'InspectionCustomDate':
      return 'mdi-calendar-clock-outline';
    default:
      return 'mdi-null';
  }
};

// 点検種別の選択肢
const inspectionItemCategorys = [
  '外装点検',
  '機能点検',
  '実測点検',
  '警報点検',
];

// 入力タイプの選択肢
const inputTypes = [
  {
    label: 'OK/NG',
    component: InspectionCustomCheck,
    input_type: 'InspectionCustomCheck',
  },
  {
    label: '数値入力',
    component: InspectionCustomNumber,
    input_type: 'InspectionCustomNumber',
  },
  {
    label: '日付入力',
    component: InspectionCustomDate,
    input_type: 'InspectionCustomDate',
  },
];

// 点検項目の追加・更新
const newInspectionItem = reactive<InspectionItem>({
  inspection_type: '',
  inspection_item: '',
  inspection_item_id: '',
  inspection_item_category: '',
  inspection_item_description: '',
  inspection_component_type: '',
  equipment_type: '',
  equipment_model: '',
  suffix: '',
  min: null,
  max: null,
  lowerlimit: null,
  upperlimit: null,
  inspection_sort_number: null,
});

const addOrUpdateInspectionItemLoading = ref(false);
const addOrUpdateInspectionItem = async () => {
  addOrUpdateInspectionItemLoading.value = true;
  inspectionItemFormDisabled.value = true;
  if (
    !newInspectionItem.inspection_type ||
    !newInspectionItem.inspection_item_category ||
    !newInspectionItem.inspection_item ||
    !newInspectionItem.inspection_component_type ||
    !selectedEquipmentType.value ||
    !selectedEquipmentModel.value
  ) {
    alertMessage.value = '全ての項目を入力してください。';
    alertType.value = 'error';
    showAlert.value = true;
    addOrUpdateInspectionItemLoading.value = false;
    inspectionItemFormDisabled.value = false;
    return;
  }

  newInspectionItem.equipment_type = selectedEquipmentType.value;
  newInspectionItem.equipment_model = selectedEquipmentModel.value;

  let endpoint;
  // 新規もしくは編集のエンドポイントの設定
  if (!newInspectionItem.inspection_item_id) {
    endpoint = '/api/inspection/inspection-items-add';
  } else {
    endpoint = '/api/inspection/inspection-items-update';
  }

  try {
    await $fetch(endpoint, {
      method: 'POST',
      body: newInspectionItem,
    });
    resetInspectionItem();
    alertMessage.value = '点検項目が保存されました。';
    alertType.value = 'success';
    showAlert.value = true;
    fetchInspectionItems();
  } catch (error) {
    console.error('[inspection-items-add/update] Error:', error);
    alertMessage.value =
      (error as any).data?.data?.message ||
      '点検項目の保存中にエラーが発生しました。';
    alertType.value = 'error';
    showAlert.value = true;
  } finally {
    addOrUpdateInspectionItemLoading.value = false;
    inspectionItemFormDisabled.value = false;
  }
};

// 入力された点検項目のリセット
const resetInspectionItem = () => {
  newInspectionItem.inspection_item_id = '';
  newInspectionItem.inspection_type = '';
  newInspectionItem.inspection_item_category = '';
  newInspectionItem.inspection_item = '';
  newInspectionItem.inspection_item_description = '';
  newInspectionItem.inspection_component_type = '';
  newInspectionItem.inspection_sort_number = null;
  newInspectionItem.upperlimit = null;
  newInspectionItem.lowerlimit = null;
  newInspectionItem.suffix = '';
  newInspectionItem.max = null;
  newInspectionItem.min = null;
};

const resetEquipmentData = () => {
  selectedEquipmentType.value = '';
  selectedEquipmentModel.value = '';
  selectedInspectionType.value = '';
  equipmentTypes.value = [];
  equipmentModel.value = [];
  inspectionType.value = [];
  inspectionItems.value = [];
  for (const key in groupedInspectionItems) {
    delete groupedInspectionItems[key];
  }
  equipmentTypes_disabled.value = false;
  resetInspectionItem();
  fetchEquipmentTypes();
};

// 既存の点検項目を編集する
const editInspectionItem = (item: InspectionItem) => {
  newInspectionItem.inspection_item_id = item.inspection_item_id;
  newInspectionItem.inspection_type = item.inspection_type;
  newInspectionItem.inspection_item_category = item.inspection_item_category;
  newInspectionItem.inspection_item = item.inspection_item;
  newInspectionItem.inspection_item_description =
    item.inspection_item_description;
  newInspectionItem.inspection_component_type = item.inspection_component_type;
  newInspectionItem.inspection_sort_number = item.inspection_sort_number;
  newInspectionItem.equipment_type = selectedEquipmentType.value;
  newInspectionItem.equipment_model = selectedEquipmentModel.value;
  newInspectionItem.upperlimit = item.upperlimit;
  newInspectionItem.lowerlimit = item.lowerlimit;
  newInspectionItem.suffix = item.suffix;
  newInspectionItem.max = item.max;
  newInspectionItem.min = item.min;
};

//D&D処理
import draggable from 'vuedraggable';
// groupedInspectionItemsをcomputedGroupedItemsで更新
const groupedInspectionItems = reactive<Record<string, InspectionItem[]>>({});
watchEffect(() => {
  Object.keys(groupedInspectionItems).forEach(
    (key) => delete groupedInspectionItems[key],
  );
  Object.assign(groupedInspectionItems, computedGroupedItems.value);
});

const handleEnd = async (event: any) => {
  const fromElement = event.from.closest('div');
  const toElement = event.to.closest('div');

  // ドラッグ元とドロップ先のカテゴリを取得
  const fromCategory = fromElement?.dataset?.category;
  const toCategory = toElement?.dataset?.category;

  // カテゴリ情報の取得チェック
  if (!fromCategory || !toCategory) {
    console.error('カテゴリ情報が見つかりません');
    alertMessage.value = 'カテゴリ情報が見つかりません。';
    alertType.value = 'error';
    showAlert.value = true;
    return;
  }

  // カテゴリを跨いでの移動を禁止
  if (fromCategory !== toCategory) {
    alertMessage.value = 'カテゴリを跨ぐ移動はできません。';
    alertType.value = 'error';
    showAlert.value = true;
    return;
  }

  try {
    const updatedItems = groupedInspectionItems;
    await $fetch('/api/inspection/inspection-items-save-sorted', {
      method: 'PUT',
      body: {
        updatedItems,
      },
    });

    alertMessage.value = '並び替えの順序が正常に保存されました';
    alertType.value = 'success';
    showAlert.value = true;
  } catch (error) {
    console.error('Error sorted item:', error);
    alertMessage.value =
      (error as any).data?.data?.message || '並び替えの保存に失敗しました。';
    alertType.value = 'error';
    showAlert.value = true;
  }
};

const checkMove = (event: any) => {
  const fromElement = event.from.closest('div[data-category]');
  const toElement = event.to.closest('div[data-category]');

  const fromCategory = fromElement?.dataset?.category;
  const toCategory = toElement?.dataset?.category;

  // ドラッグ中のマウス位置に基づくカテゴリチェック
  if (fromCategory !== toCategory) {
    console.warn('カテゴリを跨ぐ移動は禁止されています');
    alertMessage.value = 'カテゴリを跨ぐ移動はできません。';
    alertType.value = 'error';
    showAlert.value = true;
    return false;
  }

  return true;
};
let initialCategory = '';

const beforeStart = (event: any) => {
  const fromElement = event.from.closest('div');
  initialCategory = fromElement?.dataset?.category || '';
};

//点検項目削除
const inspectionItemDeleteDialog = ref(false);
const inspectionItemDeleteloading = ref(false);
const inspectionItemDelete = async (inspectionItemId: string) => {
  inspectionItemDeleteloading.value = true;
  try {
    await $fetch('/api/inspection/inspection-item-delete', {
      method: 'POST',
      body: {
        inspection_item_id: inspectionItemId,
      },
    });
    alertMessage.value = '１件の点検項目を削除しました。';
    alertType.value = 'success';
    showAlert.value = true;
  } catch (error) {
    console.error('[inspection-item-delete]:Try Error', error);
    alertMessage.value =
      (error as any).data?.data?.message ||
      '点検項目の削除中にエラーが発生しました。';
    alertType.value = 'error';
    showAlert.value = true;
  } finally {
    inspectionItemDeleteloading.value = false;
    inspectionItemDeleteDialog.value = false;
    resetInspectionItem();
    fetchInspectionItems();
  }
};

onMounted(() => {
  fetchEquipmentTypes();
});
</script>

<style scoped>
.v-bottom-sheet {
  position: fixed;
  bottom: 0;
  width: 100%;
  max-height: 30%;
}

.sticky-sidebar {
  position: sticky;
  top: 80px;
}
</style>
