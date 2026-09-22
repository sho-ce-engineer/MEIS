import { describe, expect, it, vi } from 'vitest';

const updateMock = vi.fn();

vi.mock('~/server/db', () => ({
  db: {
    update: (...args: unknown[]) => updateMock(...args),
  },
}));

const baseParams = {
  equipmentId: 'EQ001',
  equipmentName: '人工呼吸器A',
  facilityCode: 'FAC001',
};

describe('updateEquipment', () => {
  it('DB正常応答の場合、更新後の行を返す', async () => {
    const returningMock = vi
      .fn()
      .mockResolvedValue([
        { equipmentId: 'EQ001', equipmentName: '人工呼吸器A' },
      ]);
    const whereMock = vi.fn().mockReturnValue({ returning: returningMock });
    const setMock = vi.fn().mockReturnValue({ where: whereMock });
    updateMock.mockReturnValue({ set: setMock });

    const { updateEquipment } = await import('./service');

    await expect(updateEquipment(baseParams)).resolves.toEqual({
      equipmentId: 'EQ001',
      equipmentName: '人工呼吸器A',
    });
    expect(setMock).toHaveBeenCalledWith(
      expect.objectContaining({ updatedAt: expect.anything() }),
    );
  });

  it('該当行が無い場合、undefinedを返す', async () => {
    const returningMock = vi.fn().mockResolvedValue([]);
    const whereMock = vi.fn().mockReturnValue({ returning: returningMock });
    const setMock = vi.fn().mockReturnValue({ where: whereMock });
    updateMock.mockReturnValue({ set: setMock });

    const { updateEquipment } = await import('./service');

    await expect(updateEquipment(baseParams)).resolves.toBeUndefined();
  });

  it('DBクエリが失敗した場合、エラーをそのまま伝播する', async () => {
    const returningMock = vi.fn().mockRejectedValue(new Error('DB接続エラー'));
    const whereMock = vi.fn().mockReturnValue({ returning: returningMock });
    const setMock = vi.fn().mockReturnValue({ where: whereMock });
    updateMock.mockReturnValue({ set: setMock });

    const { updateEquipment } = await import('./service');

    await expect(updateEquipment(baseParams)).rejects.toThrow('DB接続エラー');
  });
});
