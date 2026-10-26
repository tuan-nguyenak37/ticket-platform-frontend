const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function compile(filename) {
  return ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
}
const utils = {};
vm.runInNewContext(compile('app/(modules)/(organizer)/organizer/_lib/organizer.utils.ts'), { exports: utils, Intl, Date, BigInt, Error });
const code = compile('app/(modules)/(organizer)/organizer/_components/OrganizerForms.tsx');
const showing = { showingId: 'show', name: 'Suất trưa', startTime: '2099-10-23T05:00:00Z', venueName: 'Nhà hát A', address: '123 Đường A', city: 'Hồ Chí Minh' };
const input = { name: 'VIP', price: '1600000', totalQuantity: '100', maxPerOrder: '4', status: 'DRAFT',
  saleStartAt: '2099-10-21T11:14', saleEndAt: '2099-10-23T12:00', resaleAllowed: 'on' };

function nodes(tree) {
  if (tree == null || typeof tree === 'boolean') return [];
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  if (typeof tree !== 'object') return [tree];
  return [tree, ...nodes(tree.props?.children)];
}

function fixture({ editing = false, save = async () => {} } = {}) {
  const states = [], refs = [], effects = [], calls = [];
  let stateIndex = 0, refIndex = 0, closed = 0, focused = 0;
  const dependencies = {
    react: {
      useState: initial => { const index = stateIndex++; if (!(index in states)) states[index] = initial;
        return [states[index], value => { states[index] = typeof value === 'function' ? value(states[index]) : value; }]; },
      useRef: initial => refs[refIndex++] ?? (refs[refIndex - 1] = { current: initial }),
      useEffect: callback => effects.push(callback),
    },
    'react/jsx-runtime': require('react/jsx-runtime'),
    '@/components/ui/Dialog': { Dialog: 'Dialog' },
    '../_lib/organizer.api': utils,
  };
  const exports = {};
  vm.runInNewContext(code, { exports, require: name => dependencies[name], Date, Intl, Error,
    FormData: class extends Map { constructor(form) { super(Object.entries(form.values)); } },
    window: { addEventListener() {}, removeEventListener() {}, confirm: () => true },
  });
  const outer = exports.TicketForm({ showing, initial: editing ? {
    ticketTypeId: 'ticket', name: 'VIP', price: '1600000', totalQuantity: 100, maxPerOrder: 4,
    status: 'DRAFT', reservedQuantity: 0, soldQuantity: 0, saleStartAt: null, saleEndAt: null,
  } : undefined, close: () => { closed++; }, save: async body => { calls.push(body); return save(body); } });
  function render() {
    stateIndex = 0; refIndex = 0; effects.length = 0;
    const tree = outer.type(outer.props);
    for (const node of nodes(tree)) if (node.props?.ref) node.props.ref.current = { focus: () => { focused++; } };
    for (const effect of effects) effect();
    return nodes(tree);
  }
  let tree = render();
  function submit(values = input) {
    const form = tree.find(node => node.type === 'form');
    return form.props.onSubmit({ preventDefault() {}, currentTarget: { values, dataset: {} } });
  }
  return { outer, exports, calls, submit, render: () => { tree = render(); return tree; },
    closed: () => closed, focused: () => focused };
}

test('sale date inputs expose the actual showing deadline in Vietnam time', () => {
  const result = fixture();
  const fields = nodes(result.outer.props.children).filter(node => node.props?.type === 'datetime-local');
  assert.equal(fields.length, 2);
  for (const field of fields) {
    const input = nodes(result.exports.Field(field.props)).find(node => node.type === 'input');
    assert.equal(input.props.max, '2099-10-23T12:00');
  }
});

test('showing form explains a performance separately from its ticket tiers', () => {
  const result = fixture();
  const form = result.exports.ShowingForm({ event: { status: 'DRAFT' }, save: async () => {}, close() {} });
  const content = nodes(form.props.children);
  assert.ok(content.includes('Suất diễn là một lần tổ chức sự kiện, có thời gian và địa điểm riêng. Sau khi lưu suất diễn, bạn có thể thêm các hạng vé như Vé thường, VIP cho suất diễn đó.'));
  const name = content.find(node => node.props?.name === 'name');
  assert.equal(name.props.label, 'Tên suất diễn');
  assert.match(name.props.placeholder, /Đêm diễn/);
});

