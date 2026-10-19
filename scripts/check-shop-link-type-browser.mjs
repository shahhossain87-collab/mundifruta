#!/usr/bin/env node
/** Chrome: leftover shop-link is type=button. */
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
    const floatLegumes = document.getElementById('float-legumes');
    const scrollTop = document.getElementById('scroll-top');
    const catQuick = [...document.querySelectorAll('.cat-quick-btn')];
    const shopLinks = [...document.querySelectorAll('.shop-link')];
    const privacyWa = document.querySelector('.privacy-box a[href^="https://wa.me/"]');
    const barWa = document.querySelector('.mb-item[href^="https://wa.me/"]');
    const ver = [...document.querySelectorAll('.cabaz-ver')]
      .find(btn => /Detox/i.test(btn.closest('.product-card')?.textContent || ''));
    const enc = document.getElementById('encomenda');
    const encBox = enc ? enc.getBoundingClientRect() : { top: 0, bottom: 0 };
    const produtos = document.getElementById('produtos');
    const produtosBox = produtos ? produtos.getBoundingClientRect() : { top: 0, bottom: 0 };
    const cabazes = document.getElementById('cabazes');
    const cabazesBox = cabazes ? cabazes.getBoundingClientRect() : { top: 0, bottom: 0 };
    const tabFrutas = document.getElementById('tab-frutas');
    const tabLegumes = document.getElementById('tab-legumes');
    const inView = box => box.top < window.innerHeight && box.bottom > 80;
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
      floatCartType: floatCart?.getAttribute('type') || '',
      floatLegumesType: floatLegumes?.getAttribute('type') || '',
      floatLegumesText: (floatLegumes?.textContent || '').replace(/\s+/g, ' ').trim(),
      floatLegumesHidden: floatLegumes?.hidden === true,
      scrollTopType: scrollTop?.getAttribute('type') || '',
      scrollTopText: (scrollTop?.textContent || '').replace(/\s+/g, ' ').trim(),
      catQuickCount: catQuick.length,
      catQuickTypes: catQuick.map(btn => btn.getAttribute('type') || ''),
      catQuickTags: catQuick.map(btn => btn.tagName),
      catQuickLabels: catQuick.map(btn =>
        (btn.querySelector('.cq-label')?.textContent || '').replace(/\s+/g, ' ').trim()
      ),
      shopLinkCount: shopLinks.length,
      shopLinkTypes: shopLinks.map(btn => btn.getAttribute('type') || ''),
      shopLinkTags: shopLinks.map(btn => btn.tagName),
      shopLinkTexts: shopLinks.map(btn => (btn.textContent || '').replace(/\s+/g, ' ').trim()),
      shopLinkOnclicks: shopLinks.map(btn => btn.getAttribute('onclick') || ''),
      shopLinkMinHeights: shopLinks.map(btn => getComputedStyle(btn).minHeight),
      shopLinkPaddings: shopLinks.map(btn => getComputedStyle(btn).padding),
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
      encomendaInView: inView(encBox),
      produtosInView: inView(produtosBox),
      cabazesInView: inView(cabazesBox),
      tabFrutasActive: tabFrutas?.classList.contains('active') === true,
      tabLegumesActive: tabLegumes?.classList.contains('active') === true,
      tabLegumesSelected: tabLegumes?.getAttribute('aria-selected') || '',
    };
  });
}

async function clickShopLink(page, needle) {
  return page.evaluate((textNeedle) => {
    const btn = [...document.querySelectorAll('.shop-link')]
      .find(el => (el.textContent || '').replace(/\s+/g, ' ').trim() === textNeedle);
    if (!btn) return { ok: false };
    btn.click();
    return {
      ok: true,
      type: btn.getAttribute('type') || '',
      text: (btn.textContent || '').replace(/\s+/g, ' ').trim(),
      onclick: btn.getAttribute('onclick') || '',
    };
  }, needle);
}

async function waitInView(page, id) {
  await page.waitForFunction((elId) => {
    const el = document.getElementById(elId);
    if (!el) return false;
    const box = el.getBoundingClientRect();
    return box.top < window.innerHeight && box.bottom > 80;
  }, { timeout: 8000 }, id);
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
  ok(added.ok && added.count === '1', `${label}: add Melancia 1/4 (count=${added.count})`);
}

