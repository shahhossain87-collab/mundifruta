#!/usr/bin/env node
/** Chrome: leftover scroll-top is type=button. */
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
    const catQuick = document.querySelector('.cat-quick-btn');
    const shopLink = document.querySelector('.shop-link');
    const privacyWa = document.querySelector('.privacy-box a[href^="https://wa.me/"]');
    const barWa = document.querySelector('.mb-item[href^="https://wa.me/"]');
    const ver = [...document.querySelectorAll('.cabaz-ver')]
      .find(btn => /Detox/i.test(btn.closest('.product-card')?.textContent || ''));
    const enc = document.getElementById('encomenda');
    const encBox = enc ? enc.getBoundingClientRect() : { top: 0, bottom: 0 };
    const produtos = document.getElementById('produtos');
    const produtosBox = produtos ? produtos.getBoundingClientRect() : { top: 0, bottom: 0 };
    const tabFrutas = document.getElementById('tab-frutas');
    const tabLegumes = document.getElementById('tab-legumes');
    const legumesStyle = floatLegumes ? getComputedStyle(floatLegumes) : null;
    const box = floatLegumes ? floatLegumes.getBoundingClientRect() : { width: 0, height: 0 };
    const scrollStyle = scrollTop ? getComputedStyle(scrollTop) : null;
    const scrollBox = scrollTop ? scrollTop.getBoundingClientRect() : { width: 0, height: 0 };
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
      floatLegumesTag: floatLegumes?.tagName || '',
      floatLegumesType: floatLegumes?.getAttribute('type') || '',
      floatLegumesText: (floatLegumes?.textContent || '').replace(/\s+/g, ' ').trim(),
      floatLegumesTitle: floatLegumes?.getAttribute('title') || '',
      floatLegumesHidden: floatLegumes?.hidden === true,
      floatLegumesDisplay: legumesStyle?.display || '',
      floatLegumesMinHeight: legumesStyle?.minHeight || '',
      floatLegumesHeight: box.height,
      floatLegumesWidth: box.width,
      scrollTopTag: scrollTop?.tagName || '',
      scrollTopType: scrollTop?.getAttribute('type') || '',
      scrollTopText: (scrollTop?.textContent || '').replace(/\s+/g, ' ').trim(),
      scrollTopTitle: scrollTop?.getAttribute('title') || '',
      scrollTopHasVisible: scrollTop?.classList.contains('visible') === true,
      scrollTopPointerEvents: scrollStyle?.pointerEvents || '',
      scrollTopOpacity: scrollStyle?.opacity || '',
      scrollTopWidth: scrollBox.width,
      scrollTopHeight: scrollBox.height,
      scrollTopMinHeight: scrollStyle?.minHeight || '',
      scrollTopBottom: scrollStyle?.bottom || '',
      scrollY: window.scrollY,
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
      produtosInView: produtosBox.top < window.innerHeight && produtosBox.bottom > 80,
      tabFrutasActive: tabFrutas?.classList.contains('active') === true,
      tabLegumesActive: tabLegumes?.classList.contains('active') === true,
      tabLegumesSelected: tabLegumes?.getAttribute('aria-selected') || '',
    };
  });
}

async function revealScrollTop(page) {
  await page.evaluate(() => { window.scrollTo(0, 900); });
  await page.waitForFunction(() => {
    const btn = document.getElementById('scroll-top');
    return btn && btn.classList.contains('visible') && window.scrollY > 400;
  }, { timeout: 8000 });
}

async function clickScrollTop(page) {
  return page.evaluate(() => {
    const btn = document.getElementById('scroll-top');
    if (!btn) return { ok: false };
    btn.click();
    return {
      ok: true,
      type: btn.getAttribute('type') || '',
      text: (btn.textContent || '').replace(/\s+/g, ' ').trim(),
      title: btn.getAttribute('title') || '',
    };
  });
}

