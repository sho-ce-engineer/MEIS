<!-- DashBoard -->
<template>
  <div>
    <v-app>
      <v-navigation-drawer app v-model="drawer" mobile-breakpoint="md">
        <h1>
          <router-link to="/Dashboard">M.E.I.S</router-link>
        </h1>
        <!-- ドロワーのコンテンツ -->
        <v-list>
          <h2>機能</h2>
          <!-- 点検 -->
          <v-list-group>
            <template v-slot:activator="{ props }">
              <v-list-item
                v-bind="props"
                title="点検"
                prepend-icon="mdi-speedometer"
              >
              </v-list-item>
            </template>
            <v-list-item to="/inspection/AddInspection"> 日常点検 </v-list-item>
            <v-list-item to="/inspection/AddPeriodicInspection"
              >定期点検
            </v-list-item>
            <v-list-item disabled>メーカー点検 </v-list-item>
            <v-list-item to="/inspection/InspectionHistory"
              >点検履歴
            </v-list-item>
            <v-list-item disabled>不具合発生報告 </v-list-item>
            <v-list-item to="/inspection/InspectionMenuAdd"
              >点検内容作成</v-list-item
            >
          </v-list-group>
          <!-- 修理 -->
          <v-list-group>
            <template v-slot:activator="{ props }">
              <v-list-item
                v-bind="props"
                prepend-icon="mdi-tools"
                title="修理"
                disabled
              >
              </v-list-item>
            </template>
            <v-list-item> 修理履歴 </v-list-item>
          </v-list-group>
          <!-- トラブル報告 -->
          <v-list-item
            to="/issues/IssuesReport"
            prepend-icon="mdi-chat-alert-outline"
            title="トラブル報告"
          >
          </v-list-item>
          <!-- 機器台帳リスト-->
          <v-list-item
            to="/equipment/EquipmentLedger"
            prepend-icon="mdi-clipboard-pulse-outline"
            title="医療機器台帳"
          ></v-list-item>
          <!-- 追加機能 -->
          <h2>Asset</h2>
          <v-list-group>
            <template v-slot:activator="{ props }">
              <v-list-item
                v-bind="props"
                prepend-icon="mdi-home-export-outline"
                title="貸出返却管理"
              >
              </v-list-item>
            </template>
            <v-list-item to="/EquipmentLoans" @click="setLendingCookie()">
              システムページ
            </v-list-item>
            <v-list-item to="/loans/EquipmentLoansLedger">
              貸出返却履歴
            </v-list-item>
            <v-list-item to="/loans/Employee"> 利用者管理 </v-list-item>
            <!-- <v-list-item to=""> 名簿管理 </v-list-item> -->
          </v-list-group>
          <h2>設定</h2>
          <v-list-group>
            <template v-slot:activator="{ props }">
              <v-list-item
                v-bind="props"
                prepend-icon="mdi-account"
                title="アカウント"
              >
              </v-list-item>
            </template>
            <v-list-item to="/settings/MyAccount">
              マイアカウント設定
            </v-list-item>
            <v-list-item
              v-if="user_role === 'admin'"
              to="/settings/MemberManagement"
            >
              メンバー管理
            </v-list-item>
          </v-list-group>
        </v-list>
      </v-navigation-drawer>
      <!-- メインコンテンツ -->
      <v-main>
        <v-container fluid>
          <!-- ヘッダー -->
          <v-app-bar flat class="pr-4">
            <v-app-bar-nav-icon
              @click.stop="drawer = !drawer"
            ></v-app-bar-nav-icon>
            <!-- <v-btn icon disabled> <v-icon>mdi-magnify</v-icon> </v-btn> -->
            <v-spacer></v-spacer>
            <v-btn
              icon
              class="mr-2"
              variant="plain"
              @click="openNotificationsDialog()"
              ><v-badge dot :color="badgeActivator()">
                <v-icon>mdi-bell</v-icon></v-badge
              >
              <v-dialog v-model="notificationsDialog">
                <v-card title="お知らせ" prepend-icon="mdi-bell">
                  <v-divider></v-divider>
                  <Notifications @update:unreadCount="updateUnreadCount" />
                </v-card>
              </v-dialog>
            </v-btn>
            <v-btn icon variant="plain"
              ><v-icon>mdi-human-greeting-variant</v-icon
              ><v-menu activator="parent">
                <v-card>
                  <v-card-text>
                    <v-list>
                      <span class="text-caption text-center d-block">{{
                        facility_name
                      }}</span>
                      <p class="text-body-1 text-center d-block mb-1">
                        {{ user_name }}
                      </p>
                      <v-divider class="my-3"></v-divider>
                      <v-list-item
                        prepend-icon="mdi-account-edit"
                        rounded="xl"
                        to="/settings/MyAccount"
                        >マイアカウント設定</v-list-item
                      >
                      <v-list-item
                        prepend-icon="mdi-logout"
                        @click="signOut({ redirect: true, callbackUrl: '/' })"
                        rounded="xl"
                        >ログアウト</v-list-item
                      >
                    </v-list></v-card-text
                  ></v-card
                >
              </v-menu></v-btn
            >
          </v-app-bar>
          <NuxtPage />
        </v-container>
        <v-footer app class="justify-center text-caption">
          <p>
            {{ new Date().getFullYear() }} - <strong>M.E.I.S </strong>powered
            by　
          </p>
          <a href="https://coils-net.net/">CoilsNet</a>
        </v-footer>
      </v-main>
    </v-app>
    <UiAlert
      :showAlert="showAlert"
      :alertMessage="alertMessage"
      :alertType="alertType"
      @update:showAlert="updateShowAlert"
    />
  </div>
