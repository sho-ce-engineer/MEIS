import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { Variables } from '~/server/v2/auth';
import { getTodayIssuesCount } from '~/server/v2/issues/count/service';
import { deleteIssueRequestSchema } from '~/server/v2/issues/delete/domain';
import { deleteIssue } from '~/server/v2/issues/delete/service';

const app = new Hono<{ Variables: Variables }>();

app
  .get('/count', async (c) => {
    const facilityCode = c.get('facilityCode');

    try {
      const count = await getTodayIssuesCount(facilityCode);
      return c.json({ count });
    } catch (error) {
      console.error('[issues/count]Error fetching count:', error);
      throw new HTTPException(500, {
        message: '報告数の取得中にエラーが発生しました。',
      });
    }
  })
  .delete('/', zValidator('json', deleteIssueRequestSchema), async (c) => {
    const facilityCode = c.get('facilityCode');
    const { issue_id: issueId } = c.req.valid('json');

    try {
      await deleteIssue({ facilityCode, issueId });
      return c.body(null, 204);
    } catch (error) {
      console.error('[issues/delete]Error deleting issue:', error);
      throw new HTTPException(500, {
        message: 'サーバーエラーが発生しました。',
      });
    }
  });

export default app;
