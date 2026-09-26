import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { Variables } from '~/server/v2/auth';
import { addInspectionItemRequestSchema } from '~/server/v2/inspection/items/add-inspection-item/domain';
import { addInspectionItem } from '~/server/v2/inspection/items/add-inspection-item/service';
import { copyInspectionItemsRequestSchema } from '~/server/v2/inspection/items/copy-inspection-items/domain';
import { copyInspectionItems } from '~/server/v2/inspection/items/copy-inspection-items/service';
import { deleteInspectionItemRequestSchema } from '~/server/v2/inspection/items/delete-inspection-item/domain';
import { deleteInspectionItem } from '~/server/v2/inspection/items/delete-inspection-item/service';
import { listInspectionItemDetailsRequestSchema } from '~/server/v2/inspection/items/list-inspection-item-details/domain';
import { listInspectionItemDetails } from '~/server/v2/inspection/items/list-inspection-item-details/service';
import { listInspectionItemsRequestSchema } from '~/server/v2/inspection/items/list-inspection-items/domain';
import { listInspectionItems } from '~/server/v2/inspection/items/list-inspection-items/service';
import { listInspectionTypesRequestSchema } from '~/server/v2/inspection/items/list-inspection-types/domain';
import { listInspectionTypes } from '~/server/v2/inspection/items/list-inspection-types/service';
import { saveSortedInspectionItemsRequestSchema } from '~/server/v2/inspection/items/save-sorted-inspection-items/domain';
import { saveSortedInspectionItems } from '~/server/v2/inspection/items/save-sorted-inspection-items/service';
import { updateInspectionItemRequestSchema } from '~/server/v2/inspection/items/update-inspection-item/domain';
import { updateInspectionItem } from '~/server/v2/inspection/items/update-inspection-item/service';
import { zValidator } from '~/server/v2/lib/zValidator';

const app = new Hono<{ Variables: Variables }>();

