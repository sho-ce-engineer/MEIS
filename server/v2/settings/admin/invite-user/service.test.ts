import { describe, expect, it, vi } from 'vitest';

const insertMock = vi.fn();

vi.mock('~/server/db', () => ({
  db: {
    insert: (...args: unknown[]) => insertMock(...args),
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
