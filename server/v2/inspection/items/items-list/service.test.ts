import { describe, expect, it, vi } from 'vitest';

const selectMock = vi.fn();

vi.mock('~/server/db', () => ({
  db: {
    select: (...args: unknown[]) => selectMock(...args),
  },
}));

const baseParams = {
  facilityCode: 'FAC001',
  equipmentModel: 'CT200',
  inspectionType: '日常点検',
};

describe('listInspectionItems', () => {
  it('DBから取得した行をそのまま返す', async () => {
    const orderByMock = vi
      .fn()
      .mockResolvedValue([{ inspectionItemId: 'ITEM-001' }]);
    const whereMock = vi.fn().mockReturnValue({ orderBy: orderByMock });
    const fromMock = vi.fn().mockReturnValue({ where: whereMock });
    selectMock.mockReturnValue({ from: fromMock });

    const { listInspectionItems } = await import('./service');

    await expect(listInspectionItems(baseParams)).resolves.toEqual([
      { inspectionItemId: 'ITEM-001' },
    ]);
  });

  it('DBクエリが失敗した場合、エラーをそのまま伝播する', async () => {
    const orderByMock = vi.fn().mockRejectedValue(new Error('DB接続エラー'));
    const whereMock = vi.fn().mockReturnValue({ orderBy: orderByMock });
    const fromMock = vi.fn().mockReturnValue({ where: whereMock });
    selectMock.mockReturnValue({ from: fromMock });

    const { listInspectionItems } = await import('./service');

    await expect(listInspectionItems(baseParams)).rejects.toThrow(
      'DB接続エラー',
    );
  });
});
