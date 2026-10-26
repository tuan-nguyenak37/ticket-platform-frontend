import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const axios = require('axios');
const user = { user_id: 'test-user', email: 'test@example.com', full_name: 'Test User', role: 'USER', status: 'ACTIVE' };
const auth = (overrides = {}) => ({ user, accessToken: 'access-current', accessTokenExpiresAt: new Date(Date.now() + 3600_000).toISOString(), ...overrides });
const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };

function harness(handler, globals = {}) {
  const calls = [];
  const adapter = async config => {
    calls.push({ url: config.url, token: config.headers.Authorization, baseURL: config.baseURL });
    const result = await handler(config, calls);
    const status = result.status ?? 200;
    const response = { config, status, statusText: '', headers: {}, data: {
      success: status < 400, statusCode: status, message: 'test response', code: result.code, data: result.data,
    } };
    if (status >= 400) throw new axios.AxiosError('request failed', 'ERR_BAD_RESPONSE', config, null, response);
    return response;
  };
  const cache = new Map();
  function load(filename) {
    filename = path.resolve(filename);
    if (cache.has(filename)) return cache.get(filename).exports;
    const loadedModule = { exports: {} };
    cache.set(filename, loadedModule);
    const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    }).outputText;
    const localRequire = name => {
      if (name.startsWith('@/')) return load(path.resolve(name.slice(2)) + '.ts');
      if (name.startsWith('.')) return load(path.resolve(path.dirname(filename), name) + '.ts');
      return require(name);
    };
    vm.runInThisContext(`(function(require,module,exports,navigator,BroadcastChannel){${source}\n})`, { filename })(localRequire, loadedModule, loadedModule.exports, globals.navigator ?? globalThis.navigator, globals.BroadcastChannel ?? globalThis.BroadcastChannel);
    return loadedModule.exports;
  }
  const previous = axios.defaults.adapter;
  axios.defaults.adapter = adapter;
  try {
    return { ...load('lib/auth/session.ts'), store: load('lib/auth/auth.store.ts').useAuthStore, calls, load };
  } finally { axios.defaults.adapter = previous; }
}

test('fallback restore shares one refresh request and holds access JWT only in memory', async () => {
  const gate = deferred();
  const h = harness(async config => {
    assert.equal(config.url, '/auth/browser/refresh');
    assert.equal(config.headers.Authorization, undefined);
    await gate.promise;
    return { data: auth() };
  });
  const first = h.restoreSession();
  assert.equal(h.restoreSession(), first);
  assert.equal(h.store.getState().status, 'restoring');
  gate.resolve(); await first;
  assert.equal(h.calls.length, 1);
  assert.equal(h.store.getState().status, 'authenticated');
  assert.equal(h.store.getState().accessToken, 'access-current');
});

test('SSR profile stays authenticated while acquiring an access token after reload', async () => {
  const h = harness(() => ({ data: auth() }));
  h.store.getState().setSession({ user });
  const revision = h.store.getState().revision;
  await h.restoreSession();
  assert.equal(h.calls.length, 1);
  assert.equal(h.store.getState().status, 'authenticated');
  assert.equal(h.store.getState().revision, revision);
  await h.restoreSession();
  assert.equal(h.calls.length, 1);
});

test('missing or revoked cookie ends the session without a token refresh loop', async () => {
  const h = harness(() => ({ status: 401 }));
  await h.restoreSession();
  assert.equal(h.calls.length, 1);
  assert.equal(h.store.getState().status, 'unauthenticated');
  h.store.getState().setAuth(auth());
  await assert.rejects(h.apiClient.get('/private'));
  assert.equal(h.calls.length, 2);
  assert.equal(h.store.getState().user, null);
});

test('register does not authenticate; login receives access JWT but never refresh JWT', async () => {
  const h = harness(config => ({ data: config.url === '/auth/register' ? user : auth() }));
  const profile = await h.registerSession({ email: user.email, password: 'password', fullName: user.full_name });
  assert.deepEqual(profile, user);
  assert.equal(h.store.getState().isAuthenticated, false);
  const result = await h.loginSession({ email: user.email, password: 'password' });
  assert.deepEqual(Object.keys(result), ['user', 'accessToken', 'accessTokenExpiresAt']);
  assert.equal(result.refreshToken, undefined);
  assert.equal(h.store.getState().isAuthenticated, true);
  assert.deepEqual(h.calls.map(call => call.url), ['/auth/register', '/auth/browser/login']);
});

test('temporary profile revalidation errors preserve authenticated UI, revision and entered form state', async () => {
  for (const status of [0, 408, 429, 503]) {
    let attempts = 0;
    const h = harness(config => {
      if (++attempts > 1) return { data: auth({ user: { ...user, full_name: 'Current name' } }) };
      if (status === 0) throw new axios.AxiosError('offline', 'ERR_NETWORK', config);
      return { status };
    });
    h.store.getState().setAuth({ user });
    const previous = h.store.getState();
    const transitions = [];
    const unsubscribe = h.store.subscribe(state => transitions.push([state.status, state.revision]));
    await assert.rejects(h.refreshExpiringSession());
    assert.equal(h.store.getState().user, previous.user);
    await h.refreshExpiringSession();
    assert.equal(h.store.getState().user.full_name, 'Current name');
    assert.ok(transitions.every(([state, revision]) => state === 'authenticated' && revision === previous.revision));
    unsubscribe();
  }
});

