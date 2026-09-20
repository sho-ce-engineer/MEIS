import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { Variables } from '~/server/v2/auth';
import downloadSampleXlsxLedgerRouter from '~/server/v2/equipment/download-sample-xlsx-ledger/router';
import { listEquipmentTypes } from './types/service';

const app = new Hono<{ Variables: Variables }>()
  .route('/download-sample-xlsx-ledger', downloadSampleXlsxLedgerRouter)
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
  });

export default app;
