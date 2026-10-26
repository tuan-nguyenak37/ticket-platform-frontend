const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const code = ts.transpileModule(fs.readFileSync(path.resolve(__dirname, '../components/commerce/AccountLists.tsx'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
function fixture(component, { items = [], total = items.length, pending = false, error = false, resale = false, page = 1, userId = 'buyer', tab = 'sell' } = {}) {
  const calls = [], queries = [];
  const dependencies = {
    react: { useState: initial => [typeof initial === 'number' ? page : tab, () => {}] },
    'react/jsx-runtime': require('react/jsx-runtime'), 'lucide-react': require('lucide-react'),
    'next/link': { default: 'Link' },
    '@tanstack/react-query': { useQuery: options => { queries.push(options); return { data: { items, total }, isPending: pending, isError: error, isFetching: false }; } },
    '@/lib/auth/auth.store': { useAuthStore: selector => selector({ user: { user_id: userId } }) },
    '@/lib/api/commerce': { listCommerce: (...args) => calls.push(args), money: value => `${value} đ`, vietnamDate: value => value },
    '@/components/ui/commerce': { Failure: 'Failure', Pagination: 'Pagination' },
    './shared': { Empty: 'Empty', Status: 'Status' },
  };
  const exports = {};
  vm.runInNewContext(code, { exports, require: name => dependencies[name] });
  let tree = exports[component]({ resale });
  if (component === 'ResaleAccount' && tab === 'sell') {
    const listings = nodes(tree).find(node => typeof node.type === 'function');
    tree = listings.type(listings.props);
  }
  return { tree: nodes(tree), queries, calls };
}
function nodes(tree) {
  if (!tree || typeof tree !== 'object') return typeof tree === 'string' ? [tree] : [];
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  return [tree, ...nodes(tree.props?.children)];
}
const showing = { name: 'Suất tối', startTime: '2027-01-01T12:00:00Z', venueName: 'Nhà hát', city: 'Hà Nội' };
test('account queries remain scoped to user and retain private API paths', async () => {
  for (const [component, path, key, resale] of [
    ['TicketsList', 'tickets/mine', 'tickets', false], ['OrdersList', 'orders/mine', 'orders', false],
    ['OrdersList', 'resale/orders/mine', 'resale-orders', true], ['ResaleAccount', 'resale/listings/mine', 'my-listings', false],
  ]) {
    const result = fixture(component, { userId: 'next-buyer', resale, page: 2 });
    await result.queries[0].queryFn();
    assert.equal(JSON.stringify(result.queries[0].queryKey), JSON.stringify(['commerce', 'next-buyer', key, 2]));
    assert.deepEqual(result.calls[0], [path, 2]);
    assert.ok(result.tree.some(node => node.type === 'Pagination'));
  }
});
test('tickets keep status, real venue/time and encoded QR detail links', () => {
  const ticket = { ticketId: 'ticket/one', status: 'CANCELLED', ticketNumber: 2, event: { title: 'Đêm nhạc' }, ticketType: { name: 'VIP' }, showing };
  const { tree } = fixture('TicketsList', { items: [ticket] });
  assert.ok(tree.some(node => node.type === 'Status' && node.props.value === 'CANCELLED'));
  assert.ok(tree.some(node => node.type === 'Link' && node.props.href === '/account/tickets/ticket%2Fone'));
  assert.ok(tree.includes(showing.startTime));
  assert.ok(tree.includes('Nhà hát, Hà Nội'));
});
test('orders use backend totals and link to the correct original/resale checkout', () => {
  for (const resale of [false, true]) {
    const order = { ...(resale ? { resaleOrderId: 'order/one', price: '9007199254740993' } : { orderId: 'order/one', totalAmount: '9007199254740993', ticketTypeName: 'VIP', quantity: 2 }), status: 'PENDING_PAYMENT', createdAt: showing.startTime };
    const { tree } = fixture('OrdersList', { items: [order], resale });
    assert.ok(tree.includes('9007199254740993 đ'));
    assert.ok(tree.includes('Tiếp tục thanh toán'));
    assert.ok(tree.some(node => node.type === 'Link' && node.props.href === `/checkout/${resale ? 'pass' : 'orders'}/order%2Fone`));
  }
});
test('resale history shows actual listing status and management link, not payout promises', () => {
  const listing = { listingId: 'listing/one', status: 'SOLD', price: '50000', createdAt: showing.startTime, showing, event: { title: 'Đêm nhạc' }, ticketType: { name: 'VIP' } };
  const { tree } = fixture('ResaleAccount', { items: [listing] });
  assert.ok(tree.some(node => node.type === 'Status' && node.props.value === 'SOLD'));
  assert.ok(tree.some(node => node.type === 'Link' && node.props.href === '/pass/listing%2Fone'));
  assert.ok(tree.some(node => typeof node === 'string' && node.includes('không phải xác nhận nhận tiền')));
  assert.doesNotMatch(tree.filter(node => typeof node === 'string').join(' '), /sandbox|sanbox|môi trường thử nghiệm/i);
});
test('all account lists have separate loading, failure and empty states', () => {
  for (const component of ['TicketsList', 'OrdersList', 'ResaleAccount']) {
    assert.ok(fixture(component, { pending: true }).tree.some(node => node.props?.role === 'status'));
    assert.ok(fixture(component, { error: true }).tree.some(node => node.type === 'Failure'));
    const { tree } = fixture(component);
    assert.ok(tree.some(node => node.type === 'Empty'));
    assert.ok(!tree.some(node => node.type === 'Pagination'));
  }
});

test('seller history shows masked settlement, independent payout state and polls only active work', () => {
  const listing = { listingId: 'listing', status: 'SOLD', price: '200000', createdAt: showing.startTime,
    showing, event: { title: 'Đêm nhạc' }, ticketType: { name: 'VIP' },
    settlement: { bankName: 'Test Bank', accountHolder: 'SELLER', maskedAccountNumber: '•••• 7890',
      feeBasisPoints: 500, feeAmount: '10000', netAmount: '190000',
      payout: { payoutId: 'payout', status: 'PENDING', processedAt: null } } };
  for (const [status, label] of [['PENDING', 'Chờ chi trả'], ['SUCCEEDED', 'Đã xử lý chi trả'], ['FAILED', 'Chi trả cần kiểm tra']]) {
    const item = { ...listing, settlement: { ...listing.settlement, payout: { ...listing.settlement.payout, status } } };
    const { tree, queries } = fixture('ResaleAccount', { items: [item] });
    assert.ok(tree.includes(label));
    assert.ok(tree.includes('190000 đ'));
    assert.ok(tree.includes('10000 đ'));
    assert.ok(tree.includes('•••• 7890'));
    assert.equal(queries[0].refetchInterval({ state: { data: { items: [item] } } }), status === 'PENDING' ? 5000 : false);
  }
  const { queries } = fixture('ResaleAccount');
  assert.equal(queries[0].refetchInterval({ state: { data: { items: [{ ...listing, status: 'AVAILABLE' }] } } }), 5000);
  assert.equal(queries[0].refetchInterval({ state: {} }), false);
});

test('buyer history identifies the purchased event and exposes owned ticket action with live status updates', () => {
  const order = { resaleOrderId: 'purchase/one', status: 'PAID', price: '200000', createdAt: showing.startTime,
    event: { title: 'Đêm nhạc' }, ticketType: { name: 'VIP' }, showing, ticketId: 'ticket/one' };
  const { tree, queries } = fixture('OrdersList', { resale: true, items: [order] });
  assert.ok(tree.includes('Đêm nhạc'));
  assert.ok(tree.includes('VIP'));
  assert.ok(tree.some(node => node.type === 'Link' && node.props.href === '/account/tickets/ticket%2Fone'));
  assert.equal(queries[0].refetchInterval({ state: { data: { items: [order] } } }), false);
  assert.equal(queries[0].refetchInterval({ state: { data: { items: [{ ...order, status: 'PENDING_PAYMENT' }] } } }), 5000);
});
