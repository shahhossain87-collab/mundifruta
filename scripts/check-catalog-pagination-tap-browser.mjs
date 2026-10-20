#!/usr/bin/env node
/** Chrome: leftover catalog pagination is a 44px tap target on phones. */
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

async function measurePager(page) {
  return page.evaluate(() => {
    const host = document.getElementById('pagination-catalog');
    const buttons = host ? [...host.querySelectorAll('button')] : [];
    const prev = buttons.find(b => /Anterior/i.test(b.textContent || '')) || buttons[0] || null;
    const next = buttons.find(b => /Seguinte/i.test(b.textContent || '')) || buttons[1] || null;
    const label = host ? host.querySelector('span') : null;
    const box = (el) => el ? el.getBoundingClientRect() : { width: 0, height: 0 };
    const style = (el) => el ? getComputedStyle(el) : null;
    const hamburger = document.querySelector('.hamburger');
    const navOrder = document.querySelector('.nav-order');
    const mobileClose = document.querySelector('.mobile-close');
    const mbCart = document.querySelector('.mobile-bar .mb-item');
    const floatCart = document.getElementById('float-cart');
    const floatLegumes = document.getElementById('float-legumes');
    const scrollTop = document.getElementById('scroll-top');
    const cabazClose = document.querySelector('.cabaz-modal-close');
    const cabazAdd = document.getElementById('cabaz-modal-add');
    const cabazVer = document.querySelector('.cabaz-ver');
    const shopLink = document.querySelector('.shop-link');
    const catQuick = document.querySelector('.cat-quick-btn');
    const orderWa = document.querySelector('#order-form .btn-wa');
    const btnContinuar = document.querySelector('.btn-continuar');
    const toggle = document.getElementById('order-optional-toggle');
    const btnEm = document.querySelector('.btn-em');
    const orderRemove = document.querySelector('.order-remove');
    const oiMinus = document.querySelector('.oi-stepper button');
    const qty = document.querySelector('.shop-main .qty-btn');
    const add = document.querySelector('.shop-main .add-btn');
    const productQty = document.querySelector('.product-modal-qty button');
    const searchClear = document.querySelector('.shop-main .search-clear');
    const sort = document.getElementById('price-sort');
    const linkBtn = document.querySelector('.no-results .link-btn');
    const privacyWa = document.querySelector('.privacy-box a[href^="https://wa.me"]');
    const barWa = document.querySelector('.mobile-bar a[href^="https://wa.me"]');
    const bar = [...document.querySelectorAll('.mb-item')].map(el =>
      (el.textContent || '').replace(/\s+/g, ' ').trim()
    );
    const nextBox = box(next);
    const prevBox = box(prev);
    const nextStyle = style(next);
    const prevStyle = style(prev);
    return {
      found: !!next && !!prev,
      count: buttons.length,
      prevText: (prev?.textContent || '').replace(/\s+/g, ' ').trim(),
      nextText: (next?.textContent || '').replace(/\s+/g, ' ').trim(),
      prevType: prev?.getAttribute('type') || '',
      nextType: next?.getAttribute('type') || '',
      prevOnclick: prev?.getAttribute('onclick') || '',
      nextOnclick: next?.getAttribute('onclick') || '',
      prevLabel: prev?.getAttribute('aria-label') || '',
      nextLabel: next?.getAttribute('aria-label') || '',
      prevDisabled: prev?.disabled === true,
      nextDisabled: next?.disabled === true,
      pageText: (label?.textContent || '').replace(/\s+/g, ' ').trim(),
      nextWidth: nextBox.width,
      nextHeight: nextBox.height,
      prevWidth: prevBox.width,
      prevHeight: prevBox.height,
      nextMinHeight: nextStyle?.minHeight || '',
      prevMinHeight: prevStyle?.minHeight || '',
      nextBoxSizing: nextStyle?.boxSizing || '',
      prevBoxSizing: prevStyle?.boxSizing || '',
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
      cabazAddType: cabazAdd?.getAttribute('type') || '',
      cabazVerType: cabazVer?.getAttribute('type') || '',
      shopLinkType: shopLink?.getAttribute('type') || '',
      catQuickType: catQuick?.getAttribute('type') || '',
      orderWaType: orderWa?.getAttribute('type') || '',
      orderWaText: (orderWa?.textContent || '').replace(/\s+/g, ' ').trim(),
      btnContinuarText: (btnContinuar?.textContent || '').replace(/\s+/g, ' ').trim(),
      btnContinuarHeight: btnContinuar ? btnContinuar.getBoundingClientRect().height : 0,
      btnContinuarMinHeight: btnContinuar ? getComputedStyle(btnContinuar).minHeight : '',
      toggleText: (toggle?.textContent || '').replace(/\s+/g, ' ').trim(),
      toggleHeight: toggle ? toggle.getBoundingClientRect().height : 0,
      toggleMinHeight: toggle ? getComputedStyle(toggle).minHeight : '',
      btnEmText: (btnEm?.textContent || '').replace(/\s+/g, ' ').trim(),
      btnEmHeight: btnEm ? btnEm.getBoundingClientRect().height : 0,
      btnEmMinHeight: btnEm ? getComputedStyle(btnEm).minHeight : '',
      removeHeight: orderRemove ? orderRemove.getBoundingClientRect().height : 0,
      oiHeight: oiMinus ? oiMinus.getBoundingClientRect().height : 0,
      qtyHeight: qty ? qty.getBoundingClientRect().height : 0,
      addHeight: add ? add.getBoundingClientRect().height : 0,
      productQtyHeight: productQty ? productQty.getBoundingClientRect().height : 0,
      searchClearHeight: searchClear ? searchClear.getBoundingClientRect().height : 0,
      searchClearMinHeight: searchClear ? getComputedStyle(searchClear).minHeight : '',
      searchClearType: searchClear?.getAttribute('type') || '',
      sortHeight: sort ? sort.getBoundingClientRect().height : 0,
      sortMinHeight: sort ? getComputedStyle(sort).minHeight : '',
      linkBtnHeight: linkBtn ? linkBtn.getBoundingClientRect().height : 0,
      linkBtnMinHeight: linkBtn ? getComputedStyle(linkBtn).minHeight : '',
      menuOpen: document.getElementById('mobile-menu')?.classList.contains('open') === true,
      waHref: privacyWa?.getAttribute('href') || '',
      barWaHref: barWa?.getAttribute('href') || '',
      bar,
      pageUrl: window.location.pathname,
    };
  });
}

