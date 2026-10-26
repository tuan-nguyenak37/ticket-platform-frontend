const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const source = fs.readFileSync('app/(modules)/(organizer)/organizer/_lib/organizer.utils.ts', 'utf8');
const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
const exportsObject = {};
vm.runInNewContext(output, { exports: exportsObject, Intl, Date, BigInt });
const { parseVnd, vnInput, vnWire, vnd } = exportsObject;
test('VND accepts zero and maximum safe integer without rounding', () => {
  assert.equal(parseVnd('0'), 0);
  assert.equal(parseVnd('9007199254740991'), Number.MAX_SAFE_INTEGER);
  assert.equal(parseVnd('230.000'), 230000);
  assert.equal(parseVnd('9.007.199.254.740.991'), Number.MAX_SAFE_INTEGER);
  for (const value of ['-1', '1.5', '1e3', '1,000', '', '9007199254740992', '9.007.199.254.740.992', '23.00', '1..000', '0.000', '230.000 VND']) assert.throws(() => parseVnd(value));
  assert.match(vnd('1500000'), /1\.500\.000/);
});
test('Vietnam datetime conversion uses explicit offset and is machine timezone independent', () => {
  assert.equal(vnInput('2026-11-20T12:00:00.000Z'), '2026-11-20T19:00');
  assert.equal(vnWire('2026-11-20T19:00'), '2026-11-20T19:00:00+07:00');
  assert.equal(Date.parse(vnWire('2026-11-20T19:00')), Date.parse('2026-11-20T12:00:00Z'));
  assert.equal(vnInput(null), '');
  assert.throws(() => vnWire('2026-11-20'));
  assert.throws(() => vnWire('2026-13-20T19:00'));
});


