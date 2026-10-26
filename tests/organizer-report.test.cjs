const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

const code = ts.transpileModule(fs.readFileSync('app/(modules)/(organizer)/organizer/_components/ReportPanel.tsx', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
const report = {
  totals: { orderCount: '3', ticketCount: '5', amount: '9007199254940993' },
  rows: [
    { eventId: 'event-1', eventTitle: 'Đêm nhạc', showingId: 'show-1', showingName: 'Suất tối', showingStartTime: '2026-10-21T12:00:00Z', ticketTypeId: 'tier-1', ticketTypeName: 'VIP', orderCount: '1', ticketCount: '2', amount: '9007199254740993' },
    { eventId: 'event-1', eventTitle: 'Đêm nhạc', showingId: 'show-2', showingName: 'Suất tối', showingStartTime: '2026-10-22T12:00:00Z', ticketTypeId: 'tier-2', ticketTypeName: 'Thường', orderCount: '1', ticketCount: '1', amount: '200000' },
    { eventId: 'event-2', eventTitle: 'Sân khấu', showingId: 'show-3', showingName: 'Suất tối', showingStartTime: '2026-10-23T12:00:00Z', ticketTypeId: 'tier-3', ticketTypeName: 'Miễn phí', orderCount: '1', ticketCount: '2', amount: '0' },
    { eventId: 'event-2', eventTitle: 'Sân khấu', showingId: 'show-3', showingName: 'Suất tối', showingStartTime: '2026-10-23T12:00:00Z', ticketTypeId: 'tier-4', ticketTypeName: 'Chưa bán', orderCount: '0', ticketCount: '0', amount: '0' },
  ],
};
function nodes(tree) {
  if (tree == null || typeof tree === 'boolean') return [];
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  if (typeof tree !== 'object') return [tree];
  return [tree, ...nodes(tree.props?.children)];
}
function fixture({ data = structuredClone(report), pending = false, failure = false, eventId, clickError = false } = {}) {
  const states = [], queries = [], calls = [], downloads = [], revoked = [], timers = [];
  const session = { status: 'authenticated', revision: 1, user: { user_id: 'owner' } };
  const props = { organizerId: 'org-1', eventId };
  const status = { data, isPending: pending, isError: failure, isFetching: false, error: new Error('Forbidden'), refetch: () => calls.push('refetch') };
  let cursor = 0, removed = 0;
  const auth = selector => selector(session);
  auth.getState = () => session;
  const dependencies = {
    react: { useState: initial => { const index = cursor++; if (!(index in states)) states[index] = initial; return [states[index], value => { states[index] = value; }]; } },
    'react/jsx-runtime': require('react/jsx-runtime'), 'lucide-react': require('lucide-react'),
    '@tanstack/react-query': { useQuery: options => { queries.push(options); return status; } },
    '@/lib/auth/auth.store': { useAuthStore: auth }, '@/components/ui/commerce': { Failure: 'Failure' },
    '../_lib/organizer.api': { organizerApi: { report: async (...args) => { calls.push(args); return data; } }, vnd: amount => BigInt(amount).toLocaleString('vi-VN') + ' ₫' },
  };
  const exports = {};
  vm.runInNewContext(code, {
    exports, require: name => { if (!(name in dependencies)) throw new Error(name); return dependencies[name]; }, Blob,
    URL: { createObjectURL: blob => { downloads.push(blob); return 'blob:report'; }, revokeObjectURL: url => revoked.push(url) },
    document: { body: { appendChild() {} }, createElement: () => ({ click() { if (clickError) throw new Error('Download failed'); calls.push(['download', this.href, this.download]); }, remove() { removed++; } }) },
    window: { setTimeout: callback => timers.push(callback) },
  });
  const render = () => { cursor = 0; return nodes(exports.ReportPanel(props)); };
  const button = label => render().find(node => node.type === 'button' && nodes(node.props.children).includes(label));
  const change = (index, value) => render().filter(node => node.type === 'select')[index].props.onChange({ target: { value } });
  return { render, change, button, props, session, status, calls, downloads, revoked, timers, queries, removed: () => removed };
}
function values(result) { return result.render().filter(node => node.type === 'dd').map(node => node.props.children); }
function bodyRows(result) { return nodes(result.render().find(node => node.type === 'tbody')?.props.children).filter(node => node.type === 'tr'); }

test('report uses an owner/revision-scoped cancellable API and exact totals from all rows', async () => {
  const result = fixture();
  assert.deepEqual(values(result), ['3', '5', '9.007.199.254.940.993 ₫']);
  assert.equal(bodyRows(result).length, 4);
  const query = result.queries[0];
  assert.equal(JSON.stringify(query.queryKey), JSON.stringify(['organizer', 'owner', 1, 'org-1', 'report', undefined]));
  assert.equal(query.gcTime, 0);
  const signal = new AbortController().signal;
  await query.queryFn({ signal });
  assert.equal(result.calls[0][0], 'org-1');
  assert.equal(result.calls[0][2], signal);
  const selectors = result.render().filter(node => node.type === 'select');
  assert.equal(nodes(selectors[0].props.children).filter(node => node.type === 'option').length, 3);
  assert.equal(nodes(selectors[1].props.children).filter(node => node.type === 'option').length, 4);
  assert.ok(nodes(selectors[1].props.children).some(node => typeof node === 'string' && node.includes('19:00')));
});

test('event/showing filters update totals and CSV scope; changing event clears the showing', async () => {
  const result = fixture();
  result.change(0, 'event-1');
  assert.deepEqual(values(result), ['2', '3', '9.007.199.254.940.993 ₫']);
  result.change(1, 'show-2');
  assert.deepEqual(values(result), ['1', '1', '200.000 ₫']);
  assert.equal(bodyRows(result).length, 1);
  result.button('Xuất CSV').props.onClick();
  const csv = await result.downloads[0].text();
  assert.match(csv, /tier-2/);
  assert.doesNotMatch(csv, /tier-1|tier-3|tier-4/);
  assert.match(csv, /"TỔNG CỘNG".*"1","1","200000"/);
  result.change(0, 'event-2');
  assert.equal(result.render().filter(node => node.type === 'select')[1].props.value, '');
  assert.deepEqual(values(result), ['1', '2', '0 ₫']);
  assert.equal(bodyRows(result).length, 2);
});

test('event-specific report locks its event and filters only that event even if cached data contains others', () => {
  const result = fixture({ eventId: 'event-1' });
  assert.equal(result.render().filter(node => node.type === 'select')[0].props.disabled, true);
  assert.equal(bodyRows(result).length, 2);
  result.change(1, 'show-1');
  assert.deepEqual(values(result), ['1', '2', '9.007.199.254.740.993 ₫']);
});

test('CSV preserves UTF-8, integer VND and escaped text while blocking spreadsheet formulas', async () => {
  const data = structuredClone(report);
  data.rows[0].eventTitle = 'Đêm "nhạc",\nViệt Nam';
  data.rows[0].showingName = ' =SUM(1,2)';
  data.rows[0].ticketTypeName = '\t@SUM(1)';
  data.rows[1].ticketTypeName = '+1';
  data.rows[2].ticketTypeName = '-1';
  data.rows[3].ticketTypeName = ' \0=1+1';
  const result = fixture({ data });
  result.button('Xuất CSV').props.onClick();
  const blob = result.downloads[0];
  const bytes = new Uint8Array(await blob.arrayBuffer());
  assert.deepEqual([...bytes.slice(0, 3)], [239, 187, 191]);
  assert.equal(blob.type, 'text/csv;charset=utf-8');
  const csv = await blob.text();
  assert.ok(csv.includes('"Đêm ""nhạc"",\nViệt Nam"'));
  for (const escaped of ["\"' =SUM(1,2)\"", "\"'\t@SUM(1)\"", "\"'+1\"", "\"'-1\"", "\"' \0=1+1\""]) assert.ok(csv.includes(escaped));
  assert.ok(csv.includes('"9007199254740993"'));
  assert.ok(csv.includes('\r\n'));
  assert.equal(result.removed(), 1);
  result.timers[0]();
  assert.deepEqual(result.revoked, ['blob:report']);
});

test('loading, denied and empty states never export or expose cached report totals', () => {
  for (const options of [{ pending: true }, { failure: true }, { data: { rows: [], totals: report.totals } }]) {
    const result = fixture(options);
    assert.equal(result.button('Xuất CSV').props.disabled, true);
    result.button('Xuất CSV').props.onClick();
    assert.equal(result.downloads.length, 0);
    if (options.pending || options.failure) assert.equal(values(result).length, 0);
    else assert.deepEqual(values(result), ['0', '0', '0 ₫']);
    if (options.failure) { result.render().find(node => node.type === 'Failure').props.retry(); assert.ok(result.calls.includes('refetch')); }
  }
});

test('session and organizer changes reset filters; a previous session cannot export', () => {
  const result = fixture();
  result.change(0, 'event-1');
  result.change(1, 'show-1');
  const oldExport = result.button('Xuất CSV').props.onClick;
  result.session.revision++;
  oldExport();
  assert.equal(result.downloads.length, 0);
  assert.equal(result.render().filter(node => node.type === 'select')[0].props.value, '');
  result.change(0, 'event-2');
  result.props.organizerId = 'org-2';
  assert.equal(result.render().filter(node => node.type === 'select')[0].props.value, '');
  assert.equal(result.render().filter(node => node.type === 'select')[1].props.value, '');
});

test('download failures display an error and still release browser resources', () => {
  const result = fixture({ clickError: true });
  result.button('Xuất CSV').props.onClick();
  assert.ok(result.render().some(node => node.props?.role === 'alert'));
  assert.equal(result.removed(), 1);
  result.timers[0]();
  assert.deepEqual(result.revoked, ['blob:report']);
});
