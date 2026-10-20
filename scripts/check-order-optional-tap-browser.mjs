#!/usr/bin/env node
/** Chrome: leftover checkout Hora de levantamento is a 44px tap target on phones. */
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
    `${label}: add Melancia 1/4 (count=${added.count}, line=${added.line})`);
}

async function measureToggle(page) {
  return page.evaluate(() => {
    const toggle = document.getElementById('order-optional-toggle');
    const optional = document.getElementById('order-optional');
    const box = toggle ? toggle.getBoundingClientRect() : { width: 0, height: 0 };
    const style = toggle ? getComputedStyle(toggle) : null;
    const hamburger = document.querySelector('.hamburger');
    const navOrder = document.querySelector('.nav-order');
    const mobileClose = document.querySelector('.mobile-close');
    const searchClear = document.querySelector('.search-clear');
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
    const btnEm = document.querySelector('.btn-em');
    const btnContinuar = document.querySelector('.btn-continuar');
    const orderRemove = document.querySelector('.order-remove');
    const oiMinus = document.querySelector('.oi-stepper button');
    const qty = document.querySelector('.shop-main .qty-btn');
    const add = document.querySelector('.shop-main .add-btn');
    const productQty = document.querySelector('.product-modal-qty button');
    const privacyWa = document.querySelector('.privacy-box a[href^="https://wa.me"]');
    const barWa = document.querySelector('.mobile-bar a[href^="https://wa.me"]');
    const hero = [...document.querySelectorAll('.hero a, .hero button')].map(el =>
      (el.textContent || '').replace(/\s+/g, ' ').trim()
    );
    const bar = [...document.querySelectorAll('.mb-item')].map(el =>
      (el.textContent || '').replace(/\s+/g, ' ').trim()
    );
    const enc = document.getElementById('encomenda');
    return {
      found: !!toggle,
      tag: toggle?.tagName || '',
      type: toggle?.getAttribute('type') || '',
      id: toggle?.id || '',
      text: (toggle?.textContent || '').replace(/\s+/g, ' ').trim(),
      hidden: toggle ? toggle.hidden === true : null,
      display: style?.display || '',
      align: style?.alignItems || '',
      padding: style ? `${style.paddingTop} ${style.paddingRight} ${style.paddingBottom} ${style.paddingLeft}` : '',
      width: box.width,
      height: box.height,
      minHeight: style?.minHeight || '',
      minWidth: style?.minWidth || '',
      boxSizing: style?.boxSizing || '',
      optionalHidden: optional ? optional.hidden === true : null,
      pickupPlaceholder: document.getElementById('cust-levantamento')?.getAttribute('placeholder') || '',
      notesPlaceholder: document.getElementById('cust-notas')?.getAttribute('placeholder') || '',
      hamburgerType: hamburger?.getAttribute('type') || '',
      hamburgerLabel: hamburger?.getAttribute('aria-label') || '',
      hamburgerExpanded: hamburger?.getAttribute('aria-expanded'),
      navOrderType: navOrder?.getAttribute('type') || '',
      mobileCloseType: mobileClose?.getAttribute('type') || '',
      mobileCloseLabel: mobileClose?.getAttribute('aria-label') || '',
      mobileCloseText: (mobileClose?.textContent || '').trim(),
      searchClearType: searchClear?.getAttribute('type') || '',
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
      btnEmText: (btnEm?.textContent || '').replace(/\s+/g, ' ').trim(),
      btnEmHeight: btnEm ? btnEm.getBoundingClientRect().height : 0,
      btnContinuarText: (btnContinuar?.textContent || '').replace(/\s+/g, ' ').trim(),
      btnContinuarHeight: btnContinuar ? btnContinuar.getBoundingClientRect().height : 0,
      removeHeight: orderRemove ? orderRemove.getBoundingClientRect().height : 0,
      oiHeight: oiMinus ? oiMinus.getBoundingClientRect().height : 0,
      qtyHeight: qty ? qty.getBoundingClientRect().height : 0,
      addHeight: add ? add.getBoundingClientRect().height : 0,
      productQtyHeight: productQty ? productQty.getBoundingClientRect().height : 0,
      menuOpen: document.getElementById('mobile-menu')?.classList.contains('open') === true,
      waHref: privacyWa?.getAttribute('href') || '',
      barWaHref: barWa?.getAttribute('href') || '',
      hero,
      bar,
      encomendaTitle: (enc?.querySelector('h2, .section-title')?.textContent || '').trim(),
      cartCount: document.getElementById('cart-count')?.textContent || '',
    };
  });
}

