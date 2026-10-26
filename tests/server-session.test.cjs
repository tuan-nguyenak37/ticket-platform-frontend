const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const cookie = 'header.payload.signature';
const user = { user_id: 'test-user', status: 'ACTIVE', role: 'USER' };
function load(filename, dependencies, scope = {}) {
  const code = ts.transpileModule(fs.readFileSync(path.resolve(__dirname, '..', filename), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports, Response, Headers, URL, AbortSignal, process: { env: {} }, ...scope, require: name => {
    if (!(name in dependencies)) throw new Error(`Unexpected dependency ${name}`);
    return dependencies[name];
  } });
  return exports;
}
function server(session, fetcher) {
  return load('lib/auth/server-session.ts', {
    'server-only': {}, 'next/headers': { cookies: async () => ({ get: () => session ? { value: session } : undefined }) },
  }, { fetch: fetcher });
}
test('SSR never authenticates from cookie presence alone and distinguishes revoked session from outage', async () => {
  for (const session of [null, 'forged']) {
    const result = await server(session, () => { throw new Error('Unexpected fetch'); }).getServerSession();
    assert.equal(result.status, 'unauthenticated');
  }
  for (const [status, expected] of [[401, 'unauthenticated'], [503, 'error']]) {
    const result = await server(cookie, async () => new Response('{}', { status })).getServerSession();
    assert.equal(result.status, expected);
    assert.equal(result.user, null);
  }
});
test('SSR validates refresh JWT server-side without rotation or exposing credentials', async () => {
  const result = await server(cookie, async (url, options) => {
    assert.equal(url, 'http://localhost:7000/api/auth/browser/session');
    assert.equal(options.headers.Cookie, `ticketverse_refresh=${cookie}`);
    assert.equal(options.cache, 'no-store');
    assert.equal(options.redirect, 'error');
    return Response.json({ success: true, data: { user } });
  }).getServerSession();
  assert.equal(result.status, 'authenticated');
  assert.equal(result.user.user_id, user.user_id);
  assert.deepEqual(Object.keys(result).sort(), ['status', 'user']);
});
test('SSR rejects invalid or suspended account responses', async () => {
  for (const profile of [null, {}, { ...user, status: 'SUSPENDED' }]) {
    const result = await server(cookie, async () => Response.json({ success: true, data: { user: profile } })).getServerSession();
    assert.equal(result.status, 'error');
  }
});

test('SSR rotation conflict asks the client to restore instead of showing a false logout', async () => {
  const result = await server(cookie, async () => new Response('{}', { status: 409 })).getServerSession();
  assert.equal(result.status, 'restoring');
  assert.equal(result.user, null);
});

test('proxy forwards refresh only to auth and never relays cookie changes on conflict or failure', async () => {
  const routes = proxy(async (url, options) => {
    assert.equal(options.headers.get('cookie'), `ticketverse_refresh=${cookie}`);
    return new Response('{}', { status: 409, headers: { 'set-cookie': 'ticketverse_refresh=; Path=/' } });
  });
  const response = await routes.POST(request('POST', { origin: 'http://localhost:3000' }), context('auth/browser/refresh'));
  assert.equal(response.status, 409);
  assert.equal(response.headers.get('set-cookie'), null);
});

function proxy(fetcher) {
  return load('app/api/backend/[...path]/route.ts', {
    '@/lib/auth/server-session': { backendUrl: () => 'http://internal:7000/api', REFRESH_COOKIE: 'ticketverse_refresh' },
  }, { fetch: fetcher });
}
function request(method = 'GET', headers = {}, value = cookie, search = '') {
  const native = new Request(`http://localhost:3000/api/backend/test${search}`, { method, headers, ...(method === 'POST' ? { body: '{}' } : {}) });
  native.nextUrl = new URL(native.url);
  native.cookies = { get: () => value ? { value } : undefined };
  return native;
}
const context = endpoint => ({ params: Promise.resolve({ path: endpoint.split('/') }) });
test('proxy rejects cross-origin writes, path traversal, JWT routes and forged callback traffic', async () => {
  const routes = proxy(() => { throw new Error('Must not reach backend'); });
  assert.equal((await routes.POST(request('POST', { origin: 'https://evil.example' }), context('auth/browser/login'))).status, 403);
  assert.equal((await routes.POST(request('POST'), context('v1/orders'))).status, 403);
  assert.equal((await routes.GET(request('GET', { 'sec-fetch-site': 'cross-site' }), context('users/me'))).status, 403);
  for (const endpoint of ['../users', '%2e%2e/users', 'v1/https:%2f%2fevil.test']) {
    assert.equal((await routes.GET(request(), context(endpoint))).status, 400);
  }
  for (const endpoint of ['auth/login', 'auth/refresh', 'v1/payments/vnpay/ipn', 'v1/payments/vnpay/return']) {
    assert.equal((await routes.GET(request(), context(endpoint))).status, 404);
  }
});

