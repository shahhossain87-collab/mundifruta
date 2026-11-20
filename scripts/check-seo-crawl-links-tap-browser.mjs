#!/usr/bin/env node
/** Chrome: leftover Explorar o catálogo chips are 44px tap targets on phones. */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let puppeteer;
try {
  puppeteer = require('puppeteer-core');
} catch {
  puppeteer = require('/tmp/mf-test/node_modules/puppeteer-core');
}

const root = resolve(import.meta.dirname, '..');
const chrome = process.env.CHROME_PATH
  || (existsSync('/usr/bin/google-chrome-stable')
    ? '/usr/bin/google-chrome-stable'
    : '/usr/bin/google-chrome');
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.xml': 'application/xml',
  '.txt': 'text/plain',
};

const server = createServer(async (req, res) => {
  const url = req.url || '/';
  const parsed = new URL(url, 'http://127.0.0.1');
  let file = decodeURIComponent(parsed.pathname);
  if (file === '/') file = '/index.html';
  if (file.endsWith('/')) file += 'index.html';
  try {
    const buf = await readFile(join(root, file));
    res.writeHead(200, { 'Content-Type': mime[extname(file)] || 'application/octet-stream' });
    res.end(buf);
  } catch {
    res.writeHead(404); res.end('not found');
  }
});

await new Promise(r => server.listen(0, '127.0.0.1', r));
const port = server.address().port;
const base = `http://127.0.0.1:${port}/`;

const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
});

const errors = [];
const ok = (cond, msg) => { if (!cond) errors.push(msg); };

async function openReady(page, vw, vh) {
  page.on('dialog', async dialog => { await dialog.dismiss(); });
  await page.setViewport({ width: vw, height: vh, deviceScaleFactor: 1, isMobile: vw <= 430 });
  await page.goto(base, { waitUntil: 'networkidle0', timeout: 60000 });
  await page.evaluate(() => {
    try { localStorage.setItem('mf_consent', 'essential'); } catch (e) {}
    try { localStorage.removeItem('mf_cart'); } catch (e) {}
    try { localStorage.setItem('mf_coupon', JSON.stringify({ code: 'WELCOME', status: 'dismissed', issuedAt: Date.now() })); } catch (e) {}
  });
  await page.reload({ waitUntil: 'networkidle0', timeout: 60000 });
  await page.evaluate(() => {
    const c = document.getElementById('consent'); if (c) c.hidden = true;
    const o = document.getElementById('offer-pop'); if (o) o.hidden = true;
  });
}

async function addMelancia(page, label) {
  const added = await page.evaluate(() => {
    if (window.limparTudo) window.limparTudo();
    if (window.mostrarCategoria) window.mostrarCategoria('frutas', document.getElementById('tab-frutas'));
    const card = [...document.querySelectorAll('.shop-main .product-card')]
      .find(c => /Melancia 1\/4/i.test(c.textContent || ''));
    if (!card) return { ok: false, reason: 'card missing' };
    const btn = card.querySelector('.add-btn');
    if (btn) btn.click();
    const cs = document.getElementById('cs-pop');
    if (cs) cs.hidden = true;
    const line = [...document.querySelectorAll('.order-item')]
      .find(li => /Melancia 1\/4/i.test(li.textContent || ''));
    return {
      ok: true,
      count: document.getElementById('cart-count')?.textContent || '',
      line: (line?.textContent || '').replace(/\s+/g, ' ').trim(),
    };
  });
  ok(added.ok && added.count === '1' && /Melancia 1\/4/i.test(added.line),
    `${label}: add Melancia 1/4 (count=${added.count}, line="${added.line}")`);
}

