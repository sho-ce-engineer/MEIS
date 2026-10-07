import { fromZonedTime } from 'date-fns-tz';

const TIME_ZONE = 'Asia/Tokyo';
const DATE_TIME_WITH_OFFSET_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/;
const DATE_PATTERNS = [
  /^(?<year>\d{4})([/-])(?<month>\d{1,2})\2(?<day>\d{1,2})$/,
  /^(?<year>\d{4})年(?<month>\d{1,2})月(?<day>\d{1,2})日$/,
  /^(?<year>\d{4})[/-](?<month>\d{1,2})$/,
  /^(?<year>\d{4})年(?<month>\d{1,2})月$/,
  /^(?<year>\d{4})年?$/,
];

const isExistingDate = (year: number, month: number, day: number) => {
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
};

const toJstMidnight = (year: number, month: number, day: number) => {
  if (!isExistingDate(year, month, day)) return undefined;

  const pad = (value: number) => String(value).padStart(2, '0');
  return fromZonedTime(
    `${year}-${pad(month)}-${pad(day)}T00:00:00`,
    TIME_ZONE,
  ).toISOString();
};

export const normalizeAcquisitionDate = (
  value: string,
): string | null | undefined => {
  const normalized = value.normalize('NFKC').trim();
  if (normalized === '') return null;

  if (DATE_TIME_WITH_OFFSET_PATTERN.test(normalized)) {
    const time = Date.parse(normalized);
    return Number.isNaN(time) ? undefined : new Date(time).toISOString();
  }

  for (const pattern of DATE_PATTERNS) {
    const groups = pattern.exec(normalized)?.groups;
    if (!groups?.year) continue;

    return toJstMidnight(
      Number(groups.year),
      Number(groups.month ?? 1),
      Number(groups.day ?? 1),
    );
  }

  return undefined;
};
