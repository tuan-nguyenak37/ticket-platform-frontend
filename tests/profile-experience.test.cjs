const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const profile = { user_id: 'buyer', full_name: 'Người thử nghiệm', email: 'buyer@example.test', phone_number: null };
const code = ts.transpileModule(fs.readFileSync(path.resolve(__dirname, '../app/(modules)/(account)/account/_components/ProfilePage.tsx'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
function nodes(tree) {
  if (!tree || typeof tree !== 'object') return typeof tree === 'string' ? [tree] : [];
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  return [tree, ...nodes(tree.props?.children)];
}
function fixture({ pending = false, failure = false, mode = 'profile', changedSession = false } = {}) {
  let states = [], cursor = 0, queryOptions, retries = 0;
  const calls = [], updates = [], cache = [], redirects = [];
  const authState = { user: profile, revision: 3, updateUser: updated => updates.push(updated) };
  const auth = selector => selector(authState); auth.getState = () => authState;
  const query = { data: profile, isPending: pending, isError: failure, error: new Error('Không thể tải'), refetch: () => retries++ };
  const dependencies = {
    react: { useState: initial => { const index = cursor++; if (!(index in states)) states[index] = initial; return [states[index], value => { states[index] = value; }]; }, useEffect: () => {} },
    'react/jsx-runtime': require('react/jsx-runtime'), 'lucide-react': require('lucide-react'),
    '@tanstack/react-query': { useQuery: options => { queryOptions = options; return query; }, useQueryClient: () => ({ setQueryData: (...args) => cache.push(args) }) },
    '@/lib/auth/auth.store': { useAuthStore: auth },
    '@/lib/auth/session': { apiClient: {
      get: async endpoint => { calls.push(['get', endpoint]); return { data: profile }; },
      patch: async (endpoint, payload) => { calls.push(['patch', endpoint, payload]); if (changedSession) authState.revision++; return { data: { ...profile, ...payload } }; },
    }, logoutSession: async () => calls.push(['logout']) },
    '@/lib/api/response': { unwrap: value => value },
    '@/lib/api/http-errors': { formatHttpError: error => ({ message: error.message }) },
  };
  const exports = {};
  vm.runInNewContext(code, { exports, window: { location: { assign: url => redirects.push(url) } }, require: name => { if (!(name in dependencies)) throw new Error(name); return dependencies[name]; } });
  const root = exports.ProfilePage();
  let Component = root.type, props = root.props;
  if (!pending && !failure && mode === 'password') {
    const password = nodes(Component(props)).find(node => typeof node.type === 'function');
    Component = password.type; props = password.props; states = [];
  }
  const render = () => { cursor = 0; return nodes(pending || failure ? root : Component(props)); };
  return { root, render, calls, updates, cache, redirects, queryOptions, retries: () => retries };
}
function change(result, id, value) {
  result.render().find(node => node.props?.id === id).props.onChange({ target: { value } });
}
async function submit(result) {
  await result.render().find(node => node.type === 'form').props.onSubmit({ preventDefault() {} });
}
test('profile stays user/revision scoped and distinguishes loading and retryable failure', async () => {
  const result = fixture();
  assert.equal(JSON.stringify(result.queryOptions.queryKey), JSON.stringify(['profile', 'buyer', 3]));
  await result.queryOptions.queryFn();
  assert.deepEqual(result.calls[0], ['get', '/users/me']);
  assert.ok(fixture({ pending: true }).render().some(node => node.props?.role === 'status'));
  const failed = fixture({ failure: true });
  assert.ok(failed.render().some(node => node.props?.role === 'alert'));
  failed.render().find(node => node.type === 'button').props.onClick();
  assert.equal(failed.retries(), 1);
});
test('profile content reuses the outer shell without extra main or page heading', () => {
  const tree = fixture().render();
  assert.ok(!tree.some(node => node.type === 'main' || node.type === 'h1' || node.type === 'aside'));
  assert.ok(tree.some(node => node.props?.id === 'personal'));
  assert.ok(tree.some(node => node.props?.id === 'profile-email' && node.props.readOnly));
  assert.ok(tree.some(node => node.type === 'a' && node.props.href === '#security'));
  assert.ok(tree.find(node => node.type === 'button' && node.props.type === 'submit').props.disabled);
});
test('profile save normalizes input, preserves email and updates auth/cache from API', async () => {
  const result = fixture();
  change(result, 'profile-name', '  Tên mới  ');
  change(result, 'profile-phone', '  +84901234567  ');
  await submit(result);
  assert.equal(JSON.stringify(result.calls[0]), JSON.stringify(['patch', '/users/me', { full_name: 'Tên mới', phone_number: '+84901234567' }]));
  assert.equal(result.updates[0].full_name, 'Tên mới');
  assert.equal(JSON.stringify(result.cache[0][0]), JSON.stringify(['profile', 'buyer', 3]));
  assert.ok(result.render().includes('Đã lưu thông tin cá nhân.'));
  assert.ok(result.render().find(node => node.type === 'button' && node.props.type === 'submit').props.disabled);
});
test('invalid profile input never posts; undo restores the saved values', async () => {
  for (const [id, invalid] of [['profile-name', '   '], ['profile-phone', 'not-a-phone']]) {
    const result = fixture();
    change(result, id, invalid);
    await submit(result);
    assert.equal(result.calls.length, 0);
    assert.ok(result.render().some(node => node.props?.role === 'alert'));
    result.render().find(node => node.type === 'button' && node.props.type === 'button').props.onClick();
    assert.equal(result.render().find(node => node.props?.id === id).props.value, id === 'profile-name' ? profile.full_name : '');
  }
});
test('a profile response from a previous session never updates the next account', async () => {
  const result = fixture({ changedSession: true });
  change(result, 'profile-name', 'Tên mới');
  await submit(result);
  assert.equal(result.calls.length, 1);
  assert.equal(result.updates.length, 0);
  assert.equal(result.cache.length, 0);
});
test('password controls keep browser autocomplete, confirmation and login redirect', async () => {
  const result = fixture({ mode: 'password' });
  let tree = result.render();
  assert.equal(tree.find(node => node.props?.id === 'password-current').props.autoComplete, 'current-password');
  assert.equal(tree.find(node => node.props?.id === 'password-new').props.autoComplete, 'new-password');
  change(result, 'password-current', 'old-password');
  change(result, 'password-new', 'new-password');
  change(result, 'password-confirm', 'mismatch');
  await submit(result);
  assert.equal(result.calls.length, 0);
  assert.ok(result.render().some(node => node.props?.role === 'alert'));
  change(result, 'password-confirm', 'new-password');
  await submit(result);
  assert.equal(JSON.stringify(result.calls[0]), JSON.stringify(['patch', '/users/me/password', { currentPassword: 'old-password', newPassword: 'new-password' }]));
  assert.deepEqual(result.redirects, ['/login?passwordChanged=1']);
});
