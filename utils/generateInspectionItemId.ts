export const generateInspectionItemId = (facilityCode: string): string => {
  const now = new Date();
  const japanDate = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const isoString = japanDate.toISOString();
  const yyyymmddhhmmss = isoString.replace(/[-:T]/g, '').slice(0, 14);
  const randomNumber = Math.floor(100000 + Math.random() * 900000);
  return `${facilityCode}InspItemId${yyyymmddhhmmss}R${randomNumber}`;
};
