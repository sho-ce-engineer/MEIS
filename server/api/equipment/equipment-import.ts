import pool from '~/server/config/db';

interface importRequestBody {
  equipment_id: string;
  equipment_type: string;
  equipment_manufacturer: string;
  equipment_name: string;
  equipment_model: string;
  equipment_serial_number: string;
  acquisition_date: string;
  equipment_notes: string;
}

export default defineEventHandler(async (event) => {
  // 認証ユーザーの取得
  const authenticatedUser = getAuthenticatedUser(event);

  // 認証ユーザーの施設コードおよびユーザー権限を取得
  const authenticatedUserQuery = `
    SELECT
      facility_code
    FROM users
    WHERE user_id = $1
  `;

  const AuthenticatedUserFacilityResult = await pool.query(
    authenticatedUserQuery,
    [authenticatedUser.user_id],
  );
  if (AuthenticatedUserFacilityResult.rowCount === 0) {
    console.error(
      `[equipment-import] Facility code not found for user_id: ${authenticatedUser.user_id}`,
    );
    throw createError({
      statusCode: 404,
      statusText: 'Not Found',
      data: { message: '施設コードが見つかりません。' },
    });
  }

  const facilityCode: string =
    AuthenticatedUserFacilityResult.rows[0].facility_code;

  const { ledgerData } = await readBody<{ ledgerData: importRequestBody[] }>(
    event,
  );
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    for (const data of ledgerData) {
      await client.query(
        `INSERT INTO equipment_ledger (
        equipment_id,
        equipment_type,
        equipment_manufacturer,
        equipment_name,
        equipment_model,
        equipment_serial_number,
        acquisition_date,
        equipment_notes,
        facility_code
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (equipment_id, facility_code) DO NOTHING`,
        [
          data.equipment_id,
          data.equipment_type,
          data.equipment_manufacturer,
          data.equipment_name,
          data.equipment_model,
          data.equipment_serial_number,
          data.acquisition_date,
          data.equipment_notes,
          facilityCode,
        ],
      );
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[equipment-import] Transaction failed:', error);
    throw createError({
      statusCode: 500,
      statusText: 'Internal Server Error',
      data: { message: 'データのインポートに失敗しました。' },
    });
  } finally {
    client.release();
  }

  return sendNoContent(event);
});
