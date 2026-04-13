import { api, getAuthHeaders } from './api';

export async function fetchMe() {
  const { data } = await api.get('/auth/me', {
    headers: getAuthHeaders(),
  });
  return data;
}
