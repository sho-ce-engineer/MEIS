import { formatInTimeZone } from 'date-fns-tz';

export function generateInspectionItemId(facilityCode: string): string {
  const yyyymmddhhmmss = formatInTimeZone(
    new Date(),
    'Asia/Tokyo',
    'yyyyMMddHHmmss',
  );
  const randomNumber = Math.floor(100000 + Math.random() * 900000);
  return `${facilityCode}InspItemId${yyyymmddhhmmss}R${randomNumber}`;
}
