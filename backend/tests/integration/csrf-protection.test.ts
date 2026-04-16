import { describe, it, expect } from 'vitest';
import Fastify from 'fastify';
import fastifyCookie from '@fastify/cookie';
import fastifySession from '@fastify/session';
import { doubleCsrf } from 'csrf-csrf';
import cookieParser from 'cookie-parser';

// Minimal Fastify-Server mit CSRF
function buildTestServer(csrfSecret: string) {
  const server = Fastify();
  server.register(fastifyCookie);
  server.register(fastifySession, {
    secret: 'testtesttesttesttesttesttesttesttesttesttesttest',
    saveUninitialized: false,
    cookie: { httpOnly: true, secure: false, sameSite: 'lax', path: '/' },
  });
  const { doubleCsrfProtection, generateCsrfToken } = doubleCsrf({
    getSecret: () => csrfSecret,
    getSessionIdentifier: (req: any) => req.session?.id || '',
    cookieName: 'x-csrf-token',
    cookieOptions: { sameSite: 'lax', path: '/', secure: false, httpOnly: false },
    size: 64,
    ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
  });
  // Dummy-Login-Route initialisiert Session
    server.get('/login', async (request, reply) => {
      // @ts-expect-error Fastify-Test: session property is not typed on request, but present at runtime
    request.session.user = 'test';
    return { login: 'ok' };
  });
  server.get('/api/csrf-token', async (request, reply) => {
    // Patch: create minimal Express-like req/res for csrf-csrf
    const fakeReq = {
      method: request.method,
      cookies: request.cookies,
      headers: request.headers,
      session: request.session,
    };
    // Minimal fake res with .cookie()
    let tokenValue = '';
    const fakeRes = {
      cookie: (name: string, value: string) => {
        tokenValue = value;
      }
    };
    const token = generateCsrfToken(fakeReq, fakeRes);
    // Set cookie via Fastify
    reply.setCookie('x-csrf-token', token, { httpOnly: false, sameSite: 'lax', secure: false, path: '/' });
    return { csrfToken: token };
  });
  server.post('/api/protected', { preHandler: doubleCsrfProtection }, async () => {
    return { ok: true };
  });
  // Globaler Error-Handler für Debug-Ausgabe
  server.setErrorHandler((error, request, reply) => {
    // eslint-disable-next-line no-console
    console.error('Testserver-Fehler:', error);
    if (error && error.code === 'EBADCSRFTOKEN') {
      reply.status(403).send({ error: error.message || 'Forbidden' });
    } else {
      reply.status(500).send({ error: error.message || 'Internal Server Error' });
    }
  });
  return server;
}

describe('CSRF Protection (Double Submit Cookie Pattern)', () => {
  const csrfSecret = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  const server = buildTestServer(csrfSecret);

  it('should reject POST without CSRF token', async () => {
    const res = await server.inject({
      method: 'POST',
      url: '/api/protected',
    });
    expect(res.statusCode).toBe(403);
    // Fastify liefert nur "Forbidden" als Fehlertext, kein CSRF-Detail
    expect(res.json().error).toBeDefined();
  });

  it('should allow POST with valid CSRF token (cookie + header)', async () => {
    // 1. Session initialisieren (Dummy-Login)
    const loginRes = await server.inject({ method: 'GET', url: '/login' });
    const sessionCookie = loginRes.headers['set-cookie'];
    expect(sessionCookie).toBeTruthy();
    // 2. CSRF-Token holen mit Session-Cookie
    const tokenRes = await server.inject({ method: 'GET', url: '/api/csrf-token', headers: { cookie: sessionCookie } });
    expect(tokenRes.statusCode).toBe(200);
    const { csrfToken } = tokenRes.json();
    const setCookie = tokenRes.headers['set-cookie'];
    expect(csrfToken).toBeTruthy();
    // setCookie kann Array oder String sein
    const setCookieStr = Array.isArray(setCookie) ? setCookie.join(';') : setCookie;
    expect(setCookieStr).toMatch(/x-csrf-token/);
    // Extrahiere Session- und CSRF-Cookie
    const cookies = [sessionCookie, setCookie].flat().filter(Boolean);
    const cookieHeader = cookies.map(c => c.split(';')[0]).join('; ');
    // 3. POST mit Token als Header und beiden Cookies
    const res = await server.inject({
      method: 'POST',
      url: '/api/protected',
      headers: { 'x-csrf-token': csrfToken, cookie: cookieHeader },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().ok).toBe(true);
  });

  it('should reject POST with missing or invalid CSRF token', async () => {
    // 1. Session initialisieren (Dummy-Login)
    const loginRes = await server.inject({ method: 'GET', url: '/login' });
    const sessionCookie = loginRes.headers['set-cookie'];
    expect(sessionCookie).toBeTruthy();
    // 2. CSRF-Token holen mit Session-Cookie
    const tokenRes = await server.inject({ method: 'GET', url: '/api/csrf-token', headers: { cookie: sessionCookie } });
    const setCookie2 = tokenRes.headers['set-cookie'];
    const cookies2 = [sessionCookie, setCookie2].map(c => Array.isArray(c) ? c[0] : c).filter(Boolean);
    const cookieHeader2 = cookies2.map(c => c.split(';')[0]).join('; ');
    // 3. Falscher Token
    const res2 = await server.inject({
      method: 'POST',
      url: '/api/protected',
      headers: { 'x-csrf-token': 'invalid', cookie: cookieHeader2 },
    });
    expect(res2.statusCode).toBe(403);
    expect(res2.json().error).toBeDefined();
  });
});
