export type NumericValue = number | string | null;

export const toNumericColumn = (value: NumericValue | undefined) =>
  value === null || value === undefined ? null : String(value);
