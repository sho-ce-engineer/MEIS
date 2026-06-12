<template>
  <div>
    <v-card class="my-5">
      <v-card-title class="d-flex">
        <h2 class="text-h6">
          <v-icon>mdi-clipboard-pulse-outline</v-icon> 医療機器台帳
        </h2>
        <v-spacer></v-spacer>
        <v-btn
          prepend-icon="mdi-table-filter"
          color="secondary"
          class="mr-4"
          @click="
            {
              ((filterCriteriaDialog = true), fetchEquipmentIdItems());
            }
          "
          >絞り込み</v-btn
        >
        <v-dialog v-model="filterCriteriaDialog" width="auto" scrollable>
          <v-card
            title="フィルター条件設定"
            prepend-icon="mdi-table-filter"
            :loading="loading"
            width="85vw"
            class="mx-auto"
          >
            <v-divider></v-divider>
            <v-card-text>
              <form>
                <v-autocomplete
                  label="院内管理ID"
                  prepend-icon="mdi-barcode-scan"
                  variant="underlined"
                  v-model="filterCriteria.equipment_id"
                  @click:prepend="scanEquipmentDialog = true"
                  clearable
                  @click:clear="filterCriteria.equipment_id = undefined"
                  :items="equipmentIdItems"
                  :loading="loading"
                  no-data-text="該当データがありません。機器台帳から登録してください。"
                ></v-autocomplete>
                <v-dialog v-model="scanEquipmentDialog" width="auto">
                  <v-card
                    max-width="400"
                    prepend-icon="mdi-barcode-scan"
                    title="院内管理IDのスキャン"
                  >
                    <v-divider></v-divider>
                    <v-card-text>
                      <p>院内管理IDのバーコードをスキャンしてください。</p>
                      <p class="mt-4 text-caption">
                        ※読み込めない場合、ピントが合う位置までゆっくり前後させてください。
                      </p>
                      {{ filterCriteria.equipment_id }}
                      <QrcodeStream
                        @detect="onDetect"
                        :formats="['qr_code', 'linear_codes']"
                      />
                    </v-card-text>
                    <v-divider></v-divider>
                    <v-card-actions
                      ><v-btn @click="scanEquipmentDialog = false"
                        >閉じる</v-btn
                      >
                      <v-spacer></v-spacer>
                    </v-card-actions>
                  </v-card>
                </v-dialog>
                <v-select
                  label="機器種別"
                  v-model="filterCriteria.equipment_type"
                  :items="select_equiment_type_items"
                  @update:focused="fetchEquipmentTypes()"
                  variant="underlined"
                  clearable
                  @click:clear="filterCriteria.equipment_type = undefined"
                ></v-select>
                <v-select
                  label="メーカー"
                  v-model="filterCriteria.equipment_manufacturer"
                  :items="select_equiment_manufacturer_items"
                  @update:focused="fetchEquipmentManufacture()"
                  variant="underlined"
                  clearable
                  @click:clear="
                    filterCriteria.equipment_manufacturer = undefined
                  "
                ></v-select>
                <v-text-field
                  label="機器名称"
                  v-model="filterCriteria.equipment_name"
                  variant="underlined"
                  clearable
                  @click:clear="filterCriteria.equipment_name = undefined"
                ></v-text-field>
                <v-text-field
                  label="型番"
                  v-model="filterCriteria.equipment_model"
                  variant="underlined"
                  clearable
                  @click:clear="filterCriteria.equipment_model = undefined"
                ></v-text-field>
                <v-text-field
                  label="シリアル番号"
                  v-model="filterCriteria.equipment_serial_number"
                  variant="underlined"
                  clearable
                  @click:clear="
                    filterCriteria.equipment_serial_number = undefined
                  "
                ></v-text-field>
                <v-select
                  label="稼働状況"
                  :items="['active', 'inactive']"
                  v-model="filterCriteria.equipment_status"
                  variant="underlined"
                  clearable
                  @click:clear="filterCriteria.equipment_status = undefined"
                ></v-select>
                <v-select
                  label="保守契約加入状況"
                  :items="['加入', '未加入']"
                  v-model="filterCriteria.equipment_maintenance_contract"
                  variant="underlined"
                  clearable
                  @click:clear="
                    filterCriteria.equipment_maintenance_contract = undefined
                  "
                ></v-select>
              </form>
            </v-card-text>
            <v-divider></v-divider>
            <v-card-actions>
              <v-btn
                text="閉じる"
                @click="filterCriteriaDialog = false"
              ></v-btn>
              <v-btn
                text="クリア"
                variant="flat"
                @click="clearFilter()"
              ></v-btn>
              <v-spacer></v-spacer>
              <v-btn
                color="primary"
                text="絞り込む"
                type="submit"
                variant="flat"
                @click="applyFilter()"
              ></v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
        <v-btn
          class="mr-4"
          color="primary"
          text="XLSX"
          prepend-icon="mdi-plus"
          to="/equipment/EquipmentImportXlsx"
        >
        </v-btn>
        <v-dialog v-model="dialog" width="auto" scrollable>
          <template v-slot:activator="{ props: EquipmentEditActivaterProps }">
            <v-btn
              color="primary"
              text="新規機器追加"
              v-bind="EquipmentEditActivaterProps"
              prepend-icon="mdi-plus"
            >
            </v-btn>
          </template>
          <v-card prepend-icon="mdi-plus" title="新規機器追加" width="85vw">
            <v-divider></v-divider>
            <v-card-text>
              <form>
                <v-text-field
                  label="院内管理ID"
                  v-model="newItem.equipment_id"
                  :rules="[rules.idreg]"
                  hint="【注意】院内管理IDは、一度登録すると変更することができません。"
                ></v-text-field>
                <v-text-field
                  label="機器種別"
                  v-model="newItem.equipment_type"
                  :rules="[rules.required]"
                ></v-text-field>
                <v-text-field
                  label="メーカー"
                  v-model="newItem.equipment_manufacturer"
                  :rules="[rules.required]"
                ></v-text-field>
                <v-text-field
                  label="機器名称"
                  v-model="newItem.equipment_name"
                  :rules="[rules.required]"
                ></v-text-field>
                <v-text-field
                  label="型番"
                  v-model="newItem.equipment_model"
                  :rules="[rules.required]"
                ></v-text-field>
                <v-text-field
                  label="シリアル番号"
                  v-model="newItem.equipment_serial_number"
                  :rules="[rules.required]"
                ></v-text-field>
                <v-text-field
                  label="設置保管場所"
                  v-model="newItem.equipment_storage_location"
                ></v-text-field>
                <v-select
                  label="稼働状況"
                  :items="['active', 'inactive']"
                  v-model="newItem.equipment_status"
                  :rules="[rules.required]"
                ></v-select>
                <v-select
                  label="保守契約加入状況"
                  :items="['加入', '未加入']"
                  v-model="newItem.equipment_maintenance_contract"
                  :rules="[rules.required]"
                ></v-select>
                <v-date-input
                  label="購入日"
                  v-model="newItem.acquisition_date"
                  :rules="[rules.required]"
                ></v-date-input>
                <v-textarea
                  label="備考"
                  v-model="newItem.equipment_notes"
                ></v-textarea>
              </form>
            </v-card-text>
            <v-divider></v-divider>
            <v-card-actions>
              <v-btn text="閉じる" @click="dialog = false"></v-btn>
              <v-spacer></v-spacer>
              <v-btn
                color="primary"
                text="保存する"
                @click="newAddRecord(newItem)"
                variant="flat"
              ></v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </v-card-title>
      <v-data-table-server
        :headers="headers"
        :items="equipmentLedgerItems"
        :items-length="totalItems"
        item-key="equipment_id"
        class="elevation-1"
        :loading="loading"
        items-per-page="10"
        :sort-by="sortBy"
        @update:options="handleUpdateOptions"
        items-per-page-text="表示件数"
        :items-per-page-options="[
          { value: 10, title: '10' },
          { value: 25, title: '25' },
          { value: 50, title: '50' },
          { value: 100, title: '100' },
          { value: 999999, title: 'All' },
        ]"
      >
        <template v-slot:item="{ item }">
          <v-dialog width="auto" scrollable>
            <template v-slot:activator="{ props: EquipmentEditActivaterProps }">
              <tr
                v-bind="EquipmentEditActivaterProps"
                class="clickable-table-row"
              >
                <td>{{ item.equipment_id }}</td>
                <td>{{ item.equipment_type }}</td>
                <td>{{ item.equipment_manufacturer }}</td>
                <td>{{ item.equipment_name }}</td>
                <td>{{ item.equipment_model }}</td>
                <td>{{ item.equipment_serial_number }}</td>
                <td>
                  {{ item.acquisition_date }}
                </td>
              </tr></template
            >
            <template v-slot:default="{ isActive }">
              <form>
                <v-card
                  prepend-icon="mdi-clipboard-pulse-outline"
                  title="医療機器台帳　登録内容編集"
                  width="80vw"
                >
                  <v-divider></v-divider>
                  <v-card-text>
                    <v-text-field
                      label="院内管理ID"
                      v-model="item.equipment_id"
                      :rules="[rules.idreg]"
                      disabled
                    ></v-text-field>
                    <v-text-field
                      label="機器種別"
                      v-model="item.equipment_type"
                      :rules="[rules.required]"
                    ></v-text-field>
                    <v-text-field
                      label="メーカー"
                      v-model="item.equipment_manufacturer"
                      :rules="[rules.required]"
                    ></v-text-field>
                    <v-text-field
                      label="機器名称"
                      v-model="item.equipment_name"
                      :rules="[rules.required]"
                    ></v-text-field>
                    <v-text-field
                      label="型番"
                      v-model="item.equipment_model"
                      :rules="[rules.required]"
                    ></v-text-field>
                    <v-text-field
                      label="シリアル番号"
                      v-model="item.equipment_serial_number"
                      :rules="[rules.required]"
                    ></v-text-field>
                    <v-text-field
                      label="設置保管場所"
                      v-model="item.equipment_storage_location"
                    ></v-text-field>
                    <v-select
                      label="稼働状況"
                      :items="['active', 'inactive']"
                      v-model="item.equipment_status"
                      :rules="[rules.required]"
                    ></v-select>
                    <v-select
                      label="保守契約加入状況"
                      :items="['加入', '未加入']"
                      v-model="item.equipment_maintenance_contract"
                      :rules="[rules.required]"
                    ></v-select>
                    <v-text-field
                      label="購入日"
                      v-model="item.acquisition_date"
                      hint="yyyy-mm-ddの形式で入力してください。"
                      :rules="[rules.required]"
                    ></v-text-field>
                    <v-textarea
                      label="備考"
                      v-model="item.equipment_notes"
                    ></v-textarea>
                  </v-card-text>
                  <v-divider></v-divider>
                  <v-card-actions>
                    <v-btn
                      text="閉じる"
                      @click="isActive.value = false"
                    ></v-btn>
                    <v-spacer></v-spacer>
                    <v-btn
                      color="primary"
                      text="保存する"
                      variant="flat"
                      @click="updateRecord(item, isActive)"
                    ></v-btn>
                  </v-card-actions>
                </v-card>
              </form>
            </template>
          </v-dialog>
        </template>
      </v-data-table-server>
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
import { ref, reactive } from 'vue';