async function measureCrawl(page) {
  return page.evaluate(() => {
    const section = document.querySelector('.seo-crawl-links');
    const title = document.getElementById('seo-crawl-title');
    const intro = section?.querySelector('p');
    const nav = section?.querySelector('nav');
    const links = [...(section?.querySelectorAll('a') || [])];
    const chips = links.map(a => {
      const rect = a.getBoundingClientRect();
      const style = getComputedStyle(a);
      return {
        text: (a.textContent || '').replace(/\s+/g, ' ').trim(),
        href: a.getAttribute('href') || '',
        width: rect.width,
        height: rect.height,
        minHeight: style.minHeight,
        display: style.display,
        boxSizing: style.boxSizing,
        outlineStyle: style.outlineStyle,
        outlineWidth: style.outlineWidth,
      };
    });
    const hamburger = document.querySelector('.hamburger');
    const navOrder = document.querySelector('.nav-order');
    const mobileClose = document.querySelector('.mobile-close');
    const mbCart = document.querySelector('.mobile-bar .mb-item');
    const floatCart = document.getElementById('float-cart');
    const floatLegumes = document.getElementById('float-legumes');
    const scrollTop = document.getElementById('scroll-top');
    const cabazClose = document.querySelector('.cabaz-modal-close');
    const shopLink = document.querySelector('.shop-link');
    const catQuick = document.querySelector('.cat-quick-btn');
    const searchClear = document.querySelector('.shop-main .search-clear');
    const sort = document.getElementById('price-sort');
    const filterSelect = document.getElementById('filter-preco');
    const catTab = document.querySelector('.shop-sidebar .cat-tab');
    const orderWa = document.querySelector('#order-form .btn-wa');
    const privacyWa = document.querySelector('.privacy-box a[href^="https://wa.me"]');
    const barWa = document.querySelector('.mobile-bar a[href^="https://wa.me"]');
    const bar = [...document.querySelectorAll('.mb-item')].map(el =>
      (el.textContent || '').replace(/\s+/g, ' ').trim()
    );
    return {
      found: !!section,
      title: (title?.textContent || '').trim(),
      intro: (intro?.textContent || '').replace(/\s+/g, ' ').trim(),
      navLabel: nav?.getAttribute('aria-label') || '',
      chips,
      hamburgerType: hamburger?.getAttribute('type') || '',
      hamburgerLabel: hamburger?.getAttribute('aria-label') || '',
      hamburgerExpanded: hamburger?.getAttribute('aria-expanded'),
      navOrderType: navOrder?.getAttribute('type') || '',
      mobileCloseType: mobileClose?.getAttribute('type') || '',
      mobileCloseLabel: mobileClose?.getAttribute('aria-label') || '',
      mobileCloseText: (mobileClose?.textContent || '').trim(),
      mbCartType: mbCart?.getAttribute('type') || '',
      floatCartType: floatCart?.getAttribute('type') || '',
      floatLegumesType: floatLegumes?.getAttribute('type') || '',
      scrollTopType: scrollTop?.getAttribute('type') || '',
      cabazCloseType: cabazClose?.getAttribute('type') || '',
      shopLinkType: shopLink?.getAttribute('type') || '',
      catQuickType: catQuick?.getAttribute('type') || '',
      searchClearType: searchClear?.getAttribute('type') || '',
      searchClearMinHeight: searchClear ? getComputedStyle(searchClear).minHeight : '',
      sortMinHeight: sort ? getComputedStyle(sort).minHeight : '',
      filterSelectMinHeight: filterSelect ? getComputedStyle(filterSelect).minHeight : '',
      catTabMinHeight: catTab ? getComputedStyle(catTab).minHeight : '',
      orderWaType: orderWa?.getAttribute('type') || '',
      orderWaText: (orderWa?.textContent || '').replace(/\s+/g, ' ').trim(),
      privacyWa: privacyWa?.getAttribute('href') || '',
      barWa: barWa?.getAttribute('href') || '',
      bar,
      menuOpen: document.getElementById('mobile-menu')?.classList.contains('open') === true,
    };
  });
}

const expected = [
  { text: 'Frutas', href: 'categorias/frutas/' },
  { text: 'Legumes', href: 'categorias/legumes/' },
  { text: 'Ervas frescas', href: 'categorias/ervas-frescas/' },
  { text: 'Frutas da época', href: 'categorias/frutas-da-epoca/' },
  { text: 'Promoções', href: 'categorias/promocoes/' },
  { text: 'Cabazes', href: 'categorias/cabazes/' },
];

