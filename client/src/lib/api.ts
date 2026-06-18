import { apiPath } from './config';

const TOKEN_KEY = 'kv_token';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (typeof window === 'undefined') return;
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
  else window.localStorage.removeItem(TOKEN_KEY);
}

type ApiOptions = Omit<RequestInit, 'body'> & { body?: unknown };

export async function api<T = unknown>(path: string, opts: ApiOptions = {}): Promise<T> {
  const token = getToken();
  const isForm = opts.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(opts.body !== undefined && !isForm ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((opts.headers as Record<string, string>) || {}),
  };
  const res = await fetch(apiPath(path), {
    ...opts,
    headers,
    body: opts.body === undefined ? undefined : isForm ? (opts.body as FormData) : JSON.stringify(opts.body),
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(detail.error || 'Request failed');
  }
  if (res.status === 204) return null as T;
  return res.json() as Promise<T>;
}

// Upload image files, returns their public URLs.
export async function uploadPhotos(files: File[]): Promise<string[]> {
  if (!files.length) return [];
  const form = new FormData();
  files.forEach((f) => form.append('photos', f));
  const { urls } = await api<{ urls: string[] }>('/api/uploads', { method: 'POST', body: form });
  return urls;
}
