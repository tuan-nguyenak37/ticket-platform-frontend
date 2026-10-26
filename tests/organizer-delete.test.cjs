const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const code = ts.transpileModule(fs.readFileSync('app/(modules)/(organizer)/organizer/_components/OrganizerEditor.tsx', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
}).outputText;

function nodes(tree) {
  if (tree == null || typeof tree === 'boolean') return [];
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  if (typeof tree !== 'object') return [tree];
  return [tree, ...nodes(tree.props?.children)];
}

function fixture({ tickets = [], confirm = true, status = 'DRAFT', ownerStatus = 'ACTIVE', loaded = true, erase = async () => {}, step = 2 } = {}) {
  const states = [], refs = [], calls = [], confirmations = [];
  const navigations = [], readiness = [];
  let stateIndex = 0, refIndex = 0, refreshed = 0;
  const showing = { showingId: 'show-1', name: 'Suất tối', startTime: '2099-10-23T12:00:00Z', venueName: 'Nhà hát A', city: 'Hồ Chí Minh' };
  const event = { eventId: 'event-1', organizerId: 'org-1', title: 'Đêm nhạc', status };
  const auth = { revision: 1, user: { user_id: 'owner' } };
  const dependencies = {
    react: {
      useState: initial => { const index = stateIndex++; if (!(index in states)) states[index] = initial;
        return [states[index], value => { states[index] = typeof value === 'function' ? value(states[index]) : value; }]; },
      useRef: initial => refs[refIndex++] ?? (refs[refIndex - 1] = { current: initial }),
      useEffect() {},
    },
    'react/jsx-runtime': require('react/jsx-runtime'),
    'next/link': { default: 'Link' },
    'next/navigation': { useRouter: () => ({ push: url => navigations.push(url) }) },
    '@tanstack/react-query': {
      useQueries: () => [{ isSuccess: loaded, data: loaded ? tickets : undefined }],
      useQuery: options => { readiness.push(options); return { refetch: async () => { refreshed++; } }; },
    },
    '@/lib/auth/RequireAuth': { RequireAuth: 'RequireAuth' },
    '@/lib/auth/auth.store': { useAuthStore: selector => selector(auth) },
    '@/hooks/useUrlFilters': { useUrlFilters: () => ({ params: new URLSearchParams(`step=${step}`) }) },
    '../_lib/organizer.api': {
      organizerApi: {
        deleteShowing: async id => { calls.push(['showing', id]); await erase(); },
        deleteTicket: async id => { calls.push(['ticket', id]); await erase(); },
      },
      vnInput: () => '2099-10-23T19:00', vnd: value => `${value} VND`,
    },
    '../_hooks/useOrganizer': { useOrganizer: () => ({
      mine: {}, owner: { name: 'Ban tổ chức', status: ownerStatus }, event: { data: event },
      showings: { data: [showing], isSuccess: true }, mutate: async action => action(),
    }) },
    './OrganizerForms': {}, './PayoutPanel': { PayoutPanel: 'PayoutPanel' }, './PosterPreview': {},
    '@/components/ui/Dialog': {}, './OrganizerStatus': {},
    './OrganizerShell': { OrganizerShell: 'OrganizerShell' },
    'lucide-react': {},
  };
  const exports = {};
  vm.runInNewContext(code, { exports, require: name => dependencies[name], Error, URLSearchParams,
    window: { confirm: message => { confirmations.push(message); return confirm; } },
    document: { querySelector: () => null },
  });
  const wrapper = exports.OrganizerEditor({ organizerId: 'org-1', eventId: 'event-1' });
  const editor = wrapper.props.children;
  let tree;
  function render() { stateIndex = 0; refIndex = 0; tree = nodes(editor.type(editor.props)); return tree; }
  render();
  function button(label) { return tree.find(node => node.type === 'button' && nodes(node).includes(label)); }
  return { render, button, calls, confirmations, navigations, readiness, refreshed: () => refreshed };
}

const ticket = { ticketTypeId: 'ticket-1', name: 'VIP', price: '150000', totalQuantity: 10, maxPerOrder: 4, reservedQuantity: 0, soldQuantity: 0 };
const settle = () => new Promise(resolve => setImmediate(resolve));

test('canceling showing deletion sends no request', async () => {
  const result = fixture({ confirm: false });
  assert.equal(result.button('Xóa suất diễn').props.disabled, false);
  await result.button('Xóa suất diễn').props.onClick();
  assert.equal(result.calls.length, 0);
});

