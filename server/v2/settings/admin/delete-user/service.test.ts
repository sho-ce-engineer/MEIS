import { afterEach, describe, expect, it, vi } from 'vitest';
import { userNotifications, users } from '~/server/db/schema';

const transactionMock = vi.fn();

vi.mock('~/server/db', () => ({
  db: {
    transaction: (...args: unknown[]) => transactionMock(...args),
  },
}));

const baseParams = {
  facilityCode: 'FAC001',
  targetUserId: 'user-1',
};

const buildTx = ({
  targetUser,
  inspectionHistory,
  updateError,
}: {
  targetUser: unknown[];
  inspectionHistory: unknown[];
  updateError?: Error;
}) => {
  const forMock = vi.fn().mockResolvedValue(targetUser);
  const limitMock = vi.fn().mockResolvedValue(inspectionHistory);
  const selectMock = vi
    .fn()
    .mockReturnValueOnce({
      from: () => ({ where: () => ({ for: forMock }) }),
    })
    .mockReturnValueOnce({
      from: () => ({ where: () => ({ limit: limitMock }) }),
    });

  const deletedTables: unknown[] = [];
  const deleteMock = vi.fn((table: unknown) => {
    deletedTables.push(table);
    if (table === users) {
      return {
        where: () => ({ returning: vi.fn().mockResolvedValue([]) }),
      };
    }
    return { where: vi.fn().mockResolvedValue(undefined) };
  });

  const updateWhereMock = updateError
    ? vi.fn().mockRejectedValue(updateError)
    : vi.fn().mockResolvedValue(undefined);
  const setMock = vi.fn().mockReturnValue({ where: updateWhereMock });
  const updateMock = vi.fn().mockReturnValue({ set: setMock });

  const tx = { select: selectMock, delete: deleteMock, update: updateMock };
  transactionMock.mockImplementation(
    async (callback: (tx: unknown) => Promise<unknown>) => callback(tx),
  );

  return { forMock, limitMock, deleteMock, deletedTables, updateMock, setMock };
};

afterEach(() => {
  vi.clearAllMocks();
});

describe('deleteUser', () => {
  it('対象ユーザーの行をFOR UPDATEでロックして取得する', async () => {
    const { forMock } = buildTx({
      targetUser: [{ targetUserId: 'user-1' }],
      inspectionHistory: [],
    });

    const { deleteUser } = await import('./service');
    await deleteUser(baseParams);

    expect(transactionMock).toHaveBeenCalledOnce();
    expect(forMock).toHaveBeenCalledWith('update');
  });

  it('対象ユーザーがいない場合、undefinedを返し、削除も更新もしない', async () => {
    const { deleteMock, updateMock } = buildTx({
      targetUser: [],
      inspectionHistory: [],
    });

    const { deleteUser } = await import('./service');
    const result = await deleteUser(baseParams);

    expect(result).toBeUndefined();
    expect(deleteMock).not.toHaveBeenCalled();
    expect(updateMock).not.toHaveBeenCalled();
  });

  it('点検履歴が無い場合、既読の記録を削除してからユーザーを物理削除し、deleteTypeにhardを返す', async () => {
    const { deletedTables, updateMock } = buildTx({
      targetUser: [{ targetUserId: 'user-1' }],
      inspectionHistory: [],
    });

    const { deleteUser } = await import('./service');
    const result = await deleteUser(baseParams);

    expect(result).toEqual({ deleteType: 'hard' });
    expect(deletedTables).toEqual([userNotifications, users]);
    expect(updateMock).not.toHaveBeenCalled();
  });

  it('点検履歴がある場合、既読の記録を削除してdeleted_atを付け、deleteTypeにsoftを返す', async () => {
    const { deletedTables, updateMock, setMock } = buildTx({
      targetUser: [{ targetUserId: 'user-1' }],
      inspectionHistory: [{ targetUserId: 'user-1' }],
    });

    const { deleteUser } = await import('./service');
    const result = await deleteUser(baseParams);

    expect(result).toEqual({ deleteType: 'soft' });
    expect(deletedTables).toEqual([userNotifications]);
    expect(updateMock).toHaveBeenCalledWith(users);
    expect(setMock).toHaveBeenCalledWith({ deletedAt: expect.any(String) });
  });

  it('DBクエリが失敗した場合、エラーをそのまま伝播する', async () => {
    buildTx({
      targetUser: [{ targetUserId: 'user-1' }],
      inspectionHistory: [{ targetUserId: 'user-1' }],
      updateError: new Error('DB接続エラー'),
    });

    const { deleteUser } = await import('./service');

    await expect(deleteUser(baseParams)).rejects.toThrow('DB接続エラー');
  });
});
