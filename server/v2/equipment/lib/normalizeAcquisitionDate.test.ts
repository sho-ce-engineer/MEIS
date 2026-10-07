import { describe, expect, it } from 'vitest';
import { normalizeAcquisitionDate } from './normalizeAcquisitionDate';

describe('normalizeAcquisitionDate', () => {
  it.each([
    ['yyyy-MM-dd', '2026-10-15'],
    ['yyyy-M-d', '2026-10-15'],
    ['yyyy/M/d', '2026/10/15'],
    ['yyyy年M月d日', '2026年10月15日'],
  ])('年月日（%s）の場合、日本時間のその日の0時を返す', (_, input) => {
    expect(normalizeAcquisitionDate(input)).toBe('2026-10-14T15:00:00.000Z');
  });

  it('月・日が1桁の場合も、年月日として扱う', () => {
    expect(normalizeAcquisitionDate('2026-1-5')).toBe(
      '2026-01-04T15:00:00.000Z',
    );
  });

  it.each([
    ['yyyy/M', '2026/1'],
    ['yyyy/MM', '2026/01'],
    ['yyyy-M', '2026-1'],
    ['yyyy-MM', '2026-01'],
    ['yyyy年M月', '2026年1月'],
  ])('年月だけ（%s）の場合、その月の1日の日本時間0時を返す', (_, input) => {
    expect(normalizeAcquisitionDate(input)).toBe('2025-12-31T15:00:00.000Z');
  });

  it.each([
    ['yyyy', '2026'],
    ['yyyy年', '2026年'],
  ])('年だけ（%s）の場合、1月1日の日本時間0時を返す', (_, input) => {
    expect(normalizeAcquisitionDate(input)).toBe('2025-12-31T15:00:00.000Z');
  });

  it.each([
    ['UTC', '2026-10-14T15:00:00.000Z', '2026-10-14T15:00:00.000Z'],
    ['日本時間', '2026-10-15T00:00:00+09:00', '2026-10-14T15:00:00.000Z'],
    ['秒なし', '2026-10-15T00:00+09:00', '2026-10-14T15:00:00.000Z'],
  ])('時差の付いた日時（%s）の場合、その時点を返す', (_, input, expected) => {
    expect(normalizeAcquisitionDate(input)).toBe(expected);
  });

  it.each([
    ['全角の数字', '２０２６年１０月１５日', '2026-10-14T15:00:00.000Z'],
    ['全角のスラッシュ', '２０２６／１０／１５', '2026-10-14T15:00:00.000Z'],
    ['全角の年月', '２０２６年１月', '2025-12-31T15:00:00.000Z'],
  ])('%sは半角に直して扱う', (_, input, expected) => {
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
    ['2026/2/30'],
    ['2026-13-01'],
    ['2026年13月'],
    ['2026/0'],
    ['2025-02-29'],
  ])('実在しない日付・月（%s）の場合、undefinedを返す', (input) => {
    expect(normalizeAcquisitionDate(input)).toBeUndefined();
  });

  it('うるう年の2月29日は受け付ける', () => {
    expect(normalizeAcquisitionDate('2024-02-29')).toBe(
      '2024-02-28T15:00:00.000Z',
    );
  });

  it.each([
    ['時差の無い日時', '2026-10-15T00:00:00'],
    ['区切りが混在', '2026/10-15'],
    ['和暦', '令和8年'],
    ['2桁の年', '26/10/15'],
    ['文字列', 'abc'],
    ['実在しない時刻', '2026-10-15T25:00:00Z'],
  ])('受け付けない形（%s）の場合、undefinedを返す', (_, input) => {
    expect(normalizeAcquisitionDate(input)).toBeUndefined();
  });
});
