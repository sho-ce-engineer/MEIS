<template>
  <div>
    <v-card class="my-5">
      <v-card-title class="d-flex align-center">
        <h2 class="text-h6"><v-icon>mdi-history</v-icon> 点検履歴</h2>
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
          :class="[
            'mr-4',
            { 'btn-active': inspectionTypeFilter === '日常点検' },
          ]"
          @click="setInspectionTypeFilter('日常点検')"
        >
          日常点検
        </v-btn>
        <v-btn
          :class="{ 'btn-active': inspectionTypeFilter === '定期点検' }"
          @click="setInspectionTypeFilter('定期点検')"
        >
          定期点検
        </v-btn>
      </v-card-title>
      <v-data-table-server
        :headers="headers"
        :items="filteredInspectionHistoryItems"
        :items-length="totalItems"
        item-key="inspection_id"
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
            <template
              v-slot:activator="{ props: InspectionResultDetailActivaterProps }"
            >
              <tr
                v-bind="InspectionResultDetailActivaterProps"
                class="clickable-table-row"
                @click="
                  generateInspectionResultsDetailes(item.inspection_results)
                "
              >
                <td>{{ item.inspection_date }}</td>
                <td>{{ item.inspection_type }}</td>
                <td>{{ item.user_name }}</td>
                <td>{{ item.equipment_id }}</td>
                <td>{{ item.equipment_name }}</td>
                <td>{{ item.equipment_model }}</td>
                <td class="text-center">
                  <v-icon
                    v-if="hasInspectionStatusIcon(item.inspection_results)"
                    color="warning"
                  >
                    mdi-progress-alert
                  </v-icon>
                  <v-icon v-else color="success">
                    mdi-checkbox-marked-circle-outline
                  </v-icon>
                </td>
              </tr></template
            >
            <template v-slot:default="{ isActive }">
              <v-card
                prepend-icon="mdi-history"
                title="点検履歴　詳細"
                width="80vw"
                :loading="loading"
              >
                <v-divider></v-divider>
                <v-card-text>
                  <div class="inspection_detail_info">
                    <h3>基本データ</h3>
                    <v-row>
                      <v-col cols="12" md="6">
                        <h4>点検日</h4>
                        <p>{{ item.inspection_date }}</p>
                      </v-col>
                      <v-col cols="12" md="6">
                        <h4>点検者</h4>
                        <p>{{ item.user_name }}</p>
                      </v-col>
                      <v-col cols="12" md="6">
                        <h4>機器名称</h4>
                        <p>{{ item.equipment_name }}</p>
                      </v-col>
                      <v-col cols="12" md="6">
                        <h4>型番</h4>
                        <p>{{ item.equipment_model }}</p>
                      </v-col>
                      <v-col cols="12" md="6">
                        <h4>院内ID</h4>
                        <p>{{ item.equipment_id }}</p>
                      </v-col>
                      <v-col cols="12" md="6">
                        <h4>シリアルナンバー</h4>
                        <p>{{ item.equipment_serial_number }}</p>
                      </v-col>
                    </v-row>
                  </div>
                  <v-divider></v-divider>
                  <div v-for="category in categoryOrder" :key="category">
                    <!-- 現在のカテゴリに該当するinspection_itemを抽出 -->
                    <v-card
                      v-if="filteredResultsByCategory(category).length"
                      class="my-4"
                    >
                      <v-card-title class="bg-blue-grey-lighten-5">{{
                        category
                      }}</v-card-title>
                      <v-card-text class="pa-0">
                        <v-expansion-panels>
                          <v-expansion-panel
                            v-for="item in filteredResultsByCategory(category)"
                            :key="item.inspection_item_id"
                          >
                            <v-expansion-panel-title>
                              <v-icon
                                v-if="getResultIcon(item.result.result)"
                                color="success"
                                class="mr-4"
                              >
                                mdi-checkbox-marked-circle-outline
                              </v-icon>
                              <v-icon v-else color="warning" class="mr-4">
                                mdi-progress-alert
                              </v-icon>
                              {{ item.inspection_item }}
                            </v-expansion-panel-title>
                            <v-expansion-panel-text>
                              <p>
                                <span class="font-weight-bold">点検結果：</span
                                >{{ item.result.result }}
                                <span v-if="item.suffix">{{
                                  item.suffix
                                }}</span>
                              </p>
                              <p>
                                <span class="font-weight-bold">備考：</span
                                >{{ item.result.notes }}
                              </p>
                            </v-expansion-panel-text>
                          </v-expansion-panel>
                        </v-expansion-panels></v-card-text
                      >
                    </v-card>
                  </div>
                </v-card-text>
                <v-divider></v-divider>
                <v-card-actions>
                  <v-btn
                    text="削除する"
                    append-icon="mdi-delete-empty-outline"
                    @click="historyDeleteDialog = true"
                    variant="plain"
                    color="red-darken-3"
                  ></v-btn>
                  <v-spacer></v-spacer>
                  <v-btn
                    text="閉じる"
                    @click="isActive.value = false"
                    color="primary"
                  ></v-btn>
                </v-card-actions>
                <v-dialog v-model="historyDeleteDialog" width="auto" scrollable>
                  <v-card
                    title="削除確認"
                    prepend-icon="mdi-information-outline"
                  >
                    <v-divider></v-divider>
                    <v-card-text
                      ><p class="mb-2">
                        「削除する」を押すと直ちに削除処理が行われます。
                      </p>
                      <p class="my-4 font-weight-bold text-red-darken-3">
                        削除処理が行われたデータは、復元できません。
                      </p>
                      <p>
                        本当に削除処理を行なってもよろしいですか？
                      </p></v-card-text
                    >
                    <v-divider></v-divider>
                    <v-card-actions>
                      <v-btn
                        color="red-darken-3"
                        append-icon="mdi-delete-empty-outline"
                        @click="
                          {
                            (historyDelete(item.inspection_results),
                              (isActive.value = false));
                          }
                        "
                        variant="plain"
                        :loading="loading"
                        :disabled="disabled"
                      >
                        削除する
                      </v-btn>
                      <v-spacer></v-spacer>
                      <v-btn
                        text="戻る"
                        @click="historyDeleteDialog = false"
                        color="primary"
                        variant="flat"
                      ></v-btn>
                    </v-card-actions>
                  </v-card>
                </v-dialog>
              </v-card> </template
          ></v-dialog>
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
interface InspectionResult {
  result_id: string;
  result: string;
  notes: string;
}