test('initial network failure remains retryable without trusting a cached account', async () => {
  let attempts = 0;
  const h = harness(() => ++attempts === 1 ? { status: 503 } : { data: auth() });
  await h.restoreSession();
  assert.equal(h.store.getState().status, 'error');
  await h.restoreSession();
  assert.equal(h.store.getState().status, 'authenticated');
});

test('concurrent revalidation shares one request and does not unmount the account', async () => {
  const gate = deferred();
  const h = harness(async () => { await gate.promise; return { data: auth() }; });
  h.store.getState().setAuth({ user });
  const revision = h.store.getState().revision;
  const first = h.refreshExpiringSession();
  assert.equal(h.refreshExpiringSession(), first);
  assert.equal(h.store.getState().status, 'authenticated');
  gate.resolve(); await first;
  assert.equal(h.calls.length, 1);
  assert.equal(h.store.getState().revision, revision);
});

test('private API uses the current Bearer JWT, not a caller-supplied stale token', async () => {
  const h = harness(() => ({ data: 'ok' }));
  h.store.getState().setAuth(auth());
  await h.apiClient.post('/v1/orders/order/pay', {}, { headers: { Authorization: 'Bearer must-not-leak' } });
  assert.equal(h.calls.length, 1);
  assert.equal(h.calls[0].baseURL, '/api/backend');
  assert.equal(h.calls[0].token, 'Bearer access-current');
});

test('403 blocks the resource without refreshing or logging out', async () => {
  const h = harness(() => ({ status: 403 }));
  h.store.getState().setAuth(auth());
  await assert.rejects(h.apiClient.get('/admin'));
  assert.equal(h.calls.length, 1);
  assert.equal(h.store.getState().status, 'authenticated');
});

test('account switch during revalidation invalidates old query keys', async () => {
  const h = harness(() => ({ data: auth({ user: { ...user, user_id: 'other-user' } }) }));
  h.store.getState().setAuth({ user });
  const revision = h.store.getState().revision;
  await h.refreshExpiringSession();
  assert.equal(h.store.getState().user.user_id, 'other-user');
  assert.equal(h.store.getState().revision, revision + 1);
});

test('logout during revalidation cannot be undone by a late response', async () => {
  const gate = deferred();
  const h = harness(async config => {
    if (config.url === '/auth/browser/refresh') { await gate.promise; return { data: auth() }; }
    assert.equal(config.url, '/auth/browser/logout');
    return { data: {} };
  });
  h.store.getState().setAuth({ user });
  const pending = h.refreshExpiringSession();
  await new Promise(resolve => setImmediate(resolve));
  const logout = h.logoutSession();
  gate.resolve(); await pending; await logout;
  assert.equal(h.store.getState().status, 'unauthenticated');
});

test('late resource responses from an old session are rejected', async () => {
  const gate = deferred();
  const started = deferred();
  const h = harness(async config => {
    if (config.url === '/private') { started.resolve(); await gate.promise; }
    return { data: {} };
  });
  h.store.getState().setAuth(auth());
  const pending = h.apiClient.get('/private');
  await started.promise;
  await h.logoutSession();
  gate.resolve(); await assert.rejects(pending);
});

test('SSR auth state is request-scoped and renders the verified account without restoring text', () => {
  const h = harness(() => { throw new Error('Unexpected HTTP call'); });
  const { AuthStoreProvider, useAuthStore } = h.load('lib/auth/auth.store.ts');
  const React = require('react');
  const { renderToString } = require('react-dom/server');
  function Account() { return React.createElement('p', null, useAuthStore(state => state.user?.user_id || state.status)); }
  for (const id of ['first-user', 'second-user']) {
    const html = renderToString(React.createElement(AuthStoreProvider, { initial: { user: { ...user, user_id: id }, status: 'authenticated' } }, React.createElement(Account)));
    assert.ok(html.includes(id));
    assert.ok(!html.includes('restoring'));
  }
  assert.equal(h.store.getState().user, null);
});

test('concurrent expired access requests share one refresh and retry once with the same idempotency key', async () => {
  let refreshes = 0;
  const h = harness(async config => {
    if (config.url === '/auth/browser/refresh') {
      refreshes++;
      await new Promise(resolve => setTimeout(resolve, 10));
      return { data: auth({ accessToken: 'access-new' }) };
    }
    assert.equal(config.headers['Idempotency-Key'], 'payment-key');
    return config.headers.Authorization === 'Bearer access-current'
      ? { status: 401, code: 'AUTH_ACCESS_EXPIRED' } : { data: 'ok' };
  });
  h.store.getState().setAuth(auth());
  const revision = h.store.getState().revision;
  const responses = await Promise.all(Array.from({ length: 6 }, () => h.apiClient.post('/payments', {}, { headers: { 'Idempotency-Key': 'payment-key' } })));
  assert.ok(responses.every(response => response.data.data === 'ok'));
  assert.equal(refreshes, 1);
  assert.equal(h.calls.filter(call => call.url === '/payments').length, 12);
  assert.equal(h.store.getState().revision, revision);
});