for (const editing of [false, true]) {
  test(`${editing ? 'update' : 'create'} clearly identifies the linked showing and uses ticket-tier terminology`, () => {
    const result = fixture({ editing });
    const content = nodes(result.outer.props.children);
    const context = content.find(node => node.props?.['aria-label'] === 'Suất diễn áp dụng cho hạng vé');
    const contextText = nodes(context).filter(node => typeof node === 'string').join(' ');
    assert.ok(contextText.includes(showing.name));
    assert.ok(contextText.includes('12:00'));
    assert.ok(contextText.includes('23 tháng 10, 2099'));
    for (const value of [showing.venueName, showing.address, showing.city]) assert.ok(contextText.includes(value));
    assert.match(contextText, /chỉ áp dụng cho suất diễn trên/);
    assert.equal(content.find(node => node.props?.name === 'name').props.label, 'Tên hạng vé');
    assert.equal(content.filter(node => node.props?.name === 'description').length, 1);
    assert.equal(content.find(node => node.props?.name === 'description').props.label, 'Quyền lợi của hạng vé (tùy chọn)');
  });
}

for (const editing of [false, true]) {
  test(`${editing ? 'update' : 'create'} rejects a sale deadline after the showing without calling API or closing`, async () => {
    const result = fixture({ editing });
    await result.submit({ ...input, saleEndAt: '2099-11-06T11:14' });
    assert.equal(result.calls.length, 0);
    assert.equal(result.closed(), 0);
    const alert = result.render().find(node => node.props?.role === 'alert');
    const text = nodes(alert).filter(node => typeof node === 'string').join(' ');
    assert.match(text, /Chưa lưu thay đổi/);
    assert.ok(text.includes(new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', dateStyle: 'short', timeStyle: 'short' }).format(new Date(showing.startTime))));
    assert.equal(alert.props.tabIndex, -1);
    assert.equal(result.focused(), 1);
  });

  test(`${editing ? 'update' : 'create'} sends a valid deadline and closes only after save succeeds`, async () => {
    let finish;
    const result = fixture({ editing, save: () => new Promise(resolve => { finish = resolve; }) });
    const pending = result.submit();
    assert.equal(result.calls.length, 1);
    assert.equal(result.closed(), 0);
    assert.equal(result.calls[0].saleEndAt, '2099-10-23T12:00:00+07:00');
    assert.equal(result.calls[0].totalQuantity, 100);
    await result.submit();
    assert.equal(result.calls.length, 1);
    finish(); await pending;
    assert.equal(result.closed(), 1);
  });
}

test('API errors keep entered data and leave the form open', async () => {
  const result = fixture({ save: async () => { throw new Error('Không có quyền chỉnh sửa.'); } });
  await result.submit();
  assert.equal(result.calls.length, 1);
  assert.equal(result.closed(), 0);
  const alert = result.render().find(node => node.props?.role === 'alert');
  assert.ok(nodes(alert).includes('Không có quyền chỉnh sửa.'));
});

test('draft creation without sale dates still saves', async () => {
  const result = fixture();
  await result.submit({ ...input, saleStartAt: '', saleEndAt: '' });
  assert.equal(result.calls.length, 1);
  assert.equal(result.calls[0].saleEndAt, undefined);
  assert.equal(result.closed(), 1);
});

test('ticket price displays grouping and currency, with plain digits while editing', () => {
  const result = fixture({ editing: true });
  const priceField = nodes(result.outer.props.children).find(node => node.type?.name === 'PriceField');
  const content = nodes(priceField.type(priceField.props));
  const input = content.find(node => node.type === 'input');
  assert.equal(input.props.defaultValue, '1.600.000');
  assert.equal(input.props.inputMode, 'numeric');
  const pattern = new RegExp(`^(?:${input.props.pattern})$`);
  assert.equal(pattern.test('230.000'), true);
  assert.equal(pattern.test('230000'), true);
  assert.equal(pattern.test('1.5'), false);
  assert.ok(content.includes('VND'));
  const element = { value: '1.600.000', error: '', setCustomValidity(message) { this.error = message; } };
  input.props.onFocus({ currentTarget: element });
  assert.equal(element.value, '1600000');
  element.value = '230000';
  input.props.onBlur({ currentTarget: element });
  assert.equal(element.value, '230.000');
  element.value = '1.5';
  input.props.onBlur({ currentTarget: element });
  assert.equal(element.value, '1.5');
  assert.notEqual(element.error, '');
  element.value = '0';
  input.props.onChange({ currentTarget: element });
  input.props.onBlur({ currentTarget: element });
  assert.equal(element.error, '');
  assert.equal(element.value, '0');
  element.value = '';
  input.props.onBlur({ currentTarget: element });
  assert.equal(element.value, '');
});

for (const editing of [false, true]) {
  test(`${editing ? 'update' : 'create'} submits grouped prices as integer VND and rejects decimal prices`, async () => {
    const result = fixture({ editing });
    await result.submit({ ...input, price: '230.000' });
    assert.equal(result.calls[0].price, 230000);
    const invalid = fixture({ editing });
    await invalid.submit({ ...input, price: '1.5' });
    assert.equal(invalid.calls.length, 0);
    assert.equal(invalid.closed(), 0);
  });
}