function leftoverCopy(phone, label) {
  ok(phone.found, `${label}: leftover catalog pagination should render`);
  ok(phone.count === 2, `${label}: leftover catalog pagination should have leftover 2 buttons (got ${phone.count})`);
  ok(phone.prevText === '← Anterior', `${label}: leftover ← Anterior stays (got "${phone.prevText}")`);
  ok(phone.nextText === 'Seguinte →', `${label}: leftover Seguinte → stays (got "${phone.nextText}")`);
  ok(phone.prevType === 'button' && phone.nextType === 'button',
    `${label}: leftover pagination stays leftover type=button`);
  ok(phone.prevOnclick === 'mudarPagina(-1)' && phone.nextOnclick === 'mudarPagina(1)',
    `${label}: leftover mudarPagina() stays`);
  ok(phone.prevLabel === 'Página anterior' && phone.nextLabel === 'Página seguinte',
    `${label}: leftover Página anterior / leftover Página seguinte stay`);
  ok(/^Página \d+ de \d+$/.test(phone.pageText),
    `${label}: leftover Página N de N stays (got "${phone.pageText}")`);
  ok(phone.hamburgerType === '', `${label}: leftover hamburger stays without invented type=button`);
  ok(phone.hamburgerLabel === 'Menu', `${label}: leftover hamburger Menu stays`);
  ok(phone.hamburgerExpanded == null, `${label}: leftover hamburger aria-expanded stays leftover absent`);
  ok(phone.navOrderType === '', `${label}: leftover Encomendar stays without invented type=button`);
  ok(phone.mobileCloseType === '', `${label}: leftover mobile-close stays without invented type=button`);
  ok(phone.mobileCloseLabel === '', `${label}: leftover mobile-close accessible name stays leftover absent`);
  ok(phone.mobileCloseText === '✕', `${label}: leftover mobile-close ✕ stays`);
  ok(phone.mbCartType === '', `${label}: leftover 4-item bar Carrinho stays without invented type=button`);
  ok(phone.floatCartType === '', `${label}: leftover float-cart stays without invented type=button`);
  ok(phone.floatLegumesType === '', `${label}: leftover float-legumes stays without invented type=button`);
  ok(phone.scrollTopType === '', `${label}: leftover scroll-top stays without invented type=button`);
  ok(phone.cabazCloseType === '', `${label}: leftover cabaz-modal-close stays without invented type=button`);
  ok(phone.cabazAddType === '', `${label}: leftover cabaz-modal-add stays without invented type=button`);
  ok(!phone.cabazVerType, `${label}: leftover cabaz-ver stays without invented type=button`);
  ok(phone.shopLinkType === '', `${label}: leftover shop-link stays without invented type=button`);
  ok(phone.catQuickType === '', `${label}: leftover cat-quick-btn stays without invented type=button`);
  ok(phone.searchClearType === '', `${label}: leftover search-clear stays without invented type=button`);
  ok(phone.orderWaType === 'submit', `${label}: leftover order WhatsApp stays leftover type=submit`);
  ok(phone.orderWaText === '📱 Encomendar por WhatsApp',
    `${label}: leftover Encomendar por WhatsApp stays`);
  ok(phone.btnContinuarText === '← Continuar a comprar',
    `${label}: leftover ← Continuar a comprar stays`);
  ok(/Hora de levantamento ou nota/.test(phone.toggleText),
    `${label}: leftover Hora de levantamento ou nota stays`);
  ok(phone.btnEmText === 'ou encomende por email',
    `${label}: leftover ou encomende por email stays`);
  ok(phone.menuOpen === false, `${label}: leftover mobile-menu stays leftover closed`);
  ok(phone.waHref === 'https://wa.me/351932699850',
    `${label}: leftover privacy WhatsApp stays (got "${phone.waHref}")`);
  ok(phone.barWaHref === 'https://wa.me/351932699850',
    `${label}: leftover bar WhatsApp stays (got "${phone.barWaHref}")`);
}

