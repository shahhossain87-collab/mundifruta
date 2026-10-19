#!/usr/bin/env node
/** Chrome: leftover catalog Adicionar is a 44px tap target on phones. */
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
  const url = new URL(req.url, 'http://127.0.0.1');
  let file = decodeURIComponent(url.pathname);
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
    if (window.mostrarCategoria) window.mostrarCategoria('frutas', document.getElementById('tab-frutas'));
  });
}

async function measureAdd(page) {
  return page.evaluate(() => {
    const card = [...document.querySelectorAll('.shop-main .product-card')]
      .find(c => /Melancia 1\/4/i.test(c.textContent || ''));
    const btn = card ? card.querySelector('.add-btn') : null;
    const box = btn ? btn.getBoundingClientRect() : { width: 0, height: 0 };
    const style = btn ? getComputedStyle(btn) : null;
    const qty = card ? card.querySelector('.qty-btn') : null;
    const featureAdd = document.querySelector('.feature-add');
    const hamburger = document.querySelector('.hamburger');
    const navOrder = document.querySelector('.nav-order');
    const mobileClose = document.querySelector('.mobile-close');
    const searchClear = document.querySelector('.search-clear');
    const mbCart = document.querySelector('.mb-item');
    const floatCart = document.getElementById('float-cart');
    const floatLegumes = document.getElementById('float-legumes');
    const scrollTop = document.getElementById('scroll-top');
    const cabazClose = document.querySelector('.cabaz-modal-close');
    const cabazAdd = document.getElementById('cabaz-modal-add');
    const productAdd = document.getElementById('product-modal-add');
    const productClose = document.querySelector('.product-modal-close');
    const filt = document.querySelector('.filtbtn');
    const orderWa = document.querySelector('#order-form button.btn-wa');
    const skip = document.querySelector('.cs-pop-skip');
    const privacyWa = document.querySelector('.privacy-box a[href^="https://wa.me/"]');
    const barWa = document.querySelector('.mb-item[href^="https://wa.me/"]');
    const bar = [...document.querySelectorAll('.mb-item')].map(el =>
      (el.textContent || '').replace(/\s+/g, ' ').trim()
    );
    const hero = [...document.querySelectorAll('.hero-ctas a')].map(a =>
      (a.textContent || '').replace(/\s+/g, ' ').trim()
    );
    return {
      found: !!btn,
      text: (btn?.textContent || '').replace(/\s+/g, ' ').trim(),
      type: btn?.getAttribute('type') || '',
      height: box.height,
      width: box.width,
      minHeight: style?.minHeight || '',
      minWidth: style?.minWidth || '',
      boxSizing: style?.boxSizing || '',
      display: style?.display || '',
      qtyHeight: qty ? qty.getBoundingClientRect().height : 0,
      qtyWidth: qty ? qty.getBoundingClientRect().width : 0,
      featureHeight: featureAdd ? featureAdd.getBoundingClientRect().height : 0,
      featureMinHeight: featureAdd ? getComputedStyle(featureAdd).minHeight : '',
      hamburgerType: hamburger?.getAttribute('type') || '',
      hamburgerExpanded: hamburger?.getAttribute('aria-expanded'),
      navOrderType: navOrder?.getAttribute('type') || '',
      mobileCloseType: mobileClose?.getAttribute('type') || '',
      mobileCloseLabel: mobileClose?.getAttribute('aria-label'),
      searchClearType: searchClear?.getAttribute('type') || '',
      mbCartType: mbCart?.getAttribute('type') || '',
      floatCartType: floatCart?.getAttribute('type') || '',
      floatLegumesType: floatLegumes?.getAttribute('type') || '',
      scrollTopType: scrollTop?.getAttribute('type') || '',
      cabazCloseType: cabazClose?.getAttribute('type') || '',
      cabazAddType: cabazAdd?.getAttribute('type') || '',
      productAddType: productAdd?.getAttribute('type') || '',
      productAddText: (productAdd?.textContent || '').trim(),
      productCloseHeight: productClose ? productClose.getBoundingClientRect().height : 0,
      filtMinHeight: filt ? getComputedStyle(filt).minHeight : '',
      orderWaType: orderWa?.getAttribute('type') || '',
      orderWaText: (orderWa?.textContent || '').replace(/\s+/g, ' ').trim(),
      skipText: (skip?.textContent || '').trim(),
      waHref: privacyWa?.getAttribute('href') || '',
      barWaHref: barWa?.getAttribute('href') || '',
      bar,
      hero,
      cartCount: document.getElementById('cart-count')?.textContent || '',
      menuOpen: document.getElementById('mobile-menu')?.classList.contains('open') === true,
    };
  });
}

