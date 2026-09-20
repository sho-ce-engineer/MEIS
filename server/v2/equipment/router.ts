import { Hono } from 'hono';
import type { Variables } from '~/server/v2/auth';
import downloadSampleXlsxLedgerRouter from '~/server/v2/equipment/download-sample-xlsx-ledger/router';

const app = new Hono<{ Variables: Variables }>().route(
  '/download-sample-xlsx-ledger',
  downloadSampleXlsxLedgerRouter,
);

export default app;
