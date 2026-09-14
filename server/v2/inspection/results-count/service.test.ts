import { describe, expect, it, vi } from 'vitest';

const selectMock = vi.fn();

vi.mock('~/server/db', () => ({
  db: {
    select: (...args: unknown[]) => selectMock(...args),
  },
}));

const baseParams = {
  facilityCode: 'FAC001',
  jpyDate: '2026-09-14',
};

describe('countInspectionResults', () => {
  it('DBから取得したcount文字列を数値に変換して返す', async () => {
    const whereMock = vi.fn().mockResolvedValue([{ count: '3' }]);
    const fromMock = vi.fn().mockReturnValue({ where: whereMock });
    selectMock.mockReturnValue({ from: fromMock });

    const { countInspectionResults } = await import('./service');

    await expect(countInspectionResults(baseParams)).resolves.toBe(3);
  });

  it('DBクエリが失敗した場合、エラーをそのまま伝播する', async () => {
    const whereMock = vi.fn().mockRejectedValue(new Error('DB接続エラー'));
    const fromMock = vi.fn().mockReturnValue({ where: whereMock });
    selectMock.mockReturnValue({ from: fromMock });

    const { countInspectionResults } = await import('./service');

    await expect(countInspectionResults(baseParams)).rejects.toThrow(
      'DB接続エラー',
    );
  });
});