app
  .post(
    '/list',
    zValidator('json', listInspectionItemsRequestSchema),
    async (c) => {
      const facilityCode = c.get('facilityCode');
      const { equipmentModel, inspectionType } = c.req.valid('json');

      let rows: Awaited<ReturnType<typeof listInspectionItems>>;
      try {
        rows = await listInspectionItems({
          facilityCode,
          equipmentModel,
          inspectionType,
        });
      } catch (error) {
        console.error(
          '[inspection/items/list-inspection-items]Database query error for',
          error,
        );
        throw new HTTPException(500, {
          message: '点検項目の取得中にエラーが発生しました。',
        });
      }

      if (rows.length === 0) {
        throw new HTTPException(404, {
          message: '点検項目が見つかりません。',
        });
      }

      return c.json(rows);
    },
  )
  .post(
    '/details',
    zValidator('json', listInspectionItemDetailsRequestSchema),
    async (c) => {
      const facilityCode = c.get('facilityCode');
      const { inspectionItemIds } = c.req.valid('json');

      let rows: Awaited<ReturnType<typeof listInspectionItemDetails>>;
      try {
        rows = await listInspectionItemDetails({
          facilityCode,
          inspectionItemIds,
        });
      } catch (error) {
        console.error(
          '[inspection/items/list-inspection-item-details]Error occurred while fetching inspection item details:',
          error,
        );
        throw new HTTPException(500, {
          message: '点検項目の詳細の取得中にエラーが発生しました。',
        });
      }

      if (rows.length === 0) {
        throw new HTTPException(404, {
          message: '該当するデータが見つかりませんでした。',
        });
      }

      return c.json(rows);
    },
  )
  .post('/', zValidator('json', addInspectionItemRequestSchema), async (c) => {
    const facilityCode = c.get('facilityCode');
    const {
      inspectionType,
      inspectionItemCategory,
      inspectionItem,
      inspectionItemDescription,
      inspectionComponentType,
      equipmentType,
      equipmentModel,
      min,
      max,
      suffix,
      lowerLimit,
      upperLimit,
    } = c.req.valid('json');

    try {
      const row = await addInspectionItem({
        facilityCode,
        inspectionType,
        inspectionItemCategory,
        inspectionItem,
        inspectionItemDescription,
        inspectionComponentType,
        equipmentType,
        equipmentModel,
        min,
        max,
        suffix,
        lowerLimit,
        upperLimit,
      });
      return c.json(row);
    } catch (error) {
      console.error(
        '[inspection/items/add-inspection-item]Error occurred while adding inspection item.',
        error,
      );
      throw new HTTPException(500, {
        message: '点検項目の保存中にエラーが発生しました。',
      });
    }
  })
  .put(
    '/',
    zValidator('json', updateInspectionItemRequestSchema),
    async (c) => {
      const facilityCode = c.get('facilityCode');
      const {
        inspectionItemId,
        inspectionType,
        inspectionItemCategory,
        inspectionItem,
        inspectionItemDescription,
        inspectionComponentType,
        inspectionSortNumber,
        min,
        max,
        suffix,
        lowerLimit,
        upperLimit,
      } = c.req.valid('json');

      let row: Awaited<ReturnType<typeof updateInspectionItem>>;
      try {
        row = await updateInspectionItem({
          facilityCode,
          inspectionItemId,
          inspectionType,
          inspectionItemCategory,
          inspectionItem,
          inspectionItemDescription,
          inspectionComponentType,
          inspectionSortNumber,
          min,
          max,
          suffix,
          lowerLimit,
          upperLimit,
        });
      } catch (error) {
        console.error(
          '[inspection/items/update-inspection-item]Error occurred while updating inspection item.',
          error,
        );
        throw new HTTPException(500, {
          message: '点検項目の保存中にエラーが発生しました。',
        });
      }

      if (!row) {
        throw new HTTPException(404, {
          message: '点検項目が登録されていません。',
        });
      }

      return c.json(row);
    },
  )
  .delete(
    '/',
    zValidator('json', deleteInspectionItemRequestSchema),
    async (c) => {
      const facilityCode = c.get('facilityCode');
      const { inspectionItemId } = c.req.valid('json');

      try {
        await deleteInspectionItem({ facilityCode, inspectionItemId });
        return c.body(null, 204);
      } catch (error) {
        console.error(
          '[inspection/items/delete-inspection-item]Error occurred while deleting Inspection Result Data.',
          error,
        );
        throw new HTTPException(500, {
          message: '点検項目の削除処理中にエラーが発生しました。',
        });
      }
    },
  )
  .post(
    '/copy',
    zValidator('json', copyInspectionItemsRequestSchema),
    async (c) => {
      const facilityCode = c.get('facilityCode');
      const { baseInspectionData, targetInspectionData } = c.req.valid('json');

      try {
        await copyInspectionItems({
          facilityCode,
          baseEquipmentType: baseInspectionData.baseEquipmentType,
          baseEquipmentModel: baseInspectionData.baseEquipmentModel,
          baseInspectionType: baseInspectionData.baseInspectionType,
          targetEquipmentType: targetInspectionData.targetEquipmentType,
          targetEquipmentModel: targetInspectionData.targetEquipmentModel,
          targetInspectionType: targetInspectionData.targetInspectionType,
        });
        return c.body(null, 204);
      } catch (error) {
        console.error(
          '[inspection/items/copy-inspection-items]Transaction failed:',
          error,
        );
        throw new HTTPException(500, {
          message: '点検項目のコピー中にエラーが発生しました。',
        });
      }
    },
  )
  .put(
    '/sorted',
    zValidator('json', saveSortedInspectionItemsRequestSchema),
    async (c) => {
      const facilityCode = c.get('facilityCode');
      const { updatedItems } = c.req.valid('json');

      try {
        await saveSortedInspectionItems({ facilityCode, updatedItems });
        return c.body(null, 204);
      } catch (error) {
        console.error(
          '[inspection/items/save-sorted-inspection-items]Transaction failed:',
          error,
        );
        throw new HTTPException(500, {
          message: '点検項目の並び順の保存中にエラーが発生しました。',
        });
      }
    },
  )
  .post(
    '/types',
    zValidator('json', listInspectionTypesRequestSchema),
    async (c) => {
      const facilityCode = c.get('facilityCode');
      const { equipmentModel } = c.req.valid('json');

      try {
        const result = await listInspectionTypes({
          facilityCode,
          equipmentModel,
        });
        return c.json(result);
      } catch (error) {
        console.error(
          '[inspection/items/list-inspection-types]Error fetching inspection types:',
          error,
        );
        throw new HTTPException(500, {
          message: 'サーバーエラーが発生しました',
        });
      }
    },
  );

export default app;
