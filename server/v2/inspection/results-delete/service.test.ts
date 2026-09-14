import { describe, expect, it, vi } from 'vitest';

const deleteMock = vi.fn();

vi.mock('~/server/db', () => ({
  db: {
    delete: (...args: unknown[]) => deleteMock(...args),
  },
}));

const baseParams = {
  facilityCode: 'FAC001',
  resultIds: ['RESULT-001', 'RESULT-002'],
};

describe('deleteInspectionResults', () => {
  it('DB正常応答の場合、エラーを投げない', async () => {
    const whereMock = vi.fn().mockResolvedValue(undefined);
    deleteMock.mockReturnValue({ where: whereMock });

    const { deleteInspectionResults } = await import('./service');

    await expect(deleteInspectionResults(baseParams)).resolves.toBeUndefined();
  });

  it('DBクエリが失敗した場合、エラーをそのまま伝播する', async () => {
    const whereMock = vi.fn().mockRejectedValue(new Error('DB接続エラー'));
    deleteMock.mockReturnValue({ where: whereMock });

    const { deleteInspectionResults } = await import('./service');

    await expect(deleteInspectionResults(baseParams)).rejects.toThrow(
      'DB接続エラー',
    );
  });
});
