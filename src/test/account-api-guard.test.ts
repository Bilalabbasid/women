/** @vitest-environment node */
import { describe, it, expect, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as healthGet, POST as healthPost } from '@/app/api/user/health-data/route';
import { GET as exportGet } from '@/app/api/user/export/route';
import { POST as consentPost } from '@/app/api/user/consent/route';
import { POST as loginPost } from '@/app/api/auth/login/route';
import { GET as cronGet } from '@/app/api/cron/data-deletion/route';
import { POST as deleteAccountPost } from '@/app/api/user/delete-account/route';

const saved = { ...process.env };
const setEnv = (vars: Record<string, string | undefined>) => {
  for (const [k, v] of Object.entries(vars)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
};
afterEach(() => {
  process.env = { ...saved };
});

const req = (url: string, init?: ConstructorParameters<typeof NextRequest>[1]) => new NextRequest(`http://localhost${url}`, init);

describe('account APIs are closed unless accounts are really available', () => {
  it('return 404 for every route when FEATURE_LOGIN is off (the default)', async () => {
    setEnv({ FEATURE_LOGIN: undefined, SITE_ENV: 'staging' });
    expect((await healthGet(req('/api/user/health-data/', { headers: { 'x-user-id': 'u1' } }))).status).toBe(404);
    expect((await exportGet(req('/api/user/export/', { headers: { 'x-user-id': 'u1' } }))).status).toBe(404);
    expect((await loginPost(req('/api/auth/login/', { method: 'POST', body: JSON.stringify({ email: 'a@b.co' }) }))).status).toBe(404);
  });

  it('refuse production even with FEATURE_LOGIN on, because only a mock backend exists', async () => {
    setEnv({ FEATURE_LOGIN: 'true', SITE_ENV: 'production' });
    expect((await healthGet(req('/api/user/health-data/', { headers: { 'x-user-id': 'u1' } }))).status).toBe(503);
  });

  it('never take the user id from the URL', async () => {
    setEnv({ FEATURE_LOGIN: 'true', SITE_ENV: 'staging' });
    expect((await healthGet(req('/api/user/health-data/?userId=u1'))).status).toBe(400);
    expect((await exportGet(req('/api/user/export/?userId=u1'))).status).toBe(400);
  });

  it('work against the mock in a test environment, and refuse health data without consent', async () => {
    setEnv({ FEATURE_LOGIN: 'true', SITE_ENV: 'staging' });
    const login = await loginPost(req('/api/auth/login/', { method: 'POST', body: JSON.stringify({ email: 'test@example.com' }) }));
    expect(login.status).toBe(200);
    const { user } = await login.json();
    const noConsent = await healthPost(req('/api/user/health-data/', { method: 'POST', body: JSON.stringify({ userId: user.id, payload: { x: 1 } }) }));
    expect(noConsent.status).toBe(403);
    const badRetention = await consentPost(req('/api/user/consent/', { method: 'POST', body: JSON.stringify({ userId: user.id, retentionDays: 45 }) }));
    expect(badRetention.status).toBe(400);
    const withdrawn = await consentPost(req('/api/user/consent/', { method: 'POST', body: JSON.stringify({ userId: user.id, withdraw: true }) }));
    expect(withdrawn.status).toBe(200);
  });

  it('deletes an account only by the x-user-id header, never a body field', async () => {
    setEnv({ FEATURE_LOGIN: 'true', SITE_ENV: 'staging' });
    const login = await loginPost(req('/api/auth/login/', { method: 'POST', body: JSON.stringify({ email: 'delete-me@example.com' }) }));
    const { user } = await login.json();
    const byBodyOnly = await deleteAccountPost(req('/api/user/delete-account/', { method: 'POST', body: JSON.stringify({ userId: user.id }) }));
    expect(byBodyOnly.status).toBe(400);
    const byHeader = await deleteAccountPost(req('/api/user/delete-account/', { method: 'POST', headers: { 'x-user-id': user.id } }));
    expect(byHeader.status).toBe(200);
  });

  it('cron deletion fails closed in production without CRON_SECRET', async () => {
    setEnv({ SITE_ENV: 'production', CRON_SECRET: undefined });
    expect((await cronGet(req('/api/cron/data-deletion/'))).status).toBe(401);
    setEnv({ SITE_ENV: 'production', CRON_SECRET: 's3cret' });
    expect((await cronGet(req('/api/cron/data-deletion/', { headers: { authorization: 'Bearer s3cret' } }))).status).toBe(200);
  });
});
