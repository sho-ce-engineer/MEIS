<template>
  <div>
    <h2><v-icon>mdi-human-greeting-variant</v-icon> メンバー管理</h2>
    <v-card class="my-5">
      <v-card-title class="d-flex">
        <p>メンバー一覧</p>
        <v-spacer></v-spacer>
        <v-btn
          color="primary"
          text="メンバー追加"
          prepend-icon="mdi-account-multiple-plus"
          @click="sendInviteDialog = true"
        >
        </v-btn>
        <v-dialog v-model="sendInviteDialog">
          <v-card
            prepend-icon="mdi-account-multiple-plus"
            title="メンバー追加"
            :loading="loading"
            class="mx-auto"
          >
            <form @submit.prevent="sendInvite()">
              <v-divider></v-divider>
              <v-card-text>
                <div class="text-medium-emphasis mb-4">
                  メンバーを追加して、機器管理業務を始めましょう。
                </div>
                <v-text-field
                  v-model="email_invite"
                  label="メールアドレス"
                  type="email"
                  :rules="[rules.required, rules.email]"
                  required
                  hint="招待するメンバーのメールアドレスを入力してください。"
                ></v-text-field>
                <v-text-field
                  v-model="confirmEmailInvite"
                  label="メールアドレス確認"
                  type="email"
                  :rules="[rules.required, rules.email, rules.matchEmail]"
                  required
                  hint="再度招待するメンバーのメールアドレスを入力してください。"
                ></v-text-field>
                <v-select
                  label="ユーザー権限"
                  :items="userRoleItems"
                  v-model="user_role"
                  required
                  hint="データの保全のため、通常は「general」を選択してください。"
                  persistent-hint
                ></v-select>
              </v-card-text>
              <v-divider></v-divider>
              <v-card-actions>
                <v-btn text="閉じる" @click="sendInviteDialog = false"></v-btn>
                <v-spacer></v-spacer>
                <v-btn
                  color="primary"
                  text="招待する"
                  type="submit"
                  variant="flat"
                ></v-btn>
              </v-card-actions>
            </form> </v-card
        ></v-dialog>
      </v-card-title>
      <v-data-table-server
        :headers="headers"
        :items="facilityMemberItems"
        :items-length="totalItems"
        item-key="user_name"
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
        <template #item.user_role="{ item }">
          <v-select
            v-model="item.user_role"
            @update:modelValue="updateUserRole(item.user_id, item.user_role)"
            :items="['admin', 'general']"
            dense
            hide-details
            variant="solo"
            density="compact"
            flat
          />
        </template>

        <template #item.actions="{ item }">
          <v-btn
            class="text-red-lighten-1"
            @click="openDeleteDialog(item.user_id, item.user_name)"
            variant="outlined"
            prepend-icon="mdi-account-minus"
          >
            削除する
          </v-btn>
        </template>
      </v-data-table-server>
    </v-card>

    <!-- 削除確認用ダイアログ -->
    <v-dialog v-model="userDeleteDialog" max-width="500">
      <v-card>
        <v-card-title><v-icon>mdi-account-minus</v-icon>削除確認</v-card-title>
        <v-divider></v-divider>
        <v-card-text
          >ユーザー {{ selectedUserName }} を削除してよろしいですか？
          <div class="text-caption mt-2">
            ※一度削除したユーザーは復帰できません。再度登録が必要になります。
          </div></v-card-text
        >
        <v-divider></v-divider>
        <v-card-actions>
          <v-btn color="red darken-1" variant="text" @click="deleteUser"
            >はい</v-btn
          >
          <v-spacer></v-spacer>
          <v-btn
            color="green darken-1"
            variant="outlined"
            @click="userDeleteDialog = false"
            >いいえ</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>
    <UiAlert
      :showAlert="showAlert"
      :alertMessage="alertMessage"
      :alertType="alertType"
      @update:showAlert="updateShowAlert"
    />
  </div>
</template>

<script setup lang="ts">
interface SortOption {
  key: string;
  order: 'asc' | 'desc';
}

interface FacilityMemberItem {
  user_id: string;
  user_name: string;
  user_role: string;
}

const loading = ref(true);

// ユーザーデータ
const { data } = useAuth();
const sessionData = computed(() => data.value as SessionData | null);
const user_id = computed(() => sessionData.value?.user_id);
const user_name = computed(() => sessionData.value?.name);
const facility_code = computed(() => sessionData.value?.facility_code);
const userRole = computed(() => sessionData.value?.role);

// Alert
const alertMessage = ref('');
const alertType = ref<'success' | 'info' | 'warning' | 'error'>('info');
const showAlert = ref(false);
const updateShowAlert = (value: boolean) => {
  showAlert.value = value;
};

//入力バリデーション
const rules = {
  required: (value: string) => !!value || '必須項目です',
  email: (value: string) =>
    /.+@.+\..+/.test(value) || '有効なメールアドレスを入力してください',
  matchEmail: (value: string) =>
    value === email_invite.value || 'メールアドレスが一致しません',
};

