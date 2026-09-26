import { describe, expect, it, vi } from 'vitest';

const updateMock = vi.fn();

vi.mock('~/server/db', () => ({
  db: {
    update: (...args: unknown[]) => updateMock(...args),
  },
}));

const baseParams = {
  facilityCode: 'FAC001',
  inspectionItemId: 'ITEM-001',
  inspectionType: '日常点検',
  inspectionItemCategory: '外装点検',
  inspectionItem: 'item-1',
  inspectionComponentType: 'InspectionCustomCheck',
  inspectionSortNumber: 1,
};

describe('updateInspectionItem', () => {
  it('DB正常応答の場合、更新後の行を返す', async () => {
    const returningMock = vi
      .fn()
      .mockResolvedValue([
        { inspectionItemId: 'ITEM-001', inspectionSortNumber: 1 },
      ]);
    const whereMock = vi.fn().mockReturnValue({ returning: returningMock });
    const setMock = vi.fn().mockReturnValue({ where: whereMock });
    updateMock.mockReturnValue({ set: setMock });

    const { updateInspectionItem } = await import('./service');

    await expect(updateInspectionItem(baseParams)).resolves.toEqual({
      inspectionItemId: 'ITEM-001',
      inspectionSortNumber: 1,
    });
  });

  it('数値項目は文字列に変換し、未入力（null）の項目はnullで更新する', async () => {
    const returningMock = vi
      .fn()
      .mockResolvedValue([{ inspectionItemId: 'ITEM-001' }]);
    const whereMock = vi.fn().mockReturnValue({ returning: returningMock });
    const setMock = vi.fn().mockReturnValue({ where: whereMock });
    updateMock.mockReturnValue({ set: setMock });

    const { updateInspectionItem } = await import('./service');
    await updateInspectionItem({
      ...baseParams,
      min: 0,
      max: '100',
      lowerLimit: null,
      upperLimit: undefined,
    });

    expect(setMock).toHaveBeenCalledWith(
      expect.objectContaining({
        min: '0',
        max: '100',
        lowerlimit: null,
        upperlimit: null,
      }),
    );
  });

  it('該当行が無い場合、undefinedを返す', async () => {
    const returningMock = vi.fn().mockResolvedValue([]);
    const whereMock = vi.fn().mockReturnValue({ returning: returningMock });
    const setMock = vi.fn().mockReturnValue({ where: whereMock });
    updateMock.mockReturnValue({ set: setMock });

    const { updateInspectionItem } = await import('./service');

    await expect(updateInspectionItem(baseParams)).resolves.toBeUndefined();
  });

  it('DBクエリが失敗した場合、エラーをそのまま伝播する', async () => {
    const returningMock = vi.fn().mockRejectedValue(new Error('DB接続エラー'));
    const whereMock = vi.fn().mockReturnValue({ returning: returningMock });
    const setMock = vi.fn().mockReturnValue({ where: whereMock });
    updateMock.mockReturnValue({ set: setMock });

    const { updateInspectionItem } = await import('./service');

    await expect(updateInspectionItem(baseParams)).rejects.toThrow(
      'DB接続エラー',
    );
  });
});
