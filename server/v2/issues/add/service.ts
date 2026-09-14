import { formatInTimeZone } from 'date-fns-tz';
import { db } from '~/server/db';
import { issues } from '~/server/db/schema';

export interface AddIssueParams {
  facilityCode: string;
  reportedDate: string;
  reporter: string;
  location: string;
  description: string;
  equipmentId: string;
}

function generateIssueId(facilityCode: string): string {
  const yyyymmddhhmmss = formatInTimeZone(
    new Date(),
    'Asia/Tokyo',
    'yyyyMMddHHmmss',
  );
  const randomNumber = Math.floor(100000 + Math.random() * 900000);
  return `${facilityCode}IssueId${yyyymmddhhmmss}R${randomNumber}`;
}

export async function addIssue({
  facilityCode,
  reportedDate,
  reporter,
  location,
  description,
  equipmentId,
}: AddIssueParams) {
  await db.insert(issues).values({
    issueId: generateIssueId(facilityCode),
    reportedDate,
    reporter,
    location,
    description,
    equipmentId,
    facilityCode,
  });
}