function assertShopLink(prefix, shot) {
  ok(shot.shopLinkCount === 4,
    `${prefix}: leftover shop-link should stay leftover 4 CTAs (got ${shot.shopLinkCount})`);
  ok(shot.shopLinkTags.every(t => t === 'BUTTON') && shot.shopLinkTypes.every(t => t === 'button'),
    `${prefix}: leftover shop-link should be leftover type=button (got ${shot.shopLinkTypes.join('/')})`);
  ok(shot.shopLinkTexts.includes('Ver catálogo completo →'),
    `${prefix}: leftover Ver catálogo completo stays (got ${shot.shopLinkTexts.join(' / ')})`);
  ok(shot.shopLinkTexts.includes('Ver todas as frutas →'),
    `${prefix}: leftover Ver todas as frutas stays`);
  ok(shot.shopLinkTexts.includes('Explorar fruta →'),
    `${prefix}: leftover Explorar fruta stays`);
  ok(shot.shopLinkTexts.includes('Ver todos os legumes →'),
    `${prefix}: leftover Ver todos os legumes stays`);
  ok(shot.shopLinkOnclicks.some(v => v.includes("getElementById('produtos')")) &&
    shot.shopLinkOnclicks.filter(v => v.includes("abrirCatalogo('frutas')")).length === 2 &&
    shot.shopLinkOnclicks.includes("abrirCatalogo('legumes')"),
    `${prefix}: leftover shop-link onclicks stay leftover`);
  ok(shot.shopLinkMinHeights.every(h => h !== '44px'),
    `${prefix}: leftover shop-link should not invent leftover min-height 44px (got ${shot.shopLinkMinHeights.join('/')})`);
  ok(shot.catQuickTypes.every(t => t === ''),
    `${prefix}: leftover cat-quick-btn stays without leftover type=button (PR #312) (got ${shot.catQuickTypes.join('/')})`);
}

