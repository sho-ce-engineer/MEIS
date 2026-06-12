import pool from '~/server/config/db';
import { sendNoContent } from 'h3';

interface NewEquipmentRequestBody {
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
      `[newAdd] Facility code not found for user_id: ${authenticatedUser.user_id}`,
    );
    throw createError({
      statusCode: 404,
      statusText: 'Not Found',
      data: { message: '施設コードが見つかりません。' },
    });
  }

  const facilityCode: string =
    AuthenticatedUserFacilityResult.rows[0].facility_code;

  const newItem = await readBody<NewEquipmentRequestBody>(event);

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
  } = newItem;

  if (!equipment_id || !equipment_name) {
    throw createError({
      statusCode: 400,
      statusText: 'Bad Request',
      data: { message: '院内管理IDと機器名称は必須項目です。' },
    });
  }

  const query = `
    INSERT INTO equipment_ledger (
      equipment_type,
      equipment_manufacturer,
      equipment_name,
      equipment_model,
      equipment_serial_number,
      acquisition_date,
      equipment_status,
      equipment_maintenance_contract,
      equipment_notes,
      facility_code,
      equipment_id,
      equipment_storage_location
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
  `;

  const values = [
    equipment_type,
    equipment_manufacturer,
    equipment_name,
    equipment_model,
    equipment_serial_number,
    acquisition_date,
    equipment_status,
    equipment_maintenance_contract,
    equipment_notes,
    facilityCode,
    equipment_id,
    equipment_storage_location,
  ];

  try {
    await pool.query(query, values);
    return sendNoContent(event);
  } catch (error: any) {
    if (error.code === '23505') {
      throw createError({
        statusCode: 409,
        statusText: 'Conflict',
        data: { message: '同じ院内管理IDがすでに登録されています。' },
      });
    }
    console.error('[newAdd] Database insertion error:', error);
    throw createError({
      statusCode: 500,
      statusText: 'Internal Server Error',
      data: { message: 'サーバーエラーが発生しました。' },
    });
  }
});
