const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function compile(filename, dependencies) {
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports, require: name => {
    if (name in dependencies) return dependencies[name];
    if (['react/jsx-runtime', 'lucide-react'].includes(name)) return require(name);
    throw new Error(`Unexpected import ${name}`);
  } });
  return exports;
}
function nodes(tree) {
  if (tree == null || typeof tree === 'boolean') return [];
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  if (typeof tree !== 'object') return [tree];
  return [tree, ...nodes(tree.props?.children)];
}
const item = { id: 'notice_1', kind: 'ORDER_PAID', title: 'Mua vé thành công', body: 'Đơn đã thanh toán.', href: '/checkout/orders/order_1', readAt: null, createdAt: '2026-10-21T12:00:00Z' };
function fixture({ data = { items: [item], unreadCount: 1, total: 21, page: 1, limit: 20 }, pending = false, failure = false, read = async () => {} } = {}) {
  const states = [], refs = [], queries = [], calls = [];
  let stateIndex = 0, refIndex = 0;
  const session = { status: 'authenticated', user: { user_id: 'buyer' }, revision: 2 };
  const auth = selector => selector(session); auth.getState = () => session;
  const query = { data, isPending: pending, isError: failure, refetch: () => calls.push('refetch') };
  const api = { list: async (...args) => { calls.push(['list', ...args]); return data; }, read: async id => { calls.push(['read', id]); await read(); }, readAll: async () => { calls.push('readAll'); await read(); } };
  const component = compile('components/layout/NotificationBell.tsx', {
    react: {
      useState: initial => { const index = stateIndex++; if (!(index in states)) states[index] = initial; return [states[index], value => { states[index] = value; }]; },
      useRef: initial => refs[refIndex++] ?? (refs[refIndex - 1] = { current: initial }),
    },
    'next/navigation': { useRouter: () => ({ push: href => calls.push(['push', href]) }) },
    '@tanstack/react-query': { useQuery: options => { queries.push(options); return query; }, useQueryClient: () => ({ invalidateQueries: async options => calls.push(['invalidate', options.queryKey]) }) },
    '@/lib/auth/auth.store': { useAuthStore: auth }, '@/lib/api/notifications': { notificationsApi: api }, '@/components/ui/Dialog': { Dialog: 'Dialog' },
  });
  const render = () => { stateIndex = 0; refIndex = 0; return nodes(component.Inbox({ userId: 'buyer', revision: 2 })); };
  const button = text => render().find(node => node.type === 'button' && nodes(node.props.children).includes(text));
  const bell = () => render().find(node => node.type === 'button' && node.props['aria-haspopup'] === 'dialog');
  const open = () => bell().props.onClick();
  const notice = () => render().find(node => node.type === 'button' && nodes(node.props.children).includes('Xem chi tiết'));
  return { render, button, bell, open, notice, calls, queries, session, query, component };
}

test('bell hides outside authenticated sessions and remounts by user/revision', () => {
  const result = fixture();
  const wrapper = result.component.NotificationBell();
  assert.equal(wrapper.key, 'buyer:2');
  for (const status of ['restoring', 'unauthenticated', 'error']) {
    result.session.status = status;
    assert.equal(result.component.NotificationBell(), null);
  }
});

test('inbox polls the scoped cancellable query and exposes badge, Vietnam date and pagination', async () => {
  const result = fixture();
  assert.equal(result.bell().props['aria-label'], 'Thông báo, 1 chưa đọc');
  const options = result.queries[0];
  assert.equal(JSON.stringify(options.queryKey), JSON.stringify(['notifications', 'buyer', 2, 1]));
  assert.equal(options.gcTime, 0);
  assert.equal(options.refetchInterval, 15000);
  assert.equal(options.refetchIntervalInBackground, false);
  assert.equal(options.refetchOnWindowFocus, 'always');
  const signal = new AbortController().signal;
  await options.queryFn({ signal });
  assert.equal(result.calls[0][2], signal);
  result.open();
  assert.ok(result.calls.includes('refetch'));
  const time = result.render().find(node => node.type === 'time');
  assert.ok(time.props.children.includes('19:00'));
  assert.equal(result.button('Trước').props.disabled, true);
  result.button('Sau').props.onClick();
  result.render();
  assert.equal(result.queries.at(-1).queryKey.at(-1), 2);
});

