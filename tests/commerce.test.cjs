const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
function resolveLocal(file, name) {
  const base = name.startsWith('@/') ? path.resolve(name.slice(2)) : path.resolve(path.dirname(file), name);
  const found = [base, base + '.ts', base + '.tsx', path.join(base, 'index.ts')].find(candidate => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
  if (!found) throw Error('Missing module: ' + name);
  return found;
}
function load(file, dependencies = {}) {
  const code = ts.transpileModule(fs.readFileSync(path.resolve(file), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports, require: name => dependencies[name] ?? (name.startsWith('@/') || name.startsWith('.') ? load(resolveLocal(file, name), dependencies) : require(name)), Intl, Date, Promise, process });
  return exports;
}
const rules = { ...load('features/orders/utils/order.rules.ts'), ...load('features/orders/utils/checkout-key.ts'), ...load('features/tickets/utils/ticket.rules.ts'), ...load('shared/utils/format.ts') };
const baseOrder = { status: 'paid', buyerId: 'buyer', sellerId: 'seller', expiresAt: '2099-01-01T00:00:00Z', disputeUntil: '2099-01-02T00:00:00Z', dispute: null, payoutStatus: 'pending', payment: { status: 'succeeded' } };
test('two buyers: only the allocated paid order permits download; refund_pending never does', () => {
  assert.equal(rules.orderPermissions(baseOrder, 'buyer', false, Date.now()).download, true);
  const loser = { ...baseOrder, status: 'refund_pending' };
  assert.equal(rules.orderPermissions(loser, 'buyer', false, Date.now()).download, false);
  assert.equal(rules.orderPermissions(loser, 'buyer', false, Date.now()).pay, false);
  assert.equal(rules.orderPermissions(loser, 'manager', true, Date.now()).refund, true);
  assert.equal(rules.orderPermissions({ ...loser, status: 'refunded' }, 'manager', true, Date.now()).refund, false);
});
test('dispute lifecycle enforces buyer deadline, one seller reply and independent manager', () => {
  const permission = (order, actor, manage = false) => rules.orderPermissions(order, actor, manage, Date.now());
  assert.equal(permission(baseOrder, 'buyer').dispute, true);
  assert.equal(permission(baseOrder, 'seller').dispute, false);
  assert.equal(permission({ ...baseOrder, disputeUntil: '2000-01-01' }, 'buyer').dispute, false);
  const disputed = { ...baseOrder, status: 'disputed', dispute: { status: 'open', sellerResponse: null } };
  assert.equal(permission(disputed, 'seller').reply, true);
  assert.equal(permission({ ...disputed, dispute: { status: 'open', sellerResponse: 'Submitted' } }, 'seller').reply, false);
  assert.equal(permission(disputed, 'manager', true).resolve, true);
  for (const actor of ['buyer', 'seller', undefined]) assert.equal(permission(disputed, actor, true).resolve, false);
  assert.equal(permission({ ...disputed, dispute: { status: 'accepted' } }, 'manager', true).resolve, false);
});
test('payout needs completed, ready and succeeded; own transaction is forbidden', () => {
  const order = { ...baseOrder, status: 'completed', payoutStatus: 'ready' };
  assert.equal(rules.orderPermissions(order, 'manager', true, Date.now()).payout, true);
  for (const actor of ['buyer', 'seller']) assert.equal(rules.orderPermissions(order, actor, true, Date.now()).payout, false);
  for (const payoutStatus of ['none', 'pending', 'blocked', 'paid']) assert.equal(rules.orderPermissions({ ...order, payoutStatus }, 'manager', true, Date.now()).payout, false);
});
test('idempotency key persists through retries/reloads; a new completed checkout gets a new key', () => {
  const memory = new Map();
  const storage = { getItem: key => memory.get(key), setItem: (key, value) => memory.set(key, value), removeItem: key => memory.delete(key) };
  let generated = 0; const generate = () => `checkout-${++generated}`;
  assert.equal(rules.checkoutKey(storage, 'buyer', 'ticket', generate), 'checkout-1');
  assert.equal(rules.checkoutKey(storage, 'buyer', 'ticket', generate), 'checkout-1');
  assert.equal(rules.checkoutKey(storage, 'buyer2', 'ticket', generate), 'checkout-2');
  rules.clearCheckout(storage, 'buyer', 'ticket');
  assert.equal(rules.checkoutKey(storage, 'buyer', 'ticket', generate), 'checkout-3');
});
test('PDF validation checks MIME, size and signature', async () => {
  const file = new File(['%PDF-1.7 test'], 'ticket.pdf', { type: 'application/pdf' });
  await rules.validatePdf(file, 100);
  await assert.rejects(rules.validatePdf(file, 5));
  await assert.rejects(rules.validatePdf(new File(['not a pdf'], 'ticket.pdf', { type: 'application/pdf' }), 100));
  await assert.rejects(rules.validatePdf(new File(['%PDF-1.7'], 'image.png', { type: 'image/png' }), 100));
});
test('API uses contract payloads, protected files and surfaces backend failures', async () => {
  const calls = []; let failure;
  const request = async (...args) => { calls.push(args); if (failure) throw failure; return { data: { success: true, data: baseOrder } }; };
  const api = load('features/orders/api/orders.api.ts', { '@/lib/session/session': { apiClient: { get: request, post: request, delete: request } }, '@/lib/http/axios-client': { createApiClient: () => ({ get: request }) }, '@/lib/http/http-errors': { AppApiError: Error } });
  await api.createOrder('ticket', 'checkout-key');
  assert.equal(calls[0][0], '/orders');
  assert.equal(JSON.stringify(calls[0][1]), '{"ticketId":"ticket"}');
  assert.equal(calls[0][2].headers['Idempotency-Key'], 'checkout-key');
  await api.actOnOrder('order', { path: 'dispute/reply', body: { response: 'Evidence' } }, false);
  assert.equal(calls[1][0], '/orders/me/order/dispute/reply');
  await api.actOnOrder('order', { path: 'dispute/resolve', body: { decision: 'reject', note: 'Reviewed' } }, true);
  assert.equal(calls[2][0], '/orders/manage/order/dispute/resolve');
  assert.equal(calls[2][1].decision, 'reject');
  await api.downloadOrder('order'); assert.equal(calls[3][1].responseType, 'blob');
  for (const statusCode of [401, 403, 409, 500]) { failure = Object.assign(new Error('Backend error'), { statusCode }); await assert.rejects(api.createOrder('ticket', 'checkout-key'), error => error === failure); }
});
test('OCR polling is bounded and stops on completed, failure and stale request errors', () => {
  let options;
  const hooks = load('features/tickets/review/hooks/useTicketDetail.ts', {
    '@tanstack/react-query': { useQuery: value => { options = value; return {}; }, useQueryClient: () => ({}), useMutation: () => ({}) },
    '@/features/tickets/review/utils/tickets.api': {},
  });
  hooks.useTicketDetail('ticket');
  const state = { dataUpdateCount: 99, data: { status: 'pending_review', check: { status: 'processing' } } };
  assert.equal(options.refetchInterval({ state }), 3000);
  assert.equal(options.refetchInterval({ state: { ...state, dataUpdateCount: 100 } }), false);
  assert.equal(options.refetchInterval({ state: { ...state, error: new Error('failed') } }), false);
  assert.equal(options.refetchIntervalInBackground, false);
});

test('refund_pending rendering explains the losing purchase and omits ticket download', () => {
  const React = require('react'); const { renderToStaticMarkup } = require('react-dom/server');
  const order = { ...baseOrder, order_id: 'order-loser', amount: '400000.00', ticket: { eventName: 'Demo', ticketTier: 'VIP', seatInfo: 'A12' }, status: 'refund_pending', payment: { status: 'refund_pending' } };
  const { OrderDetail } = load('features/orders/components/OrderDetail.tsx', {
    'next/link': { default: ({ href, children }) => React.createElement('a', { href }, children) },
    '@tanstack/react-query': { useQuery: () => ({ data: order }), useQueryClient: () => ({}), useMutation: () => ({}) },
    '@/features/orders/api/orders.api': {}, '@/features/orders/utils/order.rules': rules,
    '@/lib/session/auth.store': { useAuthStore: selector => selector({ user: { user_id: 'buyer' } }) },
    '@/shared/ui/commerce': { Failure: () => null },
    '@/features/disputes/ui': { DisputeAttachments: () => null, DisputeDialog: () => null }, '@/features/payments/ui': { PaymentHistory: () => null, TransferForm: () => null },
  });
  const html = renderToStaticMarkup(React.createElement(OrderDetail, { id: 'order-loser' }));
  assert.match(html, /Chờ hoàn tiền/);
  assert.match(html, /người khác mua trước/);
  assert.match(html, /Chưa có xác nhận hoàn tiền/);
  assert.doesNotMatch(html, /Tải vé qua kết nối xác thực/);
});

test('dispute evidence is displayed as escaped text and seller response form follows permissions', () => {
  const React = require('react'); const { renderToStaticMarkup } = require('react-dom/server');
  const order = { ...baseOrder, order_id: 'order-dispute', amount: '400000.00', ticket: { eventName: 'Demo', ticketTier: 'VIP' }, status: 'disputed', dispute: { status: 'open', reason: 'Wrong tier', evidence: '<img src=x onerror=alert(1)> https://example.test', sellerResponse: null } };
  const { OrderDetail } = load('features/orders/components/OrderDetail.tsx', {
    'next/link': { default: ({ href, children }) => React.createElement('a', { href }, children) },
    '@tanstack/react-query': { useQuery: () => ({ data: order }), useQueryClient: () => ({}), useMutation: () => ({}) },
    '@/features/orders/api/orders.api': {}, '@/features/orders/utils/order.rules': rules,
    '@/lib/session/auth.store': { useAuthStore: selector => selector({ user: { user_id: 'seller' } }) },
    '@/shared/ui/commerce': { Failure: () => null },
    '@/features/disputes/ui': { DisputeAttachments: () => null, DisputeDialog: () => null }, '@/features/payments/ui': { PaymentHistory: () => null, TransferForm: () => null },
  });
  const html = renderToStaticMarkup(React.createElement(OrderDetail, { id: 'order-dispute' }));
  assert.match(html, /&lt;img/); assert.doesNotMatch(html, /<img|href="https:\/\/example.test"/);
  assert.match(html, /Gửi phản hồi/); assert.doesNotMatch(html, /Lưu quyết định|Tải vé qua kết nối xác thực/);
});


test('dispute attachment download uses authenticated blob API, encoded IDs and cancellation', async () => {
  const calls = []; const signal = new AbortController().signal;
  const blob = new Blob(['%PDF-1.7'], { type: 'application/pdf' });
  const api = load('features/disputes/api/disputes.api.ts', {
    '@/lib/session/session': { apiClient: { get: async (...args) => { calls.push(args); return { data: blob }; } } },
    '@/lib/http/axios-client': { createApiClient: () => ({}) },
    '@/lib/http/http-errors': { AppApiError: Error },
  });
  assert.equal(await api.downloadDisputeEvidence('order/1', 'file/1', signal), blob);
  assert.equal(calls[0][0], '/orders/order%2F1/dispute/evidence/file%2F1');
  assert.equal(calls[0][1].responseType, 'blob');
  assert.equal(calls[0][1].signal, signal);
});

test('attachment list renders both parties and metadata without exposing remote file URLs', () => {
  const React = require('react'); const { renderToStaticMarkup } = require('react-dom/server');
  const { DisputeAttachments } = load('features/disputes/components/DisputeAttachments.tsx', {
    '@/features/disputes/api/disputes.api': {}, '@/shared/utils/format': rules, '@/shared/ui/commerce': { Failure: () => null },
  });
  const attachment = { id: 'file1', uploadedBy: '<seller>', side: 'seller', mimetype: 'application/pdf', size: 1024, createdAt: '2026-10-12T00:00:00Z', downloadUrl: 'https://external.test/private.pdf' };
  const html = renderToStaticMarkup(React.createElement(DisputeAttachments, { orderId: 'order', attachments: [attachment, { ...attachment, id: 'file2', side: 'buyer' }] }));
  assert.match(html, /Người bán/); assert.match(html, /Người mua/);
  assert.match(html, /application\/pdf/); assert.match(html, /1\.024 byte/);
  assert.match(html, /&lt;seller&gt;/); assert.doesNotMatch(html, /external.test|<object|<img/);
  assert.match(renderToStaticMarkup(React.createElement(DisputeAttachments, { orderId: 'order', attachments: [] })), /Chưa có file bằng chứng/);
});


test('user API respects self/admin paths, exact fields and untrimmed passwords', async () => {
  const calls = []; const send = async (...args) => { calls.push(args); return { data: { success: true, data: {} } }; };
  const api = load('features/account/api/api.ts', { '@/lib/session/session': { apiClient: { get: send, patch: send, post: send } }, '@/lib/http/http-errors': { AppApiError: Error } });
  await api.listUsers(); assert.equal(calls.at(-1)[0], '/users');
  assert.equal(calls.at(-1)[1].params, undefined);
  await api.getUser('user/1'); assert.equal(calls.at(-1)[0], '/users/user%2F1');
  await api.getProfile(); assert.equal(calls.at(-1)[0], '/users/me');
  await api.saveName('  New name  '); assert.equal(calls.at(-1)[0], '/users/me');
  assert.equal(JSON.stringify(calls.at(-1)[1]), '{"fullName":"New name"}');
  await api.saveName('Name', 'user1'); assert.equal(calls.at(-1)[0], '/users/user1');
  await api.setUserStatus('user1', 'suspended', '  Reason  ');
  assert.equal(calls.at(-1)[0], '/users/user1/status');
  assert.equal(JSON.stringify(calls.at(-1)[1]), '{"status":"suspended","reason":"Reason"}');
  await api.changePassword(' old password ', ' new password ');
  assert.equal(calls.at(-1)[0], '/users/me/password');
  assert.equal(calls.at(-1)[1].currentPassword, ' old password ');
  assert.equal(calls.at(-1)[1].newPassword, ' new password ');
  await api.createUser({ email: 'user@example.test', password: 'test-only-password' });
  assert.equal(calls.at(-1)[0], '/users');
  assert.deepEqual(Object.keys(calls.at(-1)[1]).sort(), ['email', 'password']);
});


test('card confirmation sends the demo DTO to the current payment endpoint', async () => {
  const calls = []; const result = { success: true, data: { status: 'refund_pending' } };
  const api = load('features/payments/api/payments.api.ts', { '@/lib/session/session': { apiClient: { post: async (...args) => { calls.push(args); return { data: result }; } } }, '@/lib/http/http-errors': { AppApiError: Error } });
  await api.startPayment('order', 'attempt-key');
  assert.equal(calls[0][0], '/orders/me/order/payments');
  assert.equal(calls[0][1], undefined);
  assert.equal(calls[0][2].headers['Idempotency-Key'], 'attempt-key');
  const card = { cardNumber: '4242424242424242', holderName: 'DEMO BUYER', expiryMonth: 12, expiryYear: 2035, cvv: '123' };
  assert.equal((await api.confirmPayment('order', 'payment', card)).status, 'refund_pending');
  assert.equal(calls[1][0], '/orders/me/order/payments/payment/confirm');
  assert.equal(calls[1][1], card);
  await api.cancelPayment('order', 'payment');
  assert.equal(calls[2][0], '/orders/me/order/payments/payment/cancel');
});