try {
  const mobile = await browser.newPage();
  mobile.on('pageerror', err => errors.push('390 pageerror: ' + err.message));
  await openReady(mobile, 390, 844);
  const phone = await measurePage(mobile);
  assertShopLink('390 homepage', phone);
  ok(phone.hamburgerType === '',
    `390 homepage: should not invent leftover type=button on leftover hamburger (got "${phone.hamburgerType}")`);
  ok(phone.hamburgerLabel === 'Menu',
    `390 homepage: leftover hamburger stays leftover Menu (got "${phone.hamburgerLabel}")`);
  ok(phone.hamburgerExpanded == null,
    `390 homepage: should not redo leftover hamburger aria-expanded (PR #70) (got "${phone.hamburgerExpanded}")`);
  ok(phone.menuOpen === false, '390 homepage: leftover mobile-menu should stay closed');
  ok(phone.menuLinks.join('|') === 'Frutas|Legumes|Promoções|Cabazes|Como Funciona|Produtos|Quem Somos|Avaliações|Encomendar|Contacto',
    `390 homepage: leftover mobile-menu links stay (got ${phone.menuLinks.join(' / ')})`);
  ok(phone.mobileCloseText === '✕' && phone.mobileCloseType === '',
    `390 homepage: leftover mobile-close stays leftover ✕ without leftover type=button (got "${phone.mobileCloseText}" / "${phone.mobileCloseType}")`);
  ok(phone.mobileCloseLabel === '',
    `390 homepage: leftover mobile-close stays without leftover aria-label (PR #179) (got "${phone.mobileCloseLabel}")`);
  ok(phone.navOrderType === '' && /Encomendar/i.test(phone.navOrderText),
    `390 homepage: leftover Encomendar stays without leftover type=button (got "${phone.navOrderType}" / "${phone.navOrderText}")`);
  ok(phone.searchClearType === '' && phone.searchClearText === '✕' && phone.searchClearLabel === 'Limpar pesquisa',
    `390 homepage: leftover search-clear stays leftover ✕ / leftover Limpar pesquisa without leftover type=button`);
  ok(phone.mbCartType === '',
    `390 homepage: leftover 4-item bar Carrinho stays without leftover type=button (PR #309) (got "${phone.mbCartType}")`);
  ok(phone.floatCartType === '',
    `390 homepage: leftover float-cart stays without leftover type=button (got "${phone.floatCartType}")`);
  ok(phone.floatLegumesType === '' && phone.floatLegumesHidden === true && phone.floatLegumesText === 'Legumes',
    `390 homepage: leftover float-legumes stays leftover hidden Legumes without leftover type=button (got "${phone.floatLegumesType}")`);
  ok(phone.scrollTopType === '',
    `390 homepage: leftover scroll-top stays without leftover type=button (PR #311) (got "${phone.scrollTopType}")`);
  ok(phone.cabazCloseType === '' && phone.cabazAddType === '' && phone.verType === '',
    '390 homepage: leftover cabaz-modal close / leftover cabaz-modal add / leftover cabaz-ver stay without leftover type=button');
  ok(phone.verText === '👁 Ver o que leva',
    `390 homepage: leftover cabaz-ver stays leftover 👁 Ver o que leva (got "${phone.verText}")`);
  ok(phone.verLabel === '',
    `390 homepage: leftover cabaz-ver stays without leftover aria-label (PR #64) (got "${phone.verLabel}")`);
  ok(phone.cabazCloseText === '✕' && phone.cabazAddText === '＋',
    `390 homepage: leftover cabaz-modal close ✕ / leftover cabaz-modal add ＋ stay (got "${phone.cabazCloseText}" / "${phone.cabazAddText}")`);
  ok(phone.productCloseText === '✕' && phone.productAddText === '＋',
    `390 homepage: leftover product-modal close ✕ / leftover add ＋ stay (got "${phone.productCloseText}" / "${phone.productAddText}")`);
  ok(phone.skipText === 'Continuar sem adicionar',
    `390 homepage: leftover Continuar sem adicionar stays (got "${phone.skipText}")`);
  ok(phone.linkText === 'Saber mais' && phone.noText === 'Só essenciais' && phone.yesText === 'Aceitar tudo',
    '390 homepage: leftover consent Saber mais / Só essenciais / Aceitar tudo stay');
  ok(phone.resetText === 'Repor consentimento',
    `390 homepage: leftover Repor consentimento stays (got "${phone.resetText}")`);
  ok(phone.orderWaType === 'submit',
    `390 homepage: leftover order WhatsApp stays leftover type=submit (got "${phone.orderWaType}")`);
  ok(phone.hero.some(t => /Ver Produtos/i.test(t)), '390 homepage: leftover Ver Produtos stays');
  ok(phone.hero.some(t => /Encomendar por WhatsApp/i.test(t)), '390 homepage: leftover Encomendar por WhatsApp stays');
  ok(phone.waHref === 'https://wa.me/351932699850',
    `390 homepage: leftover privacy WhatsApp stays wa.me/351932699850 (got "${phone.waHref}")`);
  ok(phone.barWaHref === 'https://wa.me/351932699850',
    `390 homepage: leftover bar WhatsApp stays wa.me/351932699850 (got "${phone.barWaHref}")`);
  ok(phone.creditText === 'Shah Hossain',
    `390 homepage: leftover Shah Hossain stays (got "${phone.creditText}")`);
  ok(phone.cartCount === '0' || phone.cartCount === '',
    `390 homepage: leftover shop-link should not add leftover cabaz to leftover cart (got "${phone.cartCount}")`);
  ok(phone.tabFrutasActive === true,
    '390 homepage: leftover catalog should start leftover Frutas');
  ok(phone.tabLegumesActive === false,
    '390 homepage: leftover legumes tab should start leftover inactive');
  ok(phone.encomendaTitle === 'Encomendar Online',
    `390 homepage: leftover Encomendar Online stays (got "${phone.encomendaTitle}")`);
  ok(phone.catalogCount > 0,
    `390 homepage: leftover catalog cards stay (got ${phone.catalogCount})`);

  const clickCatalog = await clickShopLink(mobile, 'Ver catálogo completo →');
  ok(clickCatalog.ok && clickCatalog.type === 'button',
    `390 homepage: leftover Ver catálogo completo click stays leftover type=button (got "${clickCatalog.type}")`);
  ok(clickCatalog.text === 'Ver catálogo completo →',
    `390 homepage: leftover Ver catálogo completo click keeps leftover copy (got "${clickCatalog.text}")`);
  await waitInView(mobile, 'produtos');
  const afterCatalog = await measurePage(mobile);
  ok(afterCatalog.produtosInView === true,
    '390 homepage: leftover Ver catálogo completo click should scroll leftover catálogo into leftover view');
  ok(afterCatalog.tabFrutasActive === true && afterCatalog.tabLegumesActive === false,
    '390 homepage: leftover Ver catálogo completo click should keep leftover Frutas tab leftover active');
  assertShopLink('390 after Ver catálogo completo', afterCatalog);
  ok(afterCatalog.hamburgerType === '' && afterCatalog.navOrderType === '' && afterCatalog.mobileCloseType === '' && afterCatalog.searchClearType === '',
    '390 homepage: leftover hamburger / leftover Encomendar / leftover mobile-close / leftover search-clear stay without leftover type=button after leftover Ver catálogo completo');
  ok(afterCatalog.floatCartType === '' && afterCatalog.mbCartType === '' && afterCatalog.floatLegumesType === '' && afterCatalog.scrollTopType === '',
    '390 homepage: leftover float-cart / leftover Carrinho / leftover float-legumes / leftover scroll-top stay without leftover type=button after leftover Ver catálogo completo');
  ok(afterCatalog.cabazAddType === '' && afterCatalog.cabazCloseType === '' && afterCatalog.verType === '',
    '390 homepage: leftover cabaz-modal add / leftover cabaz-modal close / leftover cabaz-ver stay without leftover type=button after leftover Ver catálogo completo');
  ok(afterCatalog.waHref === 'https://wa.me/351932699850',
    `390 homepage: leftover privacy WhatsApp stays after leftover Ver catálogo completo (got "${afterCatalog.waHref}")`);
  ok(afterCatalog.barWaHref === 'https://wa.me/351932699850',
    `390 homepage: leftover bar WhatsApp stays after leftover Ver catálogo completo (got "${afterCatalog.barWaHref}")`);
  ok(afterCatalog.cartCount === '0' || afterCatalog.cartCount === '',
    `390 homepage: leftover Ver catálogo completo should not add leftover cabaz after click (got "${afterCatalog.cartCount}")`);
  ok(afterCatalog.orderWaType === 'submit',
    `390 homepage: leftover order WhatsApp stays leftover type=submit after leftover Ver catálogo completo (got "${afterCatalog.orderWaType}")`);
  ok(afterCatalog.menuOpen === false, '390 homepage: leftover Ver catálogo completo should keep leftover mobile-menu closed');
  ok(afterCatalog.catalogCount > 0,
    `390 homepage: leftover Ver catálogo completo should keep leftover catalog cards (got ${afterCatalog.catalogCount})`);
  ok(afterCatalog.overflow === '',
    `390 homepage: leftover Ver catálogo completo should not invent leftover overflow lock (got "${afterCatalog.overflow}")`);
  ok(afterCatalog.skipText === 'Continuar sem adicionar',
    `390 homepage: leftover Continuar sem adicionar stays after leftover Ver catálogo completo (got "${afterCatalog.skipText}")`);

  const clickFrutas = await clickShopLink(mobile, 'Ver todas as frutas →');
  ok(clickFrutas.ok && clickFrutas.type === 'button',
    `390 homepage: leftover Ver todas as frutas click stays leftover type=button (got "${clickFrutas.type}")`);
  ok(clickFrutas.text === 'Ver todas as frutas →',
    `390 homepage: leftover Ver todas as frutas click keeps leftover copy (got "${clickFrutas.text}")`);
  await waitInView(mobile, 'produtos');
  const afterFrutas = await measurePage(mobile);
  ok(afterFrutas.produtosInView === true,
    '390 homepage: leftover Ver todas as frutas click should scroll leftover catálogo into leftover view');
  ok(afterFrutas.tabFrutasActive === true && afterFrutas.tabLegumesActive === false,
    '390 homepage: leftover Ver todas as frutas click should keep leftover Frutas tab leftover active');
  assertShopLink('390 after Ver todas as frutas', afterFrutas);
  ok(afterFrutas.menuOpen === false, '390 homepage: leftover Ver todas as frutas should keep leftover mobile-menu closed');
  ok(afterFrutas.waHref === 'https://wa.me/351932699850' && afterFrutas.barWaHref === 'https://wa.me/351932699850',
    '390 homepage: leftover WhatsApp stays after leftover Ver todas as frutas');
  ok(afterFrutas.cartCount === '0' || afterFrutas.cartCount === '',
    `390 homepage: leftover Ver todas as frutas should not add leftover cabaz (got "${afterFrutas.cartCount}")`);

  const clickLegumes = await clickShopLink(mobile, 'Ver todos os legumes →');
  ok(clickLegumes.ok && clickLegumes.type === 'button',
    `390 homepage: leftover Ver todos os legumes click stays leftover type=button (got "${clickLegumes.type}")`);
  ok(clickLegumes.text === 'Ver todos os legumes →',
    `390 homepage: leftover Ver todos os legumes click keeps leftover copy (got "${clickLegumes.text}")`);
  await waitInView(mobile, 'produtos');
  const afterLegumes = await measurePage(mobile);
  ok(afterLegumes.produtosInView === true,
    '390 homepage: leftover Ver todos os legumes click should scroll leftover catálogo into leftover view');
  ok(afterLegumes.tabLegumesActive === true && afterLegumes.tabFrutasActive === false,
    '390 homepage: leftover Ver todos os legumes click should mark leftover Legumes tab leftover active');
  assertShopLink('390 after Ver todos os legumes', afterLegumes);
  ok(afterLegumes.menuOpen === false, '390 homepage: leftover Ver todos os legumes should keep leftover mobile-menu closed');
  ok(afterLegumes.waHref === 'https://wa.me/351932699850' && afterLegumes.barWaHref === 'https://wa.me/351932699850',
    '390 homepage: leftover WhatsApp stays after leftover Ver todos os legumes');
  ok(afterLegumes.cartCount === '0' || afterLegumes.cartCount === '',
    `390 homepage: leftover Ver todos os legumes should not add leftover cabaz (got "${afterLegumes.cartCount}")`);

  const clickEpoca = await clickShopLink(mobile, 'Explorar fruta →');
  ok(clickEpoca.ok && clickEpoca.type === 'button',
    `390 homepage: leftover Explorar fruta click stays leftover type=button (got "${clickEpoca.type}")`);
  await waitInView(mobile, 'produtos');
  const afterEpoca = await measurePage(mobile);
  ok(afterEpoca.produtosInView === true && afterEpoca.tabFrutasActive === true,
    '390 homepage: leftover Explorar fruta click should open leftover Frutas catálogo');
  assertShopLink('390 after Explorar fruta', afterEpoca);

  await addMelancia(mobile, '390 after shop-link');
  const afterAdd = await measurePage(mobile);
  ok(afterAdd.shopLinkTypes.every(t => t === 'button') && afterAdd.catQuickTypes.every(t => t === ''),
    '390 homepage: leftover shop-link stays leftover type=button after leftover Melancia 1/4 add');
  ok(afterAdd.cartCount === '1',
    `390 homepage: leftover Melancia 1/4 stays in leftover cart (got "${afterAdd.cartCount}")`);
  const clickAfterAdd = await clickShopLink(mobile, 'Ver catálogo completo →');
  ok(clickAfterAdd.ok && clickAfterAdd.type === 'button',
    '390 homepage: leftover Ver catálogo completo click after leftover add stays leftover type=button');
  await waitInView(mobile, 'produtos');
  const afterAddClick = await measurePage(mobile);
  ok(afterAddClick.produtosInView === true && afterAddClick.shopLinkTypes.every(t => t === 'button'),
    '390 homepage: leftover Ver catálogo completo click after leftover add still opens leftover catálogo');
  ok(afterAddClick.cartCount === '1',
    `390 homepage: leftover Ver catálogo completo should keep leftover Melancia 1/4 in leftover cart (got "${afterAddClick.cartCount}")`);
  ok(afterAddClick.waHref === 'https://wa.me/351932699850',
    `390 homepage: leftover privacy WhatsApp stays after leftover add click (got "${afterAddClick.waHref}")`);

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
      hasBar: !!document.querySelector('.hamburger, #mobile-menu, [aria-label="Menu"], .mobile-close, .mb-item, #mobile-bar, #float-legumes, .float-legumes, #scroll-top, .scroll-top, .cat-quick-btn, .shop-link'),
    };
  });
  ok(cat.nav.join('|') === 'Início|Frutas|Legumes|Promoções',
    `390 Frutas: wrapping nav stays leftover Início / Frutas / Legumes / Promoções (got ${cat.nav.join(' / ')})`);
  ok(/MUNDIFRUTA/i.test(cat.footerText), `390 Frutas: leftover catalog footer stays (got "${cat.footerText}")`);
  ok(cat.footerHeight < 40, `390 Frutas: should not redo leftover catalog footer 44px tap (got ${cat.footerHeight})`);
  ok(cat.verText === 'Ver produto', `390 Frutas: leftover Ver produto copy (got "${cat.verText}")`);
  ok(!cat.hasBar, '390 Frutas: should not add a leftover SEO-page hamburger / leftover mobile-close / leftover 4-item bar / leftover float-legumes / leftover scroll-top / leftover cat-quick-btn / leftover shop-link');

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
      hasFloat: !!document.querySelector('#float-legumes, .float-legumes, #scroll-top, .scroll-top, .cat-quick-btn, .shop-link'),
    };
  });
  ok(prod.orderText === 'Ver no catálogo e encomendar',
    `390 Melancia: leftover Ver no catálogo e encomendar stays (got "${prod.orderText}")`);
  ok(prod.orderHref === '/?produto=melancia-1-4#produtos',
    `390 Melancia: leftover catalog href stays (got "${prod.orderHref}")`);
  ok(prod.orderWidth < 360, `390 Melancia: should not redo leftover full-width order CTA (got ${prod.orderWidth})`);
  ok(!prod.hasFloat, '390 Melancia: should not invent leftover catalog float-legumes / leftover scroll-top / leftover cat-quick-btn / leftover shop-link');

  const desktop = await browser.newPage();
  desktop.on('pageerror', err => errors.push('1280 pageerror: ' + err.message));
  await openReady(desktop, 1280, 800);
  const wide = await measurePage(desktop);
  assertShopLink('1280 homepage', wide);
  ok(wide.hamburgerType === '',
    `1280 homepage: should not invent leftover type=button on leftover hamburger (got "${wide.hamburgerType}")`);
  ok(wide.hamburgerLabel === 'Menu',
    `1280 homepage: leftover hamburger stays leftover Menu (got "${wide.hamburgerLabel}")`);
  ok(wide.hamburgerDisplay === 'none',
    `1280 homepage: leftover hamburger should stay leftover hidden on leftover desktop (got "${wide.hamburgerDisplay}")`);
  ok(wide.hamburgerExpanded == null,
    `1280 homepage: should not redo leftover hamburger aria-expanded (PR #70) (got "${wide.hamburgerExpanded}")`);
  ok(wide.menuOpen === false, '1280 homepage: leftover mobile-menu should stay closed');
  ok(wide.navOrderType === '' && wide.mobileCloseType === '' && wide.searchClearType === '',
    '1280 homepage: leftover Encomendar / leftover mobile-close / leftover search-clear stay without leftover type=button');
  ok(wide.floatCartType === '' && wide.mbCartType === '' && wide.floatLegumesType === '' && wide.scrollTopType === '',
    '1280 homepage: leftover float-cart / leftover Carrinho / leftover float-legumes / leftover scroll-top stay without leftover type=button');
  ok(wide.cabazCloseType === '' && wide.cabazAddType === '' && wide.verType === '',
    '1280 homepage: leftover cabaz-modal close / leftover cabaz-modal add / leftover cabaz-ver stay without leftover type=button');
  ok(wide.orderWaType === 'submit',
    `1280 homepage: leftover order WhatsApp stays leftover type=submit (got "${wide.orderWaType}")`);
  ok(wide.hero.some(t => /Ver Produtos/i.test(t)), '1280 homepage: leftover Ver Produtos stays');
  ok(wide.hero.some(t => /Encomendar por WhatsApp/i.test(t)), '1280 homepage: leftover Encomendar por WhatsApp stays');
  ok(wide.waHref === 'https://wa.me/351932699850',
    `1280 homepage: leftover privacy WhatsApp stays wa.me/351932699850 (got "${wide.waHref}")`);
  ok(wide.cartCount === '0' || wide.cartCount === '',
    `1280 homepage: leftover shop-link should not add leftover cabaz to leftover cart (got "${wide.cartCount}")`);
  ok(wide.tabLegumesActive === false,
    '1280 homepage: leftover legumes tab should start leftover inactive');
  ok(wide.encomendaTitle === 'Encomendar Online',
    `1280 homepage: leftover Encomendar Online stays (got "${wide.encomendaTitle}")`);

  const deskClick = await clickShopLink(desktop, 'Ver catálogo completo →');
  ok(deskClick.ok && deskClick.type === 'button',
    `1280 homepage: leftover Ver catálogo completo click stays leftover type=button (got "${deskClick.type}")`);
  await waitInView(desktop, 'produtos');
  const deskAfter = await measurePage(desktop);
  ok(deskAfter.produtosInView === true,
    '1280 homepage: leftover Ver catálogo completo click should scroll leftover catálogo into leftover view');
  ok(deskAfter.tabFrutasActive === true,
    '1280 homepage: leftover Ver catálogo completo click should keep leftover Frutas tab leftover active');
  assertShopLink('1280 after Ver catálogo completo', deskAfter);
  ok(deskAfter.hamburgerType === '' && deskAfter.navOrderType === '' && deskAfter.mobileCloseType === '' && deskAfter.searchClearType === '',
    '1280 homepage: leftover hamburger / leftover Encomendar / leftover mobile-close / leftover search-clear stay without leftover type=button after leftover Ver catálogo completo');
  ok(deskAfter.floatCartType === '' && deskAfter.mbCartType === '' && deskAfter.floatLegumesType === '' && deskAfter.scrollTopType === '',
    '1280 homepage: leftover float-cart / leftover Carrinho / leftover float-legumes / leftover scroll-top stay without leftover type=button after leftover Ver catálogo completo');
  ok(deskAfter.waHref === 'https://wa.me/351932699850',
    `1280 homepage: leftover privacy WhatsApp stays after leftover Ver catálogo completo (got "${deskAfter.waHref}")`);
  ok(deskAfter.cartCount === '0' || deskAfter.cartCount === '',
    `1280 homepage: leftover Ver catálogo completo should not add leftover cabaz after click (got "${deskAfter.cartCount}")`);
  ok(deskAfter.catalogCount > 0,
    `1280 homepage: leftover Ver catálogo completo should keep leftover catalog cards (got ${deskAfter.catalogCount})`);
  ok(deskAfter.orderWaType === 'submit',
    `1280 homepage: leftover order WhatsApp stays leftover type=submit after leftover Ver catálogo completo (got "${deskAfter.orderWaType}")`);

  const deskLegumes = await clickShopLink(desktop, 'Ver todos os legumes →');
  ok(deskLegumes.ok && deskLegumes.type === 'button',
    `1280 homepage: leftover Ver todos os legumes click stays leftover type=button (got "${deskLegumes.type}")`);
  await waitInView(desktop, 'produtos');
  const deskAfterLegumes = await measurePage(desktop);
  ok(deskAfterLegumes.produtosInView === true && deskAfterLegumes.tabLegumesActive === true,
    '1280 homepage: leftover Ver todos os legumes click should open leftover Legumes catálogo');
  assertShopLink('1280 after Ver todos os legumes', deskAfterLegumes);

  await addMelancia(desktop, '1280 after shop-link');
  const deskAddClick = await clickShopLink(desktop, 'Ver catálogo completo →');
  ok(deskAddClick.ok && deskAddClick.type === 'button',
    '1280 homepage: leftover Ver catálogo completo click after leftover add stays leftover type=button');
  await waitInView(desktop, 'produtos');
  const deskAfterAdd = await measurePage(desktop);
  ok(deskAfterAdd.produtosInView === true && deskAfterAdd.shopLinkTypes.every(t => t === 'button'),
    '1280 homepage: leftover Ver catálogo completo click after leftover add still opens leftover catálogo');
  ok(deskAfterAdd.cartCount === '1',
    `1280 homepage: leftover Ver catálogo completo should keep leftover Melancia 1/4 in leftover cart (got "${deskAfterAdd.cartCount}")`);

  await browser.close();
  server.close();
  if (errors.length) {
    console.error('check-shop-link-type-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
    process.exit(1);
  }
  console.log('check-shop-link-type-browser: ok');
} catch (err) {
  try { await browser.close(); } catch {}
  try { server.close(); } catch {}
  console.error(err);
  process.exit(1);
}