interface EquipmentLedgerItem {
  equipment_id: string;
  equipment_type: string;
  equipment_manufacturer: string;
  equipment_name: string;
  equipment_model: string;
  equipment_serial_number: string;
  equipment_status: string;
  acquisition_date: string | null;
  equipment_storage_location?: string;
  equipment_notes?: string;
  equipment_maintenance_contract: string;
}

interface EquipmentFilterCriteria {
  equipment_id?: string;
  equipment_type?: string;
  equipment_manufacturer?: string;
  equipment_name?: string;
  equipment_model?: string;
  equipment_serial_number?: string;
  equipment_status?: string;
  equipment_maintenance_contract?: string;
}

interface SortOption {
  key: string;
  order: 'asc' | 'desc';
}

interface NewEquipmentPayload {
  equipment_id: string;
  equipment_type: string;
  equipment_manufacturer: string;
  equipment_name: string;
  equipment_model: string;
  equipment_serial_number: string;
  equipment_storage_location?: string;
  equipment_status: string;
  equipment_maintenance_contract: string;
  acquisition_date: string | null;
  equipment_notes?: string;
}

const loading = ref(true);
const dialog = ref(false);

//Alert
const alertMessage = ref('');
const alertType = ref<'success' | 'info' | 'warning' | 'error'>('info');
const showAlert = ref(false);
const updateShowAlert = (value: boolean) => {
  showAlert.value = value;
};
//バリデーション
const rules = reactive({
  required: (value: string) => !!value || '入力必須項目です。',
  idreg: (value: string) =>
    (!!value && /^[a-zA-Z0-9\-]+$/.test(value)) ||
    '半角英数字とハイフンのみ使用できます。',
});