function leftoverCopy(phone, label) {
  ok(phone.found, `${label}: leftover checkout Hora de levantamento should be leftover present`);
  ok(phone.tag === 'BUTTON', `${label}: leftover checkout Hora de levantamento stays leftover button`);
  ok(phone.type === 'button', `${label}: leftover checkout Hora de levantamento stays leftover type=button`);
  ok(phone.id === 'order-optional-toggle',
    `${label}: leftover checkout Hora de levantamento keeps leftover #order-optional-toggle`);
  ok(phone.text === '+ Hora de levantamento ou nota (opcional)',
    `${label}: leftover + Hora de levantamento ou nota (opcional) stays (got "${phone.text}")`);
  ok(phone.hidden === false, `${label}: leftover checkout Hora de levantamento should start leftover visible`);
  ok(phone.optionalHidden === true, `${label}: leftover #order-optional should start leftover hidden`);
  ok(phone.pickupPlaceholder === 'Hora de levantamento (ex: 17h30)',
    `${label}: leftover pickup placeholder stays (got "${phone.pickupPlaceholder}")`);
  ok(phone.notesPlaceholder === 'Pedidos especiais ou notas...',
    `${label}: leftover notes placeholder stays (got "${phone.notesPlaceholder}")`);
  ok(phone.display === 'inline-flex' || phone.display === 'flex',
    `${label}: leftover checkout Hora de levantamento should stay leftover flex / inline-flex (got "${phone.display}")`);
  ok(phone.align === 'center',
    `${label}: leftover checkout Hora de levantamento should stay leftover align-items:center (got "${phone.align}")`);
  ok(phone.hamburgerType === '',
    `${label}: leftover hamburger stays without leftover type=button`);
  ok(phone.hamburgerLabel === 'Menu',
    `${label}: leftover hamburger stays leftover Menu (got "${phone.hamburgerLabel}")`);
  ok(phone.hamburgerExpanded == null,
    `${label}: should not redo leftover hamburger aria-expanded (PR #70)`);
  ok(phone.navOrderType === '',
    `${label}: leftover header Encomendar stays without leftover type=button`);
  ok(phone.mobileCloseType === '',
    `${label}: leftover mobile-close stays without leftover type=button`);
  ok(!phone.mobileCloseLabel && phone.mobileCloseText === '✕',
    `${label}: leftover mobile-close stays leftover ✕ without leftover accessible name`);
  ok(phone.searchClearType === '',
    `${label}: leftover search-clear stays without leftover type=button`);
  ok(phone.mbCartType === '',
    `${label}: leftover 4-item bar Carrinho stays without leftover type=button`);
  ok(phone.floatCartType === '',
    `${label}: leftover float-cart stays without leftover type=button`);
  ok(phone.floatLegumesType === '',
    `${label}: leftover float-legumes stays without leftover type=button`);
  ok(phone.scrollTopType === '',
    `${label}: leftover scroll-top stays without leftover type=button`);
  ok(phone.cabazCloseType === '',
    `${label}: leftover cabaz-modal close stays without leftover type=button`);
  ok(phone.cabazAddType === '',
    `${label}: leftover cabaz-modal add stays without leftover type=button`);
  ok(phone.shopLinkType === '',
    `${label}: leftover shop-link stays without leftover type=button`);
  ok(phone.catQuickType === '',
    `${label}: leftover cat-quick-btn stays without leftover type=button`);
  ok(phone.orderWaType === 'submit' && /Encomendar por WhatsApp/i.test(phone.orderWaText),
    `${label}: leftover order WhatsApp stays leftover type=submit leftover .btn-wa`);
  ok(phone.btnEmText === 'ou encomende por email',
    `${label}: leftover ou encomende por email stays (got "${phone.btnEmText}")`);
  ok(phone.btnContinuarText === '← Continuar a comprar',
    `${label}: leftover Continuar a comprar stays (got "${phone.btnContinuarText}")`);
  ok(phone.hero.some(t => /Ver Produtos/i.test(t)), `${label}: leftover Ver Produtos stays`);
  ok(phone.hero.some(t => /Encomendar por WhatsApp/i.test(t)), `${label}: leftover Encomendar por WhatsApp stays`);
  ok(phone.bar.some(t => /Carrinho/i.test(t) || /€/.test(t)),
    `${label}: leftover 4-item bar still lists Carrinho`);
  ok(phone.bar.some(t => /Promoções/i.test(t)), `${label}: leftover 4-item bar still lists Promoções`);
  ok(phone.bar.some(t => /WhatsApp/i.test(t)), `${label}: leftover 4-item bar still lists WhatsApp`);
  ok(phone.bar.some(t => /Como Chegar/i.test(t)), `${label}: leftover 4-item bar still lists Como Chegar`);
  ok(phone.bar.length === 4, `${label}: leftover 4-item bar stays (got ${phone.bar.length})`);
  ok(phone.waHref === 'https://wa.me/351932699850',
    `${label}: leftover privacy WhatsApp stays wa.me/351932699850 (got "${phone.waHref}")`);
  ok(phone.barWaHref === 'https://wa.me/351932699850',
    `${label}: leftover bar WhatsApp stays wa.me/351932699850 (got "${phone.barWaHref}")`);
  ok(phone.encomendaTitle === 'Encomendar Online',
    `${label}: leftover Encomendar Online stays (got "${phone.encomendaTitle}")`);
  ok(phone.menuOpen === false, `${label}: leftover mobile-menu stays leftover closed`);
}