interface InspectionHistoryItem {
  equipment_id: string;
  equipment_serial_number: string;
  equipment_name: string;
  equipment_model: string;
  equipment_manufacturer: string;
  inspection_date: string;
  user_name: string;
  inspection_type: string;
  inspection_results: Record<string, InspectionResult>;
}

interface InspectionFilterCriteria {
  equipment_id?: string;
  equipment_type?: string;
  equipment_name?: string;
  equipment_model?: string;
  equipment_serial_number?: string;
}

interface SortOption {
  key: string;
  order: 'asc' | 'desc';
}

interface InspectionResultDetail {
  inspection_item: string;
  inspection_item_id: string;
  inspection_item_description: string;
  inspection_item_category: string;
  inspection_sort_number: number;
  suffix: string;
  result: {
    result: string;
    notes: string;
  };
}

//ユーザーデータ
const { data } = useAuth();
const sessionData = computed(() => data.value as SessionData | null);
const facility_code = computed(() => sessionData.value?.facility_code);

//アラート
const alertMessage = ref('');
const alertType = ref<'success' | 'info' | 'warning' | 'error'>('info');
const showAlert = ref(false);
const updateShowAlert = (value: boolean) => {
  showAlert.value = value;
};

const headers = [
  { title: '点検日', key: 'inspection_date', sortable: true },
  { title: '点検区分', key: 'inspection_type', sortable: true },
  { title: '点検者', key: 'user_id', sortable: true },
  { title: '機器ID', key: 'equipment_id', sortable: true },
  { title: '機器名称', key: 'equipment_name', sortable: true },
  { title: '機器型番', key: 'equipment_model', sortable: true },
  {
    title: '点検ステータス',
    key: 'inspection_status',
    sortable: false,
    align: 'center' as const,
  },
];

