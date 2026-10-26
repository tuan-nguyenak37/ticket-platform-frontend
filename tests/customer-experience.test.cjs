const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function load(filename, dependencies) {
  const source = fs.readFileSync(path.resolve(__dirname, '..', filename), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports, Intl, Date, URL, URLSearchParams, require: name => {
    if (name in dependencies) return dependencies[name];
    if (['react/jsx-runtime', 'lucide-react'].includes(name)) return require(name);
    throw new Error(`Unexpected dependency ${name}`);
  } });
  return exports;
}

function nodes(tree) {
  if (!tree || typeof tree !== 'object') return [];
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  return [tree, ...nodes(tree.props?.children)];
}

test('banner controls wrap without timers; banners link to the real catalogue', () => {
  let active = 0;
  const { PromoCarousel } = load('app/_components/PromoCarousel.tsx', {
    react: { useState: () => [active, value => { active = value; }] },
    'next/image': { default: 'Image' }, 'next/link': { default: 'Link' },
  });
  const render = () => nodes(PromoCarousel());
  const initial = render().filter(node => node.type === 'Link');
  assert.equal(initial.length, 2);
  assert.ok(initial.every(node => node.props.href === '/events'));
  render().find(node => node.props?.['aria-label'] === 'Banner trước').props.onClick();
  assert.equal(active, 2);
  render().find(node => node.props?.['aria-label'] === 'Banner tiếp theo').props.onClick();
  assert.equal(active, 0);
});

function eventDetail(showings) {
  const event = { title: 'Đêm nhạc', description: '<script>not HTML</script>', posterUrl: null };
  const { EventDetail } = load('app/(modules)/(public)/events/_components/EventDetail.tsx', {
    '@tanstack/react-query': { useQuery: options => options.queryKey[1] === 'event' ? { isSuccess: true, data: event } : showings },
    '@/app/_components/EventDiscovery': { EventPoster: 'Poster' },
    '@/app/_lib/public-events': {}, '@/components/commerce/BuyTicket': { BuyTicket: 'BuyTicket' },
  });
  return nodes(EventDetail({ eventId: 'event' }));
}

test('showings use native exclusive disclosure with only the first expanded', () => {
  const showing = { name: 'Suất tối', startTime: '2026-11-20T12:00:00Z', venueName: 'Nhà hát', city: 'Hà Nội', address: '123 Đường A' };
  const tree = eventDetail({ data: [{ ...showing, showingId: 'one' }, { ...showing, showingId: 'two' }] });
  const disclosures = tree.filter(node => node.type === 'details');
  assert.equal(disclosures.length, 2);
  assert.equal(disclosures[0].props.open, true);
  assert.equal(disclosures[1].props.open, false);
  assert.ok(disclosures.every(node => node.props.name === 'event-showing'));
  assert.ok(tree.some(node => node.props?.id === 'tickets'));
  assert.ok(tree.some(node => node.props?.href === '#tickets'));
  assert.ok(!tree.some(node => node.props?.dangerouslySetInnerHTML));
});

test('showing errors preserve the event introduction and expose retry', () => {
  let retries = 0;
  const tree = eventDetail({ isError: true, refetch: () => { retries++; } });
  assert.ok(tree.some(node => node.props?.id === 'introduction'));
  assert.ok(tree.some(node => node.props?.role === 'alert'));
  tree.find(node => node.type === 'button').props.onClick();
  assert.equal(retries, 1);
});

function discovery(items = [], total = 0) {
  return load('app/_components/EventDiscovery.tsx', {
    react: { useState: initial => [initial, () => {}] },
    'next/image': { default: 'Image' }, 'next/link': { default: 'Link' }, '@/config/env': { ENV: { API_URL: 'http://localhost:7000/api' } },
    '../_lib/public-events': {},
    '@/lib/api/commerce': { money: value => value + ' đ', vietnamDate: value => value },
    '@tanstack/react-query': { useQuery: options => options.queryKey[1] === 'categories' ? { data: [] } : { isSuccess: true, data: { items, total } } },
  });
}

