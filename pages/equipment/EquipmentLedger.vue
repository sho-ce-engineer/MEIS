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
                  v-model="filterCriteria.equipmentId"
                  @click:prepend="scanEquipmentDialog = true"
                  clearable
                  @click:clear="filterCriteria.equipmentId = undefined"
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
                      {{ filterCriteria.equipmentId }}
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
                  v-model="filterCriteria.equipmentType"
                  :items="equipmentTypeItems"
                  @update:focused="fetchEquipmentTypes()"
                  variant="underlined"
                  clearable
                  @click:clear="filterCriteria.equipmentType = undefined"
                ></v-select>
                <v-select
                  label="メーカー"
                  v-model="filterCriteria.equipmentManufacturer"
                  :items="equipmentManufacturerItems"
                  @update:focused="fetchEquipmentManufacture()"
                  variant="underlined"
                  clearable
                  @click:clear="
                    filterCriteria.equipmentManufacturer = undefined
                  "
                ></v-select>
                <v-text-field
                  label="機器名称"
                  v-model="filterCriteria.equipmentName"
                  variant="underlined"
                  clearable
                  @click:clear="filterCriteria.equipmentName = undefined"
                ></v-text-field>
                <v-text-field
                  label="型番"
                  v-model="filterCriteria.equipmentModel"
                  variant="underlined"
                  clearable
                  @click:clear="filterCriteria.equipmentModel = undefined"
                ></v-text-field>
                <v-text-field
                  label="シリアル番号"
                  v-model="filterCriteria.equipmentSerialNumber"
                  variant="underlined"
                  clearable
                  @click:clear="
                    filterCriteria.equipmentSerialNumber = undefined
                  "
                ></v-text-field>
                <v-select
                  label="稼働状況"
                  :items="['active', 'inactive']"
                  v-model="filterCriteria.equipmentStatus"
                  variant="underlined"
                  clearable
                  @click:clear="filterCriteria.equipmentStatus = undefined"
                ></v-select>
                <v-select
                  label="保守契約加入状況"
                  :items="['加入', '未加入']"
                  v-model="filterCriteria.equipmentMaintenanceContract"
                  variant="underlined"
                  clearable
                  @click:clear="
                    filterCriteria.equipmentMaintenanceContract = undefined
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
                  v-model="newItem.equipmentId"
                  :rules="[rules.idreg]"
                  hint="【注意】院内管理IDは、一度登録すると変更することができません。"
                ></v-text-field>
                <v-text-field
                  label="機器種別"
                  v-model="newItem.equipmentType"
                  :rules="[rules.required]"
                ></v-text-field>
                <v-text-field
                  label="メーカー"
                  v-model="newItem.equipmentManufacturer"
                  :rules="[rules.required]"
                ></v-text-field>
                <v-text-field
                  label="機器名称"
                  v-model="newItem.equipmentName"
                  :rules="[rules.required]"
                ></v-text-field>
                <v-text-field
                  label="型番"
                  v-model="newItem.equipmentModel"
                  :rules="[rules.required]"
                ></v-text-field>
                <v-text-field
                  label="シリアル番号"
                  v-model="newItem.equipmentSerialNumber"
                  :rules="[rules.required]"
                ></v-text-field>
                <v-text-field
                  label="設置保管場所"
                  v-model="newItem.equipmentStorageLocation"
                ></v-text-field>
                <v-select
                  label="稼働状況"
                  :items="['active', 'inactive']"
                  v-model="newItem.equipmentStatus"
                  :rules="[rules.required]"
                ></v-select>
                <v-select
                  label="保守契約加入状況"
                  :items="['加入', '未加入']"
                  v-model="newItem.equipmentMaintenanceContract"
                  :rules="[rules.required]"
                ></v-select>
                <v-date-input
                  label="購入日"
                  v-model="newItem.acquisitionDate"
                  :rules="[rules.required]"
                ></v-date-input>
                <v-textarea
                  label="備考"
                  v-model="newItem.equipmentNotes"
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
        item-value="equipmentId"
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
                <td>{{ item.equipmentId }}</td>
                <td>{{ item.equipmentType }}</td>
                <td>{{ item.equipmentManufacturer }}</td>
                <td>{{ item.equipmentName }}</td>
                <td>{{ item.equipmentModel }}</td>
                <td>{{ item.equipmentSerialNumber }}</td>
                <td>
                  {{ item.acquisitionDate }}
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
                      v-model="item.equipmentId"
                      :rules="[rules.idreg]"
                      disabled
                    ></v-text-field>
                    <v-text-field
                      label="機器種別"
                      v-model="item.equipmentType"
                      :rules="[rules.required]"
                    ></v-text-field>
                    <v-text-field
                      label="メーカー"
                      v-model="item.equipmentManufacturer"
                      :rules="[rules.required]"
                    ></v-text-field>
                    <v-text-field
                      label="機器名称"
                      v-model="item.equipmentName"
                      :rules="[rules.required]"
                    ></v-text-field>
                    <v-text-field
                      label="型番"
                      v-model="item.equipmentModel"
                      :rules="[rules.required]"
                    ></v-text-field>
                    <v-text-field
                      label="シリアル番号"
                      v-model="item.equipmentSerialNumber"
                      :rules="[rules.required]"
                    ></v-text-field>
                    <v-text-field
                      label="設置保管場所"
                      v-model="item.equipmentStorageLocation"
                    ></v-text-field>
                    <v-select
                      label="稼働状況"
                      :items="['active', 'inactive']"
                      v-model="item.equipmentStatus"
                      :rules="[rules.required]"
                    ></v-select>
                    <v-select
                      label="保守契約加入状況"
                      :items="['加入', '未加入']"
                      v-model="item.equipmentMaintenanceContract"
                      :rules="[rules.required]"
                    ></v-select>
                    <v-text-field
                      label="購入日"
                      v-model="item.acquisitionDate"
                      hint="yyyy-mm-ddの形式で入力してください。"
                      :rules="[rules.required]"
                    ></v-text-field>
                    <v-textarea
                      label="備考"
                      v-model="item.equipmentNotes"
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
import { reactive, ref } from 'vue';