function leftoverPhoneTap(phone, label) {
  leftoverCopy(phone, label);
  ok(phone.nextHeight >= 44 && phone.prevHeight >= 44,
    `${label}: leftover catalog pagination should be leftover ≥44px (prev=${phone.prevHeight}, next=${phone.nextHeight})`);
  ok(parseFloat(phone.nextMinHeight) >= 44 && parseFloat(phone.prevMinHeight) >= 44,
    `${label}: leftover catalog pagination min-height should be leftover 44px (prev=${phone.prevMinHeight}, next=${phone.nextMinHeight})`);
  ok(phone.nextBoxSizing === 'border-box' && phone.prevBoxSizing === 'border-box',
    `${label}: leftover catalog pagination should use leftover border-box`);
  ok(!phone.btnEmMinHeight || phone.btnEmMinHeight === '0px' || phone.btnEmMinHeight === 'auto' || parseFloat(phone.btnEmMinHeight) < 44,
    `${label}: should not redo leftover checkout email 44px tap (min-height=${phone.btnEmMinHeight}, height=${phone.btnEmHeight})`);
  ok(!phone.btnContinuarMinHeight || phone.btnContinuarMinHeight === '0px' || phone.btnContinuarMinHeight === 'auto' || parseFloat(phone.btnContinuarMinHeight) < 44,
    `${label}: should not redo leftover checkout Continuar a comprar 44px tap (min-height=${phone.btnContinuarMinHeight}, height=${phone.btnContinuarHeight})`);
  ok(!phone.removeHeight || phone.removeHeight < 40,
    `${label}: should not redo leftover checkout × Remover 44px tap (got ${phone.removeHeight})`);
  ok(!phone.oiHeight || phone.oiHeight < 40,
    `${label}: should not redo leftover checkout qty 44px tap (got ${phone.oiHeight})`);
  ok(!phone.qtyHeight || phone.qtyHeight < 40,
    `${label}: should not redo leftover catalog qty 44px tap (got ${phone.qtyHeight})`);
  ok(!phone.addHeight || phone.addHeight < 50,
    `${label}: should not redo leftover catalog Adicionar 44px tap (got ${phone.addHeight})`);
  ok(!phone.productQtyHeight || phone.productQtyHeight < 40,
    `${label}: should not redo leftover product-modal qty 44px tap (got ${phone.productQtyHeight})`);
  ok(!phone.toggleMinHeight || phone.toggleMinHeight === '0px' || phone.toggleMinHeight === 'auto' || parseFloat(phone.toggleMinHeight) < 44,
    `${label}: should not redo leftover checkout Hora de levantamento 44px tap (min-height=${phone.toggleMinHeight}, height=${phone.toggleHeight})`);
  ok(!phone.searchClearMinHeight || phone.searchClearMinHeight === '0px' || phone.searchClearMinHeight === 'auto' || parseFloat(phone.searchClearMinHeight) < 44,
    `${label}: should not redo leftover catalog search-clear 44px tap (min-height=${phone.searchClearMinHeight}, height=${phone.searchClearHeight})`);
  ok(!phone.sortMinHeight || phone.sortMinHeight === '0px' || phone.sortMinHeight === 'auto' || parseFloat(phone.sortMinHeight) < 44,
    `${label}: should not redo leftover catalog sort 44px tap (min-height=${phone.sortMinHeight}, height=${phone.sortHeight})`);
  ok(!phone.linkBtnMinHeight || phone.linkBtnMinHeight === '0px' || phone.linkBtnMinHeight === 'auto' || parseFloat(phone.linkBtnMinHeight) < 44,
    `${label}: should not redo leftover no-results Limpar filtros 44px tap (min-height=${phone.linkBtnMinHeight}, height=${phone.linkBtnHeight})`);
}

