import { describe, expect, it, vi } from 'vitest';

const selectMock = vi.fn();
const insertMock = vi.fn();

vi.mock('~/server/db', () => ({
  db: {
    select: (...args: unknown[]) => selectMock(...args),
    insert: (...args: unknown[]) => insertMock(...args),
  },
}));

const baseParams = {
  facilityCode: 'FAC001',
  inspectionType: '日常点検',
  inspectionItemCategory: '外装点検',
  inspectionItem: 'item-1',
  inspectionComponentType: 'InspectionCustomCheck',
  equipmentType: 'Diagnostic',
  equipmentModel: 'CT200',
};

function mockMaxSortNumber(maxSortNumber: number | null) {
  const whereMock = vi.fn().mockResolvedValue([{ maxSortNumber }]);
  const fromMock = vi.fn().mockReturnValue({ where: whereMock });
  selectMock.mockReturnValue({ from: fromMock });
}

describe('addInspectionItem', () => {
  it('既存アイテムがある場合、MAXのsort_number+1でINSERTする', async () => {
    mockMaxSortNumber(2);
    const returningMock = vi
      .fn()
      .mockResolvedValue([
        { inspectionItemId: 'ITEM-NEW', inspectionSortNumber: 3 },
      ]);
    const valuesMock = vi.fn().mockReturnValue({ returning: returningMock });
    insertMock.mockReturnValue({ values: valuesMock });

    const { addInspectionItem } = await import('./service');
    const result = await addInspectionItem(baseParams);

    expect(valuesMock).toHaveBeenCalledWith(
      expect.objectContaining({ inspectionSortNumber: 3 }),
    );
    expect(result).toEqual({
      inspectionItemId: 'ITEM-NEW',
      inspectionSortNumber: 3,
    });
  });

  it('既存アイテムが無い場合、sort_number=1でINSERTする', async () => {
    mockMaxSortNumber(null);
    const returningMock = vi
      .fn()
      .mockResolvedValue([
        { inspectionItemId: 'ITEM-NEW', inspectionSortNumber: 1 },
      ]);
    const valuesMock = vi.fn().mockReturnValue({ returning: returningMock });
    insertMock.mockReturnValue({ values: valuesMock });

    const { addInspectionItem } = await import('./service');
    await addInspectionItem(baseParams);

    expect(valuesMock).toHaveBeenCalledWith(
      expect.objectContaining({ inspectionSortNumber: 1 }),
    );
  });

  it('DBクエリが失敗した場合、エラーをそのまま伝播する', async () => {
    const whereMock = vi.fn().mockRejectedValue(new Error('DB接続エラー'));
    const fromMock = vi.fn().mockReturnValue({ where: whereMock });
    selectMock.mockReturnValue({ from: fromMock });

    const { addInspectionItem } = await import('./service');

    await expect(addInspectionItem(baseParams)).rejects.toThrow('DB接続エラー');
  });
});
