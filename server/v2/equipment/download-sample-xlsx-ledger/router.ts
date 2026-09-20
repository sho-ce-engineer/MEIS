import fs, { createReadStream } from 'node:fs';
import path from 'node:path';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { stream } from 'hono/streaming';

const app = new Hono();

app.get('/', async (c) => {
  const filePath = path.resolve('public/samples', 'sample-ledger.xlsx');
  const fileName = 'sample.xlsx';

  if (!fs.existsSync(filePath)) {
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
    const readStream = createReadStream(filePath);

    for await (const chunk of readStream) {
      await stream.write(chunk);
    }
  });
});

export default app;