function leftoverDesktopHug(phone, label) {
  leftoverCopy(phone, label);
  ok(phone.nextHeight < 44 && phone.prevHeight < 44,
    `${label}: leftover catalog pagination should hug leftover 42px, not force 44px (prev=${phone.prevHeight}, next=${phone.nextHeight})`);
  ok(phone.nextMinHeight === '42px' && phone.prevMinHeight === '42px',
    `${label}: leftover desktop min-height should stay leftover 42px (prev=${phone.prevMinHeight}, next=${phone.nextMinHeight})`);
}

async function clickNext(page, label) {
  const after = await page.evaluate(() => {
    const host = document.getElementById('pagination-catalog');
    const next = host ? [...host.querySelectorAll('button')].find(b => /Seguinte/i.test(b.textContent || '')) : null;
    if (!next) return { ok: false, reason: 'missing' };
    const src = typeof window.mudarPagina === 'function' ? window.mudarPagina.toString() : '';
    next.click();
    const buttons = host ? [...host.querySelectorAll('button')] : [];
    const prev = buttons.find(b => /Anterior/i.test(b.textContent || '')) || null;
    const next2 = buttons.find(b => /Seguinte/i.test(b.textContent || '')) || null;
    const labelEl = host ? host.querySelector('span') : null;
    const privacyWa = document.querySelector('.privacy-box a[href^="https://wa.me"]');
    const barWa = document.querySelector('.mobile-bar a[href^="https://wa.me"]');
    const line = [...document.querySelectorAll('.order-item')]
      .find(li => /Melancia 1\/4/i.test(li.textContent || ''));
    return {
      ok: true,
      src,
      pageText: (labelEl?.textContent || '').replace(/\s+/g, ' ').trim(),
      prevText: (prev?.textContent || '').replace(/\s+/g, ' ').trim(),
      nextText: (next2?.textContent || '').replace(/\s+/g, ' ').trim(),
      prevType: prev?.getAttribute('type') || '',
      nextType: next2?.getAttribute('type') || '',
      prevOnclick: prev?.getAttribute('onclick') || '',
      nextOnclick: next2?.getAttribute('onclick') || '',
      prevDisabled: prev?.disabled === true,
      nextDisabled: next2?.disabled === true,
      menuOpen: document.getElementById('mobile-menu')?.classList.contains('open') === true,
      waHref: privacyWa?.getAttribute('href') || '',
      barWaHref: barWa?.getAttribute('href') || '',
      pageUrl: window.location.pathname,
      cartCount: document.getElementById('cart-count')?.textContent || '',
      line: (line?.textContent || '').replace(/\s+/g, ' ').trim(),
    };
  });
  ok(after.ok, `${label}: leftover Seguinte → click should work`);
  ok(/^Página 2 de \d+$/.test(after.pageText),
    `${label}: leftover Seguinte → still leftover turns leftover Página 2 de N (got "${after.pageText}")`);
  ok(after.prevText === '← Anterior' && after.nextText === 'Seguinte →',
    `${label}: leftover ← Anterior / leftover Seguinte → stay after leftover click`);
  ok(after.prevType === 'button' && after.nextType === 'button',
    `${label}: leftover pagination stays leftover type=button after leftover click`);
  ok(after.prevOnclick === 'mudarPagina(-1)' && after.nextOnclick === 'mudarPagina(1)',
    `${label}: leftover mudarPagina() stays after leftover click`);
  ok(after.prevDisabled === false, `${label}: leftover ← Anterior enables after leftover Página 2`);
  ok(after.menuOpen === false, `${label}: leftover mobile-menu stays leftover closed after leftover click`);
  ok(after.waHref === 'https://wa.me/351932699850',
    `${label}: leftover privacy WhatsApp stays after leftover click (got "${after.waHref}")`);
  ok(after.barWaHref === 'https://wa.me/351932699850',
    `${label}: leftover bar WhatsApp stays after leftover click (got "${after.barWaHref}")`);
  ok(typeof after.src === 'string' && after.src.includes('renderCatalogo'),
    `${label}: leftover pagination still leftover renders leftover catalog`);
  ok(after.cartCount === '1' && /Melancia 1\/4/i.test(after.line),
    `${label}: leftover Melancia 1/4 stays after leftover pagination (got "${after.cartCount}" / "${after.line}")`);
  ok(after.pageUrl === '/' || after.pageUrl === '/index.html' || after.pageUrl === '',
    `${label}: leftover pagination click should not leave leftover homepage (got "${after.pageUrl}")`);
}

