import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { Variables } from '~/server/v2/auth';
import { listInspectionTypesRequestSchema } from '~/server/v2/inspection/types/domain';
import { listInspectionTypes } from '~/server/v2/inspection/types/service';

const app = new Hono<{ Variables: Variables }>();

app.post(
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
);

export default app;
