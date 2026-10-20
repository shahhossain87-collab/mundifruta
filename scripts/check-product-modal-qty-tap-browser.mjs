#!/usr/bin/env node
/** Chrome: leftover product-modal qty − / + is a 44px tap target on phones. */
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

async function openMelanciaModal(page, label) {
  const opened = await page.evaluate(() => {
    if (window.limparTudo) window.limparTudo();
    if (window.mostrarCategoria) window.mostrarCategoria('frutas', document.getElementById('tab-frutas'));
    const card = [...document.querySelectorAll('.shop-main .product-card')]
      .find(c => /Melancia 1\/4/i.test(c.textContent || ''));
    if (!card) return { ok: false, reason: 'card missing' };
    const photo = card.querySelector('.photo-wrap');
    if (photo) photo.click();
    else if (window.abrirProduto && card.dataset.productId) window.abrirProduto(card.dataset.productId);
    const modal = document.getElementById('product-modal');
    const name = document.getElementById('product-modal-name')?.textContent || '';
    const qty = document.getElementById('product-modal-qty')?.textContent || '';
    return {
      ok: modal?.classList.contains('open') === true && /Melancia 1\/4/i.test(name),
      name,
      qty,
      count: document.getElementById('cart-count')?.textContent || '',
    };
  });
  ok(opened.ok && opened.qty === '1',
    `${label}: leftover photo still opens leftover Melancia 1/4 preview (name="${opened.name}", qty=${opened.qty})`);
  return opened;
}

