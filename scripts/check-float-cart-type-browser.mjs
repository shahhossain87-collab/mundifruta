#!/usr/bin/env node
/** Chrome: leftover float-cart is type=button. */
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

async function measurePage(page) {
  return page.evaluate(() => {
    const hamburger = document.querySelector('.hamburger');
    const menu = document.getElementById('mobile-menu');
    const mobileClose = document.querySelector('.mobile-close');
    const navOrder = document.querySelector('.nav-order');
    const searchClear = document.querySelector('.search-clear');
    const cabazClose = document.querySelector('.cabaz-modal-close');
    const cabazAdd = document.getElementById('cabaz-modal-add');
    const productClose = document.querySelector('.product-modal-close');
    const productAdd = document.getElementById('product-modal-add');
    const csClose = document.querySelector('.cs-pop-close');
    const skip = document.querySelector('.cs-pop-skip');
    const privacyClose = document.querySelector('.privacy-close');
    const reset = document.querySelector('.privacy-reset');
    const link = document.querySelector('.consent-link');
    const no = document.querySelector('.consent-no');
    const yes = document.querySelector('.consent-yes');
    const orderWa = document.querySelector('#order-form button.btn-wa');
    const privacyLinks = [...document.querySelectorAll('.privacy-box a')];
    const contact = [...document.querySelectorAll('.contact-card a')];
    const credit = document.querySelector('.footer-credit a');
    const footerLinks = [...document.querySelectorAll('.footer-links a')];
    const hero = [...document.querySelectorAll('.hero-ctas a')].map(a =>
      (a.textContent || '').replace(/\s+/g, ' ').trim()
    );
    const barEl = document.getElementById('mobile-bar');
    const barItems = [...document.querySelectorAll('.mb-item')];
    const bar = barItems.map(el => (el.textContent || '').replace(/\s+/g, ' ').trim());
    const mbCart = document.querySelector('.mobile-bar button.mb-item');
    const floatCart = document.getElementById('float-cart');
    const floatText = document.getElementById('float-cart-text');
    const floatIcon = floatCart?.querySelector('.fc-icon');
    const floatLegumes = document.getElementById('float-legumes');
    const scrollTop = document.getElementById('scroll-top');
    const catQuick = document.querySelector('.cat-quick-btn');
    const shopLink = document.querySelector('.shop-link');
    const privacyWa = document.querySelector('.privacy-box a[href^="https://wa.me/"]');
    const barWa = document.querySelector('.mb-item[href^="https://wa.me/"]');
    const ver = [...document.querySelectorAll('.cabaz-ver')]
      .find(btn => /Detox/i.test(btn.closest('.product-card')?.textContent || ''));
    const enc = document.getElementById('encomenda');
    const encBox = enc ? enc.getBoundingClientRect() : { top: 0, bottom: 0 };
    const box = floatCart ? floatCart.getBoundingClientRect() : { width: 0, height: 0 };
    const cartStyle = floatCart ? getComputedStyle(floatCart) : null;
    return {
      hamburgerType: hamburger?.getAttribute('type') || '',
      hamburgerLabel: hamburger?.getAttribute('aria-label') || '',
      hamburgerExpanded: hamburger?.getAttribute('aria-expanded'),
      hamburgerDisplay: hamburger ? getComputedStyle(hamburger).display : '',
      hamburgerBars: hamburger ? hamburger.querySelectorAll('span').length : 0,
      menuOpen: menu?.classList.contains('open') === true,
      menuLinks: menu
        ? [...menu.querySelectorAll('a')].map(a => (a.textContent || '').trim())
        : [],
      mobileCloseText: (mobileClose?.textContent || '').trim(),
      mobileCloseType: mobileClose?.getAttribute('type') || '',
      mobileCloseLabel: mobileClose?.getAttribute('aria-label') || '',
      navOrderType: navOrder?.getAttribute('type') || '',
      navOrderText: (navOrder?.textContent || '').replace(/\s+/g, ' ').trim(),
      searchClearType: searchClear?.getAttribute('type') || '',
      searchClearText: (searchClear?.textContent || '').trim(),
      searchClearLabel: searchClear?.getAttribute('aria-label') || '',
      barDisplay: barEl ? getComputedStyle(barEl).display : '',
      mbCartType: mbCart?.getAttribute('type') || '',
      mbCartText: (mbCart?.textContent || '').replace(/\s+/g, ' ').trim(),
      floatCartTag: floatCart?.tagName || '',
      floatCartType: floatCart?.getAttribute('type') || '',
      floatCartTitle: floatCart?.getAttribute('title') || '',
      floatCartLabel: floatCart?.getAttribute('aria-label') || '',
      floatCartText: (floatCart?.textContent || '').replace(/\s+/g, ' ').trim(),
      floatText: (floatText?.textContent || '').replace(/\s+/g, ' ').trim(),
      floatIconText: (floatIcon?.textContent || '').trim(),
      floatCartVisible: floatCart?.classList.contains('visible') === true,
      floatCartOpacity: cartStyle?.opacity || '',
      floatCartPointer: cartStyle?.pointerEvents || '',
      floatCartMinHeight: cartStyle?.minHeight || '',
      floatCartHeight: box.height,
      floatCartWidth: box.width,
      floatLegumesType: floatLegumes?.getAttribute('type') || '',
      floatLegumesHidden: floatLegumes?.hidden === true,
      scrollTopType: scrollTop?.getAttribute('type') || '',
      catQuickType: catQuick?.getAttribute('type') || '',
      shopLinkType: shopLink?.getAttribute('type') || '',
      cabazCloseText: (cabazClose?.textContent || '').trim(),
      cabazCloseType: cabazClose?.getAttribute('type') || '',
      cabazAddText: (cabazAdd?.textContent || '').trim(),
      cabazAddType: cabazAdd?.getAttribute('type') || '',
      productCloseText: (productClose?.textContent || '').trim(),
      productCloseType: productClose?.getAttribute('type') || '',
      productAddText: (productAdd?.textContent || '').trim(),
      productAddType: productAdd?.getAttribute('type') || '',
      csCloseText: (csClose?.textContent || '').trim(),
      skipText: (skip?.textContent || '').trim(),
      privacyCloseText: (privacyClose?.textContent || '').trim(),
      resetText: (reset?.textContent || '').trim(),
      linkText: (link?.textContent || '').trim(),
      noText: (no?.textContent || '').trim(),
      yesText: (yes?.textContent || '').trim(),
      orderWaType: orderWa?.getAttribute('type') || '',
      orderWaText: (orderWa?.textContent || '').replace(/\s+/g, ' ').trim(),
      privacyLabels: privacyLinks.map(a => (a.textContent || '').trim()),
      privacyHrefs: privacyLinks.map(a => a.getAttribute('href') || ''),
      contactLabels: contact.map(a => (a.textContent || '').trim()),
      creditText: (credit?.textContent || '').trim(),
      creditHref: credit?.getAttribute('href') || '',
      footerLinks: footerLinks.map(a => (a.textContent || '').trim()),
      hero,
      bar,
      waHref: privacyWa?.getAttribute('href') || '',
      barWaHref: barWa?.getAttribute('href') || '',
      verText: (ver?.textContent || '').replace(/\s+/g, ' ').trim(),
      verType: ver?.getAttribute('type') || '',
      verLabel: ver?.getAttribute('aria-label') || '',
      cartCount: document.getElementById('cart-count')?.textContent || '',
      overflow: document.body.style.overflow,
      catalogCount: document.querySelectorAll('.shop-main .product-card').length,
      encomendaTitle: (enc?.querySelector('.section-title')?.textContent || '').trim(),
      encomendaInView: encBox.top < window.innerHeight && encBox.bottom > 80,
    };
  });
}