const headers = [
  { title: 'ユーザー名', sortable: true, key: 'user_name' },
  { title: '権限', sortable: true, key: 'user_role' },
  { title: '操作', key: 'actions', sortable: false },
];

// データの取得
const totalItems = ref(0);
const facilityMemberItems = ref<FacilityMemberItem[]>([]);
const loadItems = async (
  page: number = 1,
  itemsPerPage: number = 10,
  sortBy: SortOption[] = [],
) => {
  loading.value = true;
  try {
    const { sortKey, sortByOrder } = getSortOptions(sortBy);

    const response = await $fetch<{
      items: FacilityMemberItem[];
      total: number;
    }>('/api/settings/admin/members-list', {
      method: 'POST',
      body: {
        page,
        itemsPerPage,
        sortRow: sortKey,
        sortByOrder,
      },
    });

    facilityMemberItems.value = response.items;
    totalItems.value = response.total;
  } catch (error) {
    alertMessage.value =
      (error as any).data?.data?.message ||
      'データ取得中にエラーが発生しました。';
    alertType.value = 'error';
    showAlert.value = true;
    console.error('[members-list]Load error:', error);
  } finally {
    loading.value = false;
  }
};

// ソートオプションの取得
const sortBy = ref<SortOption[]>([{ key: 'user_name', order: 'asc' }]);
const getSortOptions = (sortBy: SortOption[]) => {
  const sortKey = sortBy.length ? sortBy[0].key : 'user_name';
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
  loadItems(page, itemsPerPage, sortBy);
};

// ユーザー権限を更新
const updateUserRole = async (userId: string, newRole: string) => {
  try {
    await $fetch(`/api/settings/admin/role-change`, {
      method: 'PUT',
      body: {
        new_user_role: newRole,
        target_user_id: userId,
      },
    });
    alertMessage.value = `対象ユーザーの権限が更新されました。`;
    alertType.value = 'success';
    showAlert.value = true;
  } catch (error) {
    alertMessage.value =
      (error as any).data?.data?.message ||
      'ユーザー権限の更新中にエラーが発生しました。';
    alertType.value = 'error';
    showAlert.value = true;
    console.error('[role-change]Load error:', error);
  }
};

// ユーザー削除
const userDeleteDialog = ref(false);
const selectedUserId = ref<string>('');
const selectedUserName = ref<string>('');
const openDeleteDialog = (userId: string, userName: string) => {
  selectedUserId.value = userId;
  selectedUserName.value = userName;
  userDeleteDialog.value = true;
};

// ユーザー削除
const deleteUser = async () => {
  if (!selectedUserId.value) {
    alertMessage.value = '削除対象のユーザーを選択してください。';
    alertType.value = 'error';
    showAlert.value = true;
    return;
  }
  try {
    await $fetch(`/api/settings/admin/user-delete`, {
      method: 'DELETE',
      body: {
        target_user_id: selectedUserId.value,
      },
    });
    alertMessage.value = `ユーザー ${selectedUserName.value} を削除しました。`;
    alertType.value = 'success';
    showAlert.value = true;
    loadItems();
  } catch (error) {
    alertMessage.value =
      (error as any).data?.data?.message ||
      'ユーザーの削除処理中にエラーが発生しました。';
    alertType.value = 'error';
    showAlert.value = true;
    console.error('[user-delete]Load error:', error);
  } finally {
    userDeleteDialog.value = false;
  }
};

//ユーザー招待
const email_invite = ref('');
const confirmEmailInvite = ref('');
const user_role = ref('general');
const userRoleItems = ['general', 'admin'];
const sendInviteDialog = ref(false);

const validateInviteForm = () => {
  if (!facility_code.value) {
    alertMessage.value =
      '施設コードが取得できませんでした。再度ログインし直してください。';
    return false;
  }
  if (!userRole.value) {
    alertMessage.value =
      '招待権限がありません。権限のあるユーザーのみ、招待が可能です。';
    return false;
  }
  return true;
};

const resetInviteForm = () => {
  email_invite.value = '';
  confirmEmailInvite.value = '';
  user_role.value = 'general';
};

const sendInvite = async () => {
  loading.value = true;

  if (!validateInviteForm()) {
    alertType.value = 'error';
    showAlert.value = true;
    loading.value = false;
    return;
  }

  try {
    await $fetch('/api/settings/admin/invite', {
      method: 'POST',
      body: {
        invited_by_user_id: user_id.value,
        invited_by_user_name: user_name.value,
        email: email_invite.value,
      },
    });
    alertMessage.value = `招待メールを送信しました！`;
    alertType.value = 'success';
    showAlert.value = true;
    sendInviteDialog.value = false;
    resetInviteForm();
  } catch (error) {
    alertMessage.value =
      (error as any).data?.data?.message ||
      '招待処理に問題が発生しました。内容を確認の上、再度実施してください。';
    alertType.value = 'error';
    showAlert.value = true;
    console.error('[invite]invite error:', error);
  } finally {
    loading.value = false;
  }
};
</script>
