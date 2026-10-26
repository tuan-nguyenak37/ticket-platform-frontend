const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const adminRoot = '../app/(modules)/(admin)/admin/';
const admin = { user_id: 'admin', full_name: 'Admin', email: 'admin@example.test', role: 'ADMIN', status: 'ACTIVE', created_at: '2026-10-20T00:00:00Z' };
const buyer = { ...admin, user_id: 'buyer', role: 'USER', email: 'buyer@example.test' };
const moderator = { ...buyer, user_id: 'moderator', role: 'MODERATOR' };
function nodes(tree) {
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  if (tree == null || typeof tree === 'boolean') return [];
  if (typeof tree !== 'object') return [tree];
  return [tree, ...nodes(tree.props?.children)];
}
function fixture({ status = 'authenticated', user = admin, pending = false, error = false, changedSession = false, conflict = false } = {}) {
  const session = { status, user, revision: 7 };
  const auth = selector => selector(session); auth.getState = () => ({ ...session });
  const calls = [], queries = [], invalidations = [];
  let currentStates = [], cursor = 0;
  const summary = { users: '9007199254740993', moderators: '2', organizers: '1', pendingEvents: '0', publishedEvents: '3', paidOrders: '0', paidResaleOrders: '0', reviewPayments: '0' };
  const api = {
    users: async () => [admin, buyer, moderator], summary: async () => summary,
    updateRole: async (...args) => { calls.push(args); if (changedSession) session.revision++; if (conflict) throw Object.assign(new Error('Vai trò đã thay đổi'), { statusCode: 409 }); },
  };
  const dependencies = {
    react: { useState: initial => { const index = cursor++; if (!(index in currentStates)) currentStates[index] = initial; const bucket = currentStates; return [bucket[index], value => { bucket[index] = value; }]; }, useRef: initial => ({ current: initial }) },
    'react/jsx-runtime': require('react/jsx-runtime'), 'next/link': { default: 'a' }, 'lucide-react': require('lucide-react'),
    'next/navigation': { usePathname: () => '/admin/users' },
    '@tanstack/react-query': { useQuery: options => { queries.push(options); return { data: options.queryKey[1] === 'summary' ? summary : [admin, buyer, moderator, { ...buyer, user_id: 'suspended', status: 'SUSPENDED' }], isPending: pending, isError: error, isSuccess: !pending && !error, error: new Error('offline'), refetch() {} }; }, useQueryClient: () => ({ invalidateQueries: options => invalidations.push(options.queryKey) }) },
    '@/lib/auth/auth.store': { useAuthStore: auth }, '@/lib/auth/session': { restoreSession() {} },
    '@/components/layout/SiteShell': { SiteShell: 'section' },
    '@/components/ui/commerce': { Failure: function Failure() {}, Pagination: function Pagination() {} },
    '@/components/ui/Dialog': { Dialog: 'dialog' }, '@/lib/api/http-errors': { formatHttpError: error => error },
    '../_lib/admin.api': { adminApi: api },
    './AdminStatistics': { AdminStatistics: 'AdminStatistics' },
  };
  function load(relative) {
    const exports = {};
    const source = fs.readFileSync(path.resolve(__dirname, adminRoot + relative), 'utf8');
    const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX } }).outputText;
    vm.runInNewContext(code, { exports, require: name => { if (!(name in dependencies)) throw new Error(name); return dependencies[name]; } });
    return exports;
  }
  function renderer(Component, props = {}) {
    const states = [];
    return () => { currentStates = states; cursor = 0; return nodes(Component(props)); };
  }
  return { load, renderer, queries, calls, invalidations, session };
}
test('admin gate blocks guests, normal users, moderators and unverified sessions', () => {
  for (const options of [{ status: 'unauthenticated', user: null }, { user: buyer }, { user: moderator }, { status: 'restoring' }, { status: 'error' }]) {
    const result = fixture(options);
    const tree = result.renderer(result.load('_components/AdminGate.tsx').AdminGate, { children: 'private data' })();
    assert.ok(!tree.includes('private data'));
    assert.equal(result.queries.length, 0);
    if (options.status === 'unauthenticated') assert.ok(tree.some(node => node.props?.href === '/login?next=%2Fadmin%2Fusers'));
  }
  const result = fixture();
  assert.ok(result.renderer(result.load('_components/AdminGate.tsx').AdminGate, { children: 'private data' })().includes('private data'));
});
test('admin navigation has working routes and current-page semantics', () => {
  const result = fixture();
  const tree = result.renderer(result.load('_components/AdminShell.tsx').AdminShell)();
  assert.deepEqual(tree.filter(node => node.type === 'a').map(node => node.props.href), ['/', '/admin', '/admin/users', '/admin/events', '/admin/history']);
  assert.equal(tree.find(node => node.props?.['aria-current'] === 'page').props.href, '/admin/users');
  assert.equal(fs.existsSync(path.resolve(__dirname, adminRoot + 'payments/page.tsx')), false);
});
test('overview uses real session-scoped counts, exact bigint formatting and separate failure/loading states', async () => {
  const result = fixture();
  const tree = result.renderer(result.load('_components/AdminOverview.tsx').AdminOverview)();
  assert.equal(tree.filter(node => node.type === 'section').length, 2);
  assert.equal(tree.filter(node => node.type === 'dt').length, 4);
  assert.ok(tree.findIndex(node => node.type === 'AdminStatistics') < tree.findIndex(node => node.props?.['aria-label'] === 'Quy mô hệ thống'));
  assert.ok(tree.includes('9.007.199.254.740.993'));
  assert.equal(JSON.stringify(result.queries[0].queryKey), JSON.stringify(['admin', 'summary', 'admin', 7]));
  assert.equal((await result.queries[0].queryFn()).pendingEvents, '0');
  for (const options of [{ pending: true }, { error: true }]) {
    const result = fixture(options);
    const tree = result.renderer(result.load('_components/AdminOverview.tsx').AdminOverview)();
    assert.equal(tree.filter(node => node.type === 'section').length, 2);
    assert.equal(tree.filter(node => node.type === 'dt').length, 0);
    assert.ok(!tree.includes('9.007.199.254.740.993'));
    assert.ok(tree.some(node => options.pending ? node.props?.role === 'status' : node.type?.name === 'Failure'));
  }
});
function roleFixture(options = {}, label = 'Cấp quyền duyệt') {
  const result = fixture(options);
  const render = result.renderer(result.load('_components/AdminDashboard.tsx').AdminDashboard);
  const buttons = render().filter(node => node.type === 'button' && node.props.children === label);
  assert.equal(buttons.length, 1);
  buttons[0].props.onClick();
  const modal = render().find(node => node.type?.name === 'UpdateRoleModal');
  const renderModal = result.renderer(modal.type, modal.props);
  return { ...result, renderModal, submit: () => renderModal().find(node => node.type === 'form').props.onSubmit({ preventDefault() {} }) };
}
test('role change excludes ADMIN/self/suspended users, requires a reason and sends expectedRole', async () => {
  const result = roleFixture();
  await result.submit();
  assert.equal(result.calls.length, 0);
  result.renderModal().find(node => node.type === 'textarea').props.onChange({ target: { value: '  Phân công  ' } });
  await result.submit();
  assert.equal(JSON.stringify(result.calls), JSON.stringify([['buyer', { role: 'MODERATOR', expectedRole: 'USER', reason: 'Phân công' }]]));
  assert.ok(result.invalidations.some(key => key[1] === 'summary'));
  const revoked = roleFixture({}, 'Thu hồi quyền duyệt');
  revoked.renderModal().find(node => node.type === 'textarea').props.onChange({ target: { value: 'Kết thúc' } });
  await revoked.submit();
  assert.equal(revoked.calls[0][1].role, 'USER');
  assert.equal(revoked.calls[0][1].expectedRole, 'MODERATOR');
});
test('stale role-change response never touches the next session; conflicts reload users', async () => {
  for (const options of [{ changedSession: true }, { conflict: true }]) {
    const result = roleFixture(options);
    result.renderModal().find(node => node.type === 'textarea').props.onChange({ target: { value: 'Phân công' } });
    await result.submit();
    assert.equal(result.calls.length, 1);
    assert.equal(result.invalidations.length, options.changedSession ? 0 : 1);
    if (options.conflict) assert.ok(result.renderModal().some(node => node.type?.name === 'Failure'));
  }
});

