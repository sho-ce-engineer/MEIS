import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { Variables } from '~/server/v2/auth';
import { deleteInspectionItemRequestSchema } from '~/server/v2/inspection/items/item-delete/domain';
import { deleteInspectionItem } from '~/server/v2/inspection/items/item-delete/service';
import { listInspectionItemDetailsRequestSchema } from '~/server/v2/inspection/items/item-details/domain';
import { listInspectionItemDetails } from '~/server/v2/inspection/items/item-details/service';
import { listInspectionItemsRequestSchema } from '~/server/v2/inspection/items/items-list/domain';
import { listInspectionItems } from '~/server/v2/inspection/items/items-list/service';
import { saveSortedInspectionItemsRequestSchema } from '~/server/v2/inspection/items/items-save-sorted/domain';
import { saveSortedInspectionItems } from '~/server/v2/inspection/items/items-save-sorted/service';
import { listInspectionTypesRequestSchema } from '~/server/v2/inspection/items/types/domain';
import { listInspectionTypes } from '~/server/v2/inspection/items/types/service';

const app = new Hono<{ Variables: Variables }>();

app
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
          '[inspection/items/types]Error fetching inspection types:',
          error,
        );
        throw new HTTPException(500, {
          message: 'サーバーエラーが発生しました',
        });
      }
    },
  )
  .delete(
    '/',
    zValidator('json', deleteInspectionItemRequestSchema),
    async (c) => {
      const facilityCode = c.get('facilityCode');
      const { inspection_item_id: inspectionItemId } = c.req.valid('json');

      try {
        await deleteInspectionItem({ facilityCode, inspectionItemId });
        return c.body(null, 204);
      } catch (error) {
        console.error(
          '[inspection/items/item-delete]Error occurred while deleting Inspection Result Data.',
          error,
        );
        throw new HTTPException(500, {
          message: '点検項目の削除処理中にエラーが発生しました。',
        });
      }
    },
  )
  .post(
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
          '[inspection/items/items-save-sorted]Transaction failed:',
          error,
        );
        throw new HTTPException(500, {
          message: '点検項目の並び順の保存中にエラーが発生しました。',
        });
      }
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
          '[inspection/items/item-details]Error occurred while fetching inspection item details:',
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
          '[inspection/items/items-list]Database query error for',
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
  );

export default app;