function leftoverPhoneTap(phone, label) {
  leftoverCopy(phone, label);
  ok(phone.height >= 44,
    `${label}: leftover checkout Hora de levantamento tap height >= 44px (got ${phone.width}×${phone.height})`);
  ok(phone.width >= 44,
    `${label}: leftover checkout Hora de levantamento tap width >= 44px (got ${phone.width})`);
  ok(parseFloat(phone.minHeight) >= 44,
    `${label}: leftover checkout Hora de levantamento min-height >= 44px (got ${phone.minHeight})`);
  ok(phone.boxSizing === 'border-box',
    `${label}: leftover checkout Hora de levantamento should keep leftover border-box (got "${phone.boxSizing}")`);
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
  ok(phone.btnEmHeight < 44,
    `${label}: should not invent leftover checkout email 44px tap (got ${phone.btnEmHeight})`);
  ok(phone.btnContinuarHeight < 44,
    `${label}: should not invent leftover Continuar a comprar 44px tap (got ${phone.btnContinuarHeight})`);
}

function leftoverDesktopHug(phone, label) {
  leftoverCopy(phone, label);
  ok(phone.height < 44,
    `${label}: leftover checkout Hora de levantamento should hug leftover labels, not force 44px (got ${phone.height})`);
  ok(phone.minHeight === '0px' || phone.minHeight === 'auto' || parseFloat(phone.minHeight) < 44,
    `${label}: leftover desktop min-height should stay leftover unforced (got ${phone.minHeight})`);
}

async function clickToggle(page, label) {
  const after = await page.evaluate(() => {
    const toggle = document.getElementById('order-optional-toggle');
    if (!toggle) return { ok: false, reason: 'toggle missing' };
    toggle.click();
    const optional = document.getElementById('order-optional');
    const pickup = document.getElementById('cust-levantamento');
    const notes = document.getElementById('cust-notas');
    const privacyWa = document.querySelector('.privacy-box a[href^="https://wa.me"]');
    const barWa = document.querySelector('.mobile-bar a[href^="https://wa.me"]');
    return {
      ok: true,
      toggleHidden: toggle.hidden === true,
      optionalHidden: optional ? optional.hidden === true : null,
      pickupVisible: pickup ? pickup.offsetParent !== null || getComputedStyle(pickup).display !== 'none' : false,
      pickupPlaceholder: pickup?.getAttribute('placeholder') || '',
      notesPlaceholder: notes?.getAttribute('placeholder') || '',
      menuOpen: document.getElementById('mobile-menu')?.classList.contains('open') === true,
      waHref: privacyWa?.getAttribute('href') || '',
      barWaHref: barWa?.getAttribute('href') || '',
    };
  });
  ok(after.ok, `${label}: leftover checkout Hora de levantamento click should work`);
  ok(after.toggleHidden === true,
    `${label}: leftover checkout Hora de levantamento should hide after leftover click`);
  ok(after.optionalHidden === false,
    `${label}: leftover #order-optional should reveal after leftover click`);
  ok(after.pickupPlaceholder === 'Hora de levantamento (ex: 17h30)',
    `${label}: leftover pickup placeholder stays after leftover click (got "${after.pickupPlaceholder}")`);
  ok(after.notesPlaceholder === 'Pedidos especiais ou notas...',
    `${label}: leftover notes placeholder stays after leftover click (got "${after.notesPlaceholder}")`);
  ok(after.menuOpen === false, `${label}: leftover mobile-menu stays leftover closed after leftover click`);
  ok(after.waHref === 'https://wa.me/351932699850',
    `${label}: leftover privacy WhatsApp stays after leftover click (got "${after.waHref}")`);
  ok(after.barWaHref === 'https://wa.me/351932699850',
    `${label}: leftover bar WhatsApp stays after leftover click (got "${after.barWaHref}")`);
}

