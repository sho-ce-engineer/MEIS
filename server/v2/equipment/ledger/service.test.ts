import { describe, expect, it, vi } from 'vitest';

const selectMock = vi.fn();

vi.mock('~/server/db', () => ({
  db: {
    select: (...args: unknown[]) => selectMock(...args),
  },
}));

const baseParams = {
  facilityCode: 'FAC001',
  page: 1,
  itemsPerPage: 10,
  sortRow: 'equipment_id' as const,
  sortByOrder: 'asc' as const,
  filterCriteria: {},
};

function mockListQuery(rows: unknown[]) {
  const offsetMock = vi.fn().mockResolvedValue(rows);
  const limitMock = vi.fn().mockReturnValue({ offset: offsetMock });
  const orderByMock = vi.fn().mockReturnValue({ limit: limitMock });
  const whereMock = vi.fn().mockReturnValue({ orderBy: orderByMock });
  const fromMock = vi.fn().mockReturnValue({ where: whereMock });
  return fromMock;
}

describe('listEquipmentLedger', () => {
  it('DBから取得した行をitemsとして返し、totalを数値で返す', async () => {
    const listFromMock = mockListQuery([
      {
        equipmentId: 'EQ001',
        equipmentType: 'Diagnostic',
        equipmentManufacturer: 'MedTech',
        equipmentName: '人工呼吸器A',
        equipmentModel: 'VT100',
        equipmentSerialNumber: 'SN001',
        equipmentStatus: 'active',
        acquisitionDate: '2024-11-09',
        equipmentMaintenanceContract: null,
      },
    ]);
    const totalWhereMock = vi.fn().mockResolvedValue([{ total: 1 }]);
    const totalFromMock = vi.fn().mockReturnValue({ where: totalWhereMock });

    selectMock
      .mockReturnValueOnce({ from: listFromMock })
      .mockReturnValueOnce({ from: totalFromMock });

    const { listEquipmentLedger } = await import('./service');
    const result = await listEquipmentLedger(baseParams);

    expect(result.total).toBe(1);
    expect(result.items[0]).toEqual({
      equipmentId: 'EQ001',
      equipmentType: 'Diagnostic',
      equipmentManufacturer: 'MedTech',
      equipmentName: '人工呼吸器A',
      equipmentModel: 'VT100',
      equipmentSerialNumber: 'SN001',
      equipmentStatus: 'active',
      acquisitionDate: '2024-11-09',
      equipmentMaintenanceContract: null,
    });
  });

  it('DBクエリが失敗した場合、エラーをそのまま伝播する', async () => {
    const offsetMock = vi.fn().mockRejectedValue(new Error('DB接続エラー'));
    const limitMock = vi.fn().mockReturnValue({ offset: offsetMock });
    const orderByMock = vi.fn().mockReturnValue({ limit: limitMock });
    const whereMock = vi.fn().mockReturnValue({ orderBy: orderByMock });
    const fromMock = vi.fn().mockReturnValue({ where: whereMock });
    selectMock.mockReturnValue({ from: fromMock });

    const { listEquipmentLedger } = await import('./service');

    await expect(listEquipmentLedger(baseParams)).rejects.toThrow(
      'DB接続エラー',
    );
  });
});