test('opening an unread notice marks it read then navigates; read-all invalidates the account cache', async () => {
  const result = fixture(); result.open();
  await result.notice().props.onClick();
  await new Promise(resolve => setImmediate(resolve));
  assert.ok(result.calls.some(call => JSON.stringify(call) === JSON.stringify(['read', 'notice_1'])));
  assert.ok(result.calls.some(call => JSON.stringify(call) === JSON.stringify(['push', item.href])));
  assert.ok(!result.render().some(node => node.type === 'Dialog'));
  result.open();
  result.button('Đọc tất cả').props.onClick();
  await new Promise(resolve => setImmediate(resolve));
  assert.ok(result.calls.includes('readAll'));
  assert.ok(result.calls.some(call => JSON.stringify(call) === JSON.stringify(['invalidate', ['notifications', 'buyer', 2]])));
});

test('failures retain the dialog and unread state; loading/error never display stale private items', async () => {
  const result = fixture({ read: async () => { throw new Error('Network unavailable'); } }); result.open();
  result.notice().props.onClick();
  await new Promise(resolve => setImmediate(resolve));
  assert.ok(result.render().some(node => node.props?.role === 'alert'));
  assert.equal(result.bell().props['aria-label'], 'Thông báo, 1 chưa đọc');
  assert.ok(!result.calls.some(call => call[0] === 'push' || call[0] === 'invalidate'));
  for (const options of [{ pending: true }, { failure: true }]) {
    const loading = fixture(options); loading.open();
    assert.equal(loading.notice(), undefined);
    if (options.failure) { loading.button('Thử lại').props.onClick(); assert.ok(loading.calls.includes('refetch')); }
  }
  const empty = fixture({ data: { items: [], unreadCount: 0, total: 0, page: 1, limit: 20 } }); empty.open();
  assert.ok(empty.render().includes('Bạn chưa có thông báo.'));
  assert.equal(empty.button('Đọc tất cả').props.disabled, true);
});

test('pending read locks duplicate clicks; a changed session never navigates or invalidates another account', async () => {
  let finish;
  const result = fixture({ read: () => new Promise(resolve => { finish = resolve; }) }); result.open();
  const click = result.notice().props.onClick;
  click(); click();
  assert.equal(result.calls.filter(call => call[0] === 'read').length, 1);
  result.session.revision++;
  finish(); await new Promise(resolve => setImmediate(resolve));
  assert.ok(!result.calls.some(call => call[0] === 'push' || call[0] === 'invalidate'));
  click();
  assert.equal(result.calls.filter(call => call[0] === 'read').length, 1);
});

test('read notifications do not send another PATCH; unsafe notification destinations never navigate', async () => {
  const result = fixture({ data: { items: [{ ...item, readAt: '2026-10-21T12:30:00Z' }], unreadCount: 0, total: 1, page: 1, limit: 20 } }); result.open();
  result.notice().props.onClick();
  await new Promise(resolve => setImmediate(resolve));
  assert.ok(!result.calls.some(call => call[0] === 'read'));
  assert.ok(result.calls.some(call => call[0] === 'push'));
  for (const href of ['javascript:alert(1)', '//evil.example', '/organizer/\\evil']) {
    const unsafe = fixture({ data: { items: [{ ...item, href }], unreadCount: 1, total: 1, page: 1, limit: 20 } }); unsafe.open();
    unsafe.notice().props.onClick(); await new Promise(resolve => setImmediate(resolve));
    assert.ok(!unsafe.calls.some(call => call[0] === 'push'));
    assert.ok(unsafe.render().some(node => node.props?.role === 'alert'));
  }
});

test('notification API keeps authentication, cancellation and encoded IDs', async () => {
  const calls = [];
  const api = compile('lib/api/notifications.ts', {
    '@/lib/auth/session': { apiClient: { get: async (...args) => { calls.push(['get', ...args]); return { data: { success: true, data: 'listed' } }; }, patch: async (...args) => { calls.push(['patch', ...args]); return { data: { success: true, data: 'read' } }; } } },
    '@/lib/api/response': { unwrap: body => body.data },
  }).notificationsApi;
  const signal = new AbortController().signal;
  assert.equal(await api.list(2, signal), 'listed');
  assert.equal(calls[0][1], '/v1/notifications');
  assert.equal(calls[0][2].signal, signal);
  assert.equal(calls[0][2].params.page, 2);
  await api.read('notice/a'); await api.readAll();
  assert.equal(calls[1][1], '/v1/notifications/notice%2Fa/read');
  assert.equal(calls[2][1], '/v1/notifications/read-all');
});
