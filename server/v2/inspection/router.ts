import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { Variables } from '~/server/v2/auth';
import { deleteInspectionItemRequestSchema } from '~/server/v2/inspection/item-delete/domain';
import { deleteInspectionItem } from '~/server/v2/inspection/item-delete/service';
import { countInspectionResultsRequestSchema } from '~/server/v2/inspection/results-count/domain';
import { countInspectionResults } from '~/server/v2/inspection/results-count/service';
import { deleteInspectionResultsRequestSchema } from '~/server/v2/inspection/results-delete/domain';
import { deleteInspectionResults } from '~/server/v2/inspection/results-delete/service';
import { listInspectionTypesRequestSchema } from '~/server/v2/inspection/types/domain';
import { listInspectionTypes } from '~/server/v2/inspection/types/service';

const app = new Hono<{ Variables: Variables }>();

app
  .post(
    '/results/count',
    zValidator('json', countInspectionResultsRequestSchema),
    async (c) => {
      const facilityCode = c.get('facilityCode');
      const { jpyDate } = c.req.valid('json');

      try {
        const count = await countInspectionResults({ facilityCode, jpyDate });
        return c.json({ count });
      } catch (error) {
        console.error(
          '[inspection/results-count]Error occurred while fetching Inspection Result.',
          error,
        );
        throw new HTTPException(500, {
          message: '点検結果のカウント処理中にエラーが発生しました。',
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
          '[inspection/types]Error fetching inspection types:',
          error,
        );
        throw new HTTPException(500, {
          message: 'サーバーエラーが発生しました',
        });
      }
    },
  )
  .delete(
    '/results',
    zValidator('json', deleteInspectionResultsRequestSchema),
    async (c) => {
      const facilityCode = c.get('facilityCode');
      const { result_ids: resultIds } = c.req.valid('json');

      try {
        await deleteInspectionResults({ facilityCode, resultIds });
        return c.body(null, 204);
      } catch (error) {
        console.error(
          '[inspection/results-delete]Error occurred while deleting Inspection Result Data.',
          error,
        );
        throw new HTTPException(500, {
          message: '点検結果の削除処理中にエラーが発生しました。',
        });
      }
    },
  )
  .delete(
    '/items',
    zValidator('json', deleteInspectionItemRequestSchema),
    async (c) => {
      const facilityCode = c.get('facilityCode');
      const { inspection_item_id: inspectionItemId } = c.req.valid('json');

      try {
        await deleteInspectionItem({ facilityCode, inspectionItemId });
        return c.body(null, 204);
      } catch (error) {
        console.error(
          '[inspection/item-delete]Error occurred while deleting Inspection Result Data.',
          error,
        );
        throw new HTTPException(500, {
          message: '点検項目の削除処理中にエラーが発生しました。',
        });
      }
    },
  );

export default app;