const headers = [
  { title: '院内管理ID', sortable: true, key: 'equipment_id' },
  { title: '機器種別', sortable: true, key: 'equipment_type' },
  { title: 'メーカー', sortable: true, key: 'equipment_manufacturer' },
  { title: '機器名称', sortable: true, key: 'equipment_name' },
  { title: '型番', sortable: true, key: 'equipment_model' },
  { title: 'シリアル番号', sortable: true, key: 'equipment_serial_number' },
  { title: '購入日', key: 'acquisition_date' },
];

// //フィルター機能
const filterCriteriaDialog = ref(false);
const filterCriteria = reactive<EquipmentFilterCriteria>({
  equipment_id: '',
  equipment_type: '',
  equipment_manufacturer: '',
  equipment_name: '',
  equipment_model: '',
  equipment_serial_number: '',
  equipment_status: 'active',
  equipment_maintenance_contract: '',
});

//機器IDのオートコンプリート
const equipmentIdItems = ref<string[]>([]);
const fetchEquipmentIdItems = async () => {
  loading.value = true;
  try {
    const response = await $fetch<string[]>('/api/equipment/equipment-id', {
      method: 'GET',
    });
    equipmentIdItems.value = response;
  } catch (error) {
    alertMessage.value =
      (error as any).data?.data?.message ||
      '機器IDの取得中にエラーが発生しました。';
    alertType.value = 'error';
    showAlert.value = true;
    console.error('[equipment-id]Load error:', error);
  } finally {
    loading.value = false;
  }
};

