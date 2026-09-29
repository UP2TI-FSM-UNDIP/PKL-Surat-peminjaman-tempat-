import { AxiosError } from 'axios';

type ApiErrorBody = {
  message?: string;
  errors?: Record<string, string[] | string>;
};

/** Status HTTP dari error axios (undefined jika bukan error HTTP). */
export function getErrorStatus(err: unknown): number | undefined {
  return err instanceof AxiosError ? err.response?.status : undefined;
}

/** Pesan dari backend (`message`), atau fallback. */
export function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof AxiosError) {
    const body = err.response?.data as ApiErrorBody | undefined;
    if (body?.message) return body.message;
  }
  return fallback;
}

/** Gabungan pesan validasi Laravel (`errors`), atau null jika tidak ada. */
export function getValidationErrors(err: unknown): string | null {
  if (!(err instanceof AxiosError)) return null;
  const errors = (err.response?.data as ApiErrorBody | undefined)?.errors;
  return errors ? Object.values(errors).flat().join(', ') : null;
}

/** Request dibatalkan (AbortController / axios cancel). */
export function isCanceledError(err: unknown): boolean {
  return err instanceof Error && (err.name === 'AbortError' || err.name === 'CanceledError');
}
