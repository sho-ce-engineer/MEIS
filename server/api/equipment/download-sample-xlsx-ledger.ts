import { sendStream } from 'h3';
import fs from 'node:fs';
import path from 'node:path';

export default defineEventHandler(async (event) => {
  // 認証
  getAuthenticatedUser(event);

  const filePath = path.resolve('public/samples', 'sample-ledger.xlsx');

  if (!fs.existsSync(filePath)) {
    throw createError({
      statusCode: 404,
      statusText: 'Not Found',
      data: {
        message:
          '機器台帳サンプルXLSXファイルが見つかりませんでした。運営に問い合わせてください。',
      },
    });
  }

  // ストリームでファイルを送信
  const fileStream = fs.createReadStream(filePath);
  setResponseHeader(
    event,
    'Content-Disposition',
    'attachment; filename=sample-ledger.xlsx',
  );
  setResponseHeader(
    event,
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  );

  return sendStream(event, fileStream);
});