//機器種別の取得
const select_equiment_type_items = ref<string[]>([]);
const fetchEquipmentTypes = async () => {
  loading.value = true;
  try {
    const response = await $fetch('/api/equipment/equipment-types', {
      method: 'GET',
    });
    select_equiment_type_items.value = response.map(
      (item) => item.equipment_type,
    );
  } catch (error) {
    alertMessage.value =
      (error as any).data?.data?.message ||
      '機器種別の取得中にエラーが発生しました。';
    alertType.value = 'error';
    showAlert.value = true;
    console.error('[equipment-types]Load error:', error);
  } finally {
    loading.value = false;
  }
};

//メーカーの取得
const select_equiment_manufacturer_items = ref<string[]>([]);
const fetchEquipmentManufacture = async () => {
  loading.value = true;
  try {
    const response = await $fetch('/api/equipment/equipment-manufacturer', {
      method: 'GET',
    });
    select_equiment_manufacturer_items.value = response.map(
      (item) => item.equipment_manufacturer,
    );
  } catch (error) {
    alertMessage.value =
      (error as any).data?.data?.message ||
      'メーカーの取得中にエラーが発生しました。';
    alertType.value = 'error';
    showAlert.value = true;
    console.error('[equipment-manufacturer]Load error:', error);
  } finally {
    loading.value = false;
  }
};

//バーコードリーダー機能
//機能変更予定
import { QrcodeStream } from 'vue-qrcode-reader';
const scanEquipmentDialog = ref(false);
const onDetect = (detectedCodes: any[]) => {
  filterCriteria.equipment_id = detectedCodes[0].rawValue;
  scanEquipmentDialog.value = false;
};

//フィルター実行
const applyFilter = () => {
  filterCriteriaDialog.value = false;
  loadItems(1, 10, sortBy.value, filterCriteria);
};
const clearFilter = () => {
  for (let key in filterCriteria) {
    if (filterCriteria.hasOwnProperty(key)) {
      filterCriteria[key as keyof EquipmentFilterCriteria] = undefined;
    }
  }
};

