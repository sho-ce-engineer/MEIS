import { describe, expect, it, vi } from 'vitest';

const insertMock = vi.fn();

vi.mock('~/server/db', () => ({
  db: {
    insert: (...args: unknown[]) => insertMock(...args),
  },
}));

const baseParams = {
  equipmentId: 'EQ001',
  equipmentName: '人工呼吸器A',
  facilityCode: 'FAC001',
};

describe('addEquipment', () => {
  it('DB正常応答の場合、受け取ったパラメータでINSERTする', async () => {
    const valuesMock = vi.fn().mockResolvedValue(undefined);
    insertMock.mockReturnValue({ values: valuesMock });

    const { addEquipment } = await import('./service');
    await addEquipment(baseParams);

    expect(valuesMock).toHaveBeenCalledWith(
      expect.objectContaining({
        equipmentId: 'EQ001',
        equipmentName: '人工呼吸器A',
        facilityCode: 'FAC001',
      }),
    );
  });

  it('DBクエリが失敗した場合、エラーをそのまま伝播する', async () => {
    const pgError = Object.assign(
      new Error('duplicate key value violates unique constraint'),
      { code: '23505' },
    );
    const valuesMock = vi
      .fn()
      .mockRejectedValue(
        Object.assign(new Error('Failed query'), { cause: pgError }),
      );
    insertMock.mockReturnValue({ values: valuesMock });

    const { addEquipment } = await import('./service');

    await expect(addEquipment(baseParams)).rejects.toMatchObject({
      cause: { code: '23505' },
    });
  });
});
