import axios, { AxiosError } from 'axios';

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

export interface ApiErrorBody {
  error?: string;
  status?: number;
}

export function errorMessage(e: unknown, fallback = 'Something went wrong'): string {
  if (e instanceof AxiosError) {
    const data = e.response?.data as ApiErrorBody | undefined;
    if (data?.error) return data.error;
    if (e.message) return e.message;
  }
  if (e instanceof Error) return e.message;
  return fallback;
}
