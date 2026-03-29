import { API_BASE } from './theme';

let _token = localStorage.getItem('clear-token') || null;

export function setToken(t) { _token = t; if (t) localStorage.setItem('clear-token', t); else localStorage.removeItem('clear-token'); }
export function getToken() { return _token; }
export function isAuthenticated() { return !!_token; }

export async function api(path, opts = {}) {
  const { method = 'GET', body, raw = false } = opts;
  const headers = { 'Content-Type': 'application/json' };
  if (_token) headers['Authorization'] = `Bearer ${_token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) { setToken(null); window.location.href = '/login'; throw new Error('Unauthorized'); }
  if (raw) return res;
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  const text = await res.text();
  if (!text) return null;
  return JSON.parse(text);
}

export async function login(email, password) {
  const data = await api('/auth/login', { method: 'POST', body: { email, password } });
  if (data?.token) { setToken(data.token); return data; }
  throw new Error('No token received');
}

export function logout() { setToken(null); window.location.href = '/login'; }

// SWR fetcher
export const fetcher = (url) => api(url);