function leftoverCopy(sel, label) {
  ok(sel.found, `${label}: leftover Explorar o catálogo should be leftover present`);
  ok(sel.title === 'Explorar o catálogo',
    `${label}: leftover heading stays leftover Explorar o catálogo (got "${sel.title}")`);
  ok(/Veja produtos por categoria/.test(sel.intro),
    `${label}: leftover intro stays (got "${sel.intro}")`);
  ok(sel.navLabel === 'Categorias do catálogo',
    `${label}: leftover nav landmark stays leftover Categorias do catálogo`);
  ok(sel.chips.length === 6, `${label}: leftover 6 crawl chips stay (got ${sel.chips.length})`);
  expected.forEach((want, i) => {
    const chip = sel.chips[i] || {};
    ok(chip.text === want.text, `${label}: leftover chip ${i} text stays leftover ${want.text} (got "${chip.text}")`);
    ok(chip.href === want.href, `${label}: leftover chip ${i} href stays leftover ${want.href} (got "${chip.href}")`);
  });
  ok(sel.hamburgerType === null || sel.hamburgerType === '',
    `${label}: leftover hamburger stays without invented type=button`);
  ok(sel.hamburgerLabel === 'Menu', `${label}: leftover hamburger Menu stays`);
  ok(sel.hamburgerExpanded === null, `${label}: leftover hamburger has leftover no aria-expanded`);
  ok(sel.navOrderType === null || sel.navOrderType === '',
    `${label}: leftover Encomendar stays without invented type=button`);
  ok(sel.mobileCloseType === null || sel.mobileCloseType === '',
    `${label}: leftover mobile-close stays without invented type=button`);
  ok(!sel.mobileCloseLabel, `${label}: leftover mobile-close stays leftover unnamed`);
  ok(sel.mobileCloseText === '✕', `${label}: leftover mobile-close stays leftover ✕`);
  ok(sel.mbCartType === null || sel.mbCartType === '',
    `${label}: leftover 4-item bar Carrinho stays without invented type=button`);
  ok(sel.floatCartType === null || sel.floatCartType === '',
    `${label}: leftover float-cart stays without invented type=button`);
  ok(sel.floatLegumesType === null || sel.floatLegumesType === '',
    `${label}: leftover float-legumes stays without invented type=button`);
  ok(sel.scrollTopType === null || sel.scrollTopType === '',
    `${label}: leftover scroll-top stays without invented type=button`);
  ok(sel.shopLinkType === null || sel.shopLinkType === '',
    `${label}: leftover shop-link stays without invented type=button`);
  ok(sel.catQuickType === null || sel.catQuickType === '',
    `${label}: leftover cat-quick-btn stays without invented type=button`);
  ok(sel.searchClearType === null || sel.searchClearType === '',
    `${label}: leftover search-clear stays without invented type=button`);
  ok(sel.orderWaType === 'submit', `${label}: leftover order WhatsApp stays leftover type=submit`);
  ok(/Encomendar por WhatsApp/i.test(sel.orderWaText),
    `${label}: leftover Encomendar por WhatsApp copy stays`);
  ok(sel.privacyWa === 'https://wa.me/351932699850',
    `${label}: leftover privacy WhatsApp stays (got "${sel.privacyWa}")`);
  ok(sel.barWa === 'https://wa.me/351932699850',
    `${label}: leftover bar WhatsApp stays (got "${sel.barWa}")`);
  ok(sel.bar.some(t => /Carrinho/i.test(t) || /€/.test(t)),
    `${label}: 4-item bar still lists leftover Carrinho or leftover running total (got ${sel.bar.join(' | ')})`);
  ok(sel.bar.some(t => /Promoções/i.test(t)), `${label}: 4-item bar still lists Promoções`);
  ok(sel.bar.some(t => /WhatsApp/i.test(t)), `${label}: 4-item bar still lists WhatsApp`);
  ok(sel.bar.some(t => /Como Chegar/i.test(t)), `${label}: 4-item bar still lists Como Chegar`);
  ok(sel.bar.length === 4, `${label}: leftover 4-item bar stays (got ${sel.bar.length})`);
  ok(sel.menuOpen === false, `${label}: leftover mobile-menu stays leftover closed`);
}