function leftoverCopy(phone, label) {
  ok(phone.found, `${label}: leftover Melancia 1/4 Adicionar should be leftover present`);
  ok(phone.type === 'button',
    `${label}: leftover Adicionar should keep leftover type=button (got "${phone.type}")`);
  ok(/Adicionar/i.test(phone.text),
    `${label}: leftover Adicionar copy stays leftover ＋ Adicionar (got "${phone.text}")`);
  ok(phone.hamburgerType === '',
    `${label}: leftover hamburger should stay without invented type=button`);
  ok(phone.hamburgerExpanded == null,
    `${label}: leftover hamburger should stay without leftover aria-expanded`);
  ok(phone.navOrderType === '',
    `${label}: leftover Encomendar should stay without invented type=button`);
  ok(phone.mobileCloseType === '',
    `${label}: leftover mobile-close should stay without invented type=button`);
  ok(!phone.mobileCloseLabel,
    `${label}: leftover mobile-close should stay without leftover aria-label`);
  ok(phone.searchClearType === '',
    `${label}: leftover search-clear should stay without invented type=button`);
  ok(phone.mbCartType === '',
    `${label}: leftover 4-item bar Carrinho should stay without invented type=button`);
  ok(phone.floatCartType === '',
    `${label}: leftover float-cart should stay without invented type=button`);
  ok(phone.floatLegumesType === '',
    `${label}: leftover float-legumes should stay without invented type=button`);
  ok(phone.scrollTopType === '',
    `${label}: leftover scroll-top should stay without invented type=button`);
  ok(phone.cabazCloseType === '',
    `${label}: leftover cabaz-modal-close should stay without invented type=button`);
  ok(phone.cabazAddType === '',
    `${label}: leftover cabaz-modal-add should stay without invented type=button`);
  ok(phone.productAddType === 'button' && phone.productAddText === '＋',
    `${label}: leftover product-modal add stays leftover type=button ＋`);
  ok(phone.orderWaType === 'submit' && /Encomendar por WhatsApp/i.test(phone.orderWaText),
    `${label}: leftover order WhatsApp stays leftover type=submit`);
  ok(phone.skipText === 'Continuar sem adicionar',
    `${label}: leftover Continuar sem adicionar stays`);
  ok(phone.hero.some(t => /Ver Produtos/i.test(t)), `${label}: leftover Ver Produtos stays`);
  ok(phone.hero.some(t => /Encomendar por WhatsApp/i.test(t)), `${label}: leftover Encomendar por WhatsApp stays`);
  ok(phone.bar.some(t => /Carrinho/i.test(t)), `${label}: leftover 4-item bar still lists Carrinho`);
  ok(phone.bar.some(t => /Promoções/i.test(t)), `${label}: leftover 4-item bar still lists Promoções`);
  ok(phone.bar.some(t => /WhatsApp/i.test(t)), `${label}: leftover 4-item bar still lists WhatsApp`);
  ok(phone.bar.some(t => /Como Chegar/i.test(t)), `${label}: leftover 4-item bar still lists Como Chegar`);
  ok(phone.bar.length === 4, `${label}: leftover 4-item bar stays (got ${phone.bar.length})`);
  ok(phone.waHref === 'https://wa.me/351932699850',
    `${label}: leftover privacy WhatsApp stays wa.me/351932699850`);
  ok(phone.barWaHref === 'https://wa.me/351932699850',
    `${label}: leftover bar WhatsApp stays wa.me/351932699850`);
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
    return { ok: true, count: document.getElementById('cart-count')?.textContent || '' };
  });
  ok(added.ok && added.count === '1', `${label}: leftover Adicionar still adds leftover Melancia 1/4 (count=${added.count})`);
  return added;
}