test('expired access retries only once; 403, 503, timeout and unknown 401 never refresh or replay', async () => {
  for (const status of [401, 403, 503, 'timeout']) {
    const h = harness(config => {
      if (status === 'timeout') throw new axios.AxiosError('timeout', 'ECONNABORTED', config);
      return { status };
    });
    h.store.getState().setAuth(auth());
    await assert.rejects(h.apiClient.post('/payments', {}));
    assert.equal(h.calls.length, 1);
    assert.equal(h.store.getState().status, status === 401 ? 'unauthenticated' : 'authenticated');
  }
  const h = harness(config => config.url === '/auth/browser/refresh' ? { data: auth({ accessToken: 'access-new' }) } : { status: 401, code: 'AUTH_ACCESS_EXPIRED' });
  h.store.getState().setAuth(auth());
  await assert.rejects(h.apiClient.get('/private'));
  assert.equal(h.calls.length, 3);
});

test('proactive refresh only occurs within 60 seconds of expiry and does not reset the account', async () => {
  const h = harness(() => ({ data: auth({ accessToken: 'renewed' }) }));
  h.store.getState().setAuth(auth());
  await h.refreshExpiringSession();
  assert.equal(h.calls.length, 0);
  h.store.getState().setSession(auth({ accessTokenExpiresAt: new Date(Date.now() + 50_000).toISOString() }));
  const revision = h.store.getState().revision;
  await h.refreshExpiringSession();
  assert.equal(h.calls.length, 1);
  assert.equal(h.store.getState().revision, revision);
});

test('without Web Locks, rotation conflict retries with the current cookie; exhaustion preserves UI', async () => {
  let attempts = 0;
  const h = harness(() => ++attempts < 3 ? { status: 409, code: 'AUTH_REFRESH_CONFLICT' } : { data: auth() }, { navigator: {} });
  await h.restoreSession();
  assert.equal(attempts, 3);
  assert.equal(h.store.getState().accessToken, 'access-current');
  const blocked = harness(() => ({ status: 409, code: 'AUTH_REFRESH_CONFLICT' }), { navigator: {} });
  blocked.store.getState().setAuth({ user });
  await assert.rejects(blocked.refreshExpiringSession());
  assert.equal(blocked.calls.length, 4);
  assert.equal(blocked.store.getState().status, 'authenticated');
});

test('Web Locks serialize refresh across tabs without broadcasting tokens', async () => {
  let tail = Promise.resolve();
  let active = 0;
  const navigator = { locks: { request: (name, action) => {
    assert.equal(name, 'ticketverse-auth-cookie');
    const pending = tail.then(action); tail = pending.catch(() => {}); return pending;
  } } };
  const handler = async () => {
    assert.equal(++active, 1);
    await new Promise(resolve => setTimeout(resolve, 5));
    active--;
    return { data: auth() };
  };
  const first = harness(handler, { navigator });
  const second = harness(handler, { navigator });
  await Promise.all([first.restoreSession(), second.restoreSession()]);
  assert.equal(first.calls.length, 1);
  assert.equal(second.calls.length, 1);
});

test('login/logout tab notifications contain no tokens and logout clears in-memory JWT', async () => {
  const channels = [];
  class Channel {
    constructor() { channels.push(this); }
    postMessage(data) { assert.ok(['login', 'logout'].includes(data)); for (const channel of channels) if (channel !== this) channel.onmessage?.({ data }); }
    close() {}
  }
  const first = harness(() => ({ data: auth() }), { BroadcastChannel: Channel });
  const second = harness(() => ({ data: auth() }), { BroadcastChannel: Channel });
  const cleanupFirst = first.subscribeToSessionChanges();
  const cleanupSecond = second.subscribeToSessionChanges();
  try {
    await first.loginSession({ email: user.email, password: 'password' });
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(second.store.getState().status, 'authenticated');
    await first.logoutSession();
    assert.equal(second.store.getState().accessToken, null);
    assert.equal(first.store.getState().accessToken, null);
  } finally { cleanupFirst(); cleanupSecond(); }
});

test('account switch during access bootstrap cancels the original mutation before dispatch', async () => {
  const gate = deferred();
  const started = deferred();
  const h = harness(async config => {
    assert.equal(config.url, '/auth/browser/refresh');
    started.resolve(); await gate.promise;
    return { data: auth({ user: { ...user, user_id: 'other-user' } }) };
  });
  h.store.getState().setSession({ user });
  const pending = h.apiClient.post('/payments', {});
  await started.promise;
  gate.resolve();
  await assert.rejects(pending);
  assert.equal(h.calls.length, 1);
  assert.equal(h.store.getState().user.user_id, 'other-user');
});