function leftoverPhoneTap(sel, label) {
  leftoverCopy(sel, label);
  sel.chips.forEach(chip => {
    ok(chip.height >= 44,
      `${label}: leftover ${chip.text} should be leftover ≥44px (got ${chip.height})`);
    ok(parseFloat(chip.minHeight) >= 44,
      `${label}: leftover ${chip.text} min-height should be leftover 44px (got ${chip.minHeight})`);
    ok(chip.boxSizing === 'border-box',
      `${label}: leftover ${chip.text} box-sizing is leftover border-box`);
    ok(chip.display === 'inline-flex' || chip.display === 'flex',
      `${label}: leftover ${chip.text} display is leftover inline-flex on leftover phones (got ${chip.display})`);
  });
  ok(!sel.filterSelectMinHeight || sel.filterSelectMinHeight === '0px' || sel.filterSelectMinHeight === 'auto' || parseFloat(sel.filterSelectMinHeight) < 44,
    `${label}: should not redo leftover filter-select 44px tap (min-height=${sel.filterSelectMinHeight})`);
  ok(!sel.catTabMinHeight || sel.catTabMinHeight === '0px' || sel.catTabMinHeight === 'auto' || parseFloat(sel.catTabMinHeight) < 44,
    `${label}: should not redo leftover cat-tab 44px tap (min-height=${sel.catTabMinHeight})`);
  ok(!sel.sortMinHeight || sel.sortMinHeight === '0px' || sel.sortMinHeight === 'auto' || parseFloat(sel.sortMinHeight) < 44,
    `${label}: should not redo leftover catalog sort 44px tap (min-height=${sel.sortMinHeight})`);
  ok(!sel.searchClearMinHeight || sel.searchClearMinHeight === '0px' || sel.searchClearMinHeight === 'auto' || parseFloat(sel.searchClearMinHeight) < 44,
    `${label}: should not redo leftover catalog search-clear 44px tap (min-height=${sel.searchClearMinHeight})`);
}

function leftoverDesktopHug(sel, label) {
  leftoverCopy(sel, label);
  sel.chips.forEach(chip => {
    ok(chip.height < 44,
      `${label}: leftover ${chip.text} should hug leftover labels, not force 44px (got ${chip.height})`);
    ok(chip.minHeight === '0px' || chip.minHeight === 'auto' || parseFloat(chip.minHeight) < 44,
      `${label}: leftover desktop min-height should stay leftover unforced (got ${chip.minHeight})`);
  });
}

async function clickLegumes(page, label) {
  const href = await page.evaluate(() => {
    const a = [...document.querySelectorAll('.seo-crawl-links a')]
      .find(el => /Legumes/i.test(el.textContent || ''));
    return a?.getAttribute('href') || '';
  });
  ok(href === 'categorias/legumes/',
    `${label}: leftover Legumes href stays leftover categorias/legumes/ (got "${href}")`);
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 60000 }),
    page.evaluate(() => {
      const a = [...document.querySelectorAll('.seo-crawl-links a')]
        .find(el => /Legumes/i.test(el.textContent || ''));
      a?.click();
    }),
  ]);
  const dest = await page.evaluate(() => {
    const nav = [...document.querySelectorAll('.seo-nav a')].map(a => (a.textContent || '').trim());
    const h1 = (document.querySelector('h1')?.textContent || '').trim();
    return {
      path: window.location.pathname,
      nav,
      h1,
      hasCrawl: !!document.querySelector('.seo-crawl-links'),
      verText: (document.querySelector('.seo-text-link')?.textContent || '').trim(),
    };
  });
  ok(/\/categorias\/legumes\/?$/.test(dest.path),
    `${label}: leftover Legumes click should open leftover Legumes page (got "${dest.path}")`);
  ok(dest.nav.join('|') === 'Início|Frutas|Legumes|Promoções',
    `${label}: wrapping nav stays leftover Início / Frutas / Legumes / Promoções (got ${dest.nav.join(' / ')})`);
  ok(dest.h1 === 'Legumes', `${label}: leftover Legumes h1 stays (got "${dest.h1}")`);
  ok(!dest.hasCrawl, `${label}: catalog pages still have leftover no Explorar o catálogo chips`);
  ok(dest.verText === 'Ver produto', `${label}: leftover Ver produto copy (got "${dest.verText}")`);
}

