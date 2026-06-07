import axios from 'axios';

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: API_URL,
});

export function getAuthHeaders() {
  if (typeof window === 'undefined') {
    return {};
  }

  const token = localStorage.getItem('accessToken');

  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};
}

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error) && error.response?.data?.message) {
    const message = error.response.data.message as unknown;
    return Array.isArray(message) ? message.join(', ') : String(message);
  }
  return error instanceof Error ? error.message : 'Terjadi kesalahan';
}