try {
  const mobile = await browser.newPage();
  mobile.on('pageerror', err => errors.push('390 pageerror: ' + err.message));
  await openReady(mobile, 390, 844);

  const phone = await measureAdd(mobile);
  leftoverCopy(phone, '390 homepage');
  ok(phone.height >= 44,
    `390 homepage: leftover Adicionar tap height >= 44px (got ${phone.height})`);
  ok(phone.width >= 44,
    `390 homepage: leftover Adicionar tap width stays leftover wider than 44px (got ${phone.width})`);
  ok(phone.minHeight === '44px',
    `390 homepage: leftover Adicionar min-height should be leftover 44px (got "${phone.minHeight}")`);
  ok(phone.minWidth !== '44px',
    `390 homepage: leftover Adicionar should not invent leftover min-width 44px (got "${phone.minWidth}")`);
  ok(phone.boxSizing === 'border-box',
    `390 homepage: leftover Adicionar should keep leftover border-box (got "${phone.boxSizing}")`);
  ok(phone.qtyHeight < 40 && phone.qtyWidth < 40,
    `390 homepage: should not invent leftover qty-btn 44px tap (got ${phone.qtyWidth}×${phone.qtyHeight})`);
  ok(phone.featureHeight < 44,
    `390 homepage: should not invent leftover feature-add 44px tap (got ${phone.featureHeight})`);
  ok(phone.productCloseHeight < 40,
    `390 homepage: should not redo leftover product-modal-close 44px tap (got ${phone.productCloseHeight})`);
  ok(phone.filtMinHeight !== '44px',
    `390 homepage: should not redo leftover Filtros 44px tap (got "${phone.filtMinHeight}")`);
  ok(phone.cartCount === '0' || phone.cartCount === '',
    `390 homepage: leftover empty cart stays leftover empty before leftover Adicionar (got "${phone.cartCount}")`);
  ok(phone.menuOpen === false, '390 homepage: leftover mobile-menu stays leftover closed');

  await addMelancia(mobile, '390 homepage');
  const afterAdd = await mobile.evaluate(() => ({
    cartCount: document.getElementById('cart-count')?.textContent || '',
    selected: [...document.querySelectorAll('.shop-main .product-card')]
      .find(c => /Melancia 1\/4/i.test(c.textContent || ''))?.classList.contains('selected') === true,
    menuOpen: document.getElementById('mobile-menu')?.classList.contains('open') === true,
    barWaHref: document.querySelector('.mb-item[href^="https://wa.me/"]')?.getAttribute('href') || '',
    frutasActive: document.getElementById('tab-frutas')?.classList.contains('active') === true,
    skipText: (document.querySelector('.cs-pop-skip')?.textContent || '').trim(),
  }));
  ok(afterAdd.cartCount === '1',
    `390 homepage: leftover Adicionar should keep leftover Melancia 1/4 cart (got "${afterAdd.cartCount}")`);
  ok(afterAdd.selected === true, '390 homepage: leftover Melancia 1/4 card stays leftover selected after leftover Adicionar');
  ok(afterAdd.menuOpen === false, '390 homepage: leftover mobile-menu stays leftover closed after leftover Adicionar');
  ok(afterAdd.frutasActive === true, '390 homepage: leftover Frutas tab stays leftover active after leftover Adicionar');
  ok(afterAdd.barWaHref === 'https://wa.me/351932699850',
    `390 homepage: leftover bar WhatsApp stays after leftover Adicionar (got "${afterAdd.barWaHref}")`);
  ok(afterAdd.skipText === 'Continuar sem adicionar',
    '390 homepage: leftover Continuar sem adicionar stays after leftover Adicionar');

  const mid = await browser.newPage();
  mid.on('pageerror', err => errors.push('640 pageerror: ' + err.message));
  await openReady(mid, 640, 844);
  const midPhone = await measureAdd(mid);
  leftoverCopy(midPhone, '640 homepage');
  ok(midPhone.height >= 44,
    `640 homepage: leftover Adicionar tap height >= 44px (got ${midPhone.height})`);
  ok(midPhone.width >= 44,
    `640 homepage: leftover Adicionar tap width stays leftover wider than 44px (got ${midPhone.width})`);
  ok(midPhone.minHeight === '44px',
    `640 homepage: leftover Adicionar min-height should be leftover 44px (got "${midPhone.minHeight}")`);
  await addMelancia(mid, '640 homepage');
  const midCart = await mid.evaluate(() => document.getElementById('cart-count')?.textContent || '');
  ok(midCart === '1', `640 homepage: leftover Adicionar still adds leftover Melancia 1/4 (got "${midCart}")`);

  const catPage = await browser.newPage();
  catPage.on('pageerror', err => errors.push('390 Frutas pageerror: ' + err.message));
  await catPage.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true });
  await catPage.goto(`${base}categorias/frutas/`, { waitUntil: 'networkidle0', timeout: 60000 });
  const cat = await catPage.evaluate(() => {
    const nav = [...document.querySelectorAll('.seo-nav a')].map(a => (a.textContent || '').trim());
    const footer = document.querySelector('.seo-footer a');
    const ver = document.querySelector('.seo-text-link');
    return {
      nav,
      footerText: (footer?.textContent || '').replace(/\s+/g, ' ').trim(),
      verText: (ver?.textContent || '').trim(),
      hasHamburger: !!document.querySelector('.hamburger, #mobile-menu, [aria-label="Menu"]'),
      hasAddBtn: !!document.querySelector('.add-btn'),
    };
  });
  ok(cat.nav.join('|') === 'Início|Frutas|Legumes|Promoções',
    `390 Frutas: wrapping nav stays leftover Início / Frutas / Legumes / Promoções (got ${cat.nav.join(' / ')})`);
  ok(/MUNDIFRUTA/i.test(cat.footerText), `390 Frutas: leftover catalog footer stays (got "${cat.footerText}")`);
  ok(cat.verText === 'Ver produto', `390 Frutas: leftover Ver produto copy (got "${cat.verText}")`);
  ok(!cat.hasHamburger, '390 Frutas: should not add a leftover SEO-page hamburger');
  ok(!cat.hasAddBtn, '390 Frutas: should not add leftover catalog Adicionar');

  const prodPage = await browser.newPage();
  prodPage.on('pageerror', err => errors.push('390 Melancia pageerror: ' + err.message));
  await prodPage.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true });
  await prodPage.goto(`${base}produtos/melancia-1-4/`, { waitUntil: 'networkidle0', timeout: 60000 });
  const prod = await prodPage.evaluate(() => {
    const order = document.querySelector('.seo-order-link');
    return {
      orderText: (order?.textContent || '').replace(/\s+/g, ' ').trim(),
      orderHref: order?.getAttribute('href') || '',
      hasAddBtn: !!document.querySelector('.add-btn'),
    };
  });
  ok(prod.orderText === 'Ver no catálogo e encomendar',
    `390 Melancia: leftover Ver no catálogo e encomendar stays (got "${prod.orderText}")`);
  ok(prod.orderHref === '/?produto=melancia-1-4#produtos',
    `390 Melancia: leftover catalog href stays (got "${prod.orderHref}")`);
  ok(!prod.hasAddBtn, '390 Melancia: should not add leftover catalog Adicionar');

  const tablet = await browser.newPage();
  tablet.on('pageerror', err => errors.push('900 pageerror: ' + err.message));
  await openReady(tablet, 900, 800);
  const tabPhone = await measureAdd(tablet);
  leftoverCopy(tabPhone, '900 homepage');
  ok(tabPhone.height < 44,
    `900 homepage: leftover Adicionar should hug leftover ＋ Adicionar, not force 44px (got ${tabPhone.width}×${tabPhone.height})`);
  ok(tabPhone.minHeight !== '44px' && tabPhone.minWidth !== '44px',
    `900 homepage: leftover Adicionar min-size should stay leftover below 44px (got ${tabPhone.minHeight} / ${tabPhone.minWidth})`);
  await addMelancia(tablet, '900 homepage');

  const desktop = await browser.newPage();
  desktop.on('pageerror', err => errors.push('1280 pageerror: ' + err.message));
  await openReady(desktop, 1280, 800);
  const wide = await measureAdd(desktop);
  leftoverCopy(wide, '1280 homepage');
  ok(wide.height < 44,
    `1280 homepage: leftover Adicionar should stay leftover 42px, not force 44px (got ${wide.width}×${wide.height})`);
  ok(wide.minHeight !== '44px' && wide.minWidth !== '44px',
    `1280 homepage: leftover Adicionar min-size should stay leftover 42px, not 44px (got ${wide.minHeight} / ${wide.minWidth})`);
  ok(wide.minHeight === '42px',
    `1280 homepage: leftover Adicionar stays leftover 42px (got "${wide.minHeight}")`);
  await addMelancia(desktop, '1280 homepage');
  const wideCart = await desktop.evaluate(() => ({
    count: document.getElementById('cart-count')?.textContent || '',
    waHref: document.querySelector('.privacy-box a[href^="https://wa.me/"]')?.getAttribute('href') || '',
  }));
  ok(wideCart.count === '1', `1280 homepage: leftover Adicionar still adds leftover Melancia 1/4 (got "${wideCart.count}")`);
  ok(wideCart.waHref === 'https://wa.me/351932699850',
    `1280 homepage: leftover privacy WhatsApp stays wa.me/351932699850 (got "${wideCart.waHref}")`);

  await browser.close();
  server.close();
  if (errors.length) {
    console.error('check-add-btn-tap-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
    process.exit(1);
  }
  console.log('check-add-btn-tap-browser: ok');
} catch (err) {
  try { await browser.close(); } catch {}
  try { server.close(); } catch {}
  console.error(err);
  process.exit(1);
}
