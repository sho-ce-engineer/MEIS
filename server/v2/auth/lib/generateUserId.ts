import { format } from 'date-fns';

export const generateUserId = (facilityCode: string) =>
  `${facilityCode}${format(new Date(), 'yyyyMMddHHmmss')}`;