test('admin API uses protected endpoints and encodes user IDs without changing the payload', async () => {
  const calls = [];
  const exports = {};
  const dependencies = {
    '@/lib/auth/session': { apiClient: { get: async (endpoint, config) => { calls.push(config ? ['get', endpoint, config] : ['get', endpoint]); return { data: { data: 'summary' } }; }, patch: async (...args) => { calls.push(['patch', ...args]); return { data: { data: 'user' } }; } } },
    '@/lib/api/response': { unwrap: body => body.data },
  };
  const source = fs.readFileSync(path.resolve(__dirname, adminRoot + '_lib/admin.api.ts'), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  vm.runInNewContext(code, { exports, require: name => dependencies[name] });
  for (const method of ['payments', 'payment', 'reconcile']) assert.equal(exports.adminApi[method], undefined);
  assert.equal(await exports.adminApi.summary(), 'summary');
  const payload = { role: 'MODERATOR', expectedRole: 'USER', reason: 'Test' };
  assert.equal(await exports.adminApi.updateRole('user/id', payload), 'user');
  assert.deepEqual(calls, [['get', '/users/admin-summary'], ['patch', '/users/user%2Fid/role', payload]]);
  const params = { dateFrom: '2026-01-01', dateTo: '2026-01-31', groupBy: 'month' };
  const signal = new AbortController().signal;
  await exports.adminApi.statistics(params, signal);
  assert.equal(calls[2][1], '/users/admin-statistics');
  assert.equal(calls[2][2].params, params);
  assert.equal(calls[2][2].signal, signal);
});

test('shared moderation lists keep admin detail links and expose history failures', () => {
  for (const [filename, component] of [['ModerationEventsQueue', 'ModerationEventsQueue'], ['ModerationReviewHistoryList', 'ModerationReviewHistoryList']]) {
    for (const basePath of ['/admin', '/moderator']) {
      const exports = {};
      const dependencies = {
        'react/jsx-runtime': require('react/jsx-runtime'), 'next/link': { default: 'a' }, 'lucide-react': require('lucide-react'),
        '@/hooks/useUrlFilters': { useUrlFilters: () => ({ params: new URLSearchParams(), page: 1, update() {} }) },
        '../_lib/moderation.api': { moderationApi: {} },
        '@tanstack/react-query': { useQuery: options => ({ data: options.queryKey[1] === 'categories' ? [] : { items: [{ eventId: 'event/id', title: 'Event', eventTitle: 'Event', createdAt: '2026-10-20T00:00:00Z' }], total: 1 }, isLoading: false, isError: false }) },
      };
      const source = fs.readFileSync(path.resolve(__dirname, '../app/(modules)/(moderator)/moderator/_components/' + filename + '.tsx'), 'utf8');
      const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX } }).outputText;
      vm.runInNewContext(code, { exports, require: name => dependencies[name] });
      const tree = nodes(exports[component]({ basePath }));
      assert.ok(tree.some(node => node.props?.href === basePath + '/events/event%2Fid'));
      if (filename === 'ModerationReviewHistoryList') {
        dependencies['@tanstack/react-query'].useQuery = () => ({ isError: true, refetch() {} });
        assert.ok(nodes(exports[component]({ basePath })).some(node => node.props?.role === 'alert'));
      }
    }
  }
});
