import { describe, expect, it, vi } from 'vitest';

const selectDistinctMock = vi.fn();

vi.mock('~/server/db', () => ({
  db: {
    selectDistinct: (...args: unknown[]) => selectDistinctMock(...args),
  },
}));

const baseParams = {
  facilityCode: 'FAC001',
  equipmentType: '人工呼吸器',
};

describe('listEquipmentModels', () => {
  it('DBから取得した行をそのまま返す', async () => {
    const whereMock = vi.fn().mockResolvedValue([{ equipmentModel: 'ModelA' }]);
    const fromMock = vi.fn().mockReturnValue({ where: whereMock });
    selectDistinctMock.mockReturnValue({ from: fromMock });

    const { listEquipmentModels } = await import('./service');

    await expect(listEquipmentModels(baseParams)).resolves.toEqual([
      { equipmentModel: 'ModelA' },
    ]);
  });

  it('DBクエリが失敗した場合、エラーをそのまま伝播する', async () => {
    const whereMock = vi.fn().mockRejectedValue(new Error('DB接続エラー'));
    const fromMock = vi.fn().mockReturnValue({ where: whereMock });
    selectDistinctMock.mockReturnValue({ from: fromMock });

    const { listEquipmentModels } = await import('./service');

    await expect(listEquipmentModels(baseParams)).rejects.toThrow(
      'DB接続エラー',
    );
  });
});
