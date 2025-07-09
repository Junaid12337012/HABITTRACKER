import { getToken } from '../utils/token';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

type Options = RequestInit & { auth?: boolean };

async function request<T>(path: string, options: Options = {}): Promise<T> {
  const { auth, headers, ...rest } = options;
  const reqHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    ...headers,
  };
  if (auth) {
    const token = getToken();
    if (token) reqHeaders['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${BASE_URL}${path}`, { ...rest, headers: reqHeaders });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || res.statusText);
  }
  return (await res.json()) as T;
}

/* -------------------- AUTH -------------------- */
export const authApi = {
  status: () => request<{ isSetup: boolean }>('/auth/status'),
  setup: (password: string) => request<{ token: string }>('/auth/setup', {
    method: 'POST',
    body: JSON.stringify({ password }),
  }),
  login: (password: string) => request<{ token: string }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ password }),
  }),
  changePassword: (currentPassword: string, newPassword: string) =>
    request<{ message: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
      auth: true,
    }),
  deleteAccount: () =>
    request<{ message: string }>('/auth/delete-account', {
      method: 'DELETE',
      auth: true,
    }),
};

/* -------------------- OTHER SERVICES (examples) -------------------- */
// export const dataApi = { ... }
