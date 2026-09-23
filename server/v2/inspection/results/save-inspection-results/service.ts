import { db } from '~/server/db';
import { inspectionResults } from '~/server/db/schema';

export interface SaveInspectionResultItem {
  resultId: string;
  userId: string;
  inspectionItemId: string;
  equipmentId: string;
  equipmentSerialNumber: string;
  result: string | number;
  notes?: string;
  inspectionDate: string;
}

export interface SaveInspectionResultsParams {
  facilityCode: string;
  results: SaveInspectionResultItem[];
}

export async function saveInspectionResults({
  facilityCode,
  results,
}: SaveInspectionResultsParams) {
  await db.transaction(async (tx) => {
    for (const item of results) {
      await tx.insert(inspectionResults).values({
        resultId: item.resultId,
        facilityCode,
        userId: item.userId,
        inspectionItemId: item.inspectionItemId,
        equipmentId: item.equipmentId,
        equipmentSerialNumber: item.equipmentSerialNumber,
        result: item.result.toString(),
        inspectionDate: item.inspectionDate,
        resultNotes: item.notes,
      });
    }
  });
}