async function clickFloatCart(page) {
  return page.evaluate(() => {
    const btn = document.getElementById('float-cart');
    if (!btn) return { ok: false };
    btn.click();
    return {
      ok: true,
      type: btn.getAttribute('type') || '',
      title: btn.getAttribute('title') || '',
      text: (btn.textContent || '').replace(/\s+/g, ' ').trim(),
      visible: btn.classList.contains('visible') === true,
    };
  });
}

async function waitForEncomenda(page) {
  await page.waitForFunction(() => {
    const enc = document.getElementById('encomenda');
    if (!enc) return false;
    const r = enc.getBoundingClientRect();
    return r.top < window.innerHeight && r.bottom > 80;
  }, { timeout: 8000 });
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
  ok(added.ok && added.count === '1', `${label}: add Melancia 1/4 (count=${added.count}${added.reason ? ', ' + added.reason : ''})`);
  await page.waitForFunction(() => {
    const fc = document.getElementById('float-cart');
    if (!fc || !fc.classList.contains('visible')) return false;
    const cs = getComputedStyle(fc);
    return cs.opacity === '1' && cs.pointerEvents === 'auto';
  }, { timeout: 3000 });
}

function assertUntypedChrome(m, label) {
  ok(m.hamburgerType === '', `${label}: leftover hamburger stays without leftover type=button (got "${m.hamburgerType}")`);
  ok(m.navOrderType === '', `${label}: leftover Encomendar stays without leftover type=button (got "${m.navOrderType}")`);
  ok(m.mobileCloseType === '', `${label}: leftover mobile-close stays without leftover type=button (got "${m.mobileCloseType}")`);
  ok(m.searchClearType === '', `${label}: leftover search-clear stays without leftover type=button (got "${m.searchClearType}")`);
  ok(m.mbCartType === '', `${label}: leftover 4-item bar Carrinho stays without leftover type=button (got "${m.mbCartType}")`);
  ok(m.floatLegumesType === '', `${label}: leftover float-legumes stays without leftover type=button (got "${m.floatLegumesType}")`);
  ok(m.scrollTopType === '', `${label}: leftover scroll-top stays without leftover type=button (got "${m.scrollTopType}")`);
  ok(m.catQuickType === '', `${label}: leftover cat-quick-btn stays without leftover type=button (got "${m.catQuickType}")`);
  ok(m.shopLinkType === '', `${label}: leftover shop-link stays without leftover type=button (got "${m.shopLinkType}")`);
  ok(m.cabazCloseType === '' && m.cabazAddType === '' && m.verType === '',
    `${label}: leftover cabaz-modal close / leftover cabaz-modal add / leftover cabaz-ver stay without leftover type=button`);
  ok(m.orderWaType === 'submit',
    `${label}: leftover order WhatsApp stays leftover type=submit (got "${m.orderWaType}")`);
}