test('proxy rejects oversized uploads with or without Content-Length before calling backend', async () => {
  const routes = proxy(() => { throw new Error('Must not reach backend'); });
  const headers = { origin: 'http://localhost:3000', 'content-length': String(51 * 1024 * 1024 + 1) };
  assert.equal((await routes.POST(request('POST', headers), context('v1/events/upload'))).status, 413);
  let cancelled = false;
  const upload = request('POST', { origin: 'http://localhost:3000' });
  const chunk = new Uint8Array(1024 * 1024);
  let sent = 0;
  Object.defineProperty(upload, 'body', { value: new ReadableStream({
    pull(controller) {
      controller.enqueue(chunk);
      if (++sent === 53) controller.close();
    },
    cancel() { cancelled = true; },
  }) });
  assert.equal((await routes.POST(upload, context('v1/events/upload'))).status, 413);
  assert.equal(cancelled, true);
});
test('proxy forwards Bearer but never refresh cookie to business APIs, preserving idempotency', async () => {
  let calls = 0;
  const routes = proxy(async (url, options) => {
    calls++;
    assert.equal(url, 'http://internal:7000/api/v1/orders?page=2');
    assert.equal(options.headers.get('cookie'), null);
    assert.equal(options.headers.get('authorization'), 'Bearer access-token');
    assert.equal(options.headers.get('x-forwarded-for'), null);
    assert.equal(options.headers.get('idempotency-key'), 'order-key');
    assert.equal(options.cache, 'no-store');
    assert.equal(options.redirect, 'manual');
    return Response.json({ success: true, data: { orderId: 'same-order' } });
  });
  const response = await routes.POST(request('POST', { origin: 'http://localhost:3000', cookie: 'refresh_token=must-not-leak', authorization: 'Bearer access-token', 'idempotency-key': 'order-key', 'x-forwarded-for': '8.8.8.8' }, cookie, '?page=2'), context('v1/orders'));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(response.headers.get('vary'), 'Cookie, Authorization');
  assert.equal((await response.json()).data.orderId, 'same-order');
  assert.equal(calls, 1);
});
test('proxy only accepts auth cookie changes on successful browser auth responses', async () => {
  const routes = proxy(async () => new Response('pdf-data', { headers: {
    'set-cookie': `ticketverse_refresh=${cookie}; Path=/; HttpOnly; SameSite=Lax`,
    'content-type': 'application/pdf', 'content-disposition': 'attachment; filename=ticket.pdf', 'retry-after': '60',
  } }));
  const response = await routes.GET(request(), context('v1/tickets/test/file'));
  assert.equal(response.headers.get('set-cookie'), null);
  const authResponse = await routes.POST(request('POST', { origin: 'http://localhost:3000' }), context('auth/browser/refresh'));
  assert.ok(authResponse.headers.get('set-cookie').includes('HttpOnly'));
  assert.equal(response.headers.get('content-disposition'), 'attachment; filename=ticket.pdf');
  assert.equal(response.headers.get('retry-after'), '60');
  assert.equal(await response.text(), 'pdf-data');
  const legacy = await proxy(async () => new Response('{}', { headers: { 'set-cookie': 'refresh_token=secret' } })).GET(request(), context('users/me'));
  assert.equal(legacy.headers.get('set-cookie'), null);
});
test('proxy does not erase a newer login cookie on late 401, follow redirects, or retry a failed payment', async () => {
  let calls = 0;
  const denied = await proxy(async () => new Response('{}', { status: 401 })).GET(request(), context('users/me'));
  assert.equal(denied.status, 401);
  assert.equal(denied.headers.get('set-cookie'), null);
  const redirect = await proxy(async () => new Response(null, { status: 302, headers: { location: 'https://evil.example' } })).GET(request(), context('users/me'));
  assert.equal(redirect.status, 502);
  const failed = await proxy(async () => { calls++; throw new Error('offline'); }).POST(request('POST', { origin: 'http://localhost:3000' }), context('v1/payments/vnpay/orders/order'));
  assert.equal(failed.status, 503);
  assert.equal(calls, 1);
});
