import { describe, expect, it, vi } from 'vitest';

const transactionMock = vi.fn();

vi.mock('~/server/db', () => ({
  db: {
    transaction: (...args: unknown[]) => transactionMock(...args),
  },
}));

const baseParams = {
  facilityCode: 'FAC001',
  results: [
    {
      resultId: 'RESULT-001',
      userId: 'USER-001',
      inspectionItemId: 'ITEM-001',
      equipmentId: 'EQ-001',
      equipmentSerialNumber: 'SN-001',
      result: 55,
      notes: 'note-1',
      inspectionDate: '2026-09-18T12:00:00.000Z',
    },
  ],
};

describe('saveInspectionResults', () => {
  it('各結果をfacilityCode付きでINSERTし、resultは文字列化する', async () => {
    const valuesMock = vi.fn().mockResolvedValue(undefined);
    const insertMock = vi.fn().mockReturnValue({ values: valuesMock });
    const tx = { insert: insertMock };

    transactionMock.mockImplementation(
      async (callback: (tx: unknown) => Promise<void>) => {
        await callback(tx);
      },
    );

    const { saveInspectionResults } = await import('./service');
    await saveInspectionResults(baseParams);

    expect(insertMock).toHaveBeenCalledTimes(1);
    expect(valuesMock).toHaveBeenCalledWith(
      expect.objectContaining({
        resultId: 'RESULT-001',
        facilityCode: 'FAC001',
        result: '55',
      }),
    );
  });

  it('トランザクションが失敗した場合、エラーをそのまま伝播する', async () => {
    transactionMock.mockRejectedValue(new Error('DB接続エラー'));

    const { saveInspectionResults } = await import('./service');

    await expect(saveInspectionResults(baseParams)).rejects.toThrow(
      'DB接続エラー',
    );
  });
});
