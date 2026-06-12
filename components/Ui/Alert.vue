<template>
  <v-slide-y-transition>
    <v-alert
      v-if="internalShowAlert"
      :type="alertType"
      class="alert-center"
      variant="tonal"
      :text="alertMessage"
      width="50%"
    >
    </v-alert>
  </v-slide-y-transition>
</template>

<script setup lang="ts">
const props = defineProps({
  showAlert: Boolean,
  alertMessage: String,
  alertType: {
    type: String as () => 'success' | 'info' | 'warning' | 'error',
    default: 'info',
  },
});

const emit = defineEmits(['update:showAlert']);

const internalShowAlert = ref(props.showAlert);

watch(
  () => props.showAlert,
  (newValue) => {
    if (newValue) {
      internalShowAlert.value = true;
      // 3秒後にアラートを非表示にする
      setTimeout(() => {
        internalShowAlert.value = false;
        emit('update:showAlert', false);
      }, 3000);
    } else {
      internalShowAlert.value = false;
    }
  },
);
</script>

<style scoped>
.alert-center {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10000;
}
</style>
