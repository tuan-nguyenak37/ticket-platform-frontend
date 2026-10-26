const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function fixture({ status = 'ACTIVE', qrVisible = false, checkedInAt = null, pending = false, error = false, price = '', postFailure = null, bankName = 'Vietcombank', accountHolder = 'NGUYEN VAN A', accountNumber = '001234567890' } = {}) {
  const queries = [], calls = [];
  const states = [qrVisible, price, false, null, null, bankName, accountHolder, accountNumber];
  let queryIndex = 0, stateIndex = 0;
  const ticket = { ticketId: 'ticket/one', status, checkedInAt, ticketNumber: 1,
    event: { title: 'Event' }, organizer: { name: 'Organizer' }, ticketType: { name: 'VIP' },
    showing: { name: 'Show', startTime: '2027-01-01T00:00:00Z', venueName: 'Hall', city: 'City' } };
  const dependencies = {
    react: { useState: initial => {
      const index = stateIndex++;
      if (!(index in states)) states[index] = initial;
      return [states[index], value => { states[index] = value; }];
    }, useRef: initial => ({ current: initial }) },
    'react/jsx-runtime': require('react/jsx-runtime'),
    'next/navigation': { useRouter: () => ({ push() {} }) },
    '@tanstack/react-query': { useQuery: options => { queries.push(options); return queryIndex++ === 0
      ? { data: ticket, isPending: pending, isError: error } : { data: { qrDataUrl: 'data:image/png;base64,test' } }; }, useQueryClient: () => ({ invalidateQueries: async () => {} }) },
    '@/lib/auth/auth.store': { useAuthStore: selector => selector({ user: { user_id: 'buyer' } }) },
    '@/lib/api/commerce': { getCommerce: async route => calls.push(route), postCommerce: async (route, body) => { calls.push({ route, body }); if (postFailure) throw postFailure; return { listingId: 'listing' }; }, vietnamDate: value => value, money: value => `${new Intl.NumberFormat('vi-VN').format(BigInt(value))} ₫` },
    '@/components/ui/commerce': { Failure: 'Failure' },
    '@/components/ui/ConfirmDialog': { ConfirmDialog: 'ConfirmDialog' },
    './TicketFiles': { TicketFiles: 'TicketFiles' }, './shared': { Status: 'Status' },
  };
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(path.resolve(__dirname, '../components/commerce/TicketDetail.tsx'), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  vm.runInNewContext(code, { exports, require: name => dependencies[name] });
  const render = () => { queryIndex = 0; stateIndex = 0; queries.length = 0; return nodes(exports.TicketDetail({ id: ticket.ticketId })); };
  return { tree: render(), render, queries, calls, states };
}

function nodes(tree) {
  if (tree == null || typeof tree === 'boolean') return [];
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  if (typeof tree !== 'object') return [tree];
  return [tree, ...nodes(tree.props?.children)];
}

test('ticket details and QR use owner-scoped cache keys and encoded private routes', async () => {
  const { queries, calls } = fixture();
  await queries[0].queryFn();
  await queries[1].queryFn();
  assert.deepEqual(calls, ['tickets/ticket%2Fone', 'tickets/ticket%2Fone/qr']);
  assert.equal(JSON.stringify(queries[0].queryKey), JSON.stringify(['commerce', 'buyer', 'ticket', 'ticket/one']));
  assert.equal(JSON.stringify(queries[1].queryKey), JSON.stringify(['commerce', 'buyer', 'qr', 'ticket/one']));
  assert.equal(queries[1].enabled, false);
  assert.equal(queries[1].retry, false);
  assert.equal(queries[1].gcTime, 0);
  assert.equal(queries[1].staleTime, 0);
});

test('QR requires an explicit request and an active ticket', () => {
  const visible = fixture({ qrVisible: true });
  assert.equal(visible.queries[1].enabled, true);
  assert.ok(visible.tree.some(node => node.type === 'img' && node.props.alt));
  assert.equal(fixture().tree.some(node => node.type === 'img'), false);
  const cancelled = fixture({ qrVisible: true, status: 'CANCELLED' });
  assert.equal(cancelled.queries[1].enabled, false);
  for (const type of ['img', 'form', 'TicketFiles']) assert.equal(cancelled.tree.some(node => node.type === type), false);
});

test('only active, unused tickets expose resale controls', () => {
  assert.ok(fixture().tree.some(node => node.type === 'form'));
  assert.equal(fixture({ checkedInAt: '2026-10-20T00:00:00Z' }).tree.some(node => node.type === 'form'), false);
});

test('loading and failures never expose ticket files or QR', () => {
  const pending = fixture({ pending: true });
  assert.ok(pending.tree.some(node => node.props?.role === 'status'));
  const failed = fixture({ error: true });
  assert.ok(failed.tree.some(node => node.type === 'Failure'));
  for (const result of [pending, failed]) assert.equal(result.tree.some(node => node.type === 'TicketFiles' || node.type === 'img'), false);
});

test('resale price formats Vietnamese thousands while typing and submits the exact unformatted amount', async () => {
  const result = fixture();
  for (const input of ['200000', '250.000', '000200000', '', '9223372036854775807']) {
    result.render().find(node => node.type === 'input').props.onChange({ target: { value: input } });
    const field = result.render().find(node => node.type === 'input');
    const raw = input.replace(/\./g, '').replace(/^0+(?=\d)/, '');
    assert.equal(field.props.value, raw ? new Intl.NumberFormat('vi-VN').format(BigInt(raw)) : '');
    assert.equal(result.states[1], raw);
    if (field.props.value) assert.match(field.props.value, new RegExp(`^(?:${field.props.pattern})$`));
  }
  const tree = result.render();
  tree.find(node => node.type === 'form').props.onSubmit({ preventDefault() {} });
  assert.equal(result.calls.length, 0);
  await result.render().find(node => node.type === 'ConfirmDialog').props.onConfirm();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(result.calls[0].route, 'resale/listings');
  assert.equal(result.calls[0].body.price, '9223372036854775807');
  assert.equal(result.calls[0].body.accountNumber, '001234567890');
});

test('resale price rejects invalid input and retains positive bigint validation', async () => {
  const result = fixture({ price: '200000' });
  for (const value of ['1,5', '-1000', '1e6', 'abc', '12345678901234567890']) {
    result.render().find(node => node.type === 'input').props.onChange({ target: { value } });
    assert.equal(result.states[1], '200000');
  }
  for (const price of ['', '0', '9223372036854775808']) {
    const invalid = fixture({ price });
    invalid.tree.find(node => node.type === 'form').props.onSubmit({ preventDefault() {} });
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(invalid.calls.length, 0);
    assert.ok(invalid.states[3] instanceof Error || invalid.states[3]?.message);
  }
});

test('resale requires explicit confirmation, shows the formatted price and allows cancellation without posting', async () => {
  const result = fixture({ price: '200000' });
  result.tree.find(node => node.type === 'form').props.onSubmit({ preventDefault() {} });
  const dialog = result.render().find(node => node.type === 'ConfirmDialog');
  assert.ok(dialog.props.description.includes('200.000 ₫'));
  assert.ok(dialog.props.description.includes('VIP'));
  assert.ok(dialog.props.description.includes('10.000 ₫'));
  assert.ok(dialog.props.description.includes('190.000 ₫'));
  assert.ok(dialog.props.description.includes('•••• 7890'));
  assert.equal(dialog.props.description.includes('001234567890'), false);
  assert.equal(dialog.props.confirmLabel, 'Xác nhận đăng bán');
  assert.equal(result.calls.length, 0);
  dialog.props.onClose();
  assert.equal(result.render().some(node => node.type === 'ConfirmDialog'), false);
  assert.equal(result.calls.length, 0);
});

test('confirmation uses the reviewed price and propagates API failure to the dialog for retry', async () => {
  const failure = new Error('Không thể đăng bán');
  const result = fixture({ price: '200000', postFailure: failure });
  result.tree.find(node => node.type === 'form').props.onSubmit({ preventDefault() {} });
  const tree = result.render();
  tree.find(node => node.type === 'input').props.onChange({ target: { value: '300.000' } });
  tree.find(node => node.type === 'input' && node.props.name === 'accountNumber').props.onChange({ target: { value: '009999999999' } });
  await assert.rejects(tree.find(node => node.type === 'ConfirmDialog').props.onConfirm(), failure);
  assert.equal(result.calls[0].body.price, '200000');
  assert.equal(result.calls[0].body.accountNumber, '001234567890');
  assert.ok(result.render().some(node => node.type === 'ConfirmDialog'));
});

test('bank account is mandatory, numeric text preserves leading zeroes, and invalid details never open confirmation', () => {
  for (const details of [{ bankName: '' }, { accountHolder: ' ' }, { accountNumber: '12345' }, { accountNumber: '1234567890123456789012345678901' }, { accountNumber: '123abc' }]) {
    const result = fixture({ price: '200000', ...details });
    result.tree.find(node => node.type === 'form').props.onSubmit({ preventDefault() {} });
    assert.equal(result.render().some(node => node.type === 'ConfirmDialog'), false);
    assert.equal(result.calls.length, 0);
  }
  const result = fixture({ price: '200019' });
  const field = result.tree.find(node => node.type === 'input' && node.props.name === 'accountNumber');
  assert.notEqual(field.props.type, 'number');
  field.props.onChange({ target: { value: '0000123456' } });
  assert.equal(result.states[7], '0000123456');
  field.props.onChange({ target: { value: '1e6' } });
  assert.equal(result.states[7], '0000123456');
  result.render().find(node => node.type === 'form').props.onSubmit({ preventDefault() {} });
  const dialog = result.render().find(node => node.type === 'ConfirmDialog');
  assert.ok(dialog.props.description.includes('10.000 ₫'));
  assert.ok(dialog.props.description.includes('190.019 ₫'));
});
