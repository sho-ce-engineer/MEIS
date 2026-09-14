import { describe, expect, it, vi } from 'vitest';

const selectMock = vi.fn();

vi.mock('~/server/db', () => ({
  db: {
    select: (...args: unknown[]) => selectMock(...args),
  },
}));

describe('getTodayIssuesCount', () => {
  it('DBから取得したcountをそのまま返す', async () => {
    const whereMock = vi.fn().mockResolvedValue([{ count: 3 }]);
    const fromMock = vi.fn().mockReturnValue({ where: whereMock });
    selectMock.mockReturnValue({ from: fromMock });

    const { getTodayIssuesCount } = await import('./service');

    await expect(getTodayIssuesCount('FAC001')).resolves.toBe(3);
  });

  it('DBクエリが失敗した場合、エラーをそのまま伝播する', async () => {
    const whereMock = vi.fn().mockRejectedValue(new Error('DB接続エラー'));
    const fromMock = vi.fn().mockReturnValue({ where: whereMock });
    selectMock.mockReturnValue({ from: fromMock });

    const { getTodayIssuesCount } = await import('./service');

    await expect(getTodayIssuesCount('FAC001')).rejects.toThrow('DB接続エラー');
  });
});
