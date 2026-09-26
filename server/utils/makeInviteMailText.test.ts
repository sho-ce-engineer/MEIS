import { beforeAll, describe, expect, it } from 'vitest';

beforeAll(() => {
  process.env.FRONTEND_URL = 'http://localhost:3000';
});

describe('makeInvitationMailTxt', () => {
  it('施設名・招待者名・招待リンクを含み、注意書きは含まない（sendMailが付け足すため）', async () => {
    const { makeInvitationMailTxt } = await import('./makeInviteMailText');

    const { text, html } = makeInvitationMailTxt({
      facilityName: 'テスト病院',
      invitedByUserName: '山田太郎',
      inviteCode: 'code-1',
    });

    for (const body of [text, html]) {
      expect(body).toContain('テスト病院');
      expect(body).toContain('山田太郎');
      expect(body).toContain('http://localhost:3000/?invite=code-1');
      expect(body).not.toContain('万が一');
    }
  });
});