test('category collections hide empty rows and keep the category on view-all links', () => {
  assert.equal(discovery().EventGrid({ home: true, title: 'Nhạc sống', categoryId: 'music' }), null);
  const tree = nodes(discovery([{ eventId: 'event' }], 1).EventGrid({ home: true, title: 'Nhạc sống', categoryId: 'music' }));
  assert.ok(tree.some(node => node.type === 'Link' && node.props.href === '/events?categoryId=music'));
});

test('catalogue pagination retains both search and category filters', () => {
  const tree = nodes(discovery([{ eventId: 'event' }], 40).EventGrid({ query: 'Đêm nhạc', categoryId: 'music', page: 2 }));
  const links = tree.filter(node => node.type === 'Link').map(node => new URL(node.props.href, 'http://localhost'));
  assert.equal(tree.filter(node => node.type === 'h1').length, 1);
  assert.deepEqual(links.map(url => url.searchParams.get('page')), ['1', '3']);
  assert.ok(links.every(url => url.searchParams.get('q') === 'Đêm nhạc' && url.searchParams.get('categoryId') === 'music'));
});

test('checkout keeps its auth gate and omits the account navigation wrapper', () => {
  let pathname = '/checkout/orders/order';
  const { CustomerPage } = load('components/commerce/shared.tsx', {
    react: {}, 'next/link': { default: 'Link' },
    'next/navigation': { usePathname: () => pathname },
    '@/lib/auth/auth.store': { useAuthStore: selector => selector({ revision: 3 }) },
    '@/lib/auth/RequireAuth': { RequireAuth: 'RequireAuth' },
    '@/components/layout/SiteShell': { SiteShell: 'SiteShell' },
    '@/components/ui/commerce': { CommercePage: 'CommercePage' },
  });
  const checkout = nodes(CustomerPage({ title: 'Thông tin mua vé', children: 'checkout' }));
  assert.ok(checkout.some(node => node.type === 'RequireAuth'));
  assert.ok(!checkout.some(node => node.type === 'CommercePage' || node.type === 'nav'));
  pathname = '/account/orders';
  const account = nodes(CustomerPage({ title: 'Đơn mua vé', children: 'orders' }));
  assert.ok(account.some(node => node.type === 'RequireAuth'));
  assert.equal(account.filter(node => node.type === 'h1').length, 1);
  assert.ok(account.some(node => node.type === 'Link' && node.props.href === '/account/orders' && node.props['aria-current'] === 'page'));
  assert.equal(account.filter(node => node.type === 'Link' && node.props['aria-current'] === 'page').length, 1);
  assert.ok(account.some(node => node.type === 'nav'));
  pathname = '/account';
  const profile = nodes(CustomerPage({ title: 'Hồ sơ cá nhân', children: 'profile' }));
  assert.equal(profile.filter(node => node.type === 'Link' && node.props['aria-current'] === 'page').length, 1);
  assert.ok(profile.some(node => node.type === 'Link' && node.props.href === '/account' && node.props['aria-current'] === 'page'));
});

test('event cards distinguish free, unpublished and bigint prices without inventing schedules', () => {
  for (const [price, expected] of [['0', 'Miễn phí'], ['9007199254740993', 'Từ 9007199254740993 đ'], [null, 'Chưa công bố giá vé']]) {
    const event = { eventId: 'event', title: 'Đêm nhạc', minPrice: price, nextShowingAt: null };
    const grid = nodes(discovery([event], 1).EventGrid({}));
    const card = grid.find(node => typeof node.type === 'function' && node.props.event === event);
    const tree = card.type(card.props);
    const text = JSON.stringify(tree);
    assert.ok(text.includes(expected));
    assert.ok(text.includes('Chưa có lịch diễn sắp tới'));
  }
  const event = { eventId: 'event', title: 'Đêm nhạc', minPrice: '100000', nextShowingAt: '2026-11-20T12:00:00Z' };
  const card = nodes(discovery([event], 1).EventGrid({})).find(node => typeof node.type === 'function' && node.props.event === event);
  assert.ok(JSON.stringify(card.type(card.props)).includes(event.nextShowingAt));
});