try {
  const mobile = await browser.newPage();
  mobile.on('pageerror', err => errors.push('390 pageerror: ' + err.message));
  await openReady(mobile, 390, 844);
  leftoverPhoneTap(await measureCrawl(mobile), '390 homepage');
  await addMelancia(mobile, '390 before leftover crawl tap');
  leftoverPhoneTap(await measureCrawl(mobile), '390 homepage after leftover add');
  const cartAfter = await mobile.evaluate(() => ({
    count: document.getElementById('cart-count')?.textContent || '',
    wa: document.querySelector('.privacy-box a[href^="https://wa.me"]')?.getAttribute('href') || '',
  }));
  ok(cartAfter.count === '1', `390: leftover Melancia 1/4 stays in leftover cart after leftover measure (got "${cartAfter.count}")`);
  ok(cartAfter.wa === 'https://wa.me/351932699850', `390: leftover privacy WhatsApp stays after leftover measure`);
  await clickLegumes(mobile, '390 homepage');

  const midPhone = await browser.newPage();
  midPhone.on('pageerror', err => errors.push('640 pageerror: ' + err.message));
  await openReady(midPhone, 640, 900);
  leftoverPhoneTap(await measureCrawl(midPhone), '640 homepage');
  await addMelancia(midPhone, '640 before leftover crawl tap');
  leftoverPhoneTap(await measureCrawl(midPhone), '640 homepage after leftover add');

  const tablet = await browser.newPage();
  tablet.on('pageerror', err => errors.push('900 pageerror: ' + err.message));
  await openReady(tablet, 900, 800);
  leftoverDesktopHug(await measureCrawl(tablet), '900 homepage');

  const wide = await browser.newPage();
  wide.on('pageerror', err => errors.push('1280 pageerror: ' + err.message));
  await openReady(wide, 1280, 800);
  leftoverDesktopHug(await measureCrawl(wide), '1280 homepage');
  await addMelancia(wide, '1280 before leftover crawl tap');
  leftoverDesktopHug(await measureCrawl(wide), '1280 homepage after leftover add');
  await clickLegumes(wide, '1280 homepage');

  const catPage = await browser.newPage();
  catPage.on('pageerror', err => errors.push('390 Frutas pageerror: ' + err.message));
  await catPage.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true });
  await catPage.goto(`${base}categorias/frutas/`, { waitUntil: 'networkidle0', timeout: 60000 });
  const cat = await catPage.evaluate(() => {
    const nav = [...document.querySelectorAll('.seo-nav a')].map(a => (a.textContent || '').trim());
    return {
      nav,
      hasCrawl: !!document.querySelector('.seo-crawl-links'),
      verText: (document.querySelector('.seo-text-link')?.textContent || '').trim(),
    };
  });
  ok(cat.nav.join('|') === 'Início|Frutas|Legumes|Promoções',
    `390 Frutas: wrapping nav stays leftover Início / Frutas / Legumes / Promoções (got ${cat.nav.join(' / ')})`);
  ok(!cat.hasCrawl, '390 Frutas: catalog pages still have leftover no Explorar o catálogo chips');
  ok(cat.verText === 'Ver produto', `390 Frutas: leftover Ver produto copy (got "${cat.verText}")`);

  const prodPage = await browser.newPage();
  prodPage.on('pageerror', err => errors.push('390 Melancia pageerror: ' + err.message));
  await prodPage.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true });
  await prodPage.goto(`${base}produtos/melancia-1-4/`, { waitUntil: 'networkidle0', timeout: 60000 });
  const prod = await prodPage.evaluate(() => {
    const order = document.querySelector('.seo-order-link');
    return {
      orderText: (order?.textContent || '').replace(/\s+/g, ' ').trim(),
      orderHref: order?.getAttribute('href') || '',
      hasCrawl: !!document.querySelector('.seo-crawl-links'),
    };
  });
  ok(prod.orderText === 'Ver no catálogo e encomendar',
    `390 Melancia: leftover Ver no catálogo e encomendar stays (got "${prod.orderText}")`);
  ok(prod.orderHref === '/?produto=melancia-1-4#produtos',
    `390 Melancia: leftover catalog href stays (got "${prod.orderHref}")`);
  ok(!prod.hasCrawl, '390 Melancia: catalog pages still have leftover no Explorar o catálogo chips');

  await browser.close();
  server.close();
  if (errors.length) {
    console.error('check-seo-crawl-links-tap-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
    process.exit(1);
  }
  console.log('check-seo-crawl-links-tap-browser: ok');
} catch (err) {
  try { await browser.close(); } catch {}
  try { server.close(); } catch {}
  console.error(err);
  process.exit(1);
}
