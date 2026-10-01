import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const axios = require('axios');
const user = { user_id: 'test-user', email: 'test@example.com', fullName: null };
const auth = (token = 'new-token') => ({ accessToken: token, user });
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };

// Transpile TypeScript in memory without changing the Next.js configuration.
function harness(handler) {
  const calls = [];
  const adapter = async config => {
    calls.push({ url: config.url, token: config.headers.Authorization });
    const result = await handler(config, calls);
    const status = result.status ?? 200;
    const response = { config, status, statusText: '', headers: {}, data: {
      success: status < 400, statusCode: status, message: 'test response', data: result.data,
    } };
    if (status >= 400) throw new axios.AxiosError('request failed', 'ERR_BAD_RESPONSE', config, null, response);
    return response;
  };
  const cache = new Map();
  function load(filename) {
    filename = path.resolve(filename);
    if (cache.has(filename)) return cache.get(filename).exports;
    const module = { exports: {} };
    cache.set(filename, module);
    const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    }).outputText;
    const localRequire = name => {
      if (name.startsWith('@/')) return load(path.resolve(name.slice(2)) + '.ts');
      if (name.startsWith('.')) return load(path.resolve(path.dirname(filename), name) + '.ts');
      return require(name);
    };
    vm.runInThisContext(`(function(require,module,exports){${source}\n})`, { filename })(localRequire, module, module.exports);
    return module.exports;
  }
  const previous = axios.defaults.adapter;
  axios.defaults.adapter = adapter;
  try {
    const session = load('lib/auth/session.ts');
    const store = load('lib/store/auth.store.ts').useAuthStore;
    return { ...session, store, calls };
  } finally { axios.defaults.adapter = previous; }
}

test('reload: one refresh shared by concurrent bootstrap, then /users/me with new token', async () => {
  const gate = deferred();
  const h = harness(async c => {
    if (c.url === '/auth/refresh') { await gate.promise; return { data: auth() }; }
    assert.equal(c.url, '/users/me');
    assert.equal(c.headers.Authorization, 'Bearer new-token');
    return { data: { ...user, fullName: 'Current name' } };
  });
  const first = h.restoreSession();
  assert.equal(h.restoreSession(), first);
  assert.equal(h.store.getState().status, 'restoring');
  gate.resolve(); await first;
  assert.equal(h.calls.length, 2);
  assert.equal(h.store.getState().user.fullName, 'Current name');
  assert.equal(h.store.getState().status, 'authenticated');
});

test('missing refresh cookie: unauthenticated, no /users/me', async () => {
  const h = harness(() => ({ status: 401 }));
  await h.restoreSession();
  assert.equal(h.calls.length, 1);
  assert.equal(h.store.getState().status, 'unauthenticated');
});

test('refresh network failure is retryable without logging out permanently', async () => {
  let attempts = 0;
  const h = harness(c => {
    if (c.url === '/auth/refresh') {
      if (++attempts === 1) throw new axios.AxiosError('offline', 'ERR_NETWORK', c);
      return { data: auth() };
    }
    return { data: user };
  });
  await h.restoreSession(); assert.equal(h.store.getState().status, 'error');
  await h.restoreSession(); assert.equal(h.store.getState().status, 'authenticated');
  assert.equal(attempts, 2);
});

test('/users/me 500 retries profile without refreshing again', async () => {
  let profiles = 0;
  const h = harness(c => c.url === '/auth/refresh' ? { data: auth() }
    : ++profiles === 1 ? { status: 500 } : { data: user });
  await h.restoreSession(); assert.equal(h.store.getState().status, 'error');
  await h.restoreSession(); assert.equal(h.store.getState().status, 'authenticated');
  assert.equal(h.calls.filter(c => c.url === '/auth/refresh').length, 1);
});

test('/users/me 401 after refresh ends session without refresh loop', async () => {
  const h = harness(c => c.url === '/auth/refresh' ? { data: auth() } : { status: 401 });
  await h.restoreSession();
  assert.equal(h.store.getState().status, 'unauthenticated');
  assert.equal(h.calls.length, 2);
});

test('concurrent protected requests refresh once and replay with new token', async () => {
  const h = harness(c => c.url === '/auth/refresh' ? { data: auth() }
    : c.headers.Authorization === 'Bearer old-token' ? { status: 401 } : { data: 'ok' });
  h.store.getState().setAuth(auth('old-token'));
  await Promise.all([h.apiClient.get('/a'), h.apiClient.get('/b')]);
  assert.equal(h.calls.filter(c => c.url === '/auth/refresh').length, 1);
  assert.equal(h.calls.filter(c => c.token === 'Bearer new-token').length, 2);
});

test('replayed 401 logs out after exactly one refresh', async () => {
  const h = harness(c => c.url === '/auth/refresh' ? { data: auth() } : { status: 401 });
  h.store.getState().setAuth(auth('old-token'));
  await assert.rejects(h.apiClient.get('/a'));
  assert.equal(h.calls.length, 3);
  assert.equal(h.store.getState().status, 'unauthenticated');
});

test('403 does not refresh or erase session', async () => {
  const h = harness(() => ({ status: 403 }));
  h.store.getState().setAuth(auth());
  await assert.rejects(h.apiClient.get('/admin'));
  assert.equal(h.calls.length, 1);
  assert.equal(h.store.getState().status, 'authenticated');
});

test('protected request waits for bootstrap', async () => {
  const h = harness(c => ({ data: c.url === '/auth/refresh' ? auth() : user }));
  await h.apiClient.get('/private');
  assert.deepEqual(h.calls.map(c => c.url), ['/auth/refresh', '/users/me', '/private']);
});

test('logout during refresh waits for rotated cookie without restoring local session', async () => {
  const gate = deferred();
  const h = harness(async c => {
    if (c.url === '/auth/refresh') { await gate.promise; return { data: auth() }; }
    assert.equal(c.url, '/auth/logout');
    assert.equal(c.headers.Authorization, 'Bearer new-token');
    return { data: {} };
  });
  const restore = h.restoreSession();
  const logout = h.logoutSession();
  gate.resolve(); await Promise.all([restore, logout]);
  assert.equal(h.store.getState().status, 'unauthenticated');
  assert.equal(h.store.getState().accessToken, null);
  assert.equal(h.calls.length, 2);
});

test('logout network error is reported to caller', async () => {
  const h = harness(c => { throw new axios.AxiosError('offline', 'ERR_NETWORK', c); });
  h.store.getState().setAuth(auth());
  await assert.rejects(h.logoutSession());
  assert.equal(h.store.getState().status, 'unauthenticated');
});

test('late response from old session is rejected', async () => {
  const gate = deferred();
  const started = deferred();
  const h = harness(async c => {
    if (c.url === '/private') { started.resolve(); await gate.promise; }
    return { data: {} };
  });
  h.store.getState().setAuth(auth());
  const request = h.apiClient.get('/private');
  await started.promise;
  await h.logoutSession();
  gate.resolve();
  await assert.rejects(request);
});
