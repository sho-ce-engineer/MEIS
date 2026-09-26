import type { FetchError } from 'ofetch';
import type { ApiError } from '~/types/api-error';

export const getApiErrorMessage = (error: unknown, fallback: string) =>
  (error as FetchError<Partial<ApiError>> | undefined)?.data?.message ??
  fallback;