interface EquipmentLedgerItem {
  equipmentId: string;
  equipmentType: string;
  equipmentManufacturer: string;
  equipmentName: string;
  equipmentModel: string;
  equipmentSerialNumber: string;
  equipmentStatus: string;
  acquisitionDate: string | null;
  equipmentStorageLocation?: string;
  equipmentNotes?: string;
  equipmentMaintenanceContract: string;
}

interface EquipmentFilterCriteria {
  equipmentId?: string;
  equipmentType?: string;
  equipmentManufacturer?: string;
  equipmentName?: string;
  equipmentModel?: string;
  equipmentSerialNumber?: string;
  equipmentStatus?: string;
  equipmentMaintenanceContract?: string;
}

interface SortOption {
  key: string;
  order: 'asc' | 'desc';
}

interface NewEquipmentPayload {
  equipmentId: string;
  equipmentType: string;
  equipmentManufacturer: string;
  equipmentName: string;
  equipmentModel: string;
  equipmentSerialNumber: string;
  equipmentStorageLocation?: string;
  equipmentStatus: string;
  equipmentMaintenanceContract: string;
  acquisitionDate: string | null;
  equipmentNotes?: string;
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
    (!!value && /^[a-zA-Z0-9-]+$/.test(value)) ||
    '半角英数字とハイフンのみ使用できます。',
});

const headers = [
  { title: '院内管理ID', sortable: true, key: 'equipmentId' },
  { title: '機器種別', sortable: true, key: 'equipmentType' },
  { title: 'メーカー', sortable: true, key: 'equipmentManufacturer' },
  { title: '機器名称', sortable: true, key: 'equipmentName' },
  { title: '型番', sortable: true, key: 'equipmentModel' },
  { title: 'シリアル番号', sortable: true, key: 'equipmentSerialNumber' },
  { title: '購入日', key: 'acquisitionDate' },
];

// //フィルター機能
const filterCriteriaDialog = ref(false);
const filterCriteria = reactive<EquipmentFilterCriteria>({
  equipmentId: '',
  equipmentType: '',
  equipmentManufacturer: '',
  equipmentName: '',
  equipmentModel: '',
  equipmentSerialNumber: '',
  equipmentStatus: 'active',
  equipmentMaintenanceContract: '',
});

//機器IDのオートコンプリート
const equipmentIdItems = ref<string[]>([]);
const fetchEquipmentIdItems = async () => {
  loading.value = true;
  try {
    const response = await $fetch<string[]>('/api/v2/equipment/id', {
      method: 'GET',
    });
    equipmentIdItems.value = response;
  } catch (error) {
    alertMessage.value = getApiErrorMessage(
      error,
      '機器IDの取得中にエラーが発生しました。',
    );
    alertType.value = 'error';
    showAlert.value = true;
    console.error('[equipment-id]Load error:', error);
  } finally {
    loading.value = false;
  }
};

