import { describe, expect, it, vi } from 'vitest';

const deleteMock = vi.fn();

vi.mock('~/server/db', () => ({
  db: {
    delete: (...args: unknown[]) => deleteMock(...args),
  },
}));

const baseParams = {
  facilityCode: 'FAC001',
  issueId: 'FAC001IssueId20260914000000R123456',
};

describe('deleteIssue', () => {
  it('DB正常応答の場合、エラーを投げない', async () => {
    const whereMock = vi.fn().mockResolvedValue(undefined);
    deleteMock.mockReturnValue({ where: whereMock });

    const { deleteIssue } = await import('./service');

    await expect(deleteIssue(baseParams)).resolves.toBeUndefined();
  });

  it('DBクエリが失敗した場合、エラーをそのまま伝播する', async () => {
    const whereMock = vi.fn().mockRejectedValue(new Error('DB接続エラー'));
    deleteMock.mockReturnValue({ where: whereMock });

    const { deleteIssue } = await import('./service');

    await expect(deleteIssue(baseParams)).rejects.toThrow('DB接続エラー');
  });
});
