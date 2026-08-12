import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ApiError, formData, getTokens, request, requestAll, setTokens } from './api';
import { mockApi, paginated, signIn } from '@/test/api-mock';

beforeEach(() => {
  vi.unstubAllGlobals();
  setTokens(null);
});

describe('api client', () => {
  it('sends the access token as a Bearer header', async () => {
    signIn('token-123');
    const { calls } = mockApi({ 'GET /auth/me/': { body: { id: 1 } } });
    await request('/auth/me/');
    expect(calls[0].headers.Authorization).toBe('Bearer token-123');
  });

  it('omits the token for anonymous calls', async () => {
    signIn();
    const { calls } = mockApi({ 'POST /auth/login/': { body: {} } });
    await request('/auth/login/', { method: 'POST', body: {}, anonymous: true });
    expect(calls[0].headers.Authorization).toBeUndefined();
  });

  it('refreshes an expired access token once and retries', async () => {
    signIn('stale', 'refresh-1');
    let meCalls = 0;
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const path = new URL(String(input)).pathname;
      if (path.endsWith('/auth/refresh/')) {
        return { ok: true, status: 200, json: async () => ({ access: 'fresh' }) } as Response;
      }
      meCalls += 1;
      const unauthorized = meCalls === 1;
      return {
        ok: !unauthorized,
        status: unauthorized ? 401 : 200,
        json: async () => (unauthorized ? { detail: 'expired' } : { id: 1 }),
      } as Response;
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(request('/auth/me/')).resolves.toEqual({ id: 1 });
    expect(getTokens()?.access).toBe('fresh');
    expect(meCalls).toBe(2);
  });

  it('drops the session when the refresh token is rejected', async () => {
    signIn('stale', 'dead');
    mockApi({ 'GET /auth/me/': { status: 401, body: {} } });
    await expect(request('/auth/me/')).rejects.toBeInstanceOf(ApiError);
    expect(getTokens()).toBeNull();
  });

  it('turns a field error body into a readable message', async () => {
    mockApi({ 'POST /playlists/': { status: 400, body: { name: ['This field is required.'] } } });
    await expect(request('/playlists/', { method: 'POST', body: {} })).rejects.toThrow(
      'This field is required.',
    );
  });

  it('follows pagination in requestAll', async () => {
    const { calls } = mockApi({ 'GET /songs/': { body: paginated([{ id: 1 }, { id: 2 }]) } });
    const items = await requestAll<{ id: number }>('/songs/');
    expect(items).toHaveLength(2);
    expect(calls[0].path).toBe('/songs/');
  });

  it('skips empty values when building a multipart body', () => {
    const body = formData({ title: 'Song', genre: '', cover: null, tags: ['a', 'b'] });
    expect(body.get('title')).toBe('Song');
    expect(body.get('genre')).toBeNull();
    expect(body.get('cover')).toBeNull();
    expect(body.get('tags')).toBe('["a","b"]');
  });
});