try {
  const mobile = await browser.newPage();
  mobile.on('pageerror', err => errors.push('390 pageerror: ' + err.message));
  await openReady(mobile, 390, 844);
  const phone = await measureToggle(mobile);
  leftoverPhoneTap(phone, '390 homepage');
  await clickToggle(mobile, '390 homepage');
  await addMelancia(mobile, '390 after leftover Hora de levantamento');
  const afterAdd = await mobile.evaluate(() => {
    const line = [...document.querySelectorAll('.order-item')]
      .find(li => /Melancia 1\/4/i.test(li.textContent || ''));
    const optional = document.getElementById('order-optional');
    return {
      count: document.getElementById('cart-count')?.textContent || '',
      line: (line?.textContent || '').replace(/\s+/g, ' ').trim(),
      optionalHidden: optional ? optional.hidden === true : null,
    };
  });
  ok(afterAdd.count === '1' && /Melancia 1\/4/i.test(afterAdd.line),
    `390 homepage: leftover Melancia 1/4 stays after leftover Hora de levantamento (got "${afterAdd.count}" / "${afterAdd.line}")`);
  ok(afterAdd.optionalHidden === false,
    '390 homepage: leftover #order-optional should stay leftover open after leftover Melancia 1/4 add');

  const midPhone = await browser.newPage();
  midPhone.on('pageerror', err => errors.push('640 pageerror: ' + err.message));
  await openReady(midPhone, 640, 900);
  leftoverPhoneTap(await measureToggle(midPhone), '640 homepage');
  await clickToggle(midPhone, '640 homepage');

  const tablet = await browser.newPage();
  tablet.on('pageerror', err => errors.push('900 pageerror: ' + err.message));
  await openReady(tablet, 900, 800);
  leftoverDesktopHug(await measureToggle(tablet), '900 homepage');

  const wide = await browser.newPage();
  wide.on('pageerror', err => errors.push('1280 pageerror: ' + err.message));
  await openReady(wide, 1280, 800);
  leftoverDesktopHug(await measureToggle(wide), '1280 homepage');
  await clickToggle(wide, '1280 homepage');
  await addMelancia(wide, '1280 after leftover Hora de levantamento');

  const catPage = await browser.newPage();
  catPage.on('pageerror', err => errors.push('390 Frutas pageerror: ' + err.message));
  await catPage.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true });
  await catPage.goto(`${base}categorias/frutas/`, { waitUntil: 'networkidle0', timeout: 60000 });
  const cat = await catPage.evaluate(() => {
    const nav = [...document.querySelectorAll('.seo-nav a')].map(a => (a.textContent || '').trim());
    return {
      nav,
      hasToggle: !!document.querySelector('#order-optional-toggle, .order-optional-toggle, .oi-stepper, .order-remove'),
      verText: (document.querySelector('.seo-text-link')?.textContent || '').trim(),
    };
  });
  ok(cat.nav.join('|') === 'Início|Frutas|Legumes|Promoções',
    `390 Frutas: wrapping nav stays leftover Início / Frutas / Legumes / Promoções (got ${cat.nav.join(' / ')})`);
  ok(!cat.hasToggle, '390 Frutas: catalog pages still have leftover no checkout Hora de levantamento');
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
      hasToggle: !!document.querySelector('#order-optional-toggle, .order-optional-toggle'),
    };
  });
  ok(prod.orderText === 'Ver no catálogo e encomendar',
    `390 Melancia: leftover Ver no catálogo e encomendar stays (got "${prod.orderText}")`);
  ok(prod.orderHref === '/?produto=melancia-1-4#produtos',
    `390 Melancia: leftover catalog href stays (got "${prod.orderHref}")`);
  ok(!prod.hasToggle, '390 Melancia: catalog pages still have leftover no checkout Hora de levantamento');

  await browser.close();
  server.close();
  if (errors.length) {
    console.error('check-order-optional-tap-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
    process.exit(1);
  }
  console.log('check-order-optional-tap-browser: ok');
} catch (err) {
  try { await browser.close(); } catch {}
  try { server.close(); } catch {}
  console.error(err);
  process.exit(1);
}
