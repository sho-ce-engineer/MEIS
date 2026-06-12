<template>
  <div class="inspection-number__label-wrapper">
    <v-icon>mdi-numeric</v-icon>
    <v-label>{{ inspection_item }}</v-label>
  </div>
  <div class="inspection-number-wrapper">
    <!-- 点検項目の説明 -->
    <p class="inspection-item-description text-body-2 text-grey-darken-2">
      {{ inspection_item_description }}
    </p>

    <!-- 数値入力フィールド -->
    <v-text-field
      v-model="inputValue"
      type="number"
      :placeholder="placeholder"
      @input="handleInput"
      variant="outlined"
      :min="min"
      :max="max"
      :suffix="suffix"
      :class="{ error: isError }"
      persistent-placeholder
      append-icon="mdi-pencil-plus"
      @click:append="toggleNotesField"
    ></v-text-field>

    <!-- 備考入力フィールド -->
    <v-text-field
      v-if="showNotesField"
      v-model="localNotesFieldValue"
      label="備考"
      @input="handleNotesFieldInput"
      variant="underlined"
      clearable
      class="ml-10"
    ></v-text-field>

    <!-- エラー発生時の警告表示 -->
    <v-alert
      v-if="isError"
      type="warning"
      class="mb-2"
      variant="tonal"
      closable
    >
      {{ errorMessage }}
    </v-alert>
  </div>
</template>

<script setup lang="ts">
const props = defineProps({
  modelValue: {
    type: [Number, String],
    default: '',
  },
  inspection_item: {
    type: String,
    default: '初期値が表示されています。正しく点検項目が入力されていません。',
  },
  inspection_item_description: {
    type: String,
    default: '',
  },
  notesFieldValue: {
    type: String,
    default: '',
  },
  placeholder: {
    type: String,
    default: 'ここに点検数値を入力してください。',
  },
  min: {
    type: [Number, String],
    default: null,
  },
  max: {
    type: [Number, String],
    default: null,
  },
  suffix: {
    type: String,
    default: '',
  },
  lowerLimit: {
    type: Number,
    default: -Infinity,
  },
  upperLimit: {
    type: Number,
    default: Infinity,
  },
  errorMessage: {
    type: String,
    default:
      '基準値の範囲外です。規定の手順に従って対応してください。なお、このままでも点検結果は保存できます。',
  },
});

const emit = defineEmits(['update:modelValue', 'update:notesFieldValue']);

const inputValue = ref(props.modelValue);
const isError = ref(false);
const showNotesField = ref(false);
const localNotesFieldValue = ref(props.notesFieldValue);

//親からのmodelValueの更新を読み込む
//現在は入力値リセットに使用
watch(
  () => props.modelValue,
  (newVal) => {
    inputValue.value = newVal;
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
  emit('update:modelValue', inputValue.value);
  checkError();
};

const toggleNotesField = () => {
  showNotesField.value = !showNotesField.value;
};

const handleNotesFieldInput = (event: Event) => {
  const inputValue = (event.target as HTMLInputElement).value;
  emit('update:notesFieldValue', inputValue);
};

//入力内容のエラーチェックand境界値チェック
const checkError = () => {
  const numberValue = parseFloat(String(inputValue.value));
  isError.value =
    isNaN(numberValue) ||
    (props.lowerLimit !== 0 && numberValue < props.lowerLimit) ||
    (props.upperLimit !== 0 && numberValue > props.upperLimit);
};
</script>

<style scoped>
:deep(.v-label) {
  color: #333;
  opacity: 1;
}
.inspection-number__label-wrapper {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}
.inspection-number-wrapper {
  display: flex;
  flex-direction: column;
}
.mdi-numeric {
  margin: 1rem;
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
</style>
