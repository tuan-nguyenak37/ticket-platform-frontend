const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const source = fs.readFileSync(path.resolve(__dirname, '../app/(modules)/(admin)/admin/_components/AdminStatistics.tsx'), 'utf8');
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX } }).outputText;
const statistics = {
  dateFrom: '2026-01-31', dateTo: '2026-02-01', groupBy: 'day', timeZone: 'Asia/Ho_Chi_Minh',
  series: [
    { period: '2026-01-31', originalOrders: '2', resaleOrders: '0', originalAmount: '9007199254740993', resaleAmount: '0' },
    { period: '2026-02-01', originalOrders: '0', resaleOrders: '1', originalAmount: '0', resaleAmount: '50000' },
  ],
  topEvents: [{ eventId: 'event', title: 'Đêm nhạc', originalTickets: '4', resaleTickets: '1' }],
  payments: ['orders', 'resale'].flatMap(kind => ['SUCCEEDED', 'FAILED', 'PENDING', 'REVIEW'].map(status => ({ kind, status, count: kind === 'orders' ? status === 'SUCCEEDED' ? '3' : status === 'FAILED' ? '1' : '0' : '0' }))),
};
function nodes(tree) {
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  if (tree == null || typeof tree === 'boolean') return [];
  if (typeof tree !== 'object') return [tree];
  if (typeof tree.type === 'function') return nodes(tree.type(tree.props));
  return [tree, ...nodes(tree.props?.children)];
}
function fixture({ data = statistics, pending = false, failure = false, role = 'ADMIN' } = {}) {
  let cursor = 0, options, retries = 0;
  const states = [], calls = [];
  const dependencies = {
    react: { useState: initial => { const index = cursor++; if (!(index in states)) states[index] = typeof initial === 'function' ? initial() : initial; return [states[index], value => { states[index] = value; }]; } },
    'react/jsx-runtime': require('react/jsx-runtime'),
    'lucide-react': require('lucide-react'),
    '@tanstack/react-query': { useQuery: queryOptions => { options = queryOptions; return { data, isPending: pending, isError: failure, error: new Error('offline'), refetch: () => retries++ }; } },
    '@/lib/auth/auth.store': { useAuthStore: selector => selector({ user: { user_id: 'admin', role }, revision: 9 }) },
    '@/components/ui/commerce': { Failure: 'Failure' },
    '../_lib/admin.api': { adminApi: { statistics: async (...args) => { calls.push(args); return data; } } },
  };
  const exports = {};
  class FixedDate extends Date { static now() { return Date.parse('2026-01-31T18:00:00Z'); } }
  vm.runInNewContext(code, { exports, Date: FixedDate, require: name => { if (!(name in dependencies)) throw new Error(name); return dependencies[name]; } });
  const render = () => { cursor = 0; return nodes(exports.AdminStatistics()); };
  render();
  return { render, calls, options: () => options, retries: () => retries };
}
function change(result, type, value, index = 0) {
  result.render().filter(node => node.type === type)[index].props.onChange({ target: { value } });
}
function text(tree) { return tree.filter(node => typeof node === 'string').join(' '); }

