import pool from '~/server/config/db';

interface issuesRequestBody {
  reported_date: Date;
  reporter: string;
  location: string;
  description: string;
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
      `[issue-add] Facility code not found for user_id: ${authenticatedUser.user_id}`,
    );
    throw createError({
      statusCode: 404,
      statusText: 'Not Found',
      data: { message: '施設コードが見つかりません。' },
    });
  }

  const facilityCode: string =
    AuthenticatedUserFacilityResult.rows[0].facility_code;

  const newReport = await readBody<issuesRequestBody>(event);
  const { reported_date, reporter, location, description, equipment_id } =
    newReport;

  if (
    !reported_date ||
    !reporter ||
    !location ||
    !description ||
    !equipment_id
  ) {
    throw createError({
      statusCode: 400,
      statusText: 'Bad Request',
      data: { message: '必須項目をすべて入力してください。' },
    });
  }

  const generateIssueId = (facilityCode: string): string => {
    const now = new Date();
    const japanDate = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    const isoString = japanDate.toISOString();
    const yyyymmddhhmmss = isoString.replace(/[-:T]/g, '').slice(0, 14);
    const randomNumber = Math.floor(100000 + Math.random() * 900000);
    return `${facilityCode}IssueId${yyyymmddhhmmss}R${randomNumber}`;
  };

  const query = `
    INSERT INTO issues (
        reported_date,
        reporter,
        location,
        description,
        equipment_id,
        facility_code,
        issue_id
    ) VALUES ($1::timestamptz AT TIME ZONE 'Asia/Tokyo', $2, $3, $4, $5, $6, $7)
  `;

  const values = [
    reported_date,
    reporter,
    location,
    description,
    equipment_id,
    facilityCode,
    generateIssueId(facilityCode),
  ];

  try {
    await pool.query(query, values);
    return sendNoContent(event);
  } catch (error) {
    console.error('[issue-add] Database insertion error:', error);
    throw createError({
      statusCode: 500,
      statusText: 'Internal Server Error',
      data: { message: 'サーバーエラーが発生しました。' },
    });
  }
});
