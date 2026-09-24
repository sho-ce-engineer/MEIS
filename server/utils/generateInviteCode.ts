import crypto from 'node:crypto';

export const generateInviteCode = (length = 16) => {
  return crypto.randomBytes(length).toString('hex');
};
