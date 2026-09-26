<template>
  <div>
    <v-card>
      <v-card-title class="d-flex">
        <h2 class="text-h6">
          <v-icon>mdi-chat-alert-outline</v-icon>トラブル対応報告
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
                <v-date-input
                  label="対応日"
                  v-model="reportedDate"
                  :rules="[rules.required]"
                  @update:modelValue="sortbyReportedDate(reportedDate)"
                  variant="underlined"
                ></v-date-input>
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
                        @detect="onDetectFilterEquipmentId"
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
                <v-text-field
                  label="発生場所"
                  variant="underlined"
                  v-model="filterCriteria.location"
                  prepend-icon="mdi-map-marker-radius-outline"
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
          color="primary"
          text="新規報告"
          prepend-icon="mdi-plus"
          @click="
            {
              ((issuesReportDialog = true), fetchEquipmentIdItems());
            }
          "
        >
        </v-btn>
        <v-dialog v-model="issuesReportDialog">
          <v-card title="新規トラブル対応報告" prepend-icon="mdi-plus">
            <v-divider></v-divider>
            <v-card-text>
              <v-form>
                <v-date-input
                  label="対応日"
                  v-model="initialDate"
                  :rules="[rules.required]"
                  @update:modelValue="selectReportedDate(initialDate)"
                ></v-date-input>
                <v-text-field
                  label="対応者"
                  disabled
                  v-model="userName"
                  :rules="[rules.required]"
                  prepend-icon="mdi-human-greeting-variant"
                ></v-text-field>
                <v-autocomplete
                  label="院内機器ID"
                  v-model="newReport.equipmentId"
                  :rules="[rules.required]"
                  prepend-icon="mdi-barcode-scan"
                  @change=""
                  @click:prepend="dialog = true"
                  :error="error"
                  :items="equipmentIdItems"
                  :loading="loading"
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
                      {{ newReport.equipmentId }}
                      <QrcodeStream
                        @detect="onDetect"
                        :formats="['qr_code', 'linear_codes']"
                      />
                    </v-card-text>
                    <v-divider></v-divider>
                    <v-card-actions
                      ><v-btn
                        @click="dialog = false"
                        variant="plain"
                        color="grey-darken-4"
                        >戻る</v-btn
                      ><v-spacer></v-spacer
                      ><v-btn
                        @click="dialog = false"
                        variant="tonal"
                        color="info"
                        >決定</v-btn
                      ></v-card-actions
                    >
                  </v-card>
                </v-dialog>
                <v-text-field
                  label="発生場所"
                  v-model="newReport.location"
                  prepend-icon="mdi-map-marker-radius-outline"
                  :rules="[rules.required]"
                  :error="error"
                ></v-text-field>
                <v-textarea
                  label="不具合トラブル内容"
                  v-model="newReport.description"
                  prepend-icon="mdi-pencil-plus"
                  :rules="[rules.required]"
                  :error="error"
                ></v-textarea>
              </v-form>
            </v-card-text>
            <v-divider></v-divider>
            <v-card-actions>
              <v-btn
                text="閉じる"
                @click="issuesReportDialog = false"
                color="grey-darken-4"
                variant="plain"
              ></v-btn>
              <v-spacer></v-spacer>
              <v-btn
                text="保存する"
                append-icon="mdi-checkbox-marked-circle-plus-outline"
                variant="flat"
                @click="checkIssuesReportRules()"
                color="primary"
              ></v-btn
              ><v-dialog v-model="confirmationDialog">
                <v-card title="保存確認" prepend-icon="mdi-information-outline">
                  <v-divider></v-divider>
                  <v-card-text
                    ><p class="mb-2">
                      「保存する」を押すと直ちに保存処理が行われます。
                    </p>
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
                      @click="saveIssueReport()"
                    >
                      保存する
                    </v-btn></v-card-actions
                  >
                </v-card>
              </v-dialog></v-card-actions
            >
          </v-card>
        </v-dialog>
      </v-card-title>
      <v-divider></v-divider>
      <v-data-table-server
        :headers="headers"
        :items="issueItems"
        :items-length="totalItems"
        item-value="issueId"
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
            <template v-slot:activator="{ props: IssueEditActivaterProps }">
              <tr
                v-bind="IssueEditActivaterProps"
                class="clickable-table-row"
                @click="fetchEquipmentDetail(item.equipmentId)"
              >
                <td>{{ item.reportedDate }}</td>
                <td>{{ item.reporter }}</td>
                <td>{{ item.equipmentId }}</td>
                <td>{{ item.location }}</td>
                <td>{{ item.description }}</td>
              </tr></template
            >
            <template v-slot:default="{ isActive }">
              <v-card
                prepend-icon="mdi-clipboard-pulse-outline"
                title="トラブル報告詳細"
                :loading="loading"
              >
                <v-divider></v-divider>
                <v-card-text>
                  <div
                    class="inspection_detail_info"
                    style="min-width: 70vw"
                    v-if="equipmentDetail"
                  >
                    <h3>基本データ</h3>
                    <v-row>
                      <v-col cols="12" md="6">
                        <h4>対応日</h4>
                        <p>{{ item.reportedDate }}</p>
                      </v-col>
                      <v-col cols="12" md="6">
                        <h4>発生場所</h4>
                        <p>{{ item.location }}</p>
                      </v-col>
                      <v-col cols="12" md="6">
                        <h4>対応者</h4>
                        <p>{{ item.reporter }}</p>
                      </v-col>
                    </v-row>
                    <v-divider class="my-4"></v-divider>
                    <h3>機器情報</h3>
                    <v-row>
                      <v-col cols="12" md="6">
                        <h4>機器種別</h4>
                        <p>{{ equipmentDetail.equipmentType }}</p>
                      </v-col>
                      <v-col cols="12" md="6">
                        <h4>機器名称</h4>
                        <p>{{ equipmentDetail.equipmentName }}</p>
                      </v-col>
                      <v-col cols="12" md="6">
                        <h4>型番</h4>
                        <p>{{ equipmentDetail.equipmentModel }}</p>
                      </v-col>
                      <v-col cols="12" md="6">
                        <h4>院内機器ID</h4>
                        <p>{{ item.equipmentId }}</p>
                      </v-col>
                      <v-col cols="12" md="6">
                        <h4>シリアルナンバー</h4>
                        <p>{{ equipmentDetail.equipmentSerialNumber }}</p>
                      </v-col></v-row
                    >
                    <v-divider class="my-4"></v-divider>
                    <v-row>
                      <v-col cols="12" md="6">
                        <h4>不具合内容</h4>
                        <p>{{ item.description }}</p>
                      </v-col></v-row
                    >
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
                    variant="flat"
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
                            (historyDelete(item.issueId),
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
              </v-card>
            </template>
          </v-dialog>
        </template>
      </v-data-table-server>
      <v-divider></v-divider>
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
interface IssueItem {
  issueId: string;
  reportedDate: string;
  reporter: string;
  equipmentId: string;
  location: string;
  description: string;
}

interface IssuesFilterCriteria {
  reportedDate?: string;
  equipmentId?: string;
  location?: string;
}

interface SortOption {
  key: string;
  order: 'asc' | 'desc';
}

interface EquipmentDetails {
  equipmentName: string;
  equipmentModel: string;
  equipmentSerialNumber: string;
  equipmentType: string;
}

interface NewIssueItem {
  reportedDate: Date | string; //ToDo:タイムゾーン問題
  reporter?: string;
  equipmentId: string;
  location: string;
  description: string;
}

const loading = ref(true);
//ユーザーデータ
const { data } = useAuth();
const sessionData = computed(() => data.value as SessionData | null);
const userName = computed(() => sessionData.value?.name);

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
  { title: '対応日', sortable: true, key: 'reportedDate' },
  { title: '対応者', sortable: true, key: 'reporter' },
  { title: '院内機器ID', sortable: true, key: 'equipmentId' },
  { title: '発生場所', sortable: true, key: 'location' },
  { title: '不具合内容', sortable: true, key: 'description' },
];

