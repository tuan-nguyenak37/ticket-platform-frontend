const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function fixture() {
  const calls = [], downloads = [], revoked = [], timers = [];
  let response = { success: true, data: { orderId: 'order' } };
  let failure;
  const client = scope => ({
    defaults: { withCredentials: true },
    get: async (...args) => { calls.push([scope, 'get', ...args]); if (failure) throw failure; return { data: response }; },
    post: async (...args) => { calls.push([scope, 'post', ...args]); if (failure) throw failure; return { data: response }; },
  });
  const publicClient = client('public');
  const dependencies = {
    '@/lib/auth/session': { apiClient: client('private') },
    '@/lib/api/axios-client': { createApiClient: () => publicClient },
    '@/lib/api/response': { unwrap: body => { if (!body.success) throw new Error(body.message); return body.data; } },
  };
  const code = ts.transpileModule(fs.readFileSync(path.resolve(__dirname, '../lib/api/commerce.ts'), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const exports = {};
  vm.runInNewContext(code, {
    exports, require: name => dependencies[name],
    URL: { createObjectURL: blob => { downloads.push(blob); return 'blob:ticket'; }, revokeObjectURL: url => revoked.push(url) },
    document: { createElement: tag => { assert.equal(tag, 'a'); const anchor = { click() { downloads.push([this.href, this.download]); } }; return anchor; } },
    window: { setTimeout: (callback, delay) => timers.push({ callback, delay }) },
  });
  return { api: exports, calls, publicClient, downloads, revoked, timers, respond: value => { response = value; }, fail: error => { failure = error; } };
}

test('commerce defaults to authenticated calls; public discovery omits credentials', async () => {
  const { api, calls, publicClient } = fixture();
  assert.equal((await api.getCommerce('orders/order')).orderId, 'order');
  await api.listCommerce('resale/listings', 2, true);
  assert.equal(publicClient.defaults.withCredentials, false);
  assert.equal(JSON.stringify(calls), JSON.stringify([
    ['private', 'get', '/v1/orders/order', {}],
    ['public', 'get', '/v1/resale/listings', { params: { page: 2, limit: 20 } }],
  ]));
});

test('order creation forwards idempotency keys without inventing payment data', async () => {
  const { api, calls } = fixture();
  const body = { ticketTypeId: 'type', quantity: 2 };
  await api.postCommerce('orders', body, 'purchase-key');
  await api.postCommerce('orders/order/cancel');
  assert.equal(JSON.stringify(calls), JSON.stringify([
    ['private', 'post', '/v1/orders', body, { headers: { 'Idempotency-Key': 'purchase-key' } }],
    ['private', 'post', '/v1/orders/order/cancel', {}, {}],
  ]));
});

test('commerce propagates transport and API failures instead of reporting success', async () => {
  const { api, respond, fail } = fixture();
  respond({ success: false, message: 'Order expired', statusCode: 409 });
  await assert.rejects(api.getCommerce('orders/order'), /Order expired/);
  const error = new Error('Network unavailable');
  fail(error);
  await assert.rejects(api.postCommerce('orders'), error);
});

test('PDF downloads use private blob responses and release temporary URLs', async () => {
  const { api, calls, respond, downloads, timers, revoked } = fixture();
  const blob = new Blob(['ticket'], { type: 'application/pdf' });
  respond(blob);
  await api.downloadTicketPdf('tickets/ticket/pdf', 'ticket.pdf');
  assert.equal(JSON.stringify(calls[0]), JSON.stringify(['private', 'get', '/v1/tickets/ticket/pdf', { responseType: 'blob' }]));
  assert.equal(downloads[0], blob);
  assert.deepEqual(downloads[1], ['blob:ticket', 'ticket.pdf']);
  assert.equal(timers[0].delay, 1000);
  timers[0].callback();
  assert.deepEqual(revoked, ['blob:ticket']);
});

test('failed PDF requests never create a download', async () => {
  const { api, fail, downloads } = fixture();
  fail(new Error('Forbidden'));
  await assert.rejects(api.downloadTicketPdf('tickets/other/pdf', 'ticket.pdf'), /Forbidden/);
  assert.equal(downloads.length, 0);
});

test('VND formatting preserves bigint precision and dates use Vietnam time', () => {
  const { api } = fixture();
  assert.equal(api.money('9007199254740993'), '9.007.199.254.740.993 đ');
  assert.equal(api.money('invalid'), 'Giá chưa khả dụng');
  assert.equal(api.vietnamDate('2027-01-01T18:00:00Z'), new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh', dateStyle: 'medium', timeStyle: 'short',
  }).format(new Date('2027-01-01T18:00:00Z')));
});
