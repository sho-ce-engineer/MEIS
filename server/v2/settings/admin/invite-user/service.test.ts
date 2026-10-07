import type { SQL } from 'drizzle-orm';
import { PgDialect } from 'drizzle-orm/pg-core';
import { describe, expect, it, vi } from 'vitest';

const insertMock = vi.fn();
const selectMock = vi.fn();

vi.mock('~/server/db', () => ({
  db: {
    insert: (...args: unknown[]) => insertMock(...args),
    select: (...args: unknown[]) => selectMock(...args),
  },
}));

const baseParams = {
  email: 'invitee@example.com',
  facilityCode: 'FAC001',
  userRole: 'admin',
  invitedByUserId: 'user-1',
  inviteCode: 'test-invite-code',
};

describe('addInvitation', () => {
  it('DB正常応答の場合、受け取ったパラメータとexpiresAtでINSERTし、追加された行を返す', async () => {
    const returningMock = vi
      .fn()
      .mockResolvedValue([
        { id: 1, email: 'invitee@example.com', inviteCode: 'test-invite-code' },
      ]);
    const valuesMock = vi.fn().mockReturnValue({ returning: returningMock });
    insertMock.mockReturnValue({ values: valuesMock });

    const { addInvitation } = await import('./service');
    const result = await addInvitation(baseParams);

    expect(result).toEqual({
      id: 1,
      email: 'invitee@example.com',
      inviteCode: 'test-invite-code',
    });
    expect(valuesMock).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'invitee@example.com',
        facilityCode: 'FAC001',
        userRole: 'admin',
        invitedByUserId: 'user-1',
        inviteCode: 'test-invite-code',
        expiresAt: expect.any(String),
      }),
    );
  });

  it('DBクエリが失敗した場合、エラーをそのまま伝播する', async () => {
    const returningMock = vi.fn().mockRejectedValue(new Error('DB接続エラー'));
    const valuesMock = vi.fn().mockReturnValue({ returning: returningMock });
    insertMock.mockReturnValue({ values: valuesMock });

    const { addInvitation } = await import('./service');

    await expect(addInvitation(baseParams)).rejects.toThrow('DB接続エラー');
  });
});

describe('getInviterName', () => {
  const params = { userId: 'user-1', facilityCode: 'FAC001' };

  const buildSelectChain = (rows: unknown[]) => {
    const whereMock = vi.fn().mockResolvedValue(rows);
    selectMock.mockReturnValue({ from: () => ({ where: whereMock }) });
    return { whereMock };
  };

  it('ユーザーが見つかった場合、名前を返す', async () => {
    buildSelectChain([{ userName: '山田太郎' }]);

    const { getInviterName } = await import('./service');

    expect(await getInviterName(params)).toBe('山田太郎');
  });

  it('ユーザーが見つからない場合、undefinedを返す', async () => {
    buildSelectChain([]);

    const { getInviterName } = await import('./service');

    expect(await getInviterName(params)).toBeUndefined();
  });

  it('ユーザーID・施設コード・削除済みでないことを条件に検索する', async () => {
    const { whereMock } = buildSelectChain([]);

    const { getInviterName } = await import('./service');
    await getInviterName(params);

    const { sql, params: values } = new PgDialect().sqlToQuery(
      whereMock.mock.lastCall?.[0] as SQL,
    );
    expect(sql).toBe(
      '("users"."user_id" = $1 and "users"."facility_code" = $2 and "users"."deleted_at" is null)',
    );
    expect(values).toEqual(['user-1', 'FAC001']);
  });

  it('DBクエリが失敗した場合、エラーをそのまま伝播する', async () => {
    selectMock.mockReturnValue({
      from: () => ({
        where: vi.fn().mockRejectedValue(new Error('DB接続エラー')),
      }),
    });

    const { getInviterName } = await import('./service');

    await expect(getInviterName(params)).rejects.toThrow('DB接続エラー');
  });
});