// //フィルター機能
const filterCriteriaDialog = ref(false);
const initialDate = shallowRef(new Date());
const reportedDate = shallowRef<Date | undefined>(undefined);
const filterCriteria = reactive<IssuesFilterCriteria>({
  equipmentId: '',
  location: '',
  reportedDate: undefined,
});

const sortbyReportedDate = (date: Date | undefined) => {
  // JSTの日付でフィルタするため、ブラウザのローカル日付(yyyy-MM-dd)を送る
  filterCriteria.reportedDate = date ? format(date, 'yyyy-MM-dd') : '';
};

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

//機器の詳細データの取得
const equipmentDetail = ref<EquipmentDetails | null>(null);
const fetchEquipmentDetail = async (equipmentId: string) => {
  loading.value = true;
  try {
    const response = await $fetch<EquipmentDetails>(
      '/api/v2/equipment/details',
      {
        method: 'POST',
        body: {
          equipmentId: equipmentId,
        },
      },
    );
    equipmentDetail.value = response;
  } catch (error) {
    alertMessage.value = getApiErrorMessage(
      error,
      '機器の詳細データの取得中にエラーが発生しました。',
    );
    alertType.value = 'error';
    showAlert.value = true;
    console.error('[equipment-details] DB Error:', error);
  } finally {
    loading.value = false;
  }
};

