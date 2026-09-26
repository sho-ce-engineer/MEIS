<template>
  <v-data-table-server
    :headers="headers"
    :items="notificationsItems"
    :items-length="totalItems"
    item-key="id"
    class="elevation-1"
    :loading="loading"
    :items-per-page="10"
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
          v-slot:activator="{ props: NotificationsDetaileActivaterProps }"
        >
          <tr
            v-bind="NotificationsDetaileActivaterProps"
            :class="['clickable-table-row', { 'viewed-item': item.isViewed }]"
            @click="markAsViewed(item.id)"
          >
            <td width="10%">{{ item.createdAt }}</td>
            <td
              width="10%"
              :class="[
                getImportanceClass(item.importanceLevel),
                { 'viewed-item': item.isViewed },
              ]"
            >
              {{ item.importanceLevel }}
            </td>
            <td>{{ item.title }}</td>
          </tr></template
        >
        <template v-slot:default="{ isActive }">
          <v-card
            prepend-icon="mdi-bell"
            :title="item.title"
            width="65vw"
            :loading="loading"
          >
            <v-divider></v-divider>
            <v-card-text>
              <div class="text-medium-emphasis text-right">
                公開日：{{ item.createdAt }}
              </div>
              <div class="text-medium-emphasis text-right">
                重要度：<span
                  :class="getImportanceClass(item.importanceLevel)"
                  >{{ item.importanceLevel }}</span
                >
              </div>
              <div class="text-h5 text-center mb-5">
                {{ item.title }}
              </div>
              <p v-html="item.message"></p>
            </v-card-text>
            <v-divider></v-divider>
            <v-card-actions>
              <v-btn text="閉じる" @click="isActive.value = false"></v-btn>
            </v-card-actions>
          </v-card>
        </template>
      </v-dialog>
    </template>
  </v-data-table-server>
  <UiAlert
    :showAlert="showAlert"
    :alertMessage="alertMessage"
    :alertType="alertType"
    @update:showAlert="updateShowAlert"
  />
</template>
<script setup lang="ts">
interface Announcement {
  id: number;
  title: string;
  message: string;
  importanceLevel: string;
  isActive: boolean;
  createdAt: string;
  audience: string;
  isViewed: boolean;
  viewedAt: string | null;
}

interface AnnouncementsResponse {
  items: Announcement[];
  total: number;
}

interface SortOption {
  key: string;
  order: 'asc' | 'desc';
}
const emit = defineEmits<{
  'update:unreadCount': [value: number];
}>();
const loading = ref(false);

const notificationsItems = ref<Announcement[]>([]);
const totalItems = ref(0);
const unreadCount = ref(0);
const sortBy = ref<SortOption[]>([{ key: 'createdAt', order: 'desc' }]);

//Alert
const alertMessage = ref('');
const alertType = ref<'success' | 'info' | 'warning' | 'error'>('info');
const showAlert = ref(false);
const updateShowAlert = (value: boolean) => {
  showAlert.value = value;
};

// ヘッダー情報
const headers = [
  { title: '通知日', sortable: true, key: 'createdAt' },
  { title: '重要度', sortable: true, key: 'importanceLevel' },
  { title: 'タイトル', sortable: false, key: 'title' },
];

// データの取得
const loadItems = async (
  page: number = 1,
  itemsPerPage: number = 10,
  sortBy: SortOption[] = [],
) => {
  loading.value = true;
  try {
    const { sortKey, sortOrder } = getSortOptions(sortBy);
    const response = await $fetch<AnnouncementsResponse>(
      '/api/v2/notifications/announcements',
      {
        method: 'POST',
        body: {
          page,
          itemsPerPage,
          sortRow: sortKey,
          sortOrder,
        },
      },
    );
    notificationsItems.value = response.items;
    totalItems.value = response.total;
    unreadCount.value = notificationsItems.value.filter(
      (item) => !item.isViewed,
    ).length;
    emit('update:unreadCount', unreadCount.value);
  } catch (error) {
    alertMessage.value = getApiErrorMessage(
      error,
      '通知の取得に失敗しました。',
    );
    alertType.value = 'error';
    showAlert.value = true;
    console.error('[notifications]Error loading notifications:', error);
  } finally {
    loading.value = false;
  }
};

// ソートオプションの取得
const getSortOptions = (sortBy: SortOption[]) => {
  const sortKey = sortBy.length ? sortBy[0].key : 'createdAt';
  const sortOrder = sortBy.length ? sortBy[0].order : 'desc';
  return { sortKey, sortOrder };
};

// オプション変更時のハンドリング
const handleUpdateOptions = (options: {
  page: number;
  itemsPerPage: number;
  sortBy: SortOption[];
}) => {
  const { page, itemsPerPage, sortBy } = options;
  loadItems(page, itemsPerPage, sortBy);
};

//重要度に合わせたカラー変更
const getImportanceClass = (importanceLevel: string) => {
  switch (importanceLevel) {
    case 'low':
      return 'low-importance';
    case 'normal':
      return 'medium-importance';
    case 'high':
      return 'high-importance';
    default:
      return '';
  }
};

//既読処理
const markAsViewed = async (notificationId: number) => {
  try {
    await $fetch('/api/v2/notifications/already-read', {
      method: 'PATCH',
      body: {
        notificationId: notificationId,
        isViewed: true,
      },
    });
    const notification = notificationsItems.value.find(
      (item) => item.id === notificationId,
    );
    if (notification) {
      notification.isViewed = true;
      unreadCount.value = notificationsItems.value.filter(
        (item) => !item.isViewed,
      ).length;
      emit('update:unreadCount', unreadCount.value);
    }
  } catch (error) {
    alertMessage.value = getApiErrorMessage(
      error,
      '通知の既読処理に失敗しました。',
    );
    alertType.value = 'error';
    showAlert.value = true;
    console.error('[notifications]Error updating notification:', error);
  }
};
</script>

<style scoped>
.clickable-table-row {
  cursor: pointer;
}
/* Notificatiols重要度 */
.low-importance {
  color: #039be5;
}
.medium-importance {
  color: #039be5;
}
.high-importance {
  color: #e53935;
}
.viewed-item {
  color: gray !important;
}
</style>