test('statistics requests are administrator/revision scoped, cancellable and default to 30 Vietnam dates', async () => {
  const result = fixture();
  const query = result.options();
  assert.equal(JSON.stringify(query.queryKey.slice(0, 4)), JSON.stringify(['admin', 'statistics', 'admin', 9]));
  assert.equal(query.queryKey[4].dateFrom, '2026-01-03');
  assert.equal(query.queryKey[4].dateTo, '2026-02-01');
  const signal = new AbortController().signal;
  await query.queryFn({ signal });
  assert.equal(result.calls[0][1], signal);
  assert.equal(result.options().enabled, true);
  assert.equal(fixture({ role: 'USER' }).options().enabled, false);
});
test('custom dates and monthly grouping apply together; invalid ranges never change the active filter', () => {
  const result = fixture();
  change(result, 'input', '2026-02-01', 0);
  change(result, 'input', '2026-02-28', 1);
  change(result, 'select', 'month');
  result.render().find(node => node.type === 'form').props.onSubmit({ preventDefault() {} });
  result.render();
  assert.equal(JSON.stringify(result.options().queryKey[4]), JSON.stringify({ dateFrom: '2026-02-01', dateTo: '2026-02-28', groupBy: 'month' }));
  for (const invalid of ['2025-01-01', '2027-03-01', '']) {
    change(result, 'input', invalid, 1);
    result.render().find(node => node.type === 'form').props.onSubmit({ preventDefault() {} });
    assert.ok(result.render().some(node => node.props?.role === 'alert'));
    assert.equal(result.options().queryKey[4].dateTo, '2026-02-28');
  }
  result.render().find(node => node.type === 'button' && node.props.children[0] === 7).props.onClick();
  result.render();
  assert.equal(result.options().queryKey[4].dateFrom, '2026-01-26');
  assert.equal(result.options().queryKey[4].groupBy, 'day');
});
test('charts retain exact bigint amounts, accessible tables, separate series and meaningful zero states', () => {
  const tree = fixture().render();
  assert.ok(text(tree).includes('9.007.199.254.740.993'));
  assert.equal(tree.filter(node => node.type === 'svg' && node.props.role === 'img').length, 2);
  assert.equal(tree.filter(node => node.type === 'table').length, 2);
  assert.equal(tree.filter(node => node.type === 'caption').length, 2);
  assert.match(text(tree), /75\s*%/);
  assert.match(text(tree), /25\s*%/);
  assert.ok(text(tree).includes('Tổng thu = tiền thanh toán vé gốc + vé bán lại'));
  assert.ok(text(tree).includes('9.007.199.254.790.993'));
  assert.equal(tree.find(node => node.props?.['aria-label'] === 'Tổng thu trong kỳ').type, 'section');
  assert.ok(!/sandbox|sanbox/i.test(text(tree)));
  for (const element of tree.filter(node => node.type === 'polyline')) assert.doesNotMatch(element.props.points, /NaN|Infinity/);
  for (const element of tree.filter(node => node.props?.style?.width)) assert.ok(parseFloat(element.props.style.width) <= 100);
  const zero = structuredClone(statistics);
  zero.topEvents = [];
  zero.series = zero.series.map(row => ({ ...row, originalAmount: '0', resaleAmount: '0', originalOrders: '0', resaleOrders: '0' }));
  zero.payments = zero.payments.map(row => ({ ...row, count: '0' }));
  const emptyTree = fixture({ data: zero }).render();
  assert.equal(emptyTree.filter(node => node.type === 'svg').length, 0);
  assert.ok(text(emptyTree).includes('Chưa có đơn đã thanh toán'));
  assert.ok(text(emptyTree).includes('Chưa có giao dịch VNPay'));
});
test('loading and errors hide stale chart data and expose retries', () => {
  for (const options of [{ pending: true }, { failure: true }]) {
    const result = fixture(options);
    const tree = result.render();
    assert.equal(tree.filter(node => node.type === 'svg').length, 0);
    if (options.pending) assert.ok(tree.some(node => node.props?.role === 'status'));
    else { tree.find(node => node.type === 'Failure').props.retry(); assert.equal(result.retries(), 1); }
  }
});

test('gross receipts add both sources exactly per period without deducting fees or treating transfers as new tickets', () => {
  const data = structuredClone(statistics);
  data.series[0].resaleAmount = '200000';
  data.groupBy = 'month';
  const tree = fixture({ data }).render();
  const receipt = tree.find(node => node.props?.['aria-label'] === 'Tổng thu trong kỳ');
  assert.match(text(nodes(receipt.props.children)), /9\.007\.199\.254\.990\.993/);
  const amountTable = tree.find(node => node.type === 'table');
  const rows = nodes(amountTable.props.children).filter(node => node.type === 'tr');
  assert.equal(text(nodes(rows[0].props.children)), 'Kỳ Tổng thu Vé gốc Bán lại');
  assert.match(text(nodes(rows[1].props.children)), /01\/2026 9\.007\.199\.254\.940\.993/);
  assert.match(text(nodes(rows[2].props.children)), /02\/2026 50\.000/);
  assert.match(text(tree), /chưa trừ phí, hoàn tiền hay khoản chi trả/);
  assert.match(text(tree), /không phải lợi nhuận/);
  assert.ok(!/lợi nhuận ròng|tăng trưởng|so với kỳ trước/i.test(text(tree)));
});

test('single-period gross receipts have finite chart coordinates and a complete accessible total', () => {
  const data = structuredClone(statistics);
  data.series = [{ ...data.series[0], originalAmount: '200000', resaleAmount: '100000' }];
  const tree = fixture({ data }).render();
  const receipt = tree.find(node => node.props?.['aria-label'] === 'Tổng thu trong kỳ');
  assert.match(text(nodes(receipt.props.children)), /300\.000/);
  for (const circle of tree.filter(node => node.type === 'circle')) {
    assert.ok(Number.isFinite(circle.props.cx));
    assert.ok(Number.isFinite(circle.props.cy));
  }
  const totalTooltip = tree.filter(node => node.type === 'title').find(node => /Tổng thu\s*:/.test(text(nodes(node.props.children))));
  assert.match(text(nodes(totalTooltip.props.children)), /300\.000/);
});

test('free paid orders do not become an empty order chart or a false no-order message', () => {
  const free = structuredClone(statistics);
  free.series = [{ ...free.series[0], originalAmount: '0', originalOrders: '1', resaleAmount: '0', resaleOrders: '0' }];
  const tree = fixture({ data: free }).render();
  assert.equal(tree.filter(node => node.type === 'svg').length, 1);
  assert.ok(text(tree).includes('Tổng thu trong kỳ là 0'));
  assert.ok(!text(tree).includes('Chưa có đơn đã thanh toán'));
});
