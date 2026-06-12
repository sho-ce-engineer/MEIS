<template>
  <div>
    <div class="inspection-date__label-wrapper">
      <v-icon>mdi-calendar-clock-outline</v-icon>
      <v-label>{{ inspection_item }}</v-label>
    </div>
    <div class="inspection-date-wrapper">
      <!-- 点検項目の説明 -->
      <p class="inspection-item-description text-body-2 text-grey-darken-2">
        {{ inspection_item_description }}
      </p>
      <v-date-input
        label="タッチして入力"
        v-model="inspection_select_date"
        variant="underlined"
        append-icon="mdi-pencil-plus"
        prepend-icon="undefine"
        @update:modelValue="handleInput"
        @click:append="toggleNotesField"
      ></v-date-input>
      <v-text-field
        v-if="showNotesField"
        v-model="localNotesFieldValue"
        label="備考"
        @input="handleNotesFieldInput"
        variant="underlined"
        clearable
        class="ml-10"
      ></v-text-field>
    </div>
  </div>
</template>

<script setup lang="ts">
import { VDateInput } from 'vuetify/labs/VDateInput';

const props = defineProps({
  modelValue: {
    type: Date,
    default: null,
  },
  inspection_item: {
    type: String,
    default: '初期値が表示されています。点検項目が登録されていません。',
  },
  inspection_item_description: {
    type: String,
    default: null,
  },
  notesFieldValue: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['update:modelValue', 'update:notesFieldValue']);

const inspection_select_date = shallowRef(props.modelValue);
const showNotesField = ref(false);
const localNotesFieldValue = ref(props.notesFieldValue);

//現時点では未使用だが、将来的な使用を見越して実装
watch(
  () => props.modelValue,
  (newVal) => {
    inspection_select_date.value = newVal;
  },
);

//親からのnotesFieldValueの更新を読み込む
//現時点では未使用だが、将来的な使用を見越して実装
watch(
  () => props.notesFieldValue,
  (newVal) => {
    localNotesFieldValue.value = newVal;
  },
);

const handleInput = () => {
  emit('update:modelValue', inspection_select_date.value);
};

const toggleNotesField = () => {
  showNotesField.value = !showNotesField.value;
};

const handleNotesFieldInput = (event: Event) => {
  const inputValue = (event.target as HTMLInputElement).value;
  emit('update:notesFieldValue', inputValue);
};
</script>

<style scoped>
:deep(.v-label) {
  color: #333;
  opacity: 1;
}
.inspection-date__label-wrapper {
  display: flex;
  align-items: center;
  margin-top: 1rem;
  margin-bottom: 1rem;
}
.inspection-date-wrapper {
  display: flex;
  flex-direction: column;
}
.mdi-calendar-clock-outline {
  margin-left: 12px;
  margin-right: 12px;
}
.inspection-item-description {
  margin-bottom: 8px;
  margin-left: 2.5rem;
  white-space: pre-line;
}
.v-input {
  margin-left: 2.5rem;
}
.v-input__details {
  display: none !important;
}
</style>
