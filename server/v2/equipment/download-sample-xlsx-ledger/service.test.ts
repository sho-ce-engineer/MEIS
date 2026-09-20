import fs from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';

describe('sampleLedgerFileExists', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('ファイルが存在する場合、trueを返す', async () => {
    vi.spyOn(fs, 'existsSync').mockReturnValue(true);

    const { sampleLedgerFileExists } = await import('./service');

    expect(sampleLedgerFileExists()).toBe(true);
  });

  it('ファイルが存在しない場合、falseを返す', async () => {
    vi.spyOn(fs, 'existsSync').mockReturnValue(false);

    const { sampleLedgerFileExists } = await import('./service');

    expect(sampleLedgerFileExists()).toBe(false);
  });
});

describe('createSampleLedgerReadStream', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('サンプルファイルパスに対するReadStreamを生成する', async () => {
    const createReadStreamSpy = vi
      .spyOn(fs, 'createReadStream')
      // biome-ignore lint/suspicious/noExplicitAny: テスト用のダミー戻り値のため
      .mockReturnValue({} as any);

    const { createSampleLedgerReadStream, SAMPLE_LEDGER_FILE_PATH } =
      await import('./service');

    createSampleLedgerReadStream();

    expect(createReadStreamSpy).toHaveBeenCalledWith(SAMPLE_LEDGER_FILE_PATH);
  });
});