const equipmentLedgerItems = ref<EquipmentLedgerItem[]>([]);
const totalItems = ref(0);
const sortBy = ref<SortOption[]>([{ key: 'equipment_id', order: 'asc' }]);
const loadItems = async (
  page: number = 1,
  itemsPerPage: number = 10,
  sortBy: SortOption[] = [],
  filterCriteria: EquipmentFilterCriteria = {},
) => {
  loading.value = true;
  try {
    const { sortKey, sortByOrder } = getSortOptions(sortBy);
    const response = await $fetch<{
      items: EquipmentLedgerItem[];
      total: number;
    }>('/api/equipment/equipment-ledger', {
      method: 'POST',
      body: {
        page,
        itemsPerPage,
        sortRow: sortKey,
        sortByOrder,
        filterCriteria: filterCriteria,
      },
    });
    equipmentLedgerItems.value = response.items;
    totalItems.value = response.total;
  } catch (error) {
    alertMessage.value =
      (error as any).data?.data?.message ||
      'データ取得中にエラーが発生しました。';
    alertType.value = 'error';
    showAlert.value = true;
    console.error('[equipment-ledger]Load error:', error);
  } finally {
    loading.value = false;
  }
};

const getSortOptions = (sortBy: SortOption[]) => {
  const sortKey = sortBy.length ? sortBy[0].key : 'equipment_id';
  const sortOrder = sortBy.length ? sortBy[0].order : 'asc';
  return { sortKey, sortByOrder: sortOrder };
};

const handleUpdateOptions = (options: {
  page: number;
  itemsPerPage: number;
  sortBy: SortOption[];
}) => {
  if (!import.meta.client) return;
  const { page, itemsPerPage, sortBy } = options;
  loadItems(page, itemsPerPage, sortBy, filterCriteria);
};

const updateRecord = async (
  item: EquipmentLedgerItem,
  isActive: Ref<boolean>,
) => {
  try {
    const updatedItem = { ...item };
    await $fetch('/api/equipment/update-record', {
      method: 'PUT',
      body: { equipment_id: item.equipment_id, updatedItem },
    });
    loadItems();
    isActive.value = false;
    alertMessage.value = 'データが正常に保存されました。';
    alertType.value = 'success';
    showAlert.value = true;
  } catch (error) {
    alertMessage.value =
      (error as any).data?.data?.message ||
      '変更に問題が発生しました。データは保存されていません。内容を確認した上で再度「保存」してください。';
    alertType.value = 'error';
    showAlert.value = true;
    console.error(
      '[update-record]Update error for equipment_id: ' + item.equipment_id,
      error,
    );
  }
};

const newItem = ref<NewEquipmentPayload>({
  equipment_id: '',
  equipment_type: '',
  equipment_manufacturer: '',
  equipment_name: '',
  equipment_model: '',
  equipment_serial_number: '',
  equipment_storage_location: '',
  equipment_status: 'active',
  equipment_maintenance_contract: '',
  acquisition_date: null,
  equipment_notes: '',
});
const resetForm = () => {
  newItem.value = {
    equipment_id: '',
    equipment_type: '',
    equipment_manufacturer: '',
    equipment_name: '',
    equipment_model: '',
    equipment_serial_number: '',
    equipment_storage_location: '',
    equipment_status: 'active',
    equipment_maintenance_contract: '',
    acquisition_date: null,
    equipment_notes: '',
  };
};
const newAddRecord = async (newItem: NewEquipmentPayload) => {
  try {
    await $fetch('/api/equipment/newAdd', {
      method: 'POST',
      body: { ...newItem },
    });
    loadItems();
    dialog.value = false;
    resetForm();
    alertMessage.value = '機器の新規登録をサーバーに送信しました。';
    alertType.value = 'success';
    showAlert.value = true;
  } catch (error) {
    alertMessage.value =
      (error as any).data?.data?.message ||
      '機器の新規登録に問題が発生しました。内容を確認した上で再度「保存」してください。';
    alertType.value = 'error';
    showAlert.value = true;
    console.error('[newAdd]New add error:', error);
  }
};
</script>

<style scoped>
.clickable-table-row {
  cursor: pointer;
}
</style>
