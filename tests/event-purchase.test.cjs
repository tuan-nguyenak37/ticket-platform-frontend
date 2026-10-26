const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { webcrypto } = require('node:crypto');
const ts = require('typescript');

const code = ts.transpileModule(fs.readFileSync(path.resolve(__dirname, '../components/commerce/BuyTicket.tsx'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
}).outputText;

function fixture({ storage = new Map(), quantity = 2, discountCode = ' save15 ', failure = false, changeSession = false } = {}) {
  const state = { user: { user_id: 'buyer' }, revision: 1 };
  const auth = selector => selector(state); auth.getState = () => state;
  const states = [quantity, false, null, discountCode];
  let stateIndex = 0;
  const calls = [], navigations = [], actions = [];
  const dependencies = {
    react: { useRef: value => ({ current: value }), useState: () => [states[stateIndex++], () => {}], useEffect: () => {} },
    'react/jsx-runtime': require('react/jsx-runtime'),
    'lucide-react': { ChevronDown: 'ChevronDown' },
    'next/navigation': { useRouter: () => ({ push: url => navigations.push(url) }) },
    '@tanstack/react-query': { useQueryClient: () => ({ invalidateQueries: async () => {} }), useQuery: () => { throw new Error('Purchase must not load a registration form'); } },
    '@/lib/auth/auth.store': { useAuthStore: auth },
    '@/lib/auth/useAuthenticatedAction': { useAuthenticatedAction: () => ({ run: action => { const promise = action(); actions.push(promise); return promise; }, restoring: false }) },
    '@/lib/api/http-errors': { formatHttpError: () => ({ statusCode: 0 }) },
    '@/lib/api/commerce': { money: value => value, vietnamDate: value => value, postCommerce: async (...args) => { calls.push(args); if (changeSession) state.revision++; if (failure) throw new Error('Network unavailable'); return { orderId: 'ord' }; } },
    '@/components/ui/commerce': { Failure: 'Failure' },
    './shared': { useClock: () => Date.parse('2026-10-20T00:00:00Z') },
  };
  const exports = {};
  vm.runInNewContext(code, { exports, require: name => { if (!(name in dependencies)) throw new Error(name); return dependencies[name]; }, crypto: webcrypto, TextEncoder, Uint8Array, Date, sessionStorage: { getItem: key => storage.get(key), setItem: (key,value) => storage.set(key,value), removeItem: key => storage.delete(key) } });
  const tree = exports.BuyTicket({ eventId: 'event', startTime: '2099-01-01T00:00:00Z', ticket: { ticketTypeId: 'type', name: 'VIP', price: '100001', maxPerOrder: 4, availableQuantity: 10, saleStartAt: '2020-01-01T00:00:00Z', saleEndAt: '2098-01-01T00:00:00Z' } });
  return { tree, calls, navigations, storage, actions };
}
function nodes(tree) { if (!tree || typeof tree !== 'object') return []; if (Array.isArray(tree)) return tree.flatMap(nodes); return [tree, ...nodes(tree.props?.children)]; }
async function submit(fixture) { const form = nodes(fixture.tree).find(node => node.type === 'form'); form.props.onSubmit({ preventDefault() {} }); await Promise.all(fixture.actions); }

test('purchase sends normalized discount code, without answers or a client amount', async () => {
  const result = fixture(); await submit(result);
  const [, body] = result.calls[0];
  assert.equal(body.discountCode,'SAVE15'); assert.equal('answers' in body,false);
  assert.equal('totalAmount' in body,false); assert.equal(body.quantity,2);
  assert.deepEqual(result.navigations,['/checkout/orders/ord']);
});
test('uncertain purchase retry keeps its key', async () => {
  const storage = new Map(); const first = fixture({ storage, failure: true }); await submit(first);
  assert.equal(storage.size,1);
  const retry = fixture({ storage }); await submit(retry);
  assert.equal(first.calls[0][2],retry.calls[0][2]); assert.equal(storage.size,0);
});
test('changed quantity requires a different idempotency key', async () => {
  const storage = new Map(); const first = fixture({ storage, failure: true }); await submit(first);
  const changed = fixture({ storage, quantity: 3 }); await submit(changed);
  assert.notEqual(first.calls[0][2],changed.calls[0][2]);
});
test('purchase is available without fetching or completing a registration form', async () => {
  const result = fixture();
  assert.equal(nodes(result.tree).filter(node => node.type === 'select').length,0);
  await submit(result); assert.equal(result.calls.length,1);
});
test('discount input pattern works with browser Unicode sets', () => {
  const input = nodes(fixture().tree).find(node => node.type === 'input' && node.props.pattern);
  const pattern = new RegExp('^(?:' + input.props.pattern + ')$', 'v');
  assert.equal(pattern.test('SAVE-15'),true); assert.equal(pattern.test('wrong code'),false);
});
test('session changes during creation do not redirect the next account', async () => {
  const result = fixture({ changeSession: true }); await submit(result); assert.equal(result.navigations.length,0);
});
