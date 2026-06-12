import { sendNoContent } from 'h3';
import pool from '~/server/config/db';

interface UpdateEquipmentRequestBody {
  updatedItem: {
    equipment_type: string;
    equipment_manufacturer: string;
    equipment_name: string;
    equipment_model: string;
    equipment_serial_number: string;
    equipment_storage_location: string;
    acquisition_date: string | null;
    equipment_status: string;
    equipment_maintenance_contract: string;
    equipment_notes: string;
    equipment_id: string;
  };
}

export default defineEventHandler(async (event) => {
  // 認証ユーザーの取得
  const authenticatedUser = getAuthenticatedUser(event);

  // 認証ユーザーの施設コードを取得
  const authenticatedUserQuery = `
    SELECT facility_code FROM users
    WHERE user_id = $1
  `;

  const AuthenticatedUserFacilityResult = await pool.query(
    authenticatedUserQuery,
    [authenticatedUser.user_id],
  );
  if (AuthenticatedUserFacilityResult.rowCount === 0) {
    console.error(
      `[update-record] Facility code not found for user_id: ${authenticatedUser.user_id}`,
    );
    throw createError({
      statusCode: 404,
      statusText: 'Not Found',
      data: { message: '施設コードが見つかりません。' },
    });
  }

  const facilityCode: string =
    AuthenticatedUserFacilityResult.rows[0].facility_code;

  const { updatedItem } = await readBody<UpdateEquipmentRequestBody>(event);

  const {
    equipment_type,
    equipment_manufacturer,
    equipment_name,
    equipment_model,
    equipment_serial_number,
    equipment_storage_location,
    acquisition_date,
    equipment_status,
    equipment_maintenance_contract,
    equipment_notes,
    equipment_id,
  } = updatedItem;

  let result;

  try {
    result = await pool.query(
      `
      UPDATE equipment_ledger
      SET
        equipment_type = $1,
        equipment_manufacturer = $2,
        equipment_name = $3,
        equipment_model = $4,
        equipment_serial_number = $5,
        acquisition_date = $6,
        equipment_status = $7,
        equipment_maintenance_contract = $8,
        equipment_notes = $9,
        equipment_storage_location = $10
      WHERE equipment_id = $11
      AND facility_code = $12
      `,
      [
        equipment_type,
        equipment_manufacturer,
        equipment_name,
        equipment_model,
        equipment_serial_number,
        acquisition_date,
        equipment_status,
        equipment_maintenance_contract,
        equipment_notes,
        equipment_storage_location,
        equipment_id,
        facilityCode,
      ],
    );
  } catch (error) {
    console.error('[update-record]Update error:', error);
    throw createError({
      statusCode: 500,
      statusText: 'Internal Server Error',
      data: { message: 'サーバーエラーが発生しました。' },
    });
  }

  if (!result?.rowCount) {
    throw createError({
      statusCode: 404,
      statusText: 'Not Found',
      data: { message: 'Record not found or no changes made' },
    });
  }

  return sendNoContent(event);
});
