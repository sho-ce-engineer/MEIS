import fs from 'node:fs';
import path from 'node:path';

export const SAMPLE_LEDGER_FILE_PATH = path.resolve(
  'public/samples',
  'sample-ledger.xlsx',
);

export function sampleLedgerFileExists(): boolean {
  return fs.existsSync(SAMPLE_LEDGER_FILE_PATH);
}

export function createSampleLedgerReadStream() {
  return fs.createReadStream(SAMPLE_LEDGER_FILE_PATH);
}
