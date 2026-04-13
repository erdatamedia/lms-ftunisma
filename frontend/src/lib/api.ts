import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

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

export function getApiErrorMessage(error: any): string {
  if (error?.response?.data?.message) {
    const message = error.response.data.message;
    return Array.isArray(message) ? message.join(', ') : message;
  }
  return error?.message || 'Terjadi kesalahan';
}
