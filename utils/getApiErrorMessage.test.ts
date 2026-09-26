import { FetchError } from 'ofetch';
import { describe, expect, it } from 'vitest';
import { getApiErrorMessage } from './getApiErrorMessage';

const buildFetchError = (data: unknown) => {
  const error = new FetchError('Request failed');
  error.data = data;
  return error;
};

describe('getApiErrorMessage', () => {
  it('レスポンスが{ message }の場合、そのメッセージを返す', () => {
    const error = buildFetchError({ message: '管理者権限がありません。' });

    expect(getApiErrorMessage(error, '既定の文言')).toBe(
      '管理者権限がありません。',
    );
  });

  it('レスポンスにmessageが無い場合、既定の文言を返す', () => {
    expect(getApiErrorMessage(buildFetchError('Not Found'), '既定の文言')).toBe(
      '既定の文言',
    );
  });

  it('レスポンスを受け取れなかった場合、既定の文言を返す', () => {
    expect(getApiErrorMessage(buildFetchError(undefined), '既定の文言')).toBe(
      '既定の文言',
    );
    expect(getApiErrorMessage(new Error('network'), '既定の文言')).toBe(
      '既定の文言',
    );
  });
});