</template>

<script setup lang="ts">
const { signOut, data } = useAuth();
const drawer = ref(false);

//ユーザーデータ
const sessionData = computed(() => data.value as SessionData | null);
const user_name = computed(() => sessionData.value?.name);
const facility_name = computed(() => sessionData.value?.facility_name);
const facility_code = computed(() => sessionData.value?.facility_code);
const user_role = computed(() => sessionData.value?.role);

// アラートの設定
const alertMessage = ref('');
const alertType = ref<'success' | 'info' | 'warning' | 'error'>('info');
const showAlert = ref(false);
const updateShowAlert = (value: boolean) => {
  showAlert.value = value;
};

//badge
const unreadCount = ref(0);
const badgeActivator = () => {
  return unreadCount.value === 0 ? 'transparent' : 'red';
};
const updateUnreadCount = (count: number) => {
  unreadCount.value = count;
};

// 通知機能
const notificationsDialog = ref(false);
const openNotificationsDialog = () => {
  notificationsDialog.value = true;
};
const loadItems = async () => {
  try {
    const response = await $fetch<{ unreadCount: number }>(
      '/api/notifications/unread-count',
      {
        method: 'GET',
      },
    );
    if (response.unreadCount !== undefined) {
      unreadCount.value = Number(response.unreadCount);
    } else {
      console.error(
        '[unread-count]Unread count not found in response:',
        response,
      );
    }
  } catch (error) {
    alertMessage.value =
      (error as any).data?.data?.message || '通知の読み込みに失敗しました。';
    alertType.value = 'error';
    showAlert.value = true;
    console.error('[default]Error fetching unread count:', error);
  }
};

// 貸出返却システムページへのアクセス時にCookieを追加
const setLendingCookie = async () => {
  try {
    await $fetch('/api/loans/token/set-lending-cookie', {
      method: 'POST',
      body: { facility_code: facility_code.value },
    });
  } catch (error) {
    alertMessage.value =
      (error as any).data?.data?.message ||
      '貸出返却システムへのアクセスに失敗しました。';
    alertType.value = 'error';
    showAlert.value = true;
    console.error('[set-lending-cookie]Error fetching unread count:', error);
  }
};

onMounted(() => {
  loadItems();
  localStorage.setItem('hasVisitedDashboard', 'true');
  const hasLoggedIn = localStorage.getItem('hasLoggedIn');
  if (!hasLoggedIn) {
    localStorage.setItem('hasLoggedIn', 'true');
    alertMessage.value = 'ようこそM.E.I.Sへ！';
    alertType.value = 'success';
    showAlert.value = true;
  }
});
</script>

<style scoped>
.v-app-bar {
  background-color: var(--bg-gray);
}
h1 {
  font-size: 2rem;
  margin: 1rem 0 1rem 1rem;
  font-family: 'IBM Plex Sans JP', sans-serif;
  font-weight: 400;
  width: fit-content;
  color: #fff !important;
  text-decoration: none;
}
h1 > a {
  color: #fff !important;
  text-decoration: none;
  font-family: 'IBM Plex Sans JP', sans-serif;
}
.v-list > h2 {
  font-size: 1.2rem;
  margin: 1rem 0 0.5rem 1rem;
  font-family: 'IBM Plex Sans JP', sans-serif;
  font-weight: 400;
  color: #fff;
}
.v-navigation-drawer {
  background-color: var(--sub-color-navy1);
  color: #fff;
}
.v-app,
.v-footer {
  background-color: var(--bg-gray);
}
.v-main {
  background-color: var(--bg-gray);
}
</style>
