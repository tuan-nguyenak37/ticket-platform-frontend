const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const code = ts.transpileModule(fs.readFileSync(path.resolve(__dirname, '../components/commerce/Marketplace.tsx'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
const listing = { listingId: 'listing/one', status: 'AVAILABLE', price: '150000', originalPrice: '200000', event: { eventId: 'event/one', title: 'Đêm nhạc' }, showing: { name: 'Suất tối', startTime: '2026-11-20T12:00:00Z', venueName: 'Nhà hát', address: '123 Đường A', city: 'Hà Nội' }, ticketType: { name: 'Tiêu chuẩn' }, organizer: { name: 'Ban tổ chức' } };

function fixture({ component = 'ListingDetail', status = 'authenticated', data = listing, page = 1, filters = {}, eventsReady = true, total = 1, pending = false, failure = false, changeSession = false, cancel = false, failureCode = 503 } = {}) {
  const state = { status, user: status === 'authenticated' ? { user_id: 'buyer' } : null };
  const auth = selector => selector(state); auth.getState = () => state;
  const calls = [], navigations = [], actions = [];
  let stateIndex = 0;
  const values = component === 'Marketplace' ? [page] : [cancel];
  const query = { data: component === 'Marketplace' ? { items: data ? [data] : [], total } : data, isPending: pending, isError: failure, error: failure ? new Error('Unavailable') : null, refetch: async () => {} };
  let options;
  const dependencies = {
    react: { useState: () => [values[stateIndex++], () => {}], useRef: value => ({ current: value }) },
    'react/jsx-runtime': require('react/jsx-runtime'), 'lucide-react': require('lucide-react'),
    'next/link': { default: 'Link' }, 'next/navigation': { useRouter: () => ({ push: href => navigations.push(href) }) },
    '@tanstack/react-query': { useQuery: value => { if (value.queryKey[1] === 'resale-events') return { data: eventsReady ? [{ eventId: 'event', title: 'Đêm nhạc' }] : undefined }; options = value; return query; }, useQueryClient: () => ({ invalidateQueries: async () => {} }) },
    '@/lib/auth/auth.store': { useAuthStore: auth },
    '@/lib/auth/useAuthenticatedAction': { useAuthenticatedAction: () => ({ restoring: status === 'restoring', run: action => { if (state.user) actions.push(action()); } }) },
    '@/lib/api/commerce': { getCommerce: async (...args) => { calls.push(args); return data; }, listCommerce: async (...args) => { calls.push(args); return query.data; }, postCommerce: async (...args) => { calls.push(args); if (changeSession) state.user = { user_id: 'next-buyer' }; return { resaleOrderId: 'order' }; }, money: value => value + ' đ', vietnamDate: value => value },
    '@/components/ui/commerce': { Failure: 'Failure', Pagination: 'Pagination' },
    '@/components/ui/ConfirmDialog': { ConfirmDialog: 'ConfirmDialog' },
    '@/app/_components/EventDiscovery': { EventPoster: 'EventPoster' },
    '@/lib/api/http-errors': { formatHttpError: () => ({ statusCode: failureCode }) },
    './shared': { Empty: 'Empty', Status: 'Status', useClock: () => Date.parse('2026-10-21T00:00:00Z') },
  };
  const exports = {};
  vm.runInNewContext(code, { exports, URLSearchParams, require: name => { if (!(name in dependencies)) throw new Error(name); return dependencies[name]; } });
  const tree = exports[component]({ id: 'listing/one', page, filters });
  return { tree, calls, navigations, actions, state, options };
}

function nodes(tree) {
  if (!tree || typeof tree !== 'object') return typeof tree === 'string' ? [tree] : [];
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  return [tree, ...nodes(tree.props?.children)];
}
function buyButton(result) { return nodes(result.tree).find(node => node.type === 'button' && nodes(node).includes('Kiểm tra & mua vé')); }

test('catalogue uses real public listings, encoded links and one page heading', async () => {
  const result = fixture({ component: 'Marketplace' });
  await result.options.queryFn();
  assert.equal(result.calls[0][0], 'resale/listings');
  assert.equal(JSON.stringify(result.calls[0][1]), JSON.stringify({ page: 1, limit: 20 }));
  assert.equal(result.calls[0][2], true);
  assert.equal(nodes(result.tree).filter(node => node.type === 'h1').length, 1);
  assert.ok(nodes(result.tree).some(node => node.type === 'Link' && node.props.href === '/pass/listing%2Fone'));
  const text = nodes(result.tree).filter(node => typeof node === 'string').join(' ');
  assert.ok(text.includes('thanh toán qua VNPay'));
  assert.doesNotMatch(text, /sandbox|sanbox|môi trường thử nghiệm/i);
  assert.ok(!text.includes('chưa kết nối cổng thu tiền'));
});

test('filters reach the API before pagination and survive page navigation', async () => {
  const filters = { q: 'Đêm nhạc', eventId: 'event', dateFrom: '2026-11-20', dateTo: '2026-11-21', minPrice: '0', maxPrice: '9007199254740993' };
  const result = fixture({ component: 'Marketplace', filters, total: 42, page: 2 });
  await result.options.queryFn();
  assert.equal(JSON.stringify(result.calls[0][1]), JSON.stringify({ ...filters, page: 2, limit: 20 }));
  const tree = nodes(result.tree);
  assert.ok(tree.some(node => node.type === 'form' && node.props.method === 'get' && node.props.action === '/pass'));
  assert.equal(tree.filter(node => ['input', 'select'].includes(node.type)).length, 6);
  tree.find(node => node.type === 'Pagination').props.onChange(3);
  const url = new URL(result.navigations[0], 'http://localhost');
  assert.equal(url.searchParams.get('page'), '3');
  for (const [key, value] of Object.entries(filters)) assert.equal(url.searchParams.get(key), value);
  const empty = nodes(fixture({ component: 'Marketplace', filters, data: null }).tree).find(node => node.type === 'Empty');
  assert.equal(empty.props.href, '/pass');
});

test('empty catalogue offers discovery; an empty later page offers page one', () => {
  for (const page of [1, 2]) {
    const tree = nodes(fixture({ component: 'Marketplace', data: null, total: 0, page }).tree);
    assert.equal(tree.find(node => node.type === 'Empty').props.href, page === 1 ? '/events' : '/pass');
    assert.equal(tree.some(node => node.type === 'Pagination'), page > 1);
  }
});

test('selected event keeps its option identity while event choices load', () => {
  for (const eventsReady of [false, true]) {
    const tree = nodes(fixture({ component: 'Marketplace', filters: { eventId: 'event' }, eventsReady }).tree);
    const selected = tree.filter(node => node.type === 'option' && node.props.value === 'event');
    assert.equal(selected.length, 1);
    assert.equal(selected[0].key, 'event');
    assert.equal(tree.find(node => node.type === 'select').props.defaultValue, 'event');
  }
});

test('loading and error listings never show stale purchase controls', () => {
  assert.ok(nodes(fixture({ pending: true }).tree).some(node => node.props?.role === 'status'));
  assert.ok(nodes(fixture({ failure: true }).tree).some(node => node.type === 'Failure'));
  for (const options of [{ pending: true }, { failure: true }, { status: 'error' }]) assert.equal(buyButton(fixture(options)), undefined);
});

test('seller can cancel but cannot buy; unavailable listings disable purchase', () => {
  const owner = fixture({ data: { ...listing, ticketId: 'private-ticket' } });
  assert.equal(buyButton(owner), undefined);
  assert.ok(nodes(owner.tree).some(node => node.type === 'button' && node.props.children === 'Hủy tin đăng'));
  for (const status of ['SOLD', 'CANCELLED']) {
    const tree = nodes(fixture({ data: { ...listing, status } }).tree);
    assert.equal(tree.find(node => node.type === 'button').props.disabled, true);
  }
});

test('guest action requires login; opening buyer checkout does not reserve a ticket', async () => {
  const guest = fixture({ status: 'unauthenticated' });
  buyButton(guest).props.onClick();
  assert.equal(guest.calls.length, 0);
  const buyer = fixture();
  buyButton(buyer).props.onClick(); await Promise.all(buyer.actions);
  assert.equal(buyer.calls.length, 0);
  assert.deepEqual(buyer.navigations, ['/checkout/resale/listing%2Fone']);
});

test('another buyer can inspect a reserved ticket without taking the hold or seeing buyer identity', async () => {
  const result = fixture({ data: { ...listing, status: 'RESERVED', reservedUntil: '2026-10-21T00:05:00Z' } });
  const button = buyButton(result);
  assert.equal(button.props.disabled, false);
  assert.ok(nodes(result.tree).some(node => typeof node === 'string' && node.includes('Vé đang được người khác giữ đến')));
  button.props.onClick(); await Promise.all(result.actions);
  assert.equal(result.calls.length, 0);
  assert.deepEqual(result.navigations, ['/checkout/resale/listing%2Fone']);
});

test('listing cancellation retains the existing confirmation dialog and endpoint', async () => {
  const result = fixture({ cancel: true, data: { ...listing, ticketId: 'private-ticket' } });
  const dialog = nodes(result.tree).find(node => node.type === 'ConfirmDialog');
  assert.ok(dialog);
  await dialog.props.onConfirm();
  assert.deepEqual(result.calls[0], ['resale/listings/listing%2Fone/cancel']);
});

test('a held or paid purchase opens the existing order without creating another hold', () => {
  for (const status of ['PENDING_PAYMENT', 'PAID']) {
    const result = fixture({ data: { ...listing, status: status === 'PAID' ? 'SOLD' : 'RESERVED', purchase: { status, resaleOrderId: 'held/order', expiresAt: '2027-01-01T00:00:00Z' } } });
    assert.equal(buyButton(result), undefined);
    assert.ok(nodes(result.tree).some(node => node.type === 'Link' && node.props.href === '/checkout/pass/held%2Forder'));
    assert.equal(result.calls.length, 0);
  }
});

test('unavailable listings offer purchase history instead of a dead-end API error', () => {
  const tree = nodes(fixture({ data: null, failure: true, failureCode: 404 }).tree);
  assert.ok(tree.some(node => node.type === 'Empty' && node.props.href === '/account/resale?tab=buy'));
  assert.equal(tree.some(node => node.type === 'Failure'), false);
});

test('transient detail refresh keeps ticket information but hides new purchase', () => {
  const result = fixture({ failure: true });
  const tree = nodes(result.tree);
  assert.ok(tree.includes('Đêm nhạc'));
  assert.ok(tree.some(node => node.type === 'EventPoster'));
  assert.equal(buyButton(result), undefined);
});
