import { describe, expect, it, vi } from 'vitest';

const selectMock = vi.fn();

vi.mock('~/server/db', () => ({
  db: {
    select: (...args: unknown[]) => selectMock(...args),
  },
}));

describe('getUnreadCount', () => {
  it('DBクエリが失敗した場合、エラーをそのまま伝播する', async () => {
    const chain = {
      from: vi.fn().mockReturnThis(),
      leftJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockRejectedValue(new Error('DB接続エラー')),
    };
    selectMock.mockReturnValue(chain);

    const { getUnreadCount } = await import('./service');

    await expect(getUnreadCount('user-1')).rejects.toThrow('DB接続エラー');
  });
});
