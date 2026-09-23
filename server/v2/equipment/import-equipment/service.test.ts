import { describe, expect, it, vi } from 'vitest';

const transactionMock = vi.fn();

vi.mock('~/server/db', () => ({
  db: {
    transaction: (...args: unknown[]) => transactionMock(...args),
  },
}));

const baseParams = {
  facilityCode: 'FAC001',
  ledgerData: [
    { equipmentId: 'EQ001', equipmentName: '人工呼吸器A' },
    { equipmentId: 'EQ002', equipmentName: '人工呼吸器B' },
  ],
};

describe('importEquipment', () => {
  it('各アイテムに対してonConflictDoNothing付きでINSERTを発行する', async () => {
    const onConflictDoNothingMock = vi.fn().mockResolvedValue(undefined);
    const valuesMock = vi
      .fn()
      .mockReturnValue({ onConflictDoNothing: onConflictDoNothingMock });
    const insertMock = vi.fn().mockReturnValue({ values: valuesMock });
    const tx = { insert: insertMock };
    transactionMock.mockImplementation(
      async (callback: (tx: unknown) => Promise<void>) => {
        await callback(tx);
      },
    );

    const { importEquipment } = await import('./service');
    await importEquipment(baseParams);

    expect(insertMock).toHaveBeenCalledTimes(2);
    expect(valuesMock).toHaveBeenNthCalledWith(1, {
      equipmentId: 'EQ001',
      equipmentName: '人工呼吸器A',
      facilityCode: 'FAC001',
    });
    expect(valuesMock).toHaveBeenNthCalledWith(2, {
      equipmentId: 'EQ002',
      equipmentName: '人工呼吸器B',
      facilityCode: 'FAC001',
    });
    expect(onConflictDoNothingMock).toHaveBeenCalledTimes(2);
  });

  it('トランザクションが失敗した場合、エラーをそのまま伝播する', async () => {
    transactionMock.mockRejectedValue(new Error('DB接続エラー'));

    const { importEquipment } = await import('./service');

    await expect(importEquipment(baseParams)).rejects.toThrow('DB接続エラー');
  });
});
