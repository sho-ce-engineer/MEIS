import bcrypt from 'bcrypt';
import { afterEach, describe, expect, it, vi } from 'vitest';

const selectMock = vi.fn();
const insertMock = vi.fn();
const updateMock = vi.fn();

vi.mock('~/server/db', () => ({
  db: {
    select: (...args: unknown[]) => selectMock(...args),
    insert: (...args: unknown[]) => insertMock(...args),
    update: (...args: unknown[]) => updateMock(...args),
  },
}));

afterEach(() => {
  vi.clearAllMocks();
});

describe('getUserByEmail', () => {
  const mockSelectResult = (result: Promise<unknown>) => {
    const whereMock = vi.fn().mockReturnValue(result);
    const fromMock = vi.fn().mockReturnValue({ where: whereMock });
    selectMock.mockReturnValue({ from: fromMock });
  };

  it('同じメールアドレスのユーザーがいる場合、そのuserIdを返す', async () => {
    mockSelectResult(Promise.resolve([{ userId: 'FAC00120260101090000' }]));

    const { getUserByEmail } = await import('./service');

    await expect(getUserByEmail({ email: 'test@test.com' })).resolves.toEqual({
      userId: 'FAC00120260101090000',
    });
  });

  it('同じメールアドレスのユーザーがいない場合、undefinedを返す', async () => {
    mockSelectResult(Promise.resolve([]));

    const { getUserByEmail } = await import('./service');

    await expect(
      getUserByEmail({ email: 'new@test.com' }),
    ).resolves.toBeUndefined();
  });

  it('DBクエリが失敗した場合、エラーをそのまま伝播する', async () => {
    mockSelectResult(Promise.reject(new Error('DB接続エラー')));

    const { getUserByEmail } = await import('./service');

    await expect(getUserByEmail({ email: 'test@test.com' })).rejects.toThrow(
      'DB接続エラー',
    );
  });
});

describe('getInvitation', () => {
  const mockSelectResult = (result: Promise<unknown>) => {
    const whereMock = vi.fn().mockReturnValue(result);
    const leftJoinMock = vi.fn().mockReturnValue({ where: whereMock });
    const fromMock = vi.fn().mockReturnValue({ leftJoin: leftJoinMock });
    selectMock.mockReturnValue({ from: fromMock });
  };

  it('招待コードが存在する場合、施設名を含む招待情報を返す', async () => {
    const row = {
      email: 'invitee@test.com',
      facilityCode: 'FAC001',
      userRole: 'admin',
      expiresAt: '2026-10-03 06:00:00+00',
      facilityName: 'テスト病院',
    };
    mockSelectResult(Promise.resolve([row]));

    const { getInvitation } = await import('./service');

    await expect(getInvitation({ inviteCode: 'code-1' })).resolves.toEqual(row);
  });

  it('招待コードが存在しない場合、undefinedを返す', async () => {
    mockSelectResult(Promise.resolve([]));

    const { getInvitation } = await import('./service');

    await expect(
      getInvitation({ inviteCode: 'unknown' }),
    ).resolves.toBeUndefined();
  });

  it('DBクエリが失敗した場合、エラーをそのまま伝播する', async () => {
    mockSelectResult(Promise.reject(new Error('DB接続エラー')));

    const { getInvitation } = await import('./service');

    await expect(getInvitation({ inviteCode: 'code-1' })).rejects.toThrow(
      'DB接続エラー',
    );
  });
});