//機器種別の取得
const select_equiment_type_items = ref<string[]>([]);
const fetchEquipmentTypes = async () => {
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
      '機器種類の取得中にエラーが発生しました。';
    alertType.value = 'error';
    showAlert.value = true;
    console.error('[equipment-types]Load error:', error);
  }
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

//バーコードリーダー機能
//機能変更予定
import { QrcodeStream } from 'vue-qrcode-reader';
const scanEquipmentDialog = ref(false);
const onDetect = (detectedCodes: any[]) => {
  filterCriteria.equipment_id = detectedCodes[0].rawValue;
  scanEquipmentDialog.value = false;
};

//フィルター機能
const filterCriteriaDialog = ref(false);
const filterCriteria = reactive<InspectionFilterCriteria>({
  equipment_id: '',
  equipment_type: '',
  equipment_name: '',
  equipment_model: '',
});

//フィルター実行
const applyFilter = () => {
  filterCriteriaDialog.value = false;
  loadItems(1, 10, sortBy.value, inspectionTypeFilter.value, filterCriteria);
};

const clearFilter = () => {
  for (let key in filterCriteria) {
    if (filterCriteria.hasOwnProperty(key)) {
      filterCriteria[key as keyof InspectionFilterCriteria] = undefined;
    }
  }
};

