import { describe, expect, it } from 'vitest';
import { normalizeAcquisitionDate } from './normalizeAcquisitionDate';

describe('normalizeAcquisitionDate', () => {
  it('yyyy-MM-ddの場合、日本時間のその日の0時を返す', () => {
    expect(normalizeAcquisitionDate('2026-10-15')).toBe(
      '2026-10-14T15:00:00.000Z',
    );
  });

  it.each([
    ['UTC', '2026-10-14T15:00:00.000Z', '2026-10-14T15:00:00.000Z'],
    ['日本時間', '2026-10-15T00:00:00+09:00', '2026-10-14T15:00:00.000Z'],
    ['秒なし', '2026-10-15T00:00+09:00', '2026-10-14T15:00:00.000Z'],
  ])('時差の付いた日時（%s）の場合、その時点を返す', (_, input, expected) => {
    expect(normalizeAcquisitionDate(input)).toBe(expected);
  });

  it('前後の空白は取り除く', () => {
    expect(normalizeAcquisitionDate(' 2026-10-15 ')).toBe(
      '2026-10-14T15:00:00.000Z',
    );
  });

  it.each([
    [''],
    ['   '],
  ])('空文字・空白のみ（"%s"）の場合、nullを返す', (input) => {
    expect(normalizeAcquisitionDate(input)).toBeNull();
  });

  it.each([
    ['2026-02-30'],
    ['2026-13-01'],
    ['2025-02-29'],
  ])('実在しない日付（%s）の場合、undefinedを返す', (input) => {
    expect(normalizeAcquisitionDate(input)).toBeUndefined();
  });

  it('うるう年の2月29日は受け付ける', () => {
    expect(normalizeAcquisitionDate('2024-02-29')).toBe(
      '2024-02-28T15:00:00.000Z',
    );
  });

  it.each([
    ['時差の無い日時', '2026-10-15T00:00:00'],
    ['スラッシュ区切り', '2026/10/15'],
    ['文字列', 'abc'],
    ['実在しない時刻', '2026-10-15T25:00:00Z'],
  ])('受け付けない形（%s）の場合、undefinedを返す', (_, input) => {
    expect(normalizeAcquisitionDate(input)).toBeUndefined();
  });
});
