import { describe, expect, it, vi } from 'vitest';

const insertMock = vi.fn();

vi.mock('~/server/db', () => ({
  db: {
    insert: (...args: unknown[]) => insertMock(...args),
  },
}));

const baseParams = {
  facilityCode: 'FAC001',
  reportedDate: '2026-09-14T11:55:51.756Z',
  reporter: 'reporter-1',
  location: 'location-1',
  description: 'description-1',
  equipmentId: 'EQ001',
};

describe('addIssue', () => {
  it('DB正常応答の場合、facilityCodeを含むissue_idでINSERTする', async () => {
    const valuesMock = vi.fn().mockResolvedValue(undefined);
    insertMock.mockReturnValue({ values: valuesMock });

    const { addIssue } = await import('./service');
    await addIssue(baseParams);

    expect(valuesMock).toHaveBeenCalledWith(
      expect.objectContaining({
        issueId: expect.stringMatching(/^FAC001IssueId\d{14}R\d{6}$/),
        reportedDate: baseParams.reportedDate,
        reporter: baseParams.reporter,
        location: baseParams.location,
        description: baseParams.description,
        equipmentId: baseParams.equipmentId,
        facilityCode: baseParams.facilityCode,
      }),
    );
  });

  it('DBクエリが失敗した場合、エラーをそのまま伝播する', async () => {
    const valuesMock = vi.fn().mockRejectedValue(new Error('DB接続エラー'));
    insertMock.mockReturnValue({ values: valuesMock });

    const { addIssue } = await import('./service');

    await expect(addIssue(baseParams)).rejects.toThrow('DB接続エラー');
  });
});
