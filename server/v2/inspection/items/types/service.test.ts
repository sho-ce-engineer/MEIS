import { describe, expect, it, vi } from 'vitest';

const selectDistinctMock = vi.fn();

vi.mock('~/server/db', () => ({
  db: {
    selectDistinct: (...args: unknown[]) => selectDistinctMock(...args),
  },
}));

const baseParams = {
  facilityCode: 'FAC001',
  equipmentModel: 'CT200',
};

describe('listInspectionTypes', () => {
  it('DBから取得した行をそのまま返す', async () => {
    const whereMock = vi
      .fn()
      .mockResolvedValue([{ inspectionType: '日常点検' }]);
    const fromMock = vi.fn().mockReturnValue({ where: whereMock });
    selectDistinctMock.mockReturnValue({ from: fromMock });

    const { listInspectionTypes } = await import('./service');

    await expect(listInspectionTypes(baseParams)).resolves.toEqual([
      { inspectionType: '日常点検' },
    ]);
  });

  it('DBクエリが失敗した場合、エラーをそのまま伝播する', async () => {
    const whereMock = vi.fn().mockRejectedValue(new Error('DB接続エラー'));
    const fromMock = vi.fn().mockReturnValue({ where: whereMock });
    selectDistinctMock.mockReturnValue({ from: fromMock });

    const { listInspectionTypes } = await import('./service');

    await expect(listInspectionTypes(baseParams)).rejects.toThrow(
      'DB接続エラー',
    );
  });
});
