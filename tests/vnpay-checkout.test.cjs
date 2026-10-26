const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const filename = path.resolve(__dirname, '../components/commerce/VnpayCheckout.tsx');
const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
}).outputText;

function fixture({ status = 'PENDING_PAYMENT', transaction = null, amount = '100000', expiresAt = '2099-01-01T00:00:00Z', discountAmount = '0', paymentUrl = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_TxnRef=test', orderFailure = null, orderLoaded = true, returned = false, outcome = 'UPDATED', resale = false, ticketId, cancel = false, listingPreview = false, purchase, rejectPost = false } = {}) {
  const state = { user: { user_id: 'buyer', full_name: 'Buyer', email: 'buyer@example.com', phone_number: '0901234567' }, revision: 1 };
  const auth = selector => selector(state);
  auth.getState = () => state;
  const calls = [];
  const navigations = [];
  const errors = [];
  const effects = [];
  const invalidations = [];
  const timers = [];
  const queryOptions = [];
  const refetches = [];
  let queryIndex = 0;
  const queries = [
    { isSuccess: true, data: { status, orderId: 'order', totalAmount: amount, quantity: 1, unitPrice: '100000', ticketTypeName: 'VIP', expiresAt, discountAmount, discountCode: 'SAVE' }, refetch: async () => { refetches.push('order'); } },
    { isSuccess: true, data: { current: transaction }, refetch: async () => {} },
  ];
  if (resale) queries[0].data = { resaleOrderId: 'order', status, price: amount, expiresAt, ticketId,
    event: { title: 'Đêm nhạc thật' }, ticketType: { name: 'Khu VIP', description: 'Đồ uống đi kèm' },
    showing: { name: 'Suất tối', startTime: '2027-01-01T12:00:00Z', venueName: 'Nhà hát', city: 'Hà Nội' } };
  if (listingPreview) queries[0].data = { ...queries[0].data, listingId: 'listing', originalPrice: amount, reservedUntil: expiresAt, purchase };
  if (!orderLoaded) queries[0].data = undefined;
  if (orderFailure !== null) Object.assign(queries[0], { isSuccess: false, isError: true, error: { statusCode: orderFailure } });
  const dependencies = {
    react: { useState: initial => { const value = stateIndex++ === 2 ? cancel : initial; return [value, value => { if (value instanceof Error) errors.push(value); }]; }, useRef: initial => ({ current: initial }), useCallback: action => action, useEffect: action => effects.push(action) },
    'react/jsx-runtime': require('react/jsx-runtime'),
    'next/link': { default: 'Link' },
    'next/navigation': { useSearchParams: () => new URLSearchParams(returned ? 'vnpay=returned' : '') },
    '@tanstack/react-query': { useQuery: options => { queryOptions.push(options); return queries[queryIndex++]; }, useQueryClient: () => ({ invalidateQueries: async options => { invalidations.push(options.queryKey); } }) },
    'lucide-react': { ArrowLeft: 'ArrowLeft', ArrowRight: 'ArrowRight', CheckCircle2: 'CheckCircle2', CreditCard: 'CreditCard', ShieldCheck: 'ShieldCheck', Ticket: 'Ticket', UserRound: 'UserRound' },
    '@/lib/auth/auth.store': { useAuthStore: auth },
    '@/lib/api/commerce': { getCommerce: async () => {}, postCommerce: async (...args) => { calls.push(args); if (rejectPost) throw new Error('Vé đang được người khác giữ'); return { paymentUrl, outcome }; }, money: value => `${value} VND`, vietnamDate: value => value },
    '@/components/ui/commerce': { Failure: 'Failure' },
    '@/components/ui/ConfirmDialog': { ConfirmDialog: 'ConfirmDialog' },
    '@/lib/api/http-errors': { formatHttpError: error => error },
    './TicketFiles': { TicketFiles: 'TicketFiles' },
    './shared': { Status: 'Status', useClock: () => Date.parse('2026-10-20T00:00:00Z') },
    './checkout.css': {},
  };
  const exports = {};
  let stateIndex = 0;
  vm.runInNewContext(code, { exports, require: name => {
    if (!(name in dependencies)) throw new Error(`Unexpected dependency ${name}`);
    return dependencies[name];
  }, URL, Date, Error, window: { location: { assign: value => navigations.push(value) }, setInterval: (action, delay) => { timers.push({ action, delay }); return 1; }, clearInterval() {}, setTimeout: action => { queueMicrotask(action); return 1; }, clearTimeout() {} }, document: { visibilityState: 'visible' } });
  const tree = exports.VnpayCheckout({ id: 'order', resale, listingPreview });
  return { tree, calls, navigations, state, errors, effects, invalidations, timers, queryOptions, refetches };
}

function nodes(tree) {
  if (tree == null || typeof tree === 'boolean') return [];
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  if (typeof tree !== 'object') return [tree];
  return [tree, ...nodes(tree.props?.children)];
}

test('checkout collects contact details only, never card details or OTP', () => {
  const { tree } = fixture();
  const inputs = nodes(tree).filter(node => node.type === 'input');
  assert.equal(inputs.length, 3);
  assert.deepEqual(inputs.map(node => node.props.autoComplete), ['name', 'email', 'tel']);
  assert.equal(nodes(tree).some(node => node.type === 'TicketFiles'), false);
});

test('resale checkout shows the exact event, showing and tier, and submits only contact information', async () => {
  const result = fixture({ resale: true, amount: '200000' });
  const tree = nodes(result.tree);
  for (const value of ['Đêm nhạc thật', 'Suất tối', 'Khu VIP', 'Đồ uống đi kèm', '200000 VND']) assert.ok(tree.includes(value));
  assert.ok(tree.some(node => node.type === 'button' && node.props.children === 'Hủy giữ vé'));
  await tree.find(node => node.type === 'form').props.onSubmit({ preventDefault() {} });
  assert.equal(result.calls[0][0], 'payments/vnpay/resale/order');
  assert.deepEqual(Object.keys(result.calls[0][1]), ['recipient']);
});

test('resale receipt exposes the new owned ticket only after the backend confirms PAID', () => {
  for (const status of ['PENDING_PAYMENT', 'PAID']) {
    const tree = nodes(fixture({ resale: true, status, ticketId: 'new/ticket' }).tree);
    const files = tree.find(node => node.type === 'TicketFiles');
    assert.equal(!!files, status === 'PAID');
    if (files) { assert.equal(files.props.id, 'new/ticket'); assert.equal(files.props.order, undefined); }
    assert.equal(tree.some(node => node.type === 'Link' && node.props.href === '/account/tickets/new%2Fticket'), status === 'PAID');
  }
  assert.equal(nodes(fixture({ resale: true, status: 'PAID' }).tree).some(node => node.type === 'TicketFiles'), false);
});

test('no release action while gateway result is pending or under review', () => {
  for (const status of ['PENDING', 'SUCCEEDED', 'REVIEW']) {
    const tree = nodes(fixture({ resale: true, transaction: { status, txnRef: 'txn', expiresAt: '2099-01-01T00:00:00Z', recipient: {} } }).tree);
    assert.equal(tree.some(node => node.type === 'button' && node.props.children === 'Hủy giữ vé'), false);
  }
});

test('cancelling a resale hold requires confirmation and refreshes buyer and marketplace data', async () => {
  const result = fixture({ resale: true, cancel: true });
  assert.equal(result.calls.length, 0);
  await nodes(result.tree).find(node => node.type === 'ConfirmDialog').props.onConfirm();
  assert.equal(result.calls[0][0], 'resale/orders/order/cancel');
  assert.equal(result.invalidations.length, 2);
  assert.equal(result.navigations.length, 0);
  const changed = fixture({ resale: true, cancel: true });
  changed.state.revision++;
  await nodes(changed.tree).find(node => node.type === 'ConfirmDialog').props.onConfirm();
  assert.equal(changed.calls.length, 0);
});

test('viewing a resale preview neither creates a hold nor fetches a payment; submitting starts both atomically', async () => {
  const result = fixture({ resale: true, listingPreview: true, status: 'AVAILABLE' });
  assert.equal(result.calls.length, 0);
  assert.equal(result.queryOptions[1].enabled, false);
  const tree = nodes(result.tree);
  assert.equal(tree.some(node => node.props?.role === 'timer'), false);
  assert.equal(tree.some(node => node.type === 'button' && node.props.children === 'Hủy giữ vé'), false);
  assert.ok(tree.some(node => typeof node === 'string' && node.includes('Chưa giữ vé ở bước này')));
  const form = tree.find(node => node.type === 'form');
  assert.equal(nodes(form).find(node => node.type === 'button').props.disabled, false);
  await form.props.onSubmit({ preventDefault() {} });
  assert.equal(result.calls.length, 1);
  assert.equal(result.calls[0][0], 'payments/vnpay/resale/listings/order');
  assert.deepEqual(Object.keys(result.calls[0][1]), ['recipient']);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(result.navigations.length, 1);
});

test('another buyer can fill contact information while waiting, but cannot submit a reserved ticket', async () => {
  const result = fixture({ resale: true, listingPreview: true, status: 'RESERVED' });
  const tree = nodes(result.tree);
  const form = tree.find(node => node.type === 'form');
  assert.ok(form);
  assert.equal(tree.filter(node => node.type === 'input').length, 3);
  assert.equal(nodes(form).find(node => node.type === 'button').props.disabled, true);
  assert.ok(tree.some(node => typeof node === 'string' && node.includes('Vé đang được người khác giữ đến')));
  await form.props.onSubmit({ preventDefault() {} });
  assert.equal(result.calls.length, 0);
  assert.equal(result.queryOptions[0].refetchInterval({ state: { data: { status: 'RESERVED' } } }), 5000);
});

test('resale preview resumes an existing purchase instead of offering a second payment', () => {
  const tree = nodes(fixture({ resale: true, listingPreview: true, status: 'RESERVED', purchase: { resaleOrderId: 'existing/order', status: 'PENDING_PAYMENT' } }).tree);
  assert.equal(tree.some(node => node.type === 'form'), false);
  assert.ok(tree.some(node => node.type === 'Link' && node.props.href === '/checkout/pass/existing%2Forder'));
});

test('a lost resale race refreshes availability without redirecting, replaying payment or clearing contact fields', async () => {
  const result = fixture({ resale: true, listingPreview: true, status: 'AVAILABLE', rejectPost: true });
  const form = nodes(result.tree).find(node => node.type === 'form');
  await form.props.onSubmit({ preventDefault() {} });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(result.calls.length, 1);
  assert.deepEqual(result.refetches, ['order']);
  assert.equal(result.navigations.length, 0);
  assert.equal(result.errors.length, 1);
  assert.deepEqual(nodes(form).filter(node => node.type === 'input').map(node => node.props.value), ['Buyer', 'buyer@example.com', '0901234567']);
});

test('transient polling errors keep checkout fields visible but block payment until recovery', async () => {
  for (const orderFailure of [0, 408, 429, 500, 503]) {
    const result = fixture({ orderFailure });
    const tree = nodes(result.tree);
    assert.equal(tree.filter(node => node.type === 'input').length, 3);
    assert.ok(tree.some(node => node.type === 'Failure'));
    const form = tree.find(node => node.type === 'form');
    assert.ok(nodes(form).find(node => node.type === 'button').props.disabled);
    await form.props.onSubmit({ preventDefault() {} });
    assert.equal(result.calls.length, 0);
  }
});

test('cached order is hidden on access denial or when no initial order loaded', () => {
  for (const options of [{ orderFailure: 401 }, { orderFailure: 403 }, { orderFailure: 404 }, { orderFailure: 503, orderLoaded: false }]) {
    const tree = nodes(fixture(options).tree);
    assert.equal(tree.some(node => node.type === 'form' || node.type === 'TicketFiles'), false);
    assert.ok(tree.some(node => node.type === 'Failure'));
  }
});

test('paid order stays visible during transient polling failure and never offers another payment', () => {
  const tree = nodes(fixture({ status: 'PAID', orderFailure: 503 }).tree);
  assert.ok(tree.some(node => node.type === 'TicketFiles'));
  assert.equal(tree.some(node => node.type === 'form'), false);
});

test('customer payment copy omits environment labels and preserves security guidance in every state', () => {
  for (const options of [{}, { status: 'PAID' }, { transaction: { status: 'REVIEW', txnRef: 'txn' } }, { transaction: { status: 'FAILED', txnRef: 'txn', failureCode: '24' } }, { expiresAt: '2000-01-01T00:00:00Z' }]) {
    const tree = nodes(fixture(options).tree);
    const text = tree.filter(node => typeof node === 'string').join(' ');
    assert.doesNotMatch(text, /sandbox|sanbox|thử nghiệm|mô phỏng/i);
    assert.ok(text.includes('Thanh toán qua cổng VNPay'));
    assert.ok(text.includes('Không nhập thông tin thẻ hoặc OTP ngân hàng trên TicketVerse'));
    assert.ok(tree.some(node => node.props?.className === 'checkout-payment-notice'));
  }
});

test('pending IPN does not display paid tickets and restores saved contact details', () => {
  const { tree } = fixture({ transaction: { status: 'PENDING', txnRef: 'txn', expiresAt: '2099-01-01T00:00:00Z', recipient: { name: 'Contact', email: 'contact@example.com', phone: '0901234567' } } });
  assert.equal(nodes(tree).some(node => node.type === 'TicketFiles'), false);
  const input = nodes(tree).find(node => node.type === 'input' && node.props.type === 'email');
  assert.equal(input.props.value, 'contact@example.com');
});

test('only a paid backend order renders tickets', () => {
  const { tree } = fixture({ status: 'PAID' });
  assert.equal(nodes(tree).some(node => node.type === 'TicketFiles'), true);
  assert.equal(nodes(tree).some(node => node.type === 'form'), false);
});

test('review state blocks another payment', () => {
  const { tree } = fixture({ transaction: { status: 'REVIEW', txnRef: 'txn' } });
  assert.equal(nodes(tree).some(node => node.type === 'form'), false);
  assert.equal(nodes(tree).some(node => node.type === 'TicketFiles'), false);
  assert.ok(nodes(tree).filter(node => typeof node === 'string').join(' ').includes('Không thanh toán lại'));
});

test('submits contact details to VNPay endpoint without client-controlled amount', async () => {
  const { tree, calls, navigations } = fixture();
  await nodes(tree).find(node => node.type === 'form').props.onSubmit({ preventDefault() {} });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(calls[0][0], 'payments/vnpay/orders/order');
  assert.deepEqual(Object.keys(calls[0][1]), ['recipient']);
  assert.equal(navigations.length, 1);
  assert.ok(navigations[0].startsWith('https://sandbox.vnpayment.vn/'));
});

test('rejects redirects to untrusted payment hosts', async () => {
  const { tree, navigations, errors } = fixture({ paymentUrl: 'https://evil.example/paymentv2/vpcpay.html' });
  nodes(tree).find(node => node.type === 'form').props.onSubmit({ preventDefault() {} });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(navigations.length, 0);
  assert.equal(errors.length, 1);
});

test('does not submit after the authentication session changes', async () => {
  const { tree, state, calls } = fixture();
  state.revision = 2;
  nodes(tree).find(node => node.type === 'form').props.onSubmit({ preventDefault() {} });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(calls.length, 0);
});

test('expired orders and succeeded transactions never offer a second payment', () => {
  for (const options of [{ expiresAt: '2000-01-01T00:00:00Z' }, { transaction: { status: 'SUCCEEDED', txnRef: 'txn' } }]) {
    assert.equal(nodes(fixture(options).tree).some(node => node.type === 'form'), false);
  }
});

test('summary and payment button use server total and discount without recalculation', () => {
  const tree = nodes(fixture({ amount: '75000', discountAmount: '25000' }).tree);
  const text = tree.filter(node => typeof node === 'string').join(' ');
  assert.ok(text.includes('75000 VND'));
  assert.ok(text.includes('25000 VND'));
  assert.ok(tree.some(node => node.props?.role === 'timer'));
  assert.equal(tree.filter(node => node.type === 'h1').length, 1);
});

test('return from VNPay checks the provider through the owner API without submitting another payment', async () => {
  const result = fixture({ returned: true, transaction: { status: 'PENDING', txnRef: 'txn', recipient: {} } });
  result.effects.forEach(effect => effect());
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(result.calls.length, 1);
  assert.equal(result.calls[0][0], 'payments/vnpay/orders/order/sync');
  assert.equal(result.timers[0].delay, 5 * 60_000);
  assert.equal(result.navigations.length, 0);
  assert.ok(result.invalidations.some(key => key[0] === 'commerce' && key[1] === 'buyer'));
  const form = nodes(result.tree).find(node => node.type === 'form');
  assert.equal(nodes(form).find(node => node.type === 'button').props.disabled, true);
});

test('a returned URL alone never claims success and failed verification remains retryable', async () => {
  const result = fixture({ returned: true, outcome: 'ERROR', transaction: { status: 'PENDING', txnRef: 'txn', recipient: {} } });
  result.effects.forEach(effect => effect());
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(nodes(result.tree).some(node => node.type === 'TicketFiles'), false);
  assert.equal(result.errors.length, 1);
  assert.ok(result.errors[0].message.includes('Chưa thể xác minh'));
});

test('paid backend state announces success and invalidates account lists without rechecking or paying', async () => {
  const result = fixture({ status: 'PAID', returned: true });
  result.effects.forEach(effect => effect());
  await new Promise(resolve => setImmediate(resolve));
  assert.ok(nodes(result.tree).filter(node => typeof node === 'string').includes('Thanh toán thành công'));
  assert.ok(nodes(result.tree).some(node => node.props?.role === 'status' && node.props?.['aria-live'] === 'polite'));
  assert.ok(result.invalidations.some(key => key[0] === 'commerce' && key[1] === 'buyer'));
  assert.equal(result.calls.length, 0);
});

test('return recovery stops for paid orders even if the payment cache is briefly pending', async () => {
  const result = fixture({ status: 'PAID', returned: true, transaction: { status: 'PENDING', txnRef: 'txn', recipient: {} } });
  result.effects.forEach(effect => effect());
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(result.calls.length, 0);
  assert.equal(result.timers.length, 0);
});

test('manual result check and automatic return check share a lock and never create another payment', async () => {
  const result = fixture({ returned: true, transaction: { status: 'PENDING', txnRef: 'txn', recipient: {} } });
  result.effects.forEach(effect => effect());
  const button = nodes(result.tree).find(node => node.type === 'button' && node.props.children === 'Kiểm tra kết quả thanh toán');
  await button.props.onClick();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(result.calls.length, 1);
  assert.equal(result.calls[0][0], 'payments/vnpay/orders/order/sync');
});
