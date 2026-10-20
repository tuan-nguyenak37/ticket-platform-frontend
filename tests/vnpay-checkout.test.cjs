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

function fixture({ status = 'PENDING_PAYMENT', transaction = null, paymentUrl = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_TxnRef=test' } = {}) {
  const state = { user: { user_id: 'buyer', full_name: 'Buyer', email: 'buyer@example.com', phone_number: '0901234567' }, revision: 1 };
  const auth = selector => selector(state);
  auth.getState = () => state;
  const calls = [];
  const navigations = [];
  const errors = [];
  let queryIndex = 0;
  const queries = [
    { isSuccess: true, data: { status, orderId: 'order', totalAmount: '100000', quantity: 1, unitPrice: '100000', ticketTypeName: 'VIP', expiresAt: '2099-01-01T00:00:00Z' }, refetch: async () => {} },
    { isSuccess: true, data: { current: transaction }, refetch: async () => {} },
  ];
  const dependencies = {
    react: { useState: initial => [initial, value => { if (value instanceof Error) errors.push(value); }], useRef: initial => ({ current: initial }) },
    'react/jsx-runtime': require('react/jsx-runtime'),
    'next/link': 'Link',
    '@tanstack/react-query': { useQuery: () => queries[queryIndex++], useQueryClient: () => ({ invalidateQueries: async () => {} }) },
    'lucide-react': { ArrowRight: 'ArrowRight', CheckCircle2: 'CheckCircle2', ShieldCheck: 'ShieldCheck' },
    '@/lib/auth/auth.store': { useAuthStore: auth },
    '@/lib/api/commerce': { getCommerce: async () => {}, postCommerce: async (...args) => { calls.push(args); return { paymentUrl }; }, money: value => `${value} VND` },
    '@/components/ui/commerce': { Failure: 'Failure' },
    './TicketFiles': { TicketFiles: 'TicketFiles' },
    './shared': { Status: 'Status', useClock: () => Date.parse('2026-10-20T00:00:00Z') },
    './checkout.css': {},
  };
  const exports = {};
  vm.runInNewContext(code, { exports, require: name => {
    if (!(name in dependencies)) throw new Error(`Unexpected dependency ${name}`);
    return dependencies[name];
  }, URL, Date, Error, window: { location: { assign: value => navigations.push(value) } } });
  const tree = exports.VnpayCheckout({ id: 'order' });
  return { tree, calls, navigations, state, errors };
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