try {
  const mobile = await browser.newPage();
  mobile.on('pageerror', err => errors.push('390 pageerror: ' + err.message));
  await openReady(mobile, 390, 844);
  leftoverPhoneTap(await measurePager(mobile), '390 homepage');
  await addMelancia(mobile, '390 before leftover pagination');
  leftoverPhoneTap(await measurePager(mobile), '390 homepage after leftover add');
  await clickNext(mobile, '390 homepage');

  const midPhone = await browser.newPage();
  midPhone.on('pageerror', err => errors.push('640 pageerror: ' + err.message));
  await openReady(midPhone, 640, 900);
  leftoverPhoneTap(await measurePager(midPhone), '640 homepage');
  await addMelancia(midPhone, '640 before leftover pagination');
  leftoverPhoneTap(await measurePager(midPhone), '640 homepage after leftover add');
  await clickNext(midPhone, '640 homepage');

  const tablet = await browser.newPage();
  tablet.on('pageerror', err => errors.push('900 pageerror: ' + err.message));
  await openReady(tablet, 900, 800);
  leftoverDesktopHug(await measurePager(tablet), '900 homepage');

  const wide = await browser.newPage();
  wide.on('pageerror', err => errors.push('1280 pageerror: ' + err.message));
  await openReady(wide, 1280, 800);
  leftoverDesktopHug(await measurePager(wide), '1280 homepage');
  await addMelancia(wide, '1280 before leftover pagination');
  leftoverDesktopHug(await measurePager(wide), '1280 homepage after leftover add');
  await clickNext(wide, '1280 homepage');

  const catPage = await browser.newPage();
  catPage.on('pageerror', err => errors.push('390 Frutas pageerror: ' + err.message));
  await catPage.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true });
  await catPage.goto(`${base}categorias/frutas/`, { waitUntil: 'networkidle0', timeout: 60000 });
  const cat = await catPage.evaluate(() => {
    const nav = [...document.querySelectorAll('.seo-nav a')].map(a => (a.textContent || '').trim());
    return {
      nav,
      hasPager: !!document.getElementById('pagination-catalog'),
      hasPagerClass: !!document.querySelector('.catalog-pagination'),
      verText: (document.querySelector('.seo-text-link')?.textContent || '').trim(),
    };
  });
  ok(cat.nav.join('|') === 'Início|Frutas|Legumes|Promoções',
    `390 Frutas: wrapping nav stays leftover Início / Frutas / Legumes / Promoções (got ${cat.nav.join(' / ')})`);
  ok(!cat.hasPager, '390 Frutas: catalog pages still have leftover no pagination-catalog');
  ok(!cat.hasPagerClass, '390 Frutas: catalog pages still have leftover no catalog-pagination');
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
      hasPager: !!document.getElementById('pagination-catalog'),
      hasPagerClass: !!document.querySelector('.catalog-pagination'),
    };
  });
  ok(prod.orderText === 'Ver no catálogo e encomendar',
    `390 Melancia: leftover Ver no catálogo e encomendar stays (got "${prod.orderText}")`);
  ok(prod.orderHref === '/?produto=melancia-1-4#produtos',
    `390 Melancia: leftover catalog href stays (got "${prod.orderHref}")`);
  ok(!prod.hasPager, '390 Melancia: catalog pages still have leftover no pagination-catalog');
  ok(!prod.hasPagerClass, '390 Melancia: catalog pages still have leftover no catalog-pagination');

  await browser.close();
  server.close();
  if (errors.length) {
    console.error('check-catalog-pagination-tap-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
    process.exit(1);
  }
  console.log('check-catalog-pagination-tap-browser: ok');
} catch (err) {
  try { await browser.close(); } catch {}
  try { server.close(); } catch {}
  console.error(err);
  process.exit(1);
}
