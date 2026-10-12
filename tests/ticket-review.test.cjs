const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const base = 'app/(modules)/(moderator)/moderator/tickets/';
function load(file, deps = {}) {
  const source = fs.readFileSync(path.join(root, base, file), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports, require: name => { if (!(name in deps)) throw Error(name); return deps[name]; }, Intl, Date, Promise });
  return exports;
}
const logic = load('_lib/tickets.utils.ts');
function ticket() {
  return { ticket_id: 't1', sellerId: 'seller', status: 'pending_review', review: null, event: { endTime: '2099-01-01T00:00:00Z' }, check: { status: 'completed', version: 2, codes: [{ id: 'code1' }], report: { reasons: [], duplicates: [] } } };
}
test('review requires a pending ticket owned by another user and no final decision', () => {
  const t = ticket();
  assert.equal(logic.canReview(t, 'moderator'), true);
  for (const actor of [undefined, 'seller']) assert.equal(logic.canReview(t, actor), false);
  for (const status of ['rejected', 'available', 'holding', 'sold', 'cancelled', 'expired']) assert.equal(logic.canReview({ ...t, status }, 'moderator'), false);
  assert.equal(logic.canReview({ ...t, review: {} }, 'moderator'), false);
});
test('approval requires current completed check, valid decoded code and eligible event', () => {
  const t = ticket();
  const validate = item => logic.approvalError(item, 'moderator', 'code1', '', Date.now());
  assert.equal(validate(t), null);
  assert.ok(validate({ ...t, check: null }));
  for (const status of ['queued', 'processing', 'failed', 'skipped']) assert.ok(validate({ ...t, check: { ...t.check, status } }));
  assert.ok(validate({ ...t, check: { ...t.check, codes: [] } }));
  assert.ok(logic.approvalError(t, 'moderator', 'invented-code', '', Date.now()));
  assert.ok(validate({ ...t, event: { endTime: '2000-01-01T00:00:00Z' } }));
  assert.ok(validate({ ...t, check: { ...t.check, report: { reasons: ['event_not_eligible'] } } }));
});
test('warnings require a trimmed note, but duplicates do not block every code', () => {
  const t = ticket();
  t.check.codes.push({ id: 'code2' });
  t.check.report = { reasons: ['duplicate_detected'], duplicates: [{ ticketId: 'other', status: 'sold', kind: 'code' }] };
  assert.ok(logic.approvalError(t, 'moderator', 'code2', '  ', Date.now()));
  assert.ok(logic.approvalError(t, 'moderator', 'code2', 'a'.repeat(2001), Date.now()));
  assert.equal(logic.approvalError(t, 'moderator', 'code2', 'Reviewed warning for selected code', Date.now()), null);
});
test('API uses protected endpoints, raw blob, exact review payloads and propagates failures', async () => {
  const calls = []; let failure;
  const send = async (...args) => { calls.push(args); if (failure) throw failure; return { data: { success: true, data: ticket() } }; };
  const api = load('_lib/tickets.api.ts', { '@/lib/auth/session': { apiClient: { get: send, post: send, patch: send } }, '@/lib/http/http-errors': { AppApiError: Error } });
  await api.getTickets({ page: 1, limit: 20 });
  assert.deepEqual(Object.keys(calls[0][1].params).sort(), ['limit', 'page']);
  await api.checkTicket('ticket/1');
  assert.equal(calls[1][0], '/tickets/manage/ticket%2F1/check'); assert.equal(calls[1].length, 1);
  const approve = { decision: 'approve', checkVersion: 2, selectedCodeId: 'code1', note: 'Reviewed' };
  await api.reviewTicket('t1', approve); assert.equal(calls[2][1], approve);
  const reject = { decision: 'reject', reason: 'Wrong tier' };
  await api.reviewTicket('t1', reject); assert.equal(calls[3][1], reject);
  await api.getTicketFile('t1'); assert.equal(calls[4][1].responseType, 'blob');
  for (const status of [0, 403, 409]) { failure = Object.assign(Error('Failed'), { statusCode: status }); await assert.rejects(api.reviewTicket('t1', approve), error => error === failure); }
});
test('poll only pending running jobs; decisions never retry and reconcile both caches', async () => {
  const mutations = []; const invalidated = []; let options;
  const hooks = load('_hooks/useTicketDetail.ts', {
    '@tanstack/react-query': { useQuery: value => { options = value; return {}; }, useMutation: value => { mutations.push(value); return {}; }, useQueryClient: () => ({ invalidateQueries: async ({ queryKey }) => invalidated.push(queryKey.join('/')), setQueryData: () => {} }) },
    '../_lib/tickets.api': { getTicket: () => {}, checkTicket: () => {}, reviewTicket: () => {} },
  });
  hooks.useTicketDetail('t1');
  assert.equal(options.refetchIntervalInBackground, false);
  for (const status of ['queued', 'processing']) assert.equal(options.refetchInterval({ state: { data: { status: 'pending_review', check: { status } } } }), 3000);
  for (const status of ['completed', 'failed', 'skipped']) assert.equal(options.refetchInterval({ state: { data: { status: 'pending_review', check: { status } } } }), false);
  assert.equal(options.refetchInterval({ state: { data: { status: 'cancelled', check: { status: 'processing' } } } }), false);
  for (const mutation of mutations) { assert.equal(mutation.retry, false); assert.equal(mutation.onMutate, undefined); assert.equal(mutation.onSuccess, undefined, 'base review DTO must not replace full detail cache'); await mutation.onSettled(); }
  assert.equal(invalidated.filter(key => key === 'moderator/tickets').length, 2);
  assert.equal(invalidated.filter(key => key === 'moderator/ticket/t1').length, 2);
});
