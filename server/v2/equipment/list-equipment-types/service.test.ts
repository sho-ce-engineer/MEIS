import { describe, expect, it, vi } from 'vitest';

const selectDistinctMock = vi.fn();

vi.mock('~/server/db', () => ({
  db: {
    selectDistinct: (...args: unknown[]) => selectDistinctMock(...args),
  },
}));

const baseParams = {
  facilityCode: 'FAC001',
};

describe('listEquipmentTypes', () => {
  it('DBから取得した行をそのまま返す', async () => {
    const whereMock = vi
      .fn()
      .mockResolvedValue([{ equipmentType: '人工呼吸器' }]);
    const fromMock = vi.fn().mockReturnValue({ where: whereMock });
    selectDistinctMock.mockReturnValue({ from: fromMock });

    const { listEquipmentTypes } = await import('./service');

    await expect(listEquipmentTypes(baseParams)).resolves.toEqual([
      { equipmentType: '人工呼吸器' },
    ]);
  });

  it('DBクエリが失敗した場合、エラーをそのまま伝播する', async () => {
    const whereMock = vi.fn().mockRejectedValue(new Error('DB接続エラー'));
    const fromMock = vi.fn().mockReturnValue({ where: whereMock });
    selectDistinctMock.mockReturnValue({ from: fromMock });

    const { listEquipmentTypes } = await import('./service');

    await expect(listEquipmentTypes(baseParams)).rejects.toThrow(
      'DB接続エラー',
    );
  });
});