async function measureModalQty(page) {
  return page.evaluate(() => {
    const qtyBtns = [...document.querySelectorAll('.product-modal-qty button')];
    const minus = qtyBtns[0] || null;
    const plus = qtyBtns[1] || null;
    const minusBox = minus ? minus.getBoundingClientRect() : { width: 0, height: 0 };
    const plusBox = plus ? plus.getBoundingClientRect() : { width: 0, height: 0 };
    const minusStyle = minus ? getComputedStyle(minus) : null;
    const plusStyle = plus ? getComputedStyle(plus) : null;
    const card = [...document.querySelectorAll('.shop-main .product-card')]
      .find(c => /Melancia 1\/4/i.test(c.textContent || ''));
    const catalogQty = card ? card.querySelector('.qty-btn') : null;
    const add = card ? card.querySelector('.add-btn') : null;
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
      found: !!minus && !!plus,
      modalOpen: document.getElementById('product-modal')?.classList.contains('open') === true,
      modalName: document.getElementById('product-modal-name')?.textContent || '',
      modalQty: document.getElementById('product-modal-qty')?.textContent || '',
      minusText: (minus?.textContent || '').replace(/\s+/g, ' ').trim(),
      plusText: (plus?.textContent || '').replace(/\s+/g, ' ').trim(),
      minusType: minus?.getAttribute('type') || '',
      plusType: plus?.getAttribute('type') || '',
      minusLabel: minus?.getAttribute('aria-label') || '',
      plusLabel: plus?.getAttribute('aria-label') || '',
      groupLabel: document.querySelector('.product-modal-qty')?.getAttribute('aria-label') || '',
      minusHeight: minusBox.height,
      minusWidth: minusBox.width,
      plusHeight: plusBox.height,
      plusWidth: plusBox.width,
      minHeight: minusStyle?.minHeight || '',
      minWidth: minusStyle?.minWidth || '',
      plusMinHeight: plusStyle?.minHeight || '',
      plusMinWidth: plusStyle?.minWidth || '',
      boxSizing: minusStyle?.boxSizing || '',
      radius: minusStyle?.borderRadius || '',
      catalogQtyHeight: catalogQty ? catalogQty.getBoundingClientRect().height : 0,
      catalogQtyMinHeight: catalogQty ? getComputedStyle(catalogQty).minHeight : '',
      addHeight: add ? add.getBoundingClientRect().height : 0,
      addMinHeight: add ? getComputedStyle(add).minHeight : '',
      featureHeight: featureAdd ? featureAdd.getBoundingClientRect().height : 0,
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
      productAddHeight: productAdd ? productAdd.getBoundingClientRect().height : 0,
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
  ok(phone.found, `${label}: leftover product-modal qty − / + should be leftover present`);
  ok(phone.minusType === 'button' && phone.plusType === 'button',
    `${label}: leftover product-modal qty − / + should keep leftover type=button (got "${phone.minusType}" / "${phone.plusType}")`);
  ok(phone.minusText === '−' && phone.plusText === '+',
    `${label}: leftover product-modal qty copy stays leftover − / + (got "${phone.minusText}" / "${phone.plusText}")`);
  ok(phone.minusLabel === 'Diminuir quantidade' && phone.plusLabel === 'Aumentar quantidade',
    `${label}: leftover product-modal qty labels stay leftover Diminuir quantidade / Aumentar quantidade (got "${phone.minusLabel}" / "${phone.plusLabel}")`);
  ok(phone.groupLabel === 'Selecionar quantidade',
    `${label}: leftover product-modal qty group stays leftover Selecionar quantidade (got "${phone.groupLabel}")`);
  ok(/Melancia 1\/4/i.test(phone.modalName),
    `${label}: leftover product-modal name stays leftover Melancia 1/4 (got "${phone.modalName}")`);
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
  ok(phone.bar.some(t => /Carrinho/i.test(t) || /€/.test(t)),
    `${label}: leftover 4-item bar still lists leftover Carrinho or leftover cart total (got ${JSON.stringify(phone.bar)})`);
  ok(phone.bar.some(t => /Promoções/i.test(t)), `${label}: leftover 4-item bar still lists Promoções`);
  ok(phone.bar.some(t => /WhatsApp/i.test(t)), `${label}: leftover 4-item bar still lists WhatsApp`);
  ok(phone.bar.some(t => /Como Chegar/i.test(t)), `${label}: leftover 4-item bar still lists Como Chegar`);
  ok(phone.bar.length === 4, `${label}: leftover 4-item bar stays (got ${phone.bar.length})`);
  ok(phone.waHref === 'https://wa.me/351932699850',
    `${label}: leftover privacy WhatsApp stays wa.me/351932699850`);
  ok(phone.barWaHref === 'https://wa.me/351932699850',
    `${label}: leftover bar WhatsApp stays wa.me/351932699850`);
}

async function clickModalPlus(page, label) {
  const after = await page.evaluate(() => {
    const plus = document.querySelectorAll('.product-modal-qty button')[1];
    if (plus) plus.click();
    return {
      qty: document.getElementById('product-modal-qty')?.textContent || '',
      open: document.getElementById('product-modal')?.classList.contains('open') === true,
      name: document.getElementById('product-modal-name')?.textContent || '',
      count: document.getElementById('cart-count')?.textContent || '',
      menuOpen: document.getElementById('mobile-menu')?.classList.contains('open') === true,
      frutasActive: document.getElementById('tab-frutas')?.classList.contains('active') === true,
      barWaHref: document.querySelector('.mb-item[href^="https://wa.me/"]')?.getAttribute('href') || '',
    };
  });
  ok(after.qty === '2',
    `${label}: leftover product-modal qty + still increases leftover Melancia 1/4 (qty=${after.qty})`);
  ok(after.open === true, `${label}: leftover product-modal stays leftover open after leftover qty +`);
  ok(/Melancia 1\/4/i.test(after.name), `${label}: leftover product-modal name stays leftover Melancia 1/4 after leftover qty +`);
  ok(after.count === '0', `${label}: leftover cart stays leftover empty until leftover modal add (got "${after.count}")`);
  ok(after.menuOpen === false, `${label}: leftover mobile-menu stays leftover closed after leftover product-modal qty +`);
  ok(after.frutasActive === true, `${label}: leftover Frutas tab stays leftover active after leftover product-modal qty +`);
  ok(after.barWaHref === 'https://wa.me/351932699850',
    `${label}: leftover bar WhatsApp stays after leftover product-modal qty +`);
  return after;
}

async function addFromModal(page, label) {
  const after = await page.evaluate(() => {
    const add = document.getElementById('product-modal-add');
    if (add) add.click();
    const cs = document.getElementById('cs-pop');
    if (cs) cs.hidden = true;
    return {
      open: document.getElementById('product-modal')?.classList.contains('open') === true,
      count: document.getElementById('cart-count')?.textContent || '',
      waHref: document.querySelector('.privacy-box a[href^="https://wa.me/"]')?.getAttribute('href') || '',
    };
  });
  ok(after.open === false, `${label}: leftover product-modal add still closes leftover preview`);
  ok(after.count === '2',
    `${label}: leftover product-modal add still adds leftover Melancia 1/4 qty 2 (got "${after.count}")`);
  ok(after.waHref === 'https://wa.me/351932699850',
    `${label}: leftover privacy WhatsApp stays after leftover product-modal add`);
  return after;
}

try {
  const mobile = await browser.newPage();
  mobile.on('pageerror', err => errors.push('390 pageerror: ' + err.message));
  await openReady(mobile, 390, 844);
  const emptyBar = await mobile.evaluate(() =>
    [...document.querySelectorAll('.mb-item')].map(el => (el.textContent || '').replace(/\s+/g, ' ').trim())
  );
  ok(emptyBar.some(t => /Carrinho/i.test(t)),
    `390 homepage empty: leftover 4-item bar still lists Carrinho (got ${JSON.stringify(emptyBar)})`);
  ok(emptyBar.length === 4, `390 homepage empty: leftover 4-item bar stays (got ${emptyBar.length})`);
  await openMelanciaModal(mobile, '390 homepage');

  const phone = await measureModalQty(mobile);
  leftoverCopy(phone, '390 homepage');
  ok(phone.modalOpen === true, '390 homepage: leftover product-modal is leftover open so leftover qty is leftover visible');
  ok(phone.minusHeight >= 44 && phone.plusHeight >= 44,
    `390 homepage: leftover product-modal qty − / + tap height >= 44px (got ${phone.minusWidth}×${phone.minusHeight} / ${phone.plusWidth}×${phone.plusHeight})`);
  ok(phone.minusWidth >= 44 && phone.plusWidth >= 44,
    `390 homepage: leftover product-modal qty − / + tap width >= 44px (got ${phone.minusWidth} / ${phone.plusWidth})`);
  ok(phone.minHeight === '44px' && phone.minWidth === '44px',
    `390 homepage: leftover product-modal qty min-size should be leftover 44px (got ${phone.minHeight} / ${phone.minWidth})`);
  ok(phone.plusMinHeight === '44px' && phone.plusMinWidth === '44px',
    `390 homepage: leftover product-modal qty + min-size should be leftover 44px (got ${phone.plusMinHeight} / ${phone.plusMinWidth})`);
  ok(phone.boxSizing === 'border-box',
    `390 homepage: leftover product-modal qty should keep leftover border-box (got "${phone.boxSizing}")`);
  ok(phone.catalogQtyHeight < 44 && phone.catalogQtyMinHeight !== '44px',
    `390 homepage: should not redo leftover catalog qty 44px tap (got ${phone.catalogQtyHeight} / ${phone.catalogQtyMinHeight})`);
  ok(phone.addHeight < 44,
    `390 homepage: should not redo leftover catalog Adicionar 44px tap (got ${phone.addHeight})`);
  ok(phone.featureHeight < 44,
    `390 homepage: should not invent leftover feature-add 44px tap (got ${phone.featureHeight})`);
  ok(phone.productCloseHeight < 40,
    `390 homepage: should not redo leftover product-modal-close 44px tap (got ${phone.productCloseHeight})`);
  ok(phone.productAddHeight >= 50,
    `390 homepage: leftover product-modal add stays leftover ≥50px, not a leftover 44px slice (got ${phone.productAddHeight})`);
  ok(phone.filtMinHeight !== '44px',
    `390 homepage: should not redo leftover Filtros 44px tap (got "${phone.filtMinHeight}")`);
  ok(phone.cartCount === '0' && phone.modalQty === '1',
    `390 homepage: leftover Melancia 1/4 preview stays leftover qty 1 before leftover qty + (got "${phone.cartCount}" / "${phone.modalQty}")`);
  ok(phone.menuOpen === false, '390 homepage: leftover mobile-menu stays leftover closed');

  await clickModalPlus(mobile, '390 homepage');
  await addFromModal(mobile, '390 homepage');

  const mid = await browser.newPage();
  mid.on('pageerror', err => errors.push('640 pageerror: ' + err.message));
  await openReady(mid, 640, 844);
  await openMelanciaModal(mid, '640 homepage');
  const midPhone = await measureModalQty(mid);
  leftoverCopy(midPhone, '640 homepage');
  ok(midPhone.minusHeight >= 44 && midPhone.plusHeight >= 44,
    `640 homepage: leftover product-modal qty − / + tap height >= 44px (got ${midPhone.minusWidth}×${midPhone.minusHeight})`);
  ok(midPhone.minHeight === '44px' && midPhone.minWidth === '44px',
    `640 homepage: leftover product-modal qty min-size should be leftover 44px (got ${midPhone.minHeight} / ${midPhone.minWidth})`);
  await clickModalPlus(mid, '640 homepage');
  await addFromModal(mid, '640 homepage');

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
      hasModalQty: !!document.querySelector('.product-modal-qty'),
    };
  });
  ok(cat.nav.join('|') === 'Início|Frutas|Legumes|Promoções',
    `390 Frutas: wrapping nav stays leftover Início / Frutas / Legumes / Promoções (got ${cat.nav.join(' / ')})`);
  ok(/MUNDIFRUTA/i.test(cat.footerText), `390 Frutas: leftover catalog footer stays (got "${cat.footerText}")`);
  ok(cat.verText === 'Ver produto', `390 Frutas: leftover Ver produto copy (got "${cat.verText}")`);
  ok(!cat.hasHamburger, '390 Frutas: should not add a leftover SEO-page hamburger');
  ok(!cat.hasModalQty, '390 Frutas: should not add leftover product-modal qty − / +');

  const prodPage = await browser.newPage();
  prodPage.on('pageerror', err => errors.push('390 Melancia pageerror: ' + err.message));
  await prodPage.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true });
  await prodPage.goto(`${base}produtos/melancia-1-4/`, { waitUntil: 'networkidle0', timeout: 60000 });
  const prod = await prodPage.evaluate(() => {
    const order = document.querySelector('.seo-order-link');
    return {
      orderText: (order?.textContent || '').replace(/\s+/g, ' ').trim(),
      orderHref: order?.getAttribute('href') || '',
      hasModalQty: !!document.querySelector('.product-modal-qty'),
    };
  });
  ok(prod.orderText === 'Ver no catálogo e encomendar',
    `390 Melancia: leftover Ver no catálogo e encomendar stays (got "${prod.orderText}")`);
  ok(prod.orderHref === '/?produto=melancia-1-4#produtos',
    `390 Melancia: leftover catalog href stays (got "${prod.orderHref}")`);
  ok(!prod.hasModalQty, '390 Melancia: should not add leftover product-modal qty − / +');

  const tablet = await browser.newPage();
  tablet.on('pageerror', err => errors.push('900 pageerror: ' + err.message));
  await openReady(tablet, 900, 800);
  await openMelanciaModal(tablet, '900 homepage');
  const tabPhone = await measureModalQty(tablet);
  leftoverCopy(tabPhone, '900 homepage');
  ok(tabPhone.minusHeight < 44 && tabPhone.plusHeight < 44,
    `900 homepage: leftover product-modal qty should hug leftover − / +, not force 44px (got ${tabPhone.minusWidth}×${tabPhone.minusHeight})`);
  ok(tabPhone.minHeight !== '44px' && tabPhone.minWidth !== '44px',
    `900 homepage: leftover product-modal qty min-size should stay leftover below 44px (got ${tabPhone.minHeight} / ${tabPhone.minWidth})`);
  await clickModalPlus(tablet, '900 homepage');
  await addFromModal(tablet, '900 homepage');

  const desktop = await browser.newPage();
  desktop.on('pageerror', err => errors.push('1280 pageerror: ' + err.message));
  await openReady(desktop, 1280, 800);
  await openMelanciaModal(desktop, '1280 homepage');
  const wide = await measureModalQty(desktop);
  leftoverCopy(wide, '1280 homepage');
  ok(wide.minusHeight < 44 && wide.plusHeight < 44,
    `1280 homepage: leftover product-modal qty should stay leftover 36px, not force 44px (got ${wide.minusWidth}×${wide.minusHeight})`);
  ok(wide.minHeight !== '44px' && wide.minWidth !== '44px',
    `1280 homepage: leftover product-modal qty min-size should stay leftover 36px, not 44px (got ${wide.minHeight} / ${wide.minWidth})`);
  ok(wide.minusWidth === 36 && wide.minusHeight === 36,
    `1280 homepage: leftover product-modal qty stays leftover 36px (got ${wide.minusWidth}×${wide.minusHeight})`);
  await clickModalPlus(desktop, '1280 homepage');
  await addFromModal(desktop, '1280 homepage');
  const wideCart = await desktop.evaluate(() => ({
    count: document.getElementById('cart-count')?.textContent || '',
    waHref: document.querySelector('.privacy-box a[href^="https://wa.me/"]')?.getAttribute('href') || '',
  }));
  ok(wideCart.count === '2', `1280 homepage: leftover product-modal add still adds leftover Melancia 1/4 qty 2 (got "${wideCart.count}")`);
  ok(wideCart.waHref === 'https://wa.me/351932699850',
    `1280 homepage: leftover privacy WhatsApp stays wa.me/351932699850 (got "${wideCart.waHref}")`);

  await browser.close();
  server.close();
  if (errors.length) {
    console.error('check-product-modal-qty-tap-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
    process.exit(1);
  }
  console.log('check-product-modal-qty-tap-browser: ok');
} catch (err) {
  try { await browser.close(); } catch {}
  try { server.close(); } catch {}
  console.error(err);
  process.exit(1);
}
