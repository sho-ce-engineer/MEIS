import { NuxtAuthHandler } from '#auth';
import { authOptions } from '~/server/v2/auth/authOptions';

export default NuxtAuthHandler(authOptions);
