import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { stream } from 'hono/streaming';
import type { Variables } from '~/server/v2/auth';
import {
  createSampleLedgerReadStream,
  sampleLedgerFileExists,
} from './download-sample-xlsx-ledger/service';
import { listEquipmentTypes } from './types/service';

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
  });

export default app;