import { format } from 'date-fns';
//バーコードリーダー機能
//今後機能変更予定
import { QrcodeStream } from 'vue-qrcode-reader';

const dialog = ref(false);
const onDetect = (detectedCodes: any) => {
  newReport.value.equipmentId = detectedCodes[0].rawValue;
  dialog.value = false;
};

const scanEquipmentDialog = ref(false);
const onDetectFilterEquipmentId = (detectedCodes: any) => {
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
      filterCriteria[key as keyof IssuesFilterCriteria] = undefined;
    }
  }
  reportedDate.value = undefined;
};

const issueItems = ref<IssueItem[]>([]);
const totalItems = ref(0);
const sortBy = ref<SortOption[]>([{ key: 'reportedDate', order: 'desc' }]);
const loadItems = async (
  page: number = 1,
  itemsPerPage: number = 10,
  sortBy: SortOption[] = [],
  filterCriteria: IssuesFilterCriteria = {},
) => {
  loading.value = true;
  const { sortKey, sortOrder } = getSortOptions(sortBy);
  try {
    const response = await $fetch<{ items: IssueItem[]; total: number }>(
      '/api/v2/issues/list',
      {
        method: 'POST',
        body: {
          page,
          itemsPerPage,
          sortRow: sortKey,
          sortOrder,
          filterCriteria: filterCriteria,
        },
      },
    );
    issueItems.value = response.items;
    totalItems.value = response.total;
  } catch (error) {
    alertMessage.value = getApiErrorMessage(
      error,
      'データ取得中にエラーが発生しました。',
    );
    alertType.value = 'error';
    showAlert.value = true;
    console.error('[issues-list]Load error:', error);
  } finally {
    loading.value = false;
  }
};

const getSortOptions = (sortBy: SortOption[]) => {
  const sortKey = sortBy.length ? sortBy[0].key : 'reportedDate';
  const sortOrder = sortBy.length ? sortBy[0].order : 'desc';
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

//新規報告ダイアログ
const issuesReportDialog = ref(false);
const selectReportedDate = (date: Date | undefined) => {
  newReport.value.reportedDate = date ? date.toISOString() : '';
};

const newReport = ref<NewIssueItem>({
  reportedDate: initialDate.value,
  reporter: userName.value,
  equipmentId: '',
  location: '',
  description: '',
});

const resetForm = () => {
  newReport.value = {
    reportedDate: initialDate.value,
    reporter: userName.value,
    equipmentId: '',
    location: '',
    description: '',
  };
};

//未入力バリデーション
const confirmationDialog = ref(false);
const error = ref(false);
const checkIssuesReportRules = () => {
  if (
    !newReport.value.reportedDate ||
    !newReport.value.reporter ||
    !newReport.value.location ||
    !newReport.value.description ||
    !newReport.value.equipmentId
  ) {
    alertMessage.value = '空の入力必須項目があります。';
    alertType.value = 'error';
    showAlert.value = true;
    error.value = true;
    return;
  } else {
    confirmationDialog.value = true;
    error.value = false;
  }
};

//新規報告
const saveIssueReport = async () => {
  try {
    await $fetch('/api/v2/issues', {
      method: 'POST',
      body: newReport.value,
    });
    loadItems();
    issuesReportDialog.value = false;
    confirmationDialog.value = false;
    resetForm();
    alertMessage.value = 'トラブル対応報告を保存しました。';
    alertType.value = 'success';
    showAlert.value = true;
  } catch (error) {
    alertMessage.value = getApiErrorMessage(
      error,
      'トラブル対応報告の保存中に問題が発生しました。内容を確認の上、再度確保存してください。',
    );
    alertType.value = 'error';
    showAlert.value = true;
    console.error('[issue-add]New add error:', error);
  }
};

//報告削除
const historyDeleteDialog = ref(false);
const disabled = ref(false);
const historyDelete = async (issueId: string) => {
  loading.value = true;
  disabled.value = true;
  try {
    await $fetch('/api/v2/issues', {
      method: 'DELETE',
      body: { issueId },
    });
    alertMessage.value = 'トラブル対応履歴の削除が成功しました。';
    alertType.value = 'success';
    showAlert.value = true;
  } catch (error) {
    alertMessage.value = getApiErrorMessage(
      error,
      'トラブル対応履歴の削除中に問題が発生しました。内容を確認した上で再度「保存」してください。',
    );
    alertType.value = 'error';
    showAlert.value = true;
    console.error('[issue-delete]Delete error:', error);
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
</style>
