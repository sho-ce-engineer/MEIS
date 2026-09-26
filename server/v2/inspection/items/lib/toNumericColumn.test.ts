import { describe, expect, it } from 'vitest';
import { toNumericColumn } from './toNumericColumn';

describe('toNumericColumn', () => {
  it('数値の場合、文字列に変換する', () => {
    expect(toNumericColumn(10)).toBe('10');
    expect(toNumericColumn(0)).toBe('0');
  });

  it('文字列の場合、そのまま返す', () => {
    expect(toNumericColumn('10.5')).toBe('10.5');
  });

  it('nullまたはundefinedの場合、nullを返す', () => {
    expect(toNumericColumn(null)).toBeNull();
    expect(toNumericColumn(undefined)).toBeNull();
  });
});
