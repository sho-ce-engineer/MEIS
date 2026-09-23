import { describe, expect, it, vi } from 'vitest';

const selectMock = vi.fn();

vi.mock('~/server/db', () => ({
  db: {
    select: (...args: unknown[]) => selectMock(...args),
  },
}));

const baseParams = {
  facilityCode: 'FAC001',
  equipmentId: 'EQ001',
};

describe('getEquipmentDetails', () => {
  it('該当行がある場合、単一のオブジェクトを返す', async () => {
    const whereMock = vi.fn().mockResolvedValue([
      {
        equipmentName: '人工呼吸器A',
        equipmentModel: 'VT100',
        equipmentSerialNumber: 'SN-12345',
        equipmentType: 'Diagnostic',
      },
    ]);
    const fromMock = vi.fn().mockReturnValue({ where: whereMock });
    selectMock.mockReturnValue({ from: fromMock });

    const { getEquipmentDetails } = await import('./service');

    await expect(getEquipmentDetails(baseParams)).resolves.toEqual({
      equipmentName: '人工呼吸器A',
      equipmentModel: 'VT100',
      equipmentSerialNumber: 'SN-12345',
      equipmentType: 'Diagnostic',
    });
  });

  it('該当行が無い場合、undefinedを返す', async () => {
    const whereMock = vi.fn().mockResolvedValue([]);
    const fromMock = vi.fn().mockReturnValue({ where: whereMock });
    selectMock.mockReturnValue({ from: fromMock });

    const { getEquipmentDetails } = await import('./service');

    await expect(getEquipmentDetails(baseParams)).resolves.toBeUndefined();
  });

  it('DBクエリが失敗した場合、エラーをそのまま伝播する', async () => {
    const whereMock = vi.fn().mockRejectedValue(new Error('DB接続エラー'));
    const fromMock = vi.fn().mockReturnValue({ where: whereMock });
    selectMock.mockReturnValue({ from: fromMock });

    const { getEquipmentDetails } = await import('./service');

    await expect(getEquipmentDetails(baseParams)).rejects.toThrow(
      'DB接続エラー',
    );
  });
});
