const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function setup(status = 'unauthenticated') {
  const state = { status };
  const ui = { open: false, show() { ui.open = true; } };
  const useAuthStore = selector => selector(state);
  useAuthStore.getState = () => state;
  const useAuthUi = selector => selector(ui);
  useAuthUi.getState = () => ui;
  const pending = { current: null };
  let effect;
  const dependencies = {
    react: { useRef: () => pending, useEffect: callback => { effect = callback; } },
    './auth.store': { useAuthStore },
    './auth-ui.store': { useAuthUi },
  };
  const source = fs.readFileSync(path.join(__dirname, '../lib/auth/useAuthenticatedAction.ts'), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports, require: name => dependencies[name] });
  const render = () => { const hook = exports.useAuthenticatedAction(); effect(); return hook; };
  return { state, ui, render };
}

test('logged-in buyer proceeds without opening login', () => {
  const fixture = setup('authenticated');
  let calls = 0;
  fixture.render().run(async () => { calls++; });
  assert.equal(calls, 1);
  assert.equal(fixture.ui.open, false);
});

test('login resumes the requested purchase exactly once', () => {
  const fixture = setup();
  let calls = 0;
  fixture.render().run(async () => { calls++; });
  fixture.render();
  assert.equal(calls, 0);
  fixture.state.status = 'authenticated';
  fixture.ui.open = false;
  fixture.render();
  fixture.render();
  assert.equal(calls, 1);
});

test('closing login cancels the pending purchase', () => {
  const fixture = setup();
  let calls = 0;
  fixture.render().run(async () => { calls++; });
  fixture.ui.open = false;
  fixture.render();
  fixture.state.status = 'authenticated';
  fixture.render();
  assert.equal(calls, 0);
});

test('session restoration does not initiate a purchase', () => {
  const fixture = setup('restoring');
  let calls = 0;
  fixture.render().run(async () => { calls++; });
  assert.equal(calls, 0);
  assert.equal(fixture.ui.open, false);
});
