import { fromZonedTime } from 'date-fns-tz';

const TIME_ZONE = 'Asia/Tokyo';
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const DATE_TIME_WITH_OFFSET_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/;

const isExistingDate = (year: number, month: number, day: number) => {
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
};

export const normalizeAcquisitionDate = (
  value: string,
): string | null | undefined => {
  const trimmed = value.trim();
  if (trimmed === '') return null;

  if (DATE_TIME_WITH_OFFSET_PATTERN.test(trimmed)) {
    const time = Date.parse(trimmed);
    return Number.isNaN(time) ? undefined : new Date(time).toISOString();
  }

  const match = DATE_PATTERN.exec(trimmed);
  if (!match) return undefined;

  const [year, month, day] = match.slice(1).map(Number);
  if (
    year === undefined ||
    month === undefined ||
    day === undefined ||
    !isExistingDate(year, month, day)
  ) {
    return undefined;
  }

  return fromZonedTime(`${trimmed}T00:00:00`, TIME_ZONE).toISOString();
};