test('showing deletion confirms exact showing, calls its API and refreshes readiness', async () => {
  const result = fixture();
  await result.button('Xóa suất diễn').props.onClick();
  await settle();
  assert.deepEqual(result.calls, [['showing', 'show-1']]);
  assert.match(result.confirmations[0], /Suất tối/);
  assert.match(result.confirmations[0], /2099-10-23 19:00/);
  assert.match(result.confirmations[0], /Nhà hát A/);
  assert.match(result.confirmations[0], /Không thể hoàn tác/);
  assert.equal(result.refreshed(), 1);
  assert.ok(result.render().some(node => node.props?.role === 'status' && nodes(node).some(value => typeof value === 'string' && value.includes('Đã xóa suất diễn'))));
});

test('showing deletion is disabled until tickets load or while it contains ticket tiers', () => {
  assert.equal(fixture({ loaded: false }).button('Xóa suất diễn').props.disabled, true);
  assert.equal(fixture({ tickets: [ticket] }).button('Xóa suất diễn').props.disabled, true);
});

test('ticket-tier deletion targets the tier, not the showing', async () => {
  const result = fixture({ tickets: [ticket] });
  assert.equal(result.button('Xóa hạng vé').props.disabled, false);
  await result.button('Xóa hạng vé').props.onClick();
  assert.deepEqual(result.calls, [['ticket', 'ticket-1']]);
  assert.match(result.confirmations[0], /hạng vé “VIP”/);
  assert.match(result.confirmations[0], /Suất tối/);
});

test('ticket tiers with reservations or sales cannot be deleted from UI', () => {
  for (const quantities of [{ reservedQuantity: 1 }, { soldQuantity: 1 }]) {
    const result = fixture({ tickets: [{ ...ticket, ...quantities }] });
    assert.equal(result.button('Xóa hạng vé').props.disabled, true);
  }
});

test('pending review and suspended organizers cannot delete', async () => {
  for (const options of [{ status: 'PENDING_REVIEW' }, { ownerStatus: 'SUSPENDED' }]) {
    const result = fixture({ ...options, tickets: [ticket] });
    assert.equal(result.button('Xóa suất diễn').props.disabled, true);
    assert.equal(result.button('Xóa hạng vé').props.disabled, true);
    await result.button('Xóa hạng vé').props.onClick();
    assert.equal(result.calls.length, 0);
  }
});

test('delete request is locked against double clicks and unlocks after success', async () => {
  let finish;
  const result = fixture({ erase: () => new Promise(resolve => { finish = resolve; }) });
  const original = result.button('Xóa suất diễn');
  const pending = original.props.onClick();
  await original.props.onClick();
  assert.equal(result.calls.length, 1);
  result.render();
  assert.equal(result.button('Xóa suất diễn').props.disabled, true);
  finish(); await pending; await settle();
  result.render();
  assert.equal(result.button('Xóa suất diễn').props.disabled, false);
});

test('API rejection is displayed without a success message', async () => {
  const result = fixture({ tickets: [ticket], erase: async () => { throw new Error('Đã phát sinh đơn hàng.'); } });
  await result.button('Xóa hạng vé').props.onClick();
  await settle();
  const tree = result.render();
  const alert = tree.find(node => node.props?.role === 'alert');
  assert.match(nodes(alert).filter(node => typeof node === 'string').join(' '), /Không thể xóa hạng vé “VIP”.*Đã phát sinh đơn hàng/);
  assert.equal(tree.filter(node => node.props?.role === 'status').length, 0);
  assert.equal(result.button('Xóa hạng vé').props.disabled, false);
});

test('event setup has four steps without a registration form', () => {
  const result = fixture();
  const tree = result.render();
  const select = tree.find(node => node.type === 'select');
  const options = nodes(select).filter(node => node.type === 'option');
  assert.deepEqual(options.map(node => node.props.value), [1, 2, 3, 4]);
  assert.equal(JSON.stringify(options).includes('Cài đặt đăng ký'), false);
  result.button('Tiếp tục').props.onClick();
  assert.equal(result.navigations[0], '/organizer/org-1/events/event-1?step=3');
});

test('payout is step three and skips directly to review at step four', () => {
  const result = fixture({ step: 3 });
  const payout = result.render().find(node => node.type === 'PayoutPanel');
  assert.ok(payout);
  payout.props.onSkip();
  assert.equal(result.navigations[0], '/organizer/org-1/events/event-1?step=4');
});

test('review is the final step, and old step-five links still open review', () => {
  for (const step of [4, 5]) {
    const result = fixture({ step });
    assert.ok(result.button('Gửi duyệt'));
    assert.equal(result.button('Tiếp tục'), undefined);
    assert.equal(result.readiness[0].enabled, true);
  }
});
