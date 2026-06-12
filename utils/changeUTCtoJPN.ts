export const changeUTCtoJPN = (date: Date | undefined): string => {
  if (!date) return '';
  const japanDate = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  const yyyymmddhhmmss = japanDate.toISOString().slice(0, 19).replace('T', ' ');
  return yyyymmddhhmmss;
};