async function waitForTop(page) {
  await page.waitForFunction(() => window.scrollY < 16, { timeout: 8000 });
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

try {
  const mobile = await browser.newPage();
  mobile.on('pageerror', err => errors.push('390 pageerror: ' + err.message));
  await openReady(mobile, 390, 844);
  const phone = await measurePage(mobile);
  ok(phone.scrollTopTag === 'BUTTON' && phone.scrollTopType === 'button',
    `390 homepage: leftover scroll-top should be leftover type=button (got "${phone.scrollTopTag}" / "${phone.scrollTopType}")`);
  ok(phone.scrollTopText === '▲',
    `390 homepage: leftover scroll-top stays leftover ▲ (got "${phone.scrollTopText}")`);
  ok(phone.scrollTopTitle === 'Voltar ao topo',
    `390 homepage: leftover scroll-top stays leftover Voltar ao topo (got "${phone.scrollTopTitle}")`);
  ok(phone.scrollTopHasVisible === false && phone.scrollY < 16,
    `390 homepage: leftover scroll-top should start leftover hidden at leftover top (got "${phone.scrollTopHasVisible}" / ${phone.scrollY})`);
  ok(phone.scrollTopPointerEvents === 'none',
    `390 homepage: leftover scroll-top should start leftover pointer-events none (got "${phone.scrollTopPointerEvents}")`);
  ok(Math.round(phone.scrollTopWidth) === 44 && Math.round(phone.scrollTopHeight) === 44,
    `390 homepage: leftover scroll-top should keep leftover 44×44 (got ${phone.scrollTopWidth}×${phone.scrollTopHeight})`);
  ok(phone.scrollTopMinHeight !== '44px',
    `390 homepage: leftover scroll-top should not invent leftover min-height 44px (got "${phone.scrollTopMinHeight}")`);
  ok(phone.scrollTopBottom === '28px',
    `390 homepage: leftover scroll-top computed leftover bottom stays leftover 28px until leftover cascade slice (got "${phone.scrollTopBottom}")`);
  ok(phone.floatLegumesType === '',
    `390 homepage: leftover float-legumes stays without leftover type=button (PR #310) (got "${phone.floatLegumesType}")`);
  ok(phone.floatLegumesHidden === true && phone.floatLegumesText === 'Legumes',
    `390 homepage: leftover float-legumes stays leftover hidden Legumes (got "${phone.floatLegumesText}")`);
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
  ok(phone.catQuickType === '' && phone.shopLinkType === '',
    '390 homepage: leftover cat-quick-btn / leftover shop-link stay without leftover type=button');
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
    `390 homepage: leftover scroll-top should not add leftover cabaz to leftover cart (got "${phone.cartCount}")`);
  ok(phone.produtosInView === true || phone.tabFrutasActive === true,
    '390 homepage: leftover catalog should start leftover Frutas');
  ok(phone.tabLegumesActive === false,
    '390 homepage: leftover legumes tab should start leftover inactive');
  ok(phone.encomendaTitle === 'Encomendar Online',
    `390 homepage: leftover Encomendar Online stays (got "${phone.encomendaTitle}")`);
  ok(phone.catalogCount > 0,
    `390 homepage: leftover catalog cards stay (got ${phone.catalogCount})`);

  await revealScrollTop(mobile);
  const revealed = await measurePage(mobile);
  ok(revealed.scrollTopType === 'button' && revealed.scrollTopHasVisible === true && revealed.scrollY > 400,
    `390 homepage: leftover scroll-top should become leftover visible after leftover scroll (got "${revealed.scrollTopType}" / "${revealed.scrollTopHasVisible}" / ${revealed.scrollY})`);
  ok(revealed.scrollTopPointerEvents === 'all' || revealed.scrollTopPointerEvents === 'auto',
    `390 homepage: leftover scroll-top should become leftover clickable after leftover scroll (got "${revealed.scrollTopPointerEvents}")`);
  const click = await clickScrollTop(mobile);
  ok(click.ok && click.type === 'button',
    `390 homepage: leftover scroll-top click stays leftover type=button (got "${click.type}")`);
  ok(click.text === '▲' && click.title === 'Voltar ao topo',
    `390 homepage: leftover scroll-top click keeps leftover ▲ / leftover Voltar ao topo`);
  await waitForTop(mobile);
  const afterClick = await measurePage(mobile);
  ok(afterClick.scrollY < 16,
    `390 homepage: leftover scroll-top click should scroll leftover page to leftover topo (got ${afterClick.scrollY})`);
  ok(afterClick.scrollTopType === 'button',
    `390 homepage: leftover scroll-top stays leftover type=button after click (got "${afterClick.scrollTopType}")`);
  ok(afterClick.scrollTopHasVisible === false,
    '390 homepage: leftover scroll-top should hide leftover after leftover topo');
  ok(afterClick.scrollTopText === '▲' && afterClick.scrollTopTitle === 'Voltar ao topo',
    `390 homepage: leftover scroll-top stays leftover ▲ / leftover Voltar ao topo after click`);
  ok(afterClick.hamburgerType === '' && afterClick.navOrderType === '' && afterClick.mobileCloseType === '' && afterClick.searchClearType === '',
    '390 homepage: leftover hamburger / leftover Encomendar / leftover mobile-close / leftover search-clear stay without leftover type=button after click');
  ok(afterClick.floatCartType === '' && afterClick.mbCartType === '' && afterClick.floatLegumesType === '',
    '390 homepage: leftover float-cart / leftover Carrinho / leftover float-legumes stay without leftover type=button after click');
  ok(afterClick.cabazAddType === '' && afterClick.cabazCloseType === '' && afterClick.verType === '',
    '390 homepage: leftover cabaz-modal add / leftover cabaz-modal close / leftover cabaz-ver stay without leftover type=button after click');
  ok(afterClick.waHref === 'https://wa.me/351932699850',
    `390 homepage: leftover privacy WhatsApp stays after click (got "${afterClick.waHref}")`);
  ok(afterClick.barWaHref === 'https://wa.me/351932699850',
    `390 homepage: leftover bar WhatsApp stays after click (got "${afterClick.barWaHref}")`);
  ok(afterClick.cartCount === '0' || afterClick.cartCount === '',
    `390 homepage: leftover scroll-top should not add leftover cabaz after click (got "${afterClick.cartCount}")`);
  ok(afterClick.orderWaType === 'submit',
    `390 homepage: leftover order WhatsApp stays leftover type=submit after click (got "${afterClick.orderWaType}")`);
  ok(afterClick.menuOpen === false, '390 homepage: leftover scroll-top should keep leftover mobile-menu closed');
  ok(afterClick.catalogCount > 0,
    `390 homepage: leftover scroll-top should keep leftover catalog cards (got ${afterClick.catalogCount})`);
  ok(afterClick.overflow === '',
    `390 homepage: leftover scroll-top should not invent leftover overflow lock (got "${afterClick.overflow}")`);
  ok(afterClick.skipText === 'Continuar sem adicionar',
    `390 homepage: leftover Continuar sem adicionar stays after click (got "${afterClick.skipText}")`);

  await addMelancia(mobile, '390 after scroll-top');
  const afterAdd = await measurePage(mobile);
  ok(afterAdd.scrollTopType === 'button' && afterAdd.floatLegumesType === '',
    '390 homepage: leftover scroll-top stays leftover type=button after leftover Melancia 1/4 add');
  ok(afterAdd.cartCount === '1',
    `390 homepage: leftover Melancia 1/4 stays in leftover cart (got "${afterAdd.cartCount}")`);
  await revealScrollTop(mobile);
  const clickAfterAdd = await clickScrollTop(mobile);
  ok(clickAfterAdd.ok && clickAfterAdd.type === 'button',
    '390 homepage: leftover scroll-top click after leftover add stays leftover type=button');
  await waitForTop(mobile);
  const afterAddClick = await measurePage(mobile);
  ok(afterAddClick.scrollY < 16 && afterAddClick.scrollTopType === 'button',
    '390 homepage: leftover scroll-top click after leftover add still scrolls leftover topo');
  ok(afterAddClick.cartCount === '1',
    `390 homepage: leftover scroll-top should keep leftover Melancia 1/4 in leftover cart (got "${afterAddClick.cartCount}")`);
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
      hasBar: !!document.querySelector('.hamburger, #mobile-menu, [aria-label="Menu"], .mobile-close, .mb-item, #mobile-bar, #float-legumes, .float-legumes, #scroll-top, .scroll-top'),
    };
  });
  ok(cat.nav.join('|') === 'Início|Frutas|Legumes|Promoções',
    `390 Frutas: wrapping nav stays leftover Início / Frutas / Legumes / Promoções (got ${cat.nav.join(' / ')})`);
  ok(/MUNDIFRUTA/i.test(cat.footerText), `390 Frutas: leftover catalog footer stays (got "${cat.footerText}")`);
  ok(cat.footerHeight < 40, `390 Frutas: should not redo leftover catalog footer 44px tap (got ${cat.footerHeight})`);
  ok(cat.verText === 'Ver produto', `390 Frutas: leftover Ver produto copy (got "${cat.verText}")`);
  ok(!cat.hasBar, '390 Frutas: should not add a leftover SEO-page hamburger / leftover mobile-close / leftover 4-item bar / leftover float-legumes / leftover scroll-top');

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
      hasFloat: !!document.querySelector('#float-legumes, .float-legumes, #scroll-top, .scroll-top'),
    };
  });
  ok(prod.orderText === 'Ver no catálogo e encomendar',
    `390 Melancia: leftover Ver no catálogo e encomendar stays (got "${prod.orderText}")`);
  ok(prod.orderHref === '/?produto=melancia-1-4#produtos',
    `390 Melancia: leftover catalog href stays (got "${prod.orderHref}")`);
  ok(prod.orderWidth < 360, `390 Melancia: should not redo leftover full-width order CTA (got ${prod.orderWidth})`);
  ok(!prod.hasFloat, '390 Melancia: should not invent leftover catalog float-legumes / leftover scroll-top');

  const desktop = await browser.newPage();
  desktop.on('pageerror', err => errors.push('1280 pageerror: ' + err.message));
  await openReady(desktop, 1280, 800);
  const wide = await measurePage(desktop);
  ok(wide.scrollTopTag === 'BUTTON' && wide.scrollTopType === 'button',
    `1280 homepage: leftover scroll-top should be leftover type=button (got "${wide.scrollTopTag}" / "${wide.scrollTopType}")`);
  ok(wide.scrollTopText === '▲' && wide.scrollTopTitle === 'Voltar ao topo',
    `1280 homepage: leftover scroll-top stays leftover ▲ / leftover Voltar ao topo (got "${wide.scrollTopText}" / "${wide.scrollTopTitle}")`);
  ok(wide.scrollTopHasVisible === false && wide.scrollY < 16,
    `1280 homepage: leftover scroll-top should start leftover hidden at leftover top (got "${wide.scrollTopHasVisible}" / ${wide.scrollY})`);
  ok(Math.round(wide.scrollTopWidth) === 44 && Math.round(wide.scrollTopHeight) === 44,
    `1280 homepage: leftover scroll-top should keep leftover 44×44 (got ${wide.scrollTopWidth}×${wide.scrollTopHeight})`);
  ok(wide.scrollTopBottom === '28px',
    `1280 homepage: leftover scroll-top should keep leftover desktop bottom 28px (got "${wide.scrollTopBottom}")`);
  ok(wide.floatLegumesType === '' && wide.floatLegumesHidden === true,
    `1280 homepage: leftover float-legumes stays leftover hidden without leftover type=button (got "${wide.floatLegumesType}")`);
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
  ok(wide.floatCartType === '' && wide.mbCartType === '' && wide.floatLegumesType === '',
    '1280 homepage: leftover float-cart / leftover Carrinho / leftover float-legumes stay without leftover type=button');
  ok(wide.cabazCloseType === '' && wide.cabazAddType === '' && wide.verType === '',
    '1280 homepage: leftover cabaz-modal close / leftover cabaz-modal add / leftover cabaz-ver stay without leftover type=button');
  ok(wide.orderWaType === 'submit',
    `1280 homepage: leftover order WhatsApp stays leftover type=submit (got "${wide.orderWaType}")`);
  ok(wide.hero.some(t => /Ver Produtos/i.test(t)), '1280 homepage: leftover Ver Produtos stays');
  ok(wide.hero.some(t => /Encomendar por WhatsApp/i.test(t)), '1280 homepage: leftover Encomendar por WhatsApp stays');
  ok(wide.waHref === 'https://wa.me/351932699850',
    `1280 homepage: leftover privacy WhatsApp stays wa.me/351932699850 (got "${wide.waHref}")`);
  ok(wide.cartCount === '0' || wide.cartCount === '',
    `1280 homepage: leftover scroll-top should not add leftover cabaz to leftover cart (got "${wide.cartCount}")`);
  ok(wide.tabLegumesActive === false,
    '1280 homepage: leftover legumes tab should start leftover inactive');
  ok(wide.encomendaTitle === 'Encomendar Online',
    `1280 homepage: leftover Encomendar Online stays (got "${wide.encomendaTitle}")`);

  await revealScrollTop(desktop);
  const deskRevealed = await measurePage(desktop);
  ok(deskRevealed.scrollTopType === 'button' && deskRevealed.scrollTopHasVisible === true && deskRevealed.scrollY > 400,
    `1280 homepage: leftover scroll-top should become leftover visible after leftover scroll (got "${deskRevealed.scrollTopHasVisible}" / ${deskRevealed.scrollY})`);
  const deskClick = await clickScrollTop(desktop);
  ok(deskClick.ok && deskClick.type === 'button',
    `1280 homepage: leftover scroll-top click stays leftover type=button (got "${deskClick.type}")`);
  await waitForTop(desktop);
  const deskAfter = await measurePage(desktop);
  ok(deskAfter.scrollY < 16,
    `1280 homepage: leftover scroll-top click should scroll leftover page to leftover topo (got ${deskAfter.scrollY})`);
  ok(deskAfter.scrollTopType === 'button' && deskAfter.scrollTopHasVisible === false,
    `1280 homepage: leftover scroll-top stays leftover type=button leftover hidden after click (got "${deskAfter.scrollTopType}")`);
  ok(deskAfter.hamburgerType === '' && deskAfter.navOrderType === '' && deskAfter.mobileCloseType === '' && deskAfter.searchClearType === '',
    '1280 homepage: leftover hamburger / leftover Encomendar / leftover mobile-close / leftover search-clear stay without leftover type=button after click');
  ok(deskAfter.floatCartType === '' && deskAfter.mbCartType === '' && deskAfter.floatLegumesType === '',
    '1280 homepage: leftover float-cart / leftover Carrinho / leftover float-legumes stay without leftover type=button after click');
  ok(deskAfter.waHref === 'https://wa.me/351932699850',
    `1280 homepage: leftover privacy WhatsApp stays after click (got "${deskAfter.waHref}")`);
  ok(deskAfter.cartCount === '0' || deskAfter.cartCount === '',
    `1280 homepage: leftover scroll-top should not add leftover cabaz after click (got "${deskAfter.cartCount}")`);
  ok(deskAfter.catalogCount > 0,
    `1280 homepage: leftover scroll-top should keep leftover catalog cards (got ${deskAfter.catalogCount})`);
  ok(deskAfter.orderWaType === 'submit',
    `1280 homepage: leftover order WhatsApp stays leftover type=submit after click (got "${deskAfter.orderWaType}")`);

  await addMelancia(desktop, '1280 after scroll-top');
  await revealScrollTop(desktop);
  const deskAddClick = await clickScrollTop(desktop);
  ok(deskAddClick.ok && deskAddClick.type === 'button',
    '1280 homepage: leftover scroll-top click after leftover add stays leftover type=button');
  await waitForTop(desktop);
  const deskAfterAdd = await measurePage(desktop);
  ok(deskAfterAdd.scrollY < 16 && deskAfterAdd.scrollTopType === 'button',
    '1280 homepage: leftover scroll-top click after leftover add still scrolls leftover topo');
  ok(deskAfterAdd.cartCount === '1',
    `1280 homepage: leftover scroll-top should keep leftover Melancia 1/4 in leftover cart (got "${deskAfterAdd.cartCount}")`);

  await browser.close();
  server.close();
  if (errors.length) {
    console.error('check-scroll-top-type-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
    process.exit(1);
  }
  console.log('check-scroll-top-type-browser: ok');
} catch (err) {
  try { await browser.close(); } catch {}
  try { server.close(); } catch {}
  console.error(err);
  process.exit(1);
}
