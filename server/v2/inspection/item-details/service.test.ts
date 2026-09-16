import { describe, expect, it, vi } from 'vitest';

const selectMock = vi.fn();

vi.mock('~/server/db', () => ({
  db: {
    select: (...args: unknown[]) => selectMock(...args),
  },
}));

const baseParams = {
  facilityCode: 'FAC001',
  inspectionItemIds: ['ITEM-001', 'ITEM-002'],
};

describe('listInspectionItemDetails', () => {
  it('DBから取得した行をそのまま返す', async () => {
    const whereMock = vi
      .fn()
      .mockResolvedValue([{ inspectionItemId: 'ITEM-001' }]);
    const fromMock = vi.fn().mockReturnValue({ where: whereMock });
    selectMock.mockReturnValue({ from: fromMock });

    const { listInspectionItemDetails } = await import('./service');

    await expect(listInspectionItemDetails(baseParams)).resolves.toEqual([
      { inspectionItemId: 'ITEM-001' },
    ]);
  });

  it('DBクエリが失敗した場合、エラーをそのまま伝播する', async () => {
    const whereMock = vi.fn().mockRejectedValue(new Error('DB接続エラー'));
    const fromMock = vi.fn().mockReturnValue({ where: whereMock });
    selectMock.mockReturnValue({ from: fromMock });

    const { listInspectionItemDetails } = await import('./service');

    await expect(listInspectionItemDetails(baseParams)).rejects.toThrow(
      'DB接続エラー',
    );
  });
});