describe('addFacility', () => {
  it('施設コードと施設名でINSERTし、施設コードの重複時は何もしない設定になっている', async () => {
    const onConflictDoNothingMock = vi.fn().mockResolvedValue(undefined);
    const valuesMock = vi
      .fn()
      .mockReturnValue({ onConflictDoNothing: onConflictDoNothingMock });
    insertMock.mockReturnValue({ values: valuesMock });

    const { addFacility } = await import('./service');
    await addFacility({
      facilityCode: 'facilitytesuto',
      facilityName: 'テスト',
    });

    expect(valuesMock).toHaveBeenCalledWith({
      facilityCode: 'facilitytesuto',
      facilityName: 'テスト',
    });
    expect(onConflictDoNothingMock).toHaveBeenCalledWith(
      expect.objectContaining({ target: expect.anything() }),
    );
  });

  it('DBクエリが失敗した場合、エラーをそのまま伝播する', async () => {
    const onConflictDoNothingMock = vi
      .fn()
      .mockRejectedValue(new Error('DB接続エラー'));
    const valuesMock = vi
      .fn()
      .mockReturnValue({ onConflictDoNothing: onConflictDoNothingMock });
    insertMock.mockReturnValue({ values: valuesMock });

    const { addFacility } = await import('./service');

    await expect(
      addFacility({ facilityCode: 'facilitytesuto', facilityName: 'テスト' }),
    ).rejects.toThrow('DB接続エラー');
  });
});

describe('addUser', () => {
  const baseParams = {
    userId: 'FAC00120260101090000',
    userEmail: 'new@test.com',
    password: 'plain-password',
    userName: '山田太郎',
    facilityCode: 'FAC001',
    userRole: 'general',
  };

  it('パスワードをbcryptでハッシュ化してINSERTし、パスワードを含まない登録結果を返す', async () => {
    const returned = {
      userId: 'FAC00120260101090000',
      userEmail: 'new@test.com',
      userName: '山田太郎',
      facilityCode: 'FAC001',
      userRole: 'general',
    };
    const returningMock = vi.fn().mockResolvedValue([returned]);
    const valuesMock = vi.fn().mockReturnValue({ returning: returningMock });
    insertMock.mockReturnValue({ values: valuesMock });

    const { addUser } = await import('./service');
    const result = await addUser(baseParams);

    expect(result).toEqual(returned);
    expect(result).not.toHaveProperty('password');

    const inserted = valuesMock.mock.calls[0][0];
    expect(inserted).toEqual(
      expect.objectContaining({
        userId: 'FAC00120260101090000',
        userEmail: 'new@test.com',
        userName: '山田太郎',
        facilityCode: 'FAC001',
        userRole: 'general',
      }),
    );
    expect(inserted.password).not.toBe('plain-password');
    expect(inserted.password).toMatch(/^\$2b\$10\$/);
    await expect(
      bcrypt.compare('plain-password', inserted.password),
    ).resolves.toBe(true);

    const returningColumns = Object.keys(returningMock.mock.calls[0][0]);
    expect(returningColumns).not.toContain('password');
  });

  it('DBクエリが失敗した場合、エラーをそのまま伝播する', async () => {
    const returningMock = vi.fn().mockRejectedValue(new Error('DB接続エラー'));
    const valuesMock = vi.fn().mockReturnValue({ returning: returningMock });
    insertMock.mockReturnValue({ values: valuesMock });

    const { addUser } = await import('./service');

    await expect(addUser(baseParams)).rejects.toThrow('DB接続エラー');
  });
});

describe('updateInvitationAsUsed', () => {
  it('指定した招待コードを対象に、招待コードをUSED_付きへ更新する', async () => {
    const whereMock = vi.fn().mockResolvedValue(undefined);
    const setMock = vi.fn().mockReturnValue({ where: whereMock });
    updateMock.mockReturnValue({ set: setMock });

    const { updateInvitationAsUsed } = await import('./service');
    await updateInvitationAsUsed({ inviteCode: 'code-1' });

    expect(setMock).toHaveBeenCalledWith({ inviteCode: expect.anything() });
    expect(whereMock).toHaveBeenCalledTimes(1);
  });

  it('DBクエリが失敗した場合、エラーをそのまま伝播する', async () => {
    const whereMock = vi.fn().mockRejectedValue(new Error('DB接続エラー'));
    const setMock = vi.fn().mockReturnValue({ where: whereMock });
    updateMock.mockReturnValue({ set: setMock });

    const { updateInvitationAsUsed } = await import('./service');

    await expect(
      updateInvitationAsUsed({ inviteCode: 'code-1' }),
    ).rejects.toThrow('DB接続エラー');
  });
});