try {
  const mobile = await browser.newPage();
  mobile.on('pageerror', err => errors.push('390 pageerror: ' + err.message));
  await openReady(mobile, 390, 844);
  const start = await measurePage(mobile);
  ok(start.floatCartTag === 'BUTTON' && start.floatCartType === 'button',
    `390 homepage: leftover float-cart should be leftover type=button (got "${start.floatCartTag}" / "${start.floatCartType}")`);
  ok(start.floatIconText === '🛒',
    `390 homepage: leftover float-cart stays leftover 🛒 (got "${start.floatIconText}")`);
  ok(/Ver a sua encomenda/i.test(start.floatCartTitle),
    `390 homepage: leftover float-cart stays leftover Ver a sua encomenda (got "${start.floatCartTitle}")`);
  ok(start.floatCartLabel === '',
    `390 homepage: should not invent leftover float-cart aria-label (got "${start.floatCartLabel}")`);
  ok(start.floatCartVisible === false,
    '390 homepage: leftover empty float-cart should stay leftover not visible');
  ok(start.floatCartOpacity === '0',
    `390 homepage: leftover empty float-cart should stay leftover opacity 0 (got "${start.floatCartOpacity}")`);
  ok(start.floatCartPointer === 'none',
    `390 homepage: leftover empty float-cart should stay leftover pointer-events none (got "${start.floatCartPointer}")`);
  ok(!/^44px$/.test(start.floatCartMinHeight),
    `390 homepage: should not invent leftover float-cart 44px min-height (got "${start.floatCartMinHeight}")`);
  ok(start.hamburgerLabel === 'Menu',
    `390 homepage: leftover hamburger stays leftover Menu (got "${start.hamburgerLabel}")`);
  ok(start.hamburgerExpanded == null,
    `390 homepage: should not redo leftover hamburger aria-expanded (PR #70) (got "${start.hamburgerExpanded}")`);
  ok(start.hamburgerBars === 3, `390 homepage: leftover hamburger stays leftover 3 bars (got ${start.hamburgerBars})`);
  ok(start.mobileCloseText === '✕' && start.mobileCloseLabel === '',
    `390 homepage: leftover mobile-close stays leftover ✕ without leftover aria-label (got "${start.mobileCloseText}" / "${start.mobileCloseLabel}")`);
  ok(start.searchClearText === '✕' && start.searchClearLabel === 'Limpar pesquisa',
    `390 homepage: leftover search-clear stays leftover ✕ / leftover Limpar pesquisa (got "${start.searchClearText}" / "${start.searchClearLabel}")`);
  ok(start.menuOpen === false, '390 homepage: leftover mobile-menu should stay closed');
  ok(start.menuLinks.join('|') === 'Frutas|Legumes|Promoções|Cabazes|Como Funciona|Produtos|Quem Somos|Avaliações|Encomendar|Contacto',
    `390 homepage: leftover mobile-menu links stay (got ${start.menuLinks.join(' / ')})`);
  ok(/Encomendar/.test(start.navOrderText),
    `390 homepage: leftover header Encomendar stays (got "${start.navOrderText}")`);
  ok(start.skipText === 'Continuar sem adicionar',
    `390 homepage: leftover Continuar sem adicionar stays (got "${start.skipText}")`);
  ok(start.linkText === 'Saber mais' && start.noText === 'Só essenciais' && start.yesText === 'Aceitar tudo',
    `390 homepage: leftover Saber mais / Só essenciais / Aceitar tudo stay (got "${start.linkText}" / "${start.noText}" / "${start.yesText}")`);
  ok(start.resetText === 'Repor consentimento',
    `390 homepage: leftover Repor consentimento stays (got "${start.resetText}")`);
  ok(start.productAddText === '＋' && start.cabazAddText === '＋',
    `390 homepage: leftover product-modal add / leftover cabaz-modal add stay leftover ＋ (got "${start.productAddText}" / "${start.cabazAddText}")`);
  ok(start.verText === '👁 Ver o que leva' && start.verLabel === '',
    `390 homepage: leftover 👁 Ver o que leva stays without leftover aria-label (got "${start.verText}" / "${start.verLabel}")`);
  ok(start.orderWaText.includes('Encomendar por WhatsApp'),
    `390 homepage: leftover order WhatsApp copy stays (got "${start.orderWaText}")`);
  ok(start.waHref === 'https://wa.me/351932699850',
    `390 homepage: leftover privacy WhatsApp stays wa.me/351932699850 (got "${start.waHref}")`);
  ok(start.barWaHref === 'https://wa.me/351932699850',
    `390 homepage: leftover bar WhatsApp stays wa.me/351932699850 (got "${start.barWaHref}")`);
  ok(start.privacyLabels.includes('WhatsApp') && start.privacyLabels.includes('email'),
    `390 homepage: leftover privacy-dialog WhatsApp / email stay (got ${start.privacyLabels.join(' / ')})`);
  ok(start.contactLabels.some(t => /932 699 850/.test(t)),
    `390 homepage: leftover Encontre-nos 932 699 850 stays (got ${start.contactLabels.join(' / ')})`);
  ok(start.creditText === 'Shah Hossain',
    `390 homepage: leftover Shah Hossain stays (got "${start.creditText}")`);
  ok(start.footerLinks.includes('Produtos') && start.footerLinks.includes('Frutas') && start.footerLinks.includes('Créditos das fotos'),
    `390 homepage: leftover footer shop-links stay (got ${start.footerLinks.join(' / ')})`);
  ok(start.hero.some(t => /Ver Produtos/i.test(t)), '390 homepage: leftover Ver Produtos stays');
  ok(start.hero.some(t => /Encomendar por WhatsApp/i.test(t)), '390 homepage: leftover Encomendar por WhatsApp stays');
  ok(start.cartCount === '0' || start.cartCount === '',
    `390 homepage: leftover empty float-cart should not add leftover cabaz (got "${start.cartCount}")`);
  ok(start.encomendaInView === false,
    '390 homepage: leftover Encomendar Online should start below leftover fold');
  ok(start.encomendaTitle === 'Encomendar Online',
    `390 homepage: leftover Encomendar Online stays (got "${start.encomendaTitle}")`);
  ok(start.floatLegumesHidden === true, '390 homepage: leftover float-legumes stays leftover hidden');
  ok(start.catalogCount > 0,
    `390 homepage: leftover catalog cards stay (got ${start.catalogCount})`);
  assertUntypedChrome(start, '390 homepage empty');

  const emptyClick = await clickFloatCart(mobile);
  ok(emptyClick.ok && emptyClick.type === 'button',
    `390 homepage: leftover empty float-cart click stays leftover type=button (got "${emptyClick.type}")`);
  await waitForEncomenda(mobile);
  const afterEmpty = await measurePage(mobile);
  ok(afterEmpty.encomendaInView === true,
    '390 homepage: leftover float-cart click should scroll leftover Encomendar Online into leftover view');
  ok(afterEmpty.encomendaTitle === 'Encomendar Online',
    `390 homepage: leftover Encomendar Online stays after empty click (got "${afterEmpty.encomendaTitle}")`);
  ok(afterEmpty.floatCartType === 'button',
    `390 homepage: leftover float-cart stays leftover type=button after empty click (got "${afterEmpty.floatCartType}")`);
  ok(afterEmpty.floatCartVisible === false,
    '390 homepage: leftover empty float-cart stays leftover not visible after empty click');
  ok(afterEmpty.cartCount === '0' || afterEmpty.cartCount === '',
    `390 homepage: leftover empty float-cart should not add leftover cabaz after click (got "${afterEmpty.cartCount}")`);
  ok(afterEmpty.menuOpen === false, '390 homepage: leftover float-cart should keep leftover mobile-menu closed');
  ok(afterEmpty.overflow === '',
    `390 homepage: leftover float-cart should not invent leftover overflow lock (got "${afterEmpty.overflow}")`);
  ok(afterEmpty.waHref === 'https://wa.me/351932699850',
    `390 homepage: leftover privacy WhatsApp stays after empty click (got "${afterEmpty.waHref}")`);
  ok(afterEmpty.barWaHref === 'https://wa.me/351932699850',
    `390 homepage: leftover bar WhatsApp stays after empty click (got "${afterEmpty.barWaHref}")`);
  assertUntypedChrome(afterEmpty, '390 homepage after empty click');

  await addMelancia(mobile, '390 homepage');
  const filled = await measurePage(mobile);
  ok(filled.floatCartType === 'button',
    `390 homepage: leftover float-cart stays leftover type=button after leftover Melancia 1/4 (got "${filled.floatCartType}")`);
  ok(filled.floatCartVisible === true,
    '390 homepage: leftover float-cart should become leftover visible after leftover Melancia 1/4');
  ok(filled.floatCartOpacity === '1',
    `390 homepage: leftover filled float-cart should be leftover opacity 1 (got "${filled.floatCartOpacity}")`);
  ok(filled.floatCartPointer === 'auto',
    `390 homepage: leftover filled float-cart should be leftover pointer-events auto (got "${filled.floatCartPointer}")`);
  ok(filled.cartCount === '1',
    `390 homepage: leftover Melancia 1/4 should stay in leftover cart (got "${filled.cartCount}")`);
  ok(/Ver a sua encomenda/i.test(filled.floatCartTitle),
    `390 homepage: leftover filled float-cart title stays leftover Ver a sua encomenda (got "${filled.floatCartTitle}")`);
  ok(!/^44px$/.test(filled.floatCartMinHeight),
    `390 homepage: leftover filled float-cart should not invent leftover 44px min-height (got "${filled.floatCartMinHeight}")`);

  const filledClick = await clickFloatCart(mobile);
  ok(filledClick.ok && filledClick.type === 'button' && filledClick.visible === true,
    `390 homepage: leftover filled float-cart click stays leftover type=button leftover visible (got "${filledClick.type}" / visible=${filledClick.visible})`);
  await waitForEncomenda(mobile);
  const afterFilled = await measurePage(mobile);
  ok(afterFilled.encomendaInView === true,
    '390 homepage: leftover filled float-cart click should keep leftover Encomendar Online in leftover view');
  ok(afterFilled.floatCartType === 'button',
    `390 homepage: leftover float-cart stays leftover type=button after filled click (got "${afterFilled.floatCartType}")`);
  ok(afterFilled.floatCartVisible === true,
    '390 homepage: leftover float-cart stays leftover visible after filled click');
  ok(afterFilled.cartCount === '1',
    `390 homepage: leftover filled float-cart should keep leftover Melancia 1/4 (got "${afterFilled.cartCount}")`);
  ok(afterFilled.waHref === 'https://wa.me/351932699850',
    `390 homepage: leftover privacy WhatsApp stays after filled click (got "${afterFilled.waHref}")`);
  ok(afterFilled.barWaHref === 'https://wa.me/351932699850',
    `390 homepage: leftover bar WhatsApp stays after filled click (got "${afterFilled.barWaHref}")`);
  ok(afterFilled.orderWaType === 'submit',
    `390 homepage: leftover order WhatsApp stays leftover type=submit after filled click (got "${afterFilled.orderWaType}")`);
  ok(afterFilled.menuOpen === false, '390 homepage: leftover filled float-cart should keep leftover mobile-menu closed');
  ok(afterFilled.catalogCount > 0,
    `390 homepage: leftover filled float-cart should keep leftover catalog cards (got ${afterFilled.catalogCount})`);
  assertUntypedChrome(afterFilled, '390 homepage after filled click');

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
      footerHeight: footer ? footer.getBoundingClientRect().height : 0,
      verText: (ver?.textContent || '').trim(),
      hasBar: !!document.querySelector('.hamburger, #mobile-menu, [aria-label="Menu"], .mobile-close, .mb-item, #mobile-bar, #float-cart, .float-cart'),
    };
  });
  ok(cat.nav.join('|') === 'Início|Frutas|Legumes|Promoções',
    `390 Frutas: wrapping nav stays leftover Início / Frutas / Legumes / Promoções (got ${cat.nav.join(' / ')})`);
  ok(/MUNDIFRUTA/i.test(cat.footerText), `390 Frutas: leftover catalog footer stays (got "${cat.footerText}")`);
  ok(cat.footerHeight < 40, `390 Frutas: should not redo leftover catalog footer 44px tap (got ${cat.footerHeight})`);
  ok(cat.verText === 'Ver produto', `390 Frutas: leftover Ver produto copy (got "${cat.verText}")`);
  ok(!cat.hasBar, '390 Frutas: should not add a leftover SEO-page hamburger / leftover mobile-close / leftover 4-item bar / leftover float-cart');

  const prodPage = await browser.newPage();
  prodPage.on('pageerror', err => errors.push('390 Melancia pageerror: ' + err.message));
  await prodPage.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true });
  await prodPage.goto(`${base}produtos/melancia-1-4/`, { waitUntil: 'networkidle0', timeout: 60000 });
  const prod = await prodPage.evaluate(() => {
    const order = document.querySelector('.seo-order-link');
    return {
      orderText: (order?.textContent || '').replace(/\s+/g, ' ').trim(),
      orderHref: order?.getAttribute('href') || '',
      orderWidth: order ? order.getBoundingClientRect().width : 0,
      hasFloat: !!document.querySelector('#float-cart, .float-cart'),
    };
  });
  ok(prod.orderText === 'Ver no catálogo e encomendar',
    `390 Melancia: leftover Ver no catálogo e encomendar stays (got "${prod.orderText}")`);
  ok(prod.orderHref === '/?produto=melancia-1-4#produtos',
    `390 Melancia: leftover catalog href stays (got "${prod.orderHref}")`);
  ok(prod.orderWidth < 360, `390 Melancia: should not redo leftover full-width order CTA (got ${prod.orderWidth})`);
  ok(!prod.hasFloat, '390 Melancia: should not invent leftover float-cart on leftover product page');

  const desktop = await browser.newPage();
  desktop.on('pageerror', err => errors.push('1280 pageerror: ' + err.message));
  await openReady(desktop, 1280, 800);
  const wide = await measurePage(desktop);
  ok(wide.floatCartTag === 'BUTTON' && wide.floatCartType === 'button',
    `1280 homepage: leftover float-cart should be leftover type=button (got "${wide.floatCartTag}" / "${wide.floatCartType}")`);
  ok(wide.floatIconText === '🛒',
    `1280 homepage: leftover float-cart stays leftover 🛒 (got "${wide.floatIconText}")`);
  ok(/Ver a sua encomenda/i.test(wide.floatCartTitle),
    `1280 homepage: leftover float-cart stays leftover Ver a sua encomenda (got "${wide.floatCartTitle}")`);
  ok(wide.floatCartVisible === false,
    '1280 homepage: leftover empty float-cart should stay leftover not visible');
  ok(wide.floatCartOpacity === '0' && wide.floatCartPointer === 'none',
    `1280 homepage: leftover empty float-cart should stay leftover opacity 0 / leftover pointer-events none (got "${wide.floatCartOpacity}" / "${wide.floatCartPointer}")`);
  ok(!/^44px$/.test(wide.floatCartMinHeight),
    `1280 homepage: should not invent leftover float-cart 44px min-height (got "${wide.floatCartMinHeight}")`);
  ok(wide.hamburgerType === '',
    `1280 homepage: should not invent leftover type=button on leftover hamburger (got "${wide.hamburgerType}")`);
  ok(wide.hamburgerLabel === 'Menu',
    `1280 homepage: leftover hamburger stays leftover Menu (got "${wide.hamburgerLabel}")`);
  ok(wide.hamburgerDisplay === 'none',
    `1280 homepage: leftover hamburger should stay leftover hidden on leftover desktop (got "${wide.hamburgerDisplay}")`);
  ok(wide.hamburgerExpanded == null,
    `1280 homepage: should not redo leftover hamburger aria-expanded (PR #70) (got "${wide.hamburgerExpanded}")`);
  ok(wide.menuOpen === false, '1280 homepage: leftover mobile-menu should stay closed');
  ok(wide.barDisplay === 'none',
    `1280 homepage: leftover 4-item bar should stay leftover hidden on leftover desktop (got "${wide.barDisplay}")`);
  ok(wide.hero.some(t => /Ver Produtos/i.test(t)), '1280 homepage: leftover Ver Produtos stays');
  ok(wide.hero.some(t => /Encomendar por WhatsApp/i.test(t)), '1280 homepage: leftover Encomendar por WhatsApp stays');
  ok(wide.waHref === 'https://wa.me/351932699850',
    `1280 homepage: leftover privacy WhatsApp stays wa.me/351932699850 (got "${wide.waHref}")`);
  ok(wide.cartCount === '0' || wide.cartCount === '',
    `1280 homepage: leftover empty float-cart should not add leftover cabaz (got "${wide.cartCount}")`);
  ok(wide.encomendaInView === false,
    '1280 homepage: leftover Encomendar Online should start below leftover fold');
  ok(wide.encomendaTitle === 'Encomendar Online',
    `1280 homepage: leftover Encomendar Online stays (got "${wide.encomendaTitle}")`);
  assertUntypedChrome(wide, '1280 homepage empty');

  const deskClick = await clickFloatCart(desktop);
  ok(deskClick.ok && deskClick.type === 'button',
    `1280 homepage: leftover empty float-cart click stays leftover type=button (got "${deskClick.type}")`);
  await waitForEncomenda(desktop);
  const deskAfter = await measurePage(desktop);
  ok(deskAfter.encomendaInView === true,
    '1280 homepage: leftover float-cart click should scroll leftover Encomendar Online into leftover view');
  ok(deskAfter.encomendaTitle === 'Encomendar Online',
    `1280 homepage: leftover Encomendar Online stays after click (got "${deskAfter.encomendaTitle}")`);
  ok(deskAfter.floatCartType === 'button',
    `1280 homepage: leftover float-cart stays leftover type=button after click (got "${deskAfter.floatCartType}")`);
  ok(deskAfter.floatCartVisible === false,
    '1280 homepage: leftover empty float-cart stays leftover not visible after click');
  ok(deskAfter.hamburgerType === '' && deskAfter.navOrderType === '' && deskAfter.mobileCloseType === '' && deskAfter.searchClearType === '',
    '1280 homepage: leftover hamburger / leftover Encomendar / leftover mobile-close / leftover search-clear stay without leftover type=button after click');
  ok(deskAfter.waHref === 'https://wa.me/351932699850',
    `1280 homepage: leftover privacy WhatsApp stays after click (got "${deskAfter.waHref}")`);
  ok(deskAfter.cartCount === '0' || deskAfter.cartCount === '',
    `1280 homepage: leftover empty float-cart should not add leftover cabaz after click (got "${deskAfter.cartCount}")`);
  ok(deskAfter.catalogCount > 0,
    `1280 homepage: leftover float-cart should keep leftover catalog cards (got ${deskAfter.catalogCount})`);
  ok(deskAfter.orderWaType === 'submit',
    `1280 homepage: leftover order WhatsApp stays leftover type=submit after click (got "${deskAfter.orderWaType}")`);
  assertUntypedChrome(deskAfter, '1280 homepage after empty click');

  await addMelancia(desktop, '1280 homepage');
  const deskFilled = await measurePage(desktop);
  ok(deskFilled.floatCartType === 'button' && deskFilled.floatCartVisible === true,
    `1280 homepage: leftover float-cart stays leftover type=button leftover visible after leftover Melancia 1/4 (got "${deskFilled.floatCartType}" / visible=${deskFilled.floatCartVisible})`);
  ok(deskFilled.cartCount === '1',
    `1280 homepage: leftover Melancia 1/4 should stay in leftover cart (got "${deskFilled.cartCount}")`);
  const deskFilledClick = await clickFloatCart(desktop);
  ok(deskFilledClick.ok && deskFilledClick.type === 'button' && deskFilledClick.visible === true,
    `1280 homepage: leftover filled float-cart click stays leftover type=button leftover visible (got "${deskFilledClick.type}")`);
  await waitForEncomenda(desktop);
  const deskFilledAfter = await measurePage(desktop);
  ok(deskFilledAfter.encomendaInView === true,
    '1280 homepage: leftover filled float-cart click should keep leftover Encomendar Online in leftover view');
  ok(deskFilledAfter.cartCount === '1',
    `1280 homepage: leftover filled float-cart should keep leftover Melancia 1/4 (got "${deskFilledAfter.cartCount}")`);
  ok(deskFilledAfter.waHref === 'https://wa.me/351932699850',
    `1280 homepage: leftover privacy WhatsApp stays after filled click (got "${deskFilledAfter.waHref}")`);
  ok(deskFilledAfter.orderWaType === 'submit',
    `1280 homepage: leftover order WhatsApp stays leftover type=submit after filled click (got "${deskFilledAfter.orderWaType}")`);
  assertUntypedChrome(deskFilledAfter, '1280 homepage after filled click');

  await browser.close();
  server.close();
  if (errors.length) {
    console.error('check-float-cart-type-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
    process.exit(1);
  }
  console.log('check-float-cart-type-browser: ok');
} catch (err) {
  try { await browser.close(); } catch {}
  try { server.close(); } catch {}
  console.error(err);
  process.exit(1);
}