//機器種別の取得
const equipmentTypeItems = ref<string[]>([]);
const fetchEquipmentTypes = async () => {
  loading.value = true;
  try {
    const response = await $fetch<{ equipmentType: string }[]>(
      '/api/v2/equipment/types',
      { method: 'GET' },
    );
    equipmentTypeItems.value = response.map((item) => item.equipmentType);
  } catch (error) {
    alertMessage.value = getApiErrorMessage(
      error,
      '機器種別の取得中にエラーが発生しました。',
    );
    alertType.value = 'error';
    showAlert.value = true;
    console.error('[equipment-types]Load error:', error);
  } finally {
    loading.value = false;
  }
};

//メーカーの取得
const equipmentManufacturerItems = ref<string[]>([]);
const fetchEquipmentManufacture = async () => {
  loading.value = true;
  try {
    const response = await $fetch<{ equipmentManufacturer: string }[]>(
      '/api/v2/equipment/manufacturer',
      { method: 'GET' },
    );
    equipmentManufacturerItems.value = response.map(
      (item) => item.equipmentManufacturer,
    );
  } catch (error) {
    alertMessage.value = getApiErrorMessage(
      error,
      'メーカーの取得中にエラーが発生しました。',
    );
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
  filterCriteria.equipmentId = detectedCodes[0].rawValue;
  scanEquipmentDialog.value = false;
};

//フィルター実行
const applyFilter = () => {
  filterCriteriaDialog.value = false;
  loadItems(1, 10, sortBy.value, filterCriteria);
};
const clearFilter = () => {
  for (let key in filterCriteria) {
    if (Object.hasOwn(filterCriteria, key)) {
      filterCriteria[key as keyof EquipmentFilterCriteria] = undefined;
    }
  }
};

const equipmentLedgerItems = ref<EquipmentLedgerItem[]>([]);
const totalItems = ref(0);
const sortBy = ref<SortOption[]>([{ key: 'equipmentId', order: 'asc' }]);
const loadItems = async (
  page: number = 1,
  itemsPerPage: number = 10,
  sortBy: SortOption[] = [],
  filterCriteria: EquipmentFilterCriteria = {},
) => {
  loading.value = true;
  try {
    const { sortKey, sortOrder } = getSortOptions(sortBy);
    const response = await $fetch<{
      items: EquipmentLedgerItem[];
      total: number;
    }>('/api/v2/equipment/ledger', {
      method: 'POST',
      body: {
        page,
        itemsPerPage,
        sortRow: sortKey,
        sortOrder,
        filterCriteria: filterCriteria,
      },
    });
    equipmentLedgerItems.value = response.items;
    totalItems.value = response.total;
  } catch (error) {
    alertMessage.value = getApiErrorMessage(
      error,
      'データ取得中にエラーが発生しました。',
    );
    alertType.value = 'error';
    showAlert.value = true;
    console.error('[equipment-ledger]Load error:', error);
  } finally {
    loading.value = false;
  }
};

const getSortOptions = (sortBy: SortOption[]) => {
  const sortKey = sortBy.length ? sortBy[0].key : 'equipmentId';
  const sortOrder = sortBy.length ? sortBy[0].order : 'asc';
  return { sortKey, sortOrder };
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
    await $fetch('/api/v2/equipment/update', {
      method: 'PUT',
      body: { updatedItem },
    });
    loadItems();
    isActive.value = false;
    alertMessage.value = 'データが正常に保存されました。';
    alertType.value = 'success';
    showAlert.value = true;
  } catch (error) {
    alertMessage.value = getApiErrorMessage(
      error,
      '変更に問題が発生しました。データは保存されていません。内容を確認した上で再度「保存」してください。',
    );
    alertType.value = 'error';
    showAlert.value = true;
    console.error(
      '[update-record]Update error for equipmentId: ' + item.equipmentId,
      error,
    );
  }
};

const newItem = ref<NewEquipmentPayload>({
  equipmentId: '',
  equipmentType: '',
  equipmentManufacturer: '',
  equipmentName: '',
  equipmentModel: '',
  equipmentSerialNumber: '',
  equipmentStorageLocation: '',
  equipmentStatus: 'active',
  equipmentMaintenanceContract: '',
  acquisitionDate: null,
  equipmentNotes: '',
});
const resetForm = () => {
  newItem.value = {
    equipmentId: '',
    equipmentType: '',
    equipmentManufacturer: '',
    equipmentName: '',
    equipmentModel: '',
    equipmentSerialNumber: '',
    equipmentStorageLocation: '',
    equipmentStatus: 'active',
    equipmentMaintenanceContract: '',
    acquisitionDate: null,
    equipmentNotes: '',
  };
};
const newAddRecord = async (newItem: NewEquipmentPayload) => {
  try {
    await $fetch('/api/v2/equipment/add', {
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
    alertMessage.value = getApiErrorMessage(
      error,
      '機器の新規登録に問題が発生しました。内容を確認した上で再度「保存」してください。',
    );
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
