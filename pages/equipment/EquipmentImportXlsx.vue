<template>
  <div>
    <h2><v-icon>mdi-file-excel-outline</v-icon> XLSXファイル読み込み</h2>
    <v-card class="my-5" title="ファイルアップロード" prependIcon="mdi-plus">
      <v-divider></v-divider
      ><v-card-text>
        <p>
          テンプレートファイルを利用して、エクセルに記入した機器台帳ファイルをアップロードできます。
        </p>
        <p class="mb-0">
          テンプレートファイルは下記ボタンからダウンロードできます。
        </p>
        <p class="text-caption">
          ※あらかじめ入力されている箇所は変更しないでください。また、セル結合なども行わないでください。
        </p>
        <v-btn @click="downloadSampleXlsxLedger()" color="secondary"
          >機器台帳テンプレートファイルをダウンロード</v-btn
        >
        <v-divider class="my-4"></v-divider>
        <p>Excelファイル(.xlsx)をアップロードしてください。</p>
        <v-file-input
          v-model="file"
          label="Excelファイルを選択"
          accept=".xlsx, .xls"
          @change="handleFileUpload"
          prependIcon="mdi-table-arrow-up"
          variant="outlined"
          density="comfortable"
        ></v-file-input>
        <div v-if="file">
          <h3>データプレビュー</h3>
          <v-data-table
            :headers="headers"
            :items="jsonData"
            :loading="loading"
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
              <tr>
                <td>{{ item.院内管理ID }}</td>
                <td>{{ item.機器種別 }}</td>
                <td>{{ item.メーカー }}</td>
                <td>{{ item.機器名称 }}</td>
                <td>{{ item.型番 }}</td>
                <td>{{ item.シリアル番号 }}</td>
                <td>
                  {{ item.購入年月日 }}
                </td>
                <td>
                  {{ item.備考 }}
                </td>
              </tr></template
            >
          </v-data-table>
        </div>
      </v-card-text>
      <v-card-actions v-if="file">
        <v-spacer></v-spacer>
        <v-btn
          @click="submitImportData"
          color="primary"
          variant="flat"
          :disabled="disabled"
          >データを承認してアップロード</v-btn
        >
      </v-card-actions>
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
import * as XLSX from 'xlsx';

interface ExcelRow {
  院内管理ID: string;
  機器種別: string;
  メーカー: string;
  機器名称: string;
  型番: string;
  シリアル番号: string;
  購入年月日: string | Date;
  備考: string;
}

const loading = ref(false);
const disabled = ref(false);

//Alert
const alertMessage = ref('');
const alertType = ref<'success' | 'info' | 'warning' | 'error'>('info');
const showAlert = ref(false);
const updateShowAlert = (value: boolean) => {
  showAlert.value = value;
};

//サンプルファイルのDL
const downloadSampleXlsxLedger = async () => {
  try {
    const response = await fetch('/api/equipment/download-sample-xlsx-ledger', {
      method: 'GET',
    });
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'sample-ledger.xlsx');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    alertMessage.value = 'ダウンロード処理が開始されました。';
    alertType.value = 'info';
    showAlert.value = true;
  } catch (error) {
    console.error('[download-sample-xlsx-ledger] Error:', error);
    alertMessage.value =
      'テンプレートファイルのダウンロード中にエラーが発生しました。運営にお問い合わせください。';
    alertType.value = 'error';
    showAlert.value = true;
  }
};

//xlsxファイルからJSONデータに変換
const file = ref<File | null>(null);
const jsonData = ref<ExcelRow[]>([]);

const handleFileUpload = async () => {
  loading.value = true;
  disabled.value = true;
  if (file.value) {
    const data = await file.value.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array', cellDates: true });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    jsonData.value = XLSX.utils.sheet_to_json(worksheet);
    jsonData.value.forEach((item) => {
      if (item.購入年月日 instanceof Date) {
        item.購入年月日 = item.購入年月日.toISOString().split('T')[0];
      }
    });
    loading.value = false;
    disabled.value = false;
  }
};

const headers = [
  { title: '院内管理ID', sortable: false, key: 'equipment_id' },
  { title: '機器種別', sortable: false, key: 'equipment_type' },
  { title: 'メーカー', sortable: false, key: 'equipment_manufacturer' },
  { title: '機器名称', sortable: false, key: 'equipment_name' },
  { title: '型番', sortable: false, key: 'equipment_model' },
  { title: 'シリアル番号', sortable: false, key: 'equipment_serial_number' },
  { title: '購入日', sortable: false, key: 'acquisition_date' },
  { title: '備考', sortable: false, key: 'equipment_notes' },
];

const submitImportData = async () => {
  loading.value = true;
  disabled.value = true;
  const rawData = toRaw(jsonData.value);
  const filteredData = rawData.map((item) => ({
    equipment_id: item['院内管理ID'],
    equipment_type: item['機器種別'],
    equipment_manufacturer: item['メーカー'],
    equipment_name: item['機器名称'],
    equipment_model: item['型番'],
    equipment_serial_number: item['シリアル番号'],
    acquisition_date: item['購入年月日'],
    equipment_notes: item['備考'],
  }));

  try {
    await $fetch('/api/equipment/equipment-import', {
      method: 'POST',
      body: { ledgerData: filteredData },
    });
    alertMessage.value =
      'データが正常にアップロードされました。台帳データを確認してください。';
    alertType.value = 'success';
    showAlert.value = true;
    file.value = null;
  } catch (error) {
    alertMessage.value =
      (error as any).data?.data?.message ||
      '機器の新規登録に問題が発生しました。内容を確認した上で再度「保存」してください。';
    alertType.value = 'error';
    showAlert.value = true;
    console.error('[equipment-import]New add error:', error);
  } finally {
    loading.value = false;
    disabled.value = false;
  }
};
</script>
<style scoped>
p {
  margin-bottom: 0.75rem;
}
</style>
