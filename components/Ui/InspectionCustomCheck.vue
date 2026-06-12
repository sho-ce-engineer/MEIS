<template>
  <div>
    <v-checkbox
      v-model="checked"
      @change="handleChange()"
      :label="inspection_item"
      append-icon="mdi-pencil-plus"
      @click:append="toggleNotesField()"
    ></v-checkbox>
    <p class="inspection-item-description text-body-2 text-grey-darken-2">
      {{ inspection_item_description }}
    </p>
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
</template>

<script setup lang="ts">
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
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

const checked = ref(props.modelValue);
const showNotesField = ref(false);
const localNotesFieldValue = ref(props.notesFieldValue);

//setAllItemsTrueの呼び出し動作に使用
watch(
  () => props.modelValue,
  (newVal) => {
    checked.value = newVal;
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

const handleChange = () => {
  emit('update:modelValue', checked.value);
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
:deep(.v-input__details) {
  display: none;
}
.inspection-item-description {
  margin-bottom: 8px;
  margin-left: 2.5rem;
  white-space: pre-line;
}
</style>
