import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { Variables } from '~/server/v2/auth';
import { countInspectionResultsRequestSchema } from '~/server/v2/inspection/results/count-inspection-results/domain';
import { countInspectionResults } from '~/server/v2/inspection/results/count-inspection-results/service';
import { deleteInspectionResultsRequestSchema } from '~/server/v2/inspection/results/delete-inspection-results/domain';
import { deleteInspectionResults } from '~/server/v2/inspection/results/delete-inspection-results/service';
import { listInspectionHistoryRequestSchema } from '~/server/v2/inspection/results/list-inspection-history/domain';
import { listInspectionHistory } from '~/server/v2/inspection/results/list-inspection-history/service';
import { saveInspectionResultsRequestSchema } from '~/server/v2/inspection/results/save-inspection-results/domain';
import { saveInspectionResults } from '~/server/v2/inspection/results/save-inspection-results/service';

const app = new Hono<{ Variables: Variables }>();

app
  .post(
    '/history',
    zValidator('json', listInspectionHistoryRequestSchema),
    async (c) => {
      const facilityCode = c.get('facilityCode');
      const {
        page,
        itemsPerPage,
        sortRow,
        sortByOrder,
        inspectionType,
        filterCriteria,
      } = c.req.valid('json');

      try {
        const result = await listInspectionHistory({
          facilityCode,
          page,
          itemsPerPage,
          sortRow,
          sortByOrder,
          inspectionType,
          filterCriteria,
        });
        return c.json(result);
      } catch (error) {
        console.error(
          '[inspection/results/list-inspection-history]Error occurred while fetching Inspection History.',
          error,
        );
        throw new HTTPException(500, {
          message: '点検履歴の取得中にエラーが発生しました。',
        });
      }
    },
  )
  .post(
    '/count',
    zValidator('json', countInspectionResultsRequestSchema),
    async (c) => {
      const facilityCode = c.get('facilityCode');
      const { jpyDate } = c.req.valid('json');

      try {
        const count = await countInspectionResults({ facilityCode, jpyDate });
        return c.json({ count });
      } catch (error) {
        console.error(
          '[inspection/results/count-inspection-results]Error occurred while fetching Inspection Result.',
          error,
        );
        throw new HTTPException(500, {
          message: '点検結果のカウント処理中にエラーが発生しました。',
        });
      }
    },
  )
  .post(
    '/',
    zValidator('json', saveInspectionResultsRequestSchema),
    async (c) => {
      const facilityCode = c.get('facilityCode');
      const { results } = c.req.valid('json');

      try {
        await saveInspectionResults({
          facilityCode,
          results: results.map((item) => ({
            resultId: item.result_id,
            userId: item.user_id,
            inspectionItemId: item.inspection_item_id,
            equipmentId: item.equipment_id,
            equipmentSerialNumber: item.equipment_serial_number,
            result: item.result,
            notes: item.notes,
            inspectionDate: item.inspection_date,
          })),
        });
        return c.body(null, 204);
      } catch (error) {
        console.error(
          '[inspection/results/save-inspection-results]Transaction failed:',
          error,
        );
        throw new HTTPException(500, {
          message: '点検結果の保存中にエラーが発生しました。',
        });
      }
    },
  )
  .delete(
    '/',
    zValidator('json', deleteInspectionResultsRequestSchema),
    async (c) => {
      const facilityCode = c.get('facilityCode');
      const { result_ids: resultIds } = c.req.valid('json');

      try {
        await deleteInspectionResults({ facilityCode, resultIds });
        return c.body(null, 204);
      } catch (error) {
        console.error(
          '[inspection/results/delete-inspection-results]Error occurred while deleting Inspection Result Data.',
          error,
        );
        throw new HTTPException(500, {
          message: '点検結果の削除処理中にエラーが発生しました。',
        });
      }
    },
  );

export default app;
