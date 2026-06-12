<template>
  <div class="equipment-loans-wrapper">
    <h2 class="text-h2 font-weight-bold text-center">
      医療機器　貸出・返却システム
    </h2>
    <div class="equipment-loans-body">
      <div class="equipment-loans-body-inner" v-if="permission_LendingSystem">
        <button class="btn-loans" @click="$router.push('/loans/EquipmentLend')">
          貸出<span class="mdi mdi-progress-upload btn-loans-icon"></span>
        </button>
        <button
          class="btn-loans"
          @click="$router.push('/loans/EquipmentReturn')"
        >
          返却<span class="mdi mdi-progress-download btn-loans-icon"></span>
        </button>
      </div>
      <div v-else>
        <p>セッションが切れました。M.E.I.Sに再度ログインしてください。</p>
        <p>
          本システムを利用するためには、はじめにM.E.I.Sのダッシュボードにアクセスしてください。
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'loans', auth: false });
//ユーザーデータ
const permission_LendingSystem = ref(false);
const fetchLendingSysytemTokenDecode = async () => {
  try {
    const response = await $fetch(
      '/api/loans/token/decode-lending-system-token',
      {
        method: 'GET',
      },
    );
    if (response.success) {
      permission_LendingSystem.value = true;
    } else {
      alertMessage.value =
        '施設情報の取得に失敗しました。システム管理者に問い合わせてください。';
      alertType.value = 'error';
      showAlert.value = true;
    }
  } catch (error) {
    alertMessage.value =
      '施設情報の取得に失敗しました。システム管理者に問い合わせてください。';
    alertType.value = 'error';
    showAlert.value = true;
  }
}; //トークンの更新処理
const refreshToken = async () => {
  try {
    // サーバーにリクエストを送信して、トークンの有効期限を更新
    const response = await $fetch('/api/loans/token/refresh-token', {
      method: 'POST',
    });

    if (response.success) {
      console.log('Token extended successfully');
    } else {
      console.error('Failed to extend token');
    }
  } catch (error) {
    console.error('Error refreshing token:', error);
  }
};
onMounted(() => {
  fetchLendingSysytemTokenDecode();
  refreshToken();
});
</script>

<style scoped>
.equipment-loans-wrapper {
  height: 100vh;
}
h2 {
  padding-top: 5rem;
}
.equipment-loans-body {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 4rem;
  margin-bottom: 4rem;
  /* height: calc(100% - 10rem - 60px); h2のfont-sizeとpadding+5rem */
}
.equipment-loans-body-inner {
  display: flex;
  justify-content: space-between;
  column-gap: 15vw;
}

.btn-loans {
  flex: 1;
  padding: 6vh 10vw;
  font-size: 6rem;
  background-color: #fff;
  color: #01579b;
  border-radius: 8px;
  box-shadow: -2px 10px 100px -10px rgba(8, 139, 222, 0.5);
  transition: 0.5s;
  position: relative;
  z-index: 1;
}
.btn-loans:hover {
  background-color: #01579b;
  color: #fff;
  box-shadow: -2px 10px 100px 20px rgba(8, 139, 222, 0.6);
}
.btn-loans-icon {
  position: absolute;
  right: 10%;
  bottom: 50px;
  transform: scale(2);
  line-height: 80px;
  opacity: 0.1;
}
</style>
