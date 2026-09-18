import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { Variables } from '~/server/v2/auth';
import { countInspectionResultsRequestSchema } from '~/server/v2/inspection/results/results-count/domain';
import { countInspectionResults } from '~/server/v2/inspection/results/results-count/service';
import { deleteInspectionResultsRequestSchema } from '~/server/v2/inspection/results/results-delete/domain';
import { deleteInspectionResults } from '~/server/v2/inspection/results/results-delete/service';

const app = new Hono<{ Variables: Variables }>();

app
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
          '[inspection/results/results-count]Error occurred while fetching Inspection Result.',
          error,
        );
        throw new HTTPException(500, {
          message: '点検結果のカウント処理中にエラーが発生しました。',
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
          '[inspection/results/results-delete]Error occurred while deleting Inspection Result Data.',
          error,
        );
        throw new HTTPException(500, {
          message: '点検結果の削除処理中にエラーが発生しました。',
        });
      }
    },
  );

export default app;