const inspectionHistoryItems = ref<InspectionHistoryItem[]>([]);
const loading = ref(true);
const disabled = ref(false);
const totalItems = ref(0);
const sortBy = ref<SortOption[]>([{ key: 'inspection_date', order: 'desc' }]);
const loadItems = async (
  page = 1,
  itemsPerPage = 10,
  sortBy: SortOption[] = [],
  inspectionType = inspectionTypeFilter.value,
  filterCriteria: InspectionFilterCriteria = {},
) => {
  loading.value = true;
  try {
    const { sortKey, sortByOrder } = getSortOptions(sortBy);
    const response = await $fetch<{
      items: InspectionHistoryItem[];
      total: number;
    }>('/api/inspection/inspection-history', {
      method: 'POST',
      body: {
        page,
        itemsPerPage,
        sortRow: sortKey,
        sortByOrder,
        inspectionType,
        filterCriteria: filterCriteria,
      },
    });
    inspectionHistoryItems.value = response.items;
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
  const sortKey = sortBy.length ? sortBy[0].key : 'inspection_date';
  const sortOrder = sortBy.length ? sortBy[0].order : 'desc';
  return { sortKey, sortByOrder: sortOrder };
};

const handleUpdateOptions = (options: {
  page: number;
  itemsPerPage: number;
  sortBy: SortOption[];
}) => {
  if (!import.meta.client) return;
  const { page, itemsPerPage, sortBy } = options;
  loadItems(
    page,
    itemsPerPage,
    sortBy,
    inspectionTypeFilter.value,
    filterCriteria,
  );
};

// フィルタ設定メソッド
const inspectionTypeFilter = ref('');
const setInspectionTypeFilter = (type: string) => {
  inspectionTypeFilter.value = type;
  loadItems(1, 10, sortBy.value, inspectionTypeFilter.value, filterCriteria);
};

// inspectionTypeFilterが設定されている場合、その条件に一致する項目のみを返す
const filteredInspectionHistoryItems = computed(() => {
  if (inspectionTypeFilter.value) {
    return inspectionHistoryItems.value.filter(
      (item) => item.inspection_type === inspectionTypeFilter.value,
    );
  }
  return inspectionHistoryItems.value;
});

// 点検タイプフィルタクリアメソッド
const clearInspectionTypeFilter = () => {
  inspectionTypeFilter.value = '';
};

//ステータスアイコン切り替え
const hasInspectionStatusIcon = (
  inspectionResults: Record<string, InspectionResult>,
) => {
  return Object.values(inspectionResults).some(
    (item) => item.result === 'false' || item.result === 'NG',
  );
};

// inspection_itemの詳細を取得
const fetchInspectionItemDetails = async (inspectionItemIds: string[]) => {
  loading.value = true;
  try {
    const response = await $fetch('/api/inspection/inspection-item-details', {
      method: 'POST',
      body: {
        inspectionItemIds: Array.isArray(inspectionItemIds)
          ? inspectionItemIds
          : [],
      },
    });
    return response;
  } catch (error) {
    console.error(
      '[inspection-item-details] Error occurred while fetching inspection item details:',
      error,
    );
    alertMessage.value =
      (error as any).data?.data?.message ||
      '点検項目の詳細情報の取得に失敗しました。';
    alertType.value = 'error';
    showAlert.value = true;
  } finally {
    loading.value = false;
  }
};

//点検内容と点検結果を紐付けオブジェクト化
const inspectionResultsDetailes = ref<Record<string, InspectionResultDetail>>(
  {},
);
const generateInspectionResultsDetailes = async (
  inspection_results: Record<string, InspectionResult>,
) => {
  loading.value = true;
  try {
    const inspectionItemIds = Object.keys(inspection_results);

    // inspection_itemの詳細情報を取得
    const inspectionItemsDetails =
      await fetchInspectionItemDetails(inspectionItemIds);
    if (!inspectionItemsDetails) return;

    // オブジェクトの作成。元のInspectionResultsDataの値を追加
    inspectionResultsDetailes.value = inspectionItemsDetails.reduce(
      (acc, item) => {
        const {
          inspection_item_id,
          inspection_item,
          inspection_item_description,
          inspection_item_category,
          inspection_sort_number,
          suffix,
        } = item;

        acc[inspection_item_id] = {
          inspection_item,
          inspection_item_description,
          inspection_item_category,
          inspection_sort_number,
          suffix,
          result: inspection_results[inspection_item_id],
        };
        return acc;
      },
      {},
    );
    return inspectionResultsDetailes;
  } catch (error) {
    alertMessage.value =
      (error as any).data?.data?.message ||
      '新しいオブジェクトの生成に失敗しました';
    alertType.value = 'error';
    showAlert.value = true;
    console.error('[generateInspectionResultsDetailes()]Load error:', error);
  } finally {
    loading.value = false;
  }
};

//点検結果の詳細
const categoryOrder = ['外装点検', '機能点検', '実測点検', '警報点検'];
const filteredResultsByCategory = (category: string) => {
  return Object.values(inspectionResultsDetailes.value)
    .filter((item) => item.inspection_item_category === category)
    .sort((a, b) => a.inspection_sort_number - b.inspection_sort_number); // inspection_sort_numberで並べ替え
};

// 結果に応じて色を設定する関数
const getResultIcon = (result: string) => {
  const numericResult = Number(result);
  switch (true) {
    case result === 'OK':
      return true;
    case result === 'NG':
      return false;
    case !isNaN(numericResult):
      return true;
    case !isNaN(new Date(result).getTime()):
      return true;
    default:
      return false;
  }
};

const historyDeleteDialog = ref(false);
const resultIdList = ref<string[]>([]);
const historyDelete = async (resultIds: Record<string, InspectionResult>) => {
  resultIdList.value = Object.values(resultIds).map((item) => item.result_id);
  loading.value = true;
  disabled.value = true;
  try {
    await $fetch('/api/inspection/inspection-results-delete', {
      method: 'POST',
      body: {
        result_ids: resultIdList.value,
      },
    });
    alertMessage.value = '１件の点検結果を削除しました。';
    alertType.value = 'success';
    showAlert.value = true;
  } catch (error) {
    console.error('[inspection-results-delete]:Try Error', error);
    alertMessage.value =
      (error as any).data?.data?.message ||
      '点検結果の削除中にエラーが発生しました。';
    alertType.value = 'error';
    showAlert.value = true;
  } finally {
    loading.value = false;
    disabled.value = false;
    historyDeleteDialog.value = false;
    loadItems();
  }
};
</script>

<style scoped>
.clickable-table-row {
  cursor: pointer;
}
.btn-active {
  background-color: rgb(var(--v-theme-primary));
  color: white;
}
</style>
