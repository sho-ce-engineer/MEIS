import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { stream } from 'hono/streaming';
import { DatabaseError, DrizzleQueryError } from '~/server/db';
import type { Variables } from '~/server/v2/auth';
import { addEquipmentRequestSchema } from './add/domain';
import { addEquipment } from './add/service';
import { listEquipmentDetailsRequestSchema } from './details/domain';
import { getEquipmentDetails } from './details/service';
import {
  createSampleLedgerReadStream,
  sampleLedgerFileExists,
} from './download-sample-xlsx-ledger/service';
import { listEquipmentId } from './id/service';
import { importEquipmentRequestSchema } from './import/domain';
import { importEquipment } from './import/service';
import { listEquipmentLedgerRequestSchema } from './ledger/domain';
import {
  type FilterCriteria,
  listEquipmentLedger,
  type SortOrder,
  type SortRow,
} from './ledger/service';
import { listEquipmentManufacturer } from './manufacturer/service';
import { listEquipmentModelsRequestSchema } from './models/domain';
import { listEquipmentModels } from './models/service';
import { listEquipmentTypes } from './types/service';
import { updateEquipmentRequestSchema } from './update/domain';
import { updateEquipment } from './update/service';

const ALLOWED_SORT_KEYS: SortRow[] = [
  'equipment_id',
  'equipment_type',
  'equipment_manufacturer',
  'equipment_name',
  'equipment_model',
  'equipment_serial_number',
  'acquisition_date',
];

