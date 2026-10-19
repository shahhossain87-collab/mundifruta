#!/usr/bin/env node
/** Chrome: leftover cat-quick-btn is type=button. */
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
      catQuickOnclicks: catQuick.map(btn => btn.getAttribute('onclick') || ''),
      catQuickMinHeights: catQuick.map(btn => getComputedStyle(btn).minHeight),
      shopLinkTypes: shopLinks.map(btn => btn.getAttribute('type') || ''),
      shopLinkTexts: shopLinks.map(btn => (btn.textContent || '').replace(/\s+/g, ' ').trim()),
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

async function clickCatQuick(page, needle) {
  return page.evaluate((onclickNeedle) => {
    const btn = [...document.querySelectorAll('.cat-quick-btn')]
      .find(el => (el.getAttribute('onclick') || '').includes(onclickNeedle));
    if (!btn) return { ok: false };
    btn.click();
    return {
      ok: true,
      type: btn.getAttribute('type') || '',
      text: (btn.querySelector('.cq-label')?.textContent || '').replace(/\s+/g, ' ').trim(),
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

function assertCatQuick(prefix, shot) {
  ok(shot.catQuickCount === 7,
    `${prefix}: leftover cat-quick-btn should stay leftover 7 tiles (got ${shot.catQuickCount})`);
  ok(shot.catQuickTags.every(t => t === 'BUTTON') && shot.catQuickTypes.every(t => t === 'button'),
    `${prefix}: leftover cat-quick-btn should be leftover type=button (got ${shot.catQuickTypes.join('/')})`);
  ok(shot.catQuickLabels.some(t => /^Frutas/.test(t)),
    `${prefix}: leftover Frutas stays (got ${shot.catQuickLabels.join(' / ')})`);
  ok(shot.catQuickLabels.some(t => /^Legumes/.test(t)),
    `${prefix}: leftover Legumes stays (got ${shot.catQuickLabels.join(' / ')})`);
  ok(shot.catQuickLabels.some(t => /^Cabazes/.test(t)),
    `${prefix}: leftover Cabazes stays`);
  ok(shot.catQuickLabels.some(t => /^Promoções/.test(t)),
    `${prefix}: leftover Promoções stays`);
  ok(shot.catQuickLabels.some(t => /^Ervas frescas/.test(t)),
    `${prefix}: leftover Ervas frescas stays`);
  ok(shot.catQuickLabels.some(t => /^Fruta da Época/.test(t)),
    `${prefix}: leftover Fruta da Época stays`);
  ok(shot.catQuickLabels.some(t => /^Carrinho/.test(t)),
    `${prefix}: leftover Carrinho stays`);
  ok(shot.catQuickOnclicks.includes("abrirCatalogo('frutas')") &&
    shot.catQuickOnclicks.includes("abrirCatalogo('legumes')") &&
    shot.catQuickOnclicks.includes('abrirCabazes()') &&
    shot.catQuickOnclicks.includes("abrirCatalogo('promocoes')") &&
    shot.catQuickOnclicks.includes("abrirCatalogo('ervas')") &&
    shot.catQuickOnclicks.includes("abrirCatalogo('epoca')") &&
    shot.catQuickOnclicks.some(v => v.includes("getElementById('encomenda')")),
    `${prefix}: leftover cat-quick-btn onclicks stay leftover`);
  ok(shot.catQuickMinHeights.every(h => h !== '44px'),
    `${prefix}: leftover cat-quick-btn should not invent leftover min-height 44px (got ${shot.catQuickMinHeights.join('/')})`);
  ok(shot.shopLinkTypes.every(t => t === ''),
    `${prefix}: leftover shop-link stays without leftover type=button (got ${shot.shopLinkTypes.join('/')})`);
}

try {
  const mobile = await browser.newPage();
  mobile.on('pageerror', err => errors.push('390 pageerror: ' + err.message));
  await openReady(mobile, 390, 844);
  const phone = await measurePage(mobile);
  assertCatQuick('390 homepage', phone);
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
    `390 homepage: leftover cat-quick-btn should not add leftover cabaz to leftover cart (got "${phone.cartCount}")`);
  ok(phone.tabFrutasActive === true,
    '390 homepage: leftover catalog should start leftover Frutas');
  ok(phone.tabLegumesActive === false,
    '390 homepage: leftover legumes tab should start leftover inactive');
  ok(phone.encomendaTitle === 'Encomendar Online',
    `390 homepage: leftover Encomendar Online stays (got "${phone.encomendaTitle}")`);
  ok(phone.catalogCount > 0,
    `390 homepage: leftover catalog cards stay (got ${phone.catalogCount})`);
  ok(phone.shopLinkTexts.includes('Ver catálogo completo →') &&
    phone.shopLinkTexts.includes('Ver todas as frutas →') &&
    phone.shopLinkTexts.includes('Explorar fruta →') &&
    phone.shopLinkTexts.includes('Ver todos os legumes →'),
    `390 homepage: leftover shop-link copy stays (got ${phone.shopLinkTexts.join(' / ')})`);

  const clickFrutas = await clickCatQuick(mobile, "abrirCatalogo('frutas')");
  ok(clickFrutas.ok && clickFrutas.type === 'button',
    `390 homepage: leftover Frutas click stays leftover type=button (got "${clickFrutas.type}")`);
  ok(/^Frutas/.test(clickFrutas.text),
    `390 homepage: leftover Frutas click keeps leftover Frutas (got "${clickFrutas.text}")`);
  await waitInView(mobile, 'produtos');
  const afterFrutas = await measurePage(mobile);
  ok(afterFrutas.produtosInView === true,
    '390 homepage: leftover Frutas click should scroll leftover catálogo into leftover view');
  ok(afterFrutas.tabFrutasActive === true && afterFrutas.tabLegumesActive === false,
    '390 homepage: leftover Frutas click should keep leftover Frutas tab leftover active');
  assertCatQuick('390 after Frutas', afterFrutas);
  ok(afterFrutas.hamburgerType === '' && afterFrutas.navOrderType === '' && afterFrutas.mobileCloseType === '' && afterFrutas.searchClearType === '',
    '390 homepage: leftover hamburger / leftover Encomendar / leftover mobile-close / leftover search-clear stay without leftover type=button after leftover Frutas');
  ok(afterFrutas.floatCartType === '' && afterFrutas.mbCartType === '' && afterFrutas.floatLegumesType === '' && afterFrutas.scrollTopType === '',
    '390 homepage: leftover float-cart / leftover Carrinho / leftover float-legumes / leftover scroll-top stay without leftover type=button after leftover Frutas');
  ok(afterFrutas.cabazAddType === '' && afterFrutas.cabazCloseType === '' && afterFrutas.verType === '',
    '390 homepage: leftover cabaz-modal add / leftover cabaz-modal close / leftover cabaz-ver stay without leftover type=button after leftover Frutas');
  ok(afterFrutas.waHref === 'https://wa.me/351932699850',
    `390 homepage: leftover privacy WhatsApp stays after leftover Frutas (got "${afterFrutas.waHref}")`);
  ok(afterFrutas.barWaHref === 'https://wa.me/351932699850',
    `390 homepage: leftover bar WhatsApp stays after leftover Frutas (got "${afterFrutas.barWaHref}")`);
  ok(afterFrutas.cartCount === '0' || afterFrutas.cartCount === '',
    `390 homepage: leftover Frutas should not add leftover cabaz after click (got "${afterFrutas.cartCount}")`);
  ok(afterFrutas.orderWaType === 'submit',
    `390 homepage: leftover order WhatsApp stays leftover type=submit after leftover Frutas (got "${afterFrutas.orderWaType}")`);
  ok(afterFrutas.menuOpen === false, '390 homepage: leftover Frutas should keep leftover mobile-menu closed');
  ok(afterFrutas.catalogCount > 0,
    `390 homepage: leftover Frutas should keep leftover catalog cards (got ${afterFrutas.catalogCount})`);
  ok(afterFrutas.overflow === '',
    `390 homepage: leftover Frutas should not invent leftover overflow lock (got "${afterFrutas.overflow}")`);
  ok(afterFrutas.skipText === 'Continuar sem adicionar',
    `390 homepage: leftover Continuar sem adicionar stays after leftover Frutas (got "${afterFrutas.skipText}")`);

  const clickCarrinho = await clickCatQuick(mobile, "getElementById('encomenda')");
  ok(clickCarrinho.ok && clickCarrinho.type === 'button',
    `390 homepage: leftover Carrinho click stays leftover type=button (got "${clickCarrinho.type}")`);
  ok(/^Carrinho/.test(clickCarrinho.text),
    `390 homepage: leftover Carrinho click keeps leftover Carrinho (got "${clickCarrinho.text}")`);
  await waitInView(mobile, 'encomenda');
  const afterCart = await measurePage(mobile);
  ok(afterCart.encomendaInView === true,
    '390 homepage: leftover Carrinho click should scroll leftover Encomendar Online into leftover view');
  ok(afterCart.encomendaTitle === 'Encomendar Online',
    `390 homepage: leftover Encomendar Online stays after leftover Carrinho (got "${afterCart.encomendaTitle}")`);
  assertCatQuick('390 after Carrinho', afterCart);
  ok(afterCart.menuOpen === false, '390 homepage: leftover Carrinho should keep leftover mobile-menu closed');
  ok(afterCart.waHref === 'https://wa.me/351932699850' && afterCart.barWaHref === 'https://wa.me/351932699850',
    '390 homepage: leftover WhatsApp stays after leftover Carrinho');
  ok(afterCart.cartCount === '0' || afterCart.cartCount === '',
    `390 homepage: leftover Carrinho should not add leftover cabaz (got "${afterCart.cartCount}")`);

  await addMelancia(mobile, '390 after cat-quick-btn');
  const afterAdd = await measurePage(mobile);
  ok(afterAdd.catQuickTypes.every(t => t === 'button') && afterAdd.shopLinkTypes.every(t => t === ''),
    '390 homepage: leftover cat-quick-btn stays leftover type=button after leftover Melancia 1/4 add');
  ok(afterAdd.cartCount === '1',
    `390 homepage: leftover Melancia 1/4 stays in leftover cart (got "${afterAdd.cartCount}")`);
  const clickAfterAdd = await clickCatQuick(mobile, "abrirCatalogo('frutas')");
  ok(clickAfterAdd.ok && clickAfterAdd.type === 'button',
    '390 homepage: leftover Frutas click after leftover add stays leftover type=button');
  await waitInView(mobile, 'produtos');
  const afterAddClick = await measurePage(mobile);
  ok(afterAddClick.produtosInView === true && afterAddClick.catQuickTypes.every(t => t === 'button'),
    '390 homepage: leftover Frutas click after leftover add still opens leftover catálogo');
  ok(afterAddClick.cartCount === '1',
    `390 homepage: leftover Frutas should keep leftover Melancia 1/4 in leftover cart (got "${afterAddClick.cartCount}")`);
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
      hasBar: !!document.querySelector('.hamburger, #mobile-menu, [aria-label="Menu"], .mobile-close, .mb-item, #mobile-bar, #float-legumes, .float-legumes, #scroll-top, .scroll-top, .cat-quick-btn'),
    };
  });
  ok(cat.nav.join('|') === 'Início|Frutas|Legumes|Promoções',
    `390 Frutas: wrapping nav stays leftover Início / Frutas / Legumes / Promoções (got ${cat.nav.join(' / ')})`);
  ok(/MUNDIFRUTA/i.test(cat.footerText), `390 Frutas: leftover catalog footer stays (got "${cat.footerText}")`);
  ok(cat.footerHeight < 40, `390 Frutas: should not redo leftover catalog footer 44px tap (got ${cat.footerHeight})`);
  ok(cat.verText === 'Ver produto', `390 Frutas: leftover Ver produto copy (got "${cat.verText}")`);
  ok(!cat.hasBar, '390 Frutas: should not add a leftover SEO-page hamburger / leftover mobile-close / leftover 4-item bar / leftover float-legumes / leftover scroll-top / leftover cat-quick-btn');

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
      hasFloat: !!document.querySelector('#float-legumes, .float-legumes, #scroll-top, .scroll-top, .cat-quick-btn'),
    };
  });
  ok(prod.orderText === 'Ver no catálogo e encomendar',
    `390 Melancia: leftover Ver no catálogo e encomendar stays (got "${prod.orderText}")`);
  ok(prod.orderHref === '/?produto=melancia-1-4#produtos',
    `390 Melancia: leftover catalog href stays (got "${prod.orderHref}")`);
  ok(prod.orderWidth < 360, `390 Melancia: should not redo leftover full-width order CTA (got ${prod.orderWidth})`);
  ok(!prod.hasFloat, '390 Melancia: should not invent leftover catalog float-legumes / leftover scroll-top / leftover cat-quick-btn');

  const desktop = await browser.newPage();
  desktop.on('pageerror', err => errors.push('1280 pageerror: ' + err.message));
  await openReady(desktop, 1280, 800);
  const wide = await measurePage(desktop);
  assertCatQuick('1280 homepage', wide);
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
    `1280 homepage: leftover cat-quick-btn should not add leftover cabaz to leftover cart (got "${wide.cartCount}")`);
  ok(wide.tabLegumesActive === false,
    '1280 homepage: leftover legumes tab should start leftover inactive');
  ok(wide.encomendaTitle === 'Encomendar Online',
    `1280 homepage: leftover Encomendar Online stays (got "${wide.encomendaTitle}")`);

  const deskClick = await clickCatQuick(desktop, "abrirCatalogo('frutas')");
  ok(deskClick.ok && deskClick.type === 'button',
    `1280 homepage: leftover Frutas click stays leftover type=button (got "${deskClick.type}")`);
  await waitInView(desktop, 'produtos');
  const deskAfter = await measurePage(desktop);
  ok(deskAfter.produtosInView === true,
    '1280 homepage: leftover Frutas click should scroll leftover catálogo into leftover view');
  ok(deskAfter.tabFrutasActive === true,
    '1280 homepage: leftover Frutas click should keep leftover Frutas tab leftover active');
  assertCatQuick('1280 after Frutas', deskAfter);
  ok(deskAfter.hamburgerType === '' && deskAfter.navOrderType === '' && deskAfter.mobileCloseType === '' && deskAfter.searchClearType === '',
    '1280 homepage: leftover hamburger / leftover Encomendar / leftover mobile-close / leftover search-clear stay without leftover type=button after leftover Frutas');
  ok(deskAfter.floatCartType === '' && deskAfter.mbCartType === '' && deskAfter.floatLegumesType === '' && deskAfter.scrollTopType === '',
    '1280 homepage: leftover float-cart / leftover Carrinho / leftover float-legumes / leftover scroll-top stay without leftover type=button after leftover Frutas');
  ok(deskAfter.waHref === 'https://wa.me/351932699850',
    `1280 homepage: leftover privacy WhatsApp stays after leftover Frutas (got "${deskAfter.waHref}")`);
  ok(deskAfter.cartCount === '0' || deskAfter.cartCount === '',
    `1280 homepage: leftover Frutas should not add leftover cabaz after click (got "${deskAfter.cartCount}")`);
  ok(deskAfter.catalogCount > 0,
    `1280 homepage: leftover Frutas should keep leftover catalog cards (got ${deskAfter.catalogCount})`);
  ok(deskAfter.orderWaType === 'submit',
    `1280 homepage: leftover order WhatsApp stays leftover type=submit after leftover Frutas (got "${deskAfter.orderWaType}")`);

  await addMelancia(desktop, '1280 after cat-quick-btn');
  const deskAddClick = await clickCatQuick(desktop, "abrirCatalogo('frutas')");
  ok(deskAddClick.ok && deskAddClick.type === 'button',
    '1280 homepage: leftover Frutas click after leftover add stays leftover type=button');
  await waitInView(desktop, 'produtos');
  const deskAfterAdd = await measurePage(desktop);
  ok(deskAfterAdd.produtosInView === true && deskAfterAdd.catQuickTypes.every(t => t === 'button'),
    '1280 homepage: leftover Frutas click after leftover add still opens leftover catálogo');
  ok(deskAfterAdd.cartCount === '1',
    `1280 homepage: leftover Frutas should keep leftover Melancia 1/4 in leftover cart (got "${deskAfterAdd.cartCount}")`);

  await browser.close();
  server.close();
  if (errors.length) {
    console.error('check-cat-quick-btn-type-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
    process.exit(1);
  }
  console.log('check-cat-quick-btn-type-browser: ok');
} catch (err) {
  try { await browser.close(); } catch {}
  try { server.close(); } catch {}
  console.error(err);
  process.exit(1);
}
