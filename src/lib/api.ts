/**
 * The single door to the Django API.
 *
 * Everything the app knows about HTTP lives here: the base URL, the JWT pair,
 * refreshing an expired access token and turning error bodies into a message
 * the UI can show.
 */
const BASE_URL: string = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api';
const TOKENS_KEY = 'trimir:tokens';

export interface Tokens {
  access: string;
  refresh: string;
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

type Query = Record<string, string | number | boolean | undefined>;

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly data: unknown,
  ) {
    super(errorMessage(data, status));
  }
}

function errorMessage(data: unknown, status: number): string {
  if (typeof data === 'string' && data) return data;
  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;
    const first = record.detail ?? Object.values(record)[0];
    if (Array.isArray(first)) return String(first[0]);
    if (typeof first === 'string') return first;
  }
  return `Request failed (${status}).`;
}

export function getTokens(): Tokens | null {
  try {
    const raw = localStorage.getItem(TOKENS_KEY);
    return raw ? (JSON.parse(raw) as Tokens) : null;
  } catch {
    return null;
  }
}

export function setTokens(tokens: Tokens | null): void {
  if (tokens) localStorage.setItem(TOKENS_KEY, JSON.stringify(tokens));
  else localStorage.removeItem(TOKENS_KEY);
}

function buildUrl(path: string, query?: Query): string {
  const url = new URL(`${BASE_URL}${path}`);
  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== '') url.searchParams.set(key, String(value));
  });
  return url.toString();
}

async function refreshAccessToken(): Promise<string | null> {
  const tokens = getTokens();
  if (!tokens?.refresh) return null;
  const response = await fetch(buildUrl('/auth/refresh/'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh: tokens.refresh }),
  });
  if (!response.ok) {
    setTokens(null);
    return null;
  }
  const data = (await response.json()) as { access: string };
  setTokens({ ...tokens, access: data.access });
  return data.access;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  query?: Query;
  /** Skip the Authorization header (login, register). */
  anonymous?: boolean;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, query, anonymous } = options;
  const isForm = body instanceof FormData;

  const send = (accessToken: string | null): Promise<Response> =>
    fetch(buildUrl(path, query), {
      method,
      headers: {
        ...(isForm || body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: isForm ? body : body === undefined ? undefined : JSON.stringify(body),
    });

  let response = await send(anonymous ? null : (getTokens()?.access ?? null));

  if (response.status === 401 && !anonymous) {
    const access = await refreshAccessToken();
    if (access) response = await send(access);
  }

  if (response.status === 204) return undefined as T;

  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new ApiError(response.status, payload);
  return payload as T;
}

/** Reads every page of a paginated endpoint (catalogs are small here). */
export async function requestAll<T>(path: string, query?: Query): Promise<T[]> {
  const first = await request<Paginated<T>>(path, { query: { page_size: 200, ...query } });
  const items = [...first.results];
  let next = first.next;
  while (next) {
    const page = await request<Paginated<T>>(next.replace(BASE_URL, ''));
    items.push(...page.results);
    next = page.next;
  }
  return items;
}

/** Builds a multipart body, skipping empty values and appending only real files. */
export function formData(fields: Record<string, unknown>): FormData {
  const data = new FormData();
  Object.entries(fields).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    if (value instanceof File) data.append(key, value);
    else if (Array.isArray(value)) data.append(key, JSON.stringify(value));
    else data.append(key, String(value));
  });
  return data;
}