const app = new Hono<{ Variables: Variables }>()
  .get('/download-sample-xlsx-ledger', async (c) => {
    const fileName = 'sample.xlsx';

    if (!sampleLedgerFileExists()) {
      throw new HTTPException(404, {
        message:
          '機器台帳サンプルXLSXファイルが見つかりませんでした。運営に問い合わせてください。',
      });
    }

    c.header(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    c.header(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(fileName)}"`,
    );

    return stream(c, async (stream) => {
      const readStream = createSampleLedgerReadStream();

      for await (const chunk of readStream) {
        await stream.write(chunk);
      }
    });
  })
  .post('/types', async (c) => {
    const facilityCode = c.get('facilityCode');

    try {
      const result = await listEquipmentTypes({
        facilityCode,
      });
      return c.json(result);
    } catch (error) {
      console.error('[equipment/types]Error fetching Equipment Types:', error);
      throw new HTTPException(500, {
        message: 'サーバーエラーが発生しました',
      });
    }
  })
  .post('/manufacturer', async (c) => {
    const facilityCode = c.get('facilityCode');

    try {
      const result = await listEquipmentManufacturer({ facilityCode });
      return c.json(result);
    } catch (error) {
      console.error(
        '[equipment/manufacturer]Error fetching Equipment Manufacturer:',
        error,
      );
      throw new HTTPException(500, {
        message: 'サーバーエラーが発生しました',
      });
    }
  })
  .post('/id', async (c) => {
    const facilityCode = c.get('facilityCode');

    let result: Awaited<ReturnType<typeof listEquipmentId>>;

    try {
      result = await listEquipmentId({ facilityCode });
    } catch (error) {
      console.error('[equipment/id]Error fetching Equipment Id:', error);
      throw new HTTPException(500, {
        message: 'サーバーエラーが発生しました',
      });
    }

    if (result.length === 0) {
      throw new HTTPException(404, {
        message: '機器が見つかりません',
      });
    }

    return c.json(result.map((row) => row.equipmentId));
  })

  .post(
    '/models',
    zValidator('json', listEquipmentModelsRequestSchema),
    async (c) => {
      const facilityCode = c.get('facilityCode');
      const { equipmentType } = c.req.valid('json');

      let result: Awaited<ReturnType<typeof listEquipmentModels>>;

      try {
        result = await listEquipmentModels({
          facilityCode,
          equipmentType,
        });
      } catch (error) {
        console.error(
          '[equipment/models]Error fetching Equipment Models:',
          error,
        );
        throw new HTTPException(500, {
          message: '機器型番の取得中にサーバーエラーが発生しました。',
        });
      }
      if (result.length === 0) {
        throw new HTTPException(404, {
          message: '機器型番が見つかりません。登録を確認してください。',
        });
      }
      return c.json(result);
    },
  )
  .post(
    '/details',
    zValidator('json', listEquipmentDetailsRequestSchema),
    async (c) => {
      const facilityCode = c.get('facilityCode');
      const { equipmentId } = c.req.valid('json');

      let result: Awaited<ReturnType<typeof getEquipmentDetails>>;

      try {
        result = await getEquipmentDetails({ facilityCode, equipmentId });
      } catch (error) {
        console.error(
          '[equipment/details]Error fetching Equipment Details:',
          error,
        );
        throw new HTTPException(500, {
          message: '機器詳細の取得中にサーバーエラーが発生しました。',
        });
      }

      if (!result) {
        throw new HTTPException(404, {
          message: '該当するデータが見つかりませんでした。',
        });
      }

      return c.json(result);
    },
  )
  .post('/add', zValidator('json', addEquipmentRequestSchema), async (c) => {
    const facilityCode = c.get('facilityCode');
    const {
      equipment_id: equipmentId,
      equipment_name: equipmentName,
      equipment_model: equipmentModel,
      equipment_manufacturer: equipmentManufacturer,
      equipment_serial_number: equipmentSerialNumber,
      equipment_type: equipmentType,
      acquisition_date: acquisitionDate,
      equipment_status: equipmentStatus,
      equipment_notes: equipmentNotes,
      equipment_maintenance_contract: equipmentMaintenanceContract,
      equipment_storage_location: equipmentStorageLocation,
    } = c.req.valid('json');

    try {
      await addEquipment({
        equipmentId,
        equipmentName,
        equipmentModel,
        equipmentManufacturer,
        equipmentSerialNumber,
        equipmentType,
        facilityCode,
        acquisitionDate,
        equipmentStatus,
        equipmentNotes,
        equipmentMaintenanceContract,
        equipmentStorageLocation,
      });
    } catch (error: unknown) {
      if (
        error instanceof DrizzleQueryError &&
        error.cause instanceof DatabaseError &&
        error.cause.code === '23505'
      ) {
        throw new HTTPException(409, {
          message: '同じ院内管理IDがすでに登録されています。',
        });
      }
      console.error(
        '[equipment/add]Error occurred while adding equipment:',
        error,
      );
      throw new HTTPException(500, {
        message: 'サーバーエラーが発生しました。',
      });
    }

    return c.body(null, 204);
  })
  .put(
    '/update',
    zValidator('json', updateEquipmentRequestSchema),
    async (c) => {
      const facilityCode = c.get('facilityCode');
      const {
        equipment_id: equipmentId,
        equipment_name: equipmentName,
        equipment_model: equipmentModel,
        equipment_manufacturer: equipmentManufacturer,
        equipment_serial_number: equipmentSerialNumber,
        equipment_type: equipmentType,
        acquisition_date: acquisitionDate,
        equipment_status: equipmentStatus,
        equipment_notes: equipmentNotes,
        equipment_maintenance_contract: equipmentMaintenanceContract,
        equipment_storage_location: equipmentStorageLocation,
      } = c.req.valid('json').updatedItem;

      let result: Awaited<ReturnType<typeof updateEquipment>>;

      try {
        result = await updateEquipment({
          equipmentId,
          equipmentName,
          equipmentModel,
          equipmentManufacturer,
          equipmentSerialNumber,
          equipmentType,
          facilityCode,
          acquisitionDate,
          equipmentStatus,
          equipmentNotes,
          equipmentMaintenanceContract,
          equipmentStorageLocation,
        });
      } catch (error) {
        console.error(
          '[equipment/update]Error occurred while updating equipment:',
          error,
        );
        throw new HTTPException(500, {
          message: 'サーバーエラーが発生しました。',
        });
      }

      if (!result) {
        throw new HTTPException(404, {
          message: 'Record not found or no changes made',
        });
      }

      return c.body(null, 204);
    },
  )
  .post(
    '/import',
    zValidator('json', importEquipmentRequestSchema),
    async (c) => {
      const facilityCode = c.get('facilityCode');
      const { ledgerData } = c.req.valid('json');

      try {
        await importEquipment({
          facilityCode,
          ledgerData: ledgerData.map((item) => ({
            equipmentId: item.equipment_id,
            equipmentName: item.equipment_name,
            equipmentModel: item.equipment_model,
            equipmentManufacturer: item.equipment_manufacturer,
            equipmentSerialNumber: item.equipment_serial_number,
            equipmentType: item.equipment_type,
            acquisitionDate: item.acquisition_date,
            equipmentStatus: item.equipment_status,
            equipmentNotes: item.equipment_notes,
            equipmentMaintenanceContract: item.equipment_maintenance_contract,
            equipmentStorageLocation: item.equipment_storage_location,
          })),
        });
      } catch (error) {
        console.error('[equipment/import]Transaction failed:', error);
        throw new HTTPException(500, {
          message: 'データのインポートに失敗しました。',
        });
      }

      return c.body(null, 204);
    },
  )
  .post(
    '/ledger',
    zValidator('json', listEquipmentLedgerRequestSchema),
    async (c) => {
      const facilityCode = c.get('facilityCode');
      const {
        page = 1,
        itemsPerPage = 10,
        sortRow,
        sortByOrder,
        search,
        filterCriteria = {},
      } = c.req.valid('json');

      const sortByKey = ALLOWED_SORT_KEYS.includes(sortRow as SortRow)
        ? (sortRow as SortRow)
        : 'equipment_id';
      const sortOrderValue: SortOrder =
        sortByOrder === 'asc' || sortByOrder === 'desc' ? sortByOrder : 'asc';

      try {
        const result = await listEquipmentLedger({
          facilityCode,
          page,
          itemsPerPage,
          sortRow: sortByKey,
          sortByOrder: sortOrderValue,
          search,
          filterCriteria: filterCriteria as FilterCriteria,
        });
        return c.json(result);
      } catch (error) {
        console.error('[equipment/ledger]Error executing query:', error);
        throw new HTTPException(500, {
          message: 'データの取得に失敗しました。',
        });
      }
    },
  );

export default app;
