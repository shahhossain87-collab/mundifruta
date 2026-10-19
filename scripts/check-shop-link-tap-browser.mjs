#!/usr/bin/env node
/** Chrome: leftover shop-link is a 44px tap target on phones. */
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
    return { ok: true, count: document.getElementById('cart-count')?.textContent || '' };
  });
  ok(added.ok && added.count === '1', `${label}: add Melancia 1/4 (count=${added.count})`);
}

async function clickShopLink(page, wanted) {
  return page.evaluate((label) => {
    const btn = [...document.querySelectorAll('.shop-link')]
      .find(el => (el.textContent || '').replace(/\s+/g, ' ').trim() === label);
    if (!btn) return { ok: false, reason: 'missing', type: '' };
    btn.click();
    return {
      ok: true,
      type: btn.getAttribute('type') || '',
      text: (btn.textContent || '').replace(/\s+/g, ' ').trim(),
    };
  }, wanted);
}

async function waitInView(page, id) {
  await page.waitForFunction((elId) => {
    const el = document.getElementById(elId);
    if (!el) return false;
    const box = el.getBoundingClientRect();
    return box.top < window.innerHeight && box.bottom > 80;
  }, { timeout: 4000 }, id);
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
    const bar = [...document.querySelectorAll('.mb-item')].map(el =>
      (el.textContent || '').replace(/\s+/g, ' ').trim()
    );
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
    const produtos = document.getElementById('produtos');
    const produtosBox = produtos ? produtos.getBoundingClientRect() : { top: 0, bottom: 0 };
    const tabFrutas = document.getElementById('tab-frutas');
    const tabLegumes = document.getElementById('tab-legumes');
    const enc = document.getElementById('encomenda');
    const inView = box => box.top < window.innerHeight && box.bottom > 80;
    const shopMeasure = shopLinks.map(btn => {
      const box = btn.getBoundingClientRect();
      const cs = getComputedStyle(btn);
      return {
        text: (btn.textContent || '').replace(/\s+/g, ' ').trim(),
        type: btn.getAttribute('type') || '',
        tag: btn.tagName,
        onclick: btn.getAttribute('onclick') || '',
        height: box.height,
        width: box.width,
        display: cs.display,
        align: cs.alignItems,
        minHeight: cs.minHeight,
        padding: cs.padding,
      };
    });
    return {
      hamburgerType: hamburger?.getAttribute('type') || '',
      hamburgerLabel: hamburger?.getAttribute('aria-label') || '',
      hamburgerExpanded: hamburger?.getAttribute('aria-expanded'),
      hamburgerDisplay: hamburger ? getComputedStyle(hamburger).display : '',
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
      barDisplay: barEl ? getComputedStyle(barEl).display : '',
      mbCartType: mbCart?.getAttribute('type') || '',
      floatCartType: floatCart?.getAttribute('type') || '',
      floatLegumesType: floatLegumes?.getAttribute('type') || '',
      floatLegumesHidden: floatLegumes?.hidden === true,
      scrollTopType: scrollTop?.getAttribute('type') || '',
      scrollTopBottom: scrollTop ? getComputedStyle(scrollTop).bottom : '',
      catQuickCount: catQuick.length,
      catQuickTypes: catQuick.map(btn => btn.getAttribute('type') || ''),
      catQuickLabels: catQuick.map(btn =>
        (btn.querySelector('.cq-label')?.textContent || '').replace(/\s+/g, ' ').trim()
      ),
      shop: shopMeasure,
      shopLinkCount: shopMeasure.length,
      cabazCloseText: (cabazClose?.textContent || '').trim(),
      cabazCloseType: cabazClose?.getAttribute('type') || '',
      cabazCloseHeight: cabazClose ? cabazClose.getBoundingClientRect().height : 0,
      cabazAddText: (cabazAdd?.textContent || '').trim(),
      productCloseText: (productClose?.textContent || '').trim(),
      productCloseHeight: productClose ? productClose.getBoundingClientRect().height : 0,
      csCloseText: (csClose?.textContent || '').trim(),
      skipText: (skip?.textContent || '').trim(),
      skipHeight: skip ? skip.getBoundingClientRect().height : 0,
      privacyCloseText: (privacyClose?.textContent || '').trim(),
      privacyCloseHeight: privacyClose ? privacyClose.getBoundingClientRect().height : 0,
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
      verHeight: ver ? ver.getBoundingClientRect().height : 0,
      cartCount: document.getElementById('cart-count')?.textContent || '',
      produtosInView: inView(produtosBox),
      tabFrutasActive: tabFrutas?.classList.contains('active') === true,
      tabLegumesActive: tabLegumes?.classList.contains('active') === true,
      catalogCount: document.querySelectorAll('.shop-main .product-card').length,
      encomendaTitle: (enc?.querySelector('h2, .section-title')?.textContent || '').trim(),
    };
  });
}

function assertShopLink(label, page, { phone } = { phone: false }) {
  const wanted = [
    'Ver catálogo completo →',
    'Ver todas as frutas →',
    'Explorar fruta →',
    'Ver todos os legumes →',
  ];
  ok(page.shopLinkCount === 4, `${label}: leftover shop-link count stays 4 (got ${page.shopLinkCount})`);
  ok(page.shop.map(s => s.text).join('|') === wanted.join('|'),
    `${label}: leftover shop-link copy stays (got ${page.shop.map(s => s.text).join(' / ')})`);
  ok(page.shop.every(s => s.tag === 'BUTTON'), `${label}: leftover shop-link stays leftover buttons`);
  ok(page.shop.every(s => s.type === ''),
    `${label}: leftover shop-link stays without leftover type=button`);
  ok(page.shop.every(s => s.display === 'inline-flex' || s.display === 'flex'),
    `${label}: leftover shop-link should stay leftover flex / inline-flex (got ${page.shop.map(s => s.display).join('/')})`);
  ok(page.shop.every(s => s.align === 'center'),
    `${label}: leftover shop-link should stay leftover align-items:center`);
  ok(page.shop[0].onclick.includes("getElementById('produtos').scrollIntoView({behavior:'smooth'})"),
    `${label}: leftover Ver catálogo completo keeps leftover produtos scroll`);
  ok(page.shop[1].onclick.includes("abrirCatalogo('frutas')"),
    `${label}: leftover Ver todas as frutas keeps leftover abrirCatalogo('frutas')`);
  ok(page.shop[2].onclick.includes("abrirCatalogo('frutas')"),
    `${label}: leftover Explorar fruta keeps leftover abrirCatalogo('frutas')`);
  ok(page.shop[3].onclick.includes("abrirCatalogo('legumes')"),
    `${label}: leftover Ver todos os legumes keeps leftover abrirCatalogo('legumes')`);
  for (const s of page.shop) {
    ok(s.width >= 44, `${label}: leftover ${s.text} tap width >= 44px (got ${s.width})`);
    if (phone) {
      ok(s.height >= 44, `${label}: leftover ${s.text} tap height >= 44px (got ${s.height})`);
      ok(parseFloat(s.minHeight) >= 44,
        `${label}: leftover ${s.text} min-height >= 44px (got ${s.minHeight})`);
    } else {
      ok(s.height < 44, `${label}: leftover ${s.text} should hug leftover labels, not force 44px (got ${s.height})`);
    }
  }
}

try {
  const mobile = await browser.newPage();
  mobile.on('pageerror', err => errors.push('390 pageerror: ' + err.message));
  await openReady(mobile, 390, 844);
  const phone = await measurePage(mobile);
  ok(phone.bar.some(t => /Carrinho/i.test(t)), '390 homepage: leftover 4-item bar still lists Carrinho');
  ok(phone.bar.some(t => /Promoções/i.test(t)), '390 homepage: leftover 4-item bar still lists Promoções');
  ok(phone.bar.some(t => /WhatsApp/i.test(t)), '390 homepage: leftover 4-item bar still lists WhatsApp');
  ok(phone.bar.some(t => /Como Chegar/i.test(t)), '390 homepage: leftover 4-item bar still lists Como Chegar');
  ok(phone.bar.length === 4, `390 homepage: leftover 4-item bar stays (got ${phone.bar.length})`);
  assertShopLink('390 homepage', phone, { phone: true });
  ok(phone.hamburgerType === '',
    `390 homepage: should not invent leftover type=button on leftover hamburger (got "${phone.hamburgerType}")`);
  ok(phone.hamburgerLabel === 'Menu',
    `390 homepage: leftover hamburger stays leftover Menu (got "${phone.hamburgerLabel}")`);
  ok(phone.hamburgerExpanded == null,
    `390 homepage: should not redo leftover hamburger aria-expanded (PR #70) (got "${phone.hamburgerExpanded}")`);
  ok(phone.menuOpen === false, '390 homepage: leftover mobile-menu should stay closed');
  ok(phone.mobileCloseText === '✕' && phone.mobileCloseType === '' && !phone.mobileCloseLabel,
    '390 homepage: leftover mobile-close stays leftover ✕ without leftover type=button / leftover accessible name');
  ok(phone.navOrderType === '' && phone.searchClearType === '',
    '390 homepage: leftover Encomendar / leftover search-clear stay without leftover type=button');
  ok(phone.floatCartType === '' && phone.mbCartType === '' && phone.floatLegumesType === '' && phone.scrollTopType === '',
    '390 homepage: leftover float-cart / leftover Carrinho / leftover float-legumes / leftover scroll-top stay without leftover type=button');
  ok(phone.catQuickTypes.every(t => t === ''),
    '390 homepage: leftover cat-quick-btn stay without leftover type=button');
  ok(phone.cabazCloseType === '' && phone.verType === '',
    '390 homepage: leftover cabaz-modal close / leftover cabaz-ver stay without leftover type=button');
  ok(/👁 Ver o que leva/.test(phone.verText || ''),
    `390 homepage: leftover Ver o que leva stays (got "${phone.verText}")`);
  ok(phone.verHeight < 44,
    `390 homepage: should not redo leftover cabaz-ver 44px tap (got ${phone.verHeight})`);
  ok(phone.cabazCloseText === '✕', '390 homepage: leftover cabaz-modal close stays ✕');
  ok(phone.cabazCloseHeight < 40,
    `390 homepage: should not redo leftover cabaz-modal-close 44px tap (got ${phone.cabazCloseHeight})`);
  ok(phone.productCloseText === '✕', '390 homepage: leftover product-modal close stays ✕');
  ok(phone.productCloseHeight < 40,
    `390 homepage: should not redo leftover product-modal-close 44px tap (got ${phone.productCloseHeight})`);
  ok(phone.csCloseText === '✕', '390 homepage: leftover cross-sell close stays ✕');
  ok(phone.skipText === 'Continuar sem adicionar',
    `390 homepage: leftover Continuar sem adicionar stays (got "${phone.skipText}")`);
  ok(phone.skipHeight < 50,
    `390 homepage: should not redo leftover Continuar sem adicionar 44px tap (got ${phone.skipHeight})`);
  ok(phone.privacyCloseText === '✕', '390 homepage: leftover privacy close stays ✕');
  ok(phone.privacyCloseHeight < 40,
    `390 homepage: should not redo leftover privacy-close 44px tap (got ${phone.privacyCloseHeight})`);
  ok(phone.resetText === 'Repor consentimento',
    `390 homepage: leftover Repor consentimento stays (got "${phone.resetText}")`);
  ok(phone.linkText === 'Saber mais',
    `390 homepage: leftover Saber mais stays (got "${phone.linkText}")`);
  ok(phone.noText === 'Só essenciais',
    `390 homepage: leftover Só essenciais stays (got "${phone.noText}")`);
  ok(phone.yesText === 'Aceitar tudo',
    `390 homepage: leftover Aceitar tudo stays (got "${phone.yesText}")`);
  ok(phone.privacyLabels.join('|') === 'WhatsApp|email',
    `390 homepage: leftover privacy-dialog links stay (got ${phone.privacyLabels.join(' / ')})`);
  ok(phone.privacyHrefs.join('|') === 'https://wa.me/351932699850|mailto:shahhossain87@gmail.com',
    `390 homepage: leftover privacy-dialog hrefs stay (got ${phone.privacyHrefs.join(' / ')})`);
  ok(phone.contactLabels.join('|') === '932 699 850|shahhossain87@gmail.com',
    `390 homepage: leftover Encontre-nos links stay (got ${phone.contactLabels.join(' / ')})`);
  ok(phone.creditText === 'Shah Hossain',
    `390 homepage: leftover Shah Hossain stays (got "${phone.creditText}")`);
  ok(phone.creditHref === 'mailto:shahhossain050187@gmail.com',
    `390 homepage: leftover Shah Hossain mailto stays (got "${phone.creditHref}")`);
  ok(phone.footerLinks.join('|') === 'Produtos|Frutas|Legumes|Quem Somos|Encomendar|Contacto|Privacidade|Créditos das fotos',
    `390 homepage: leftover footer shop-links stay (got ${phone.footerLinks.join(' / ')})`);
  ok(phone.hero.some(t => /Ver Produtos/i.test(t)), '390 homepage: leftover Ver Produtos stays');
  ok(phone.hero.some(t => /Encomendar por WhatsApp/i.test(t)), '390 homepage: leftover Encomendar por WhatsApp stays');
  ok(phone.waHref === 'https://wa.me/351932699850',
    `390 homepage: leftover privacy WhatsApp stays wa.me/351932699850 (got "${phone.waHref}")`);
  ok(phone.barWaHref === 'https://wa.me/351932699850',
    `390 homepage: leftover bar WhatsApp stays wa.me/351932699850 (got "${phone.barWaHref}")`);
  ok(phone.orderWaType === 'submit',
    `390 homepage: leftover order WhatsApp stays leftover type=submit (got "${phone.orderWaType}")`);
  ok(phone.cartCount === '0' || phone.cartCount === '',
    `390 homepage: leftover shop-link should not add leftover cabaz to leftover cart (got "${phone.cartCount}")`);
  ok(phone.tabFrutasActive === true, '390 homepage: leftover Frutas tab should start leftover active');
  ok(phone.tabLegumesActive === false, '390 homepage: leftover legumes tab should start leftover inactive');
  ok(phone.scrollTopBottom === '28px',
    `390 homepage: leftover scroll-top computed bottom stays leftover 28px (got "${phone.scrollTopBottom}")`);

  const clickCatalogo = await clickShopLink(mobile, 'Ver catálogo completo →');
  ok(clickCatalogo.ok && clickCatalogo.type === '',
    `390 homepage: leftover Ver catálogo completo click stays without leftover type=button (got "${clickCatalogo.type}")`);
  await waitInView(mobile, 'produtos');
  const afterCatalogo = await measurePage(mobile);
  ok(afterCatalogo.produtosInView === true,
    '390 homepage: leftover Ver catálogo completo click should scroll leftover catálogo into leftover view');
  ok(afterCatalogo.tabFrutasActive === true,
    '390 homepage: leftover Ver catálogo completo click should keep leftover Frutas tab leftover active');
  ok(afterCatalogo.menuOpen === false, '390 homepage: leftover Ver catálogo completo should keep leftover mobile-menu closed');
  assertShopLink('390 after Ver catálogo completo', afterCatalogo, { phone: true });
  ok(afterCatalogo.waHref === 'https://wa.me/351932699850',
    `390 homepage: leftover privacy WhatsApp stays after leftover Ver catálogo completo (got "${afterCatalogo.waHref}")`);
  ok(afterCatalogo.cartCount === '0' || afterCatalogo.cartCount === '',
    `390 homepage: leftover Ver catálogo completo should not add leftover cabaz after click (got "${afterCatalogo.cartCount}")`);
  ok(afterCatalogo.catalogCount > 0,
    `390 homepage: leftover Ver catálogo completo should keep leftover catalog cards (got ${afterCatalogo.catalogCount})`);
  ok(afterCatalogo.orderWaType === 'submit',
    `390 homepage: leftover order WhatsApp stays leftover type=submit after leftover Ver catálogo completo (got "${afterCatalogo.orderWaType}")`);

  const clickLegumes = await clickShopLink(mobile, 'Ver todos os legumes →');
  ok(clickLegumes.ok && clickLegumes.type === '',
    `390 homepage: leftover Ver todos os legumes click stays without leftover type=button (got "${clickLegumes.type}")`);
  await waitInView(mobile, 'produtos');
  const afterLegumes = await measurePage(mobile);
  ok(afterLegumes.produtosInView === true && afterLegumes.tabLegumesActive === true,
    '390 homepage: leftover Ver todos os legumes click should open leftover Legumes catálogo');
  assertShopLink('390 after Ver todos os legumes', afterLegumes, { phone: true });
  ok(afterLegumes.menuOpen === false, '390 homepage: leftover Ver todos os legumes should keep leftover mobile-menu closed');
  ok(afterLegumes.waHref === 'https://wa.me/351932699850',
    `390 homepage: leftover privacy WhatsApp stays after leftover Ver todos os legumes (got "${afterLegumes.waHref}")`);

  await addMelancia(mobile, '390 after shop-link');
  const afterAddClick = await clickShopLink(mobile, 'Ver catálogo completo →');
  ok(afterAddClick.ok && afterAddClick.type === '',
    '390 homepage: leftover Ver catálogo completo click after leftover add stays without leftover type=button');
  await waitInView(mobile, 'produtos');
  const afterAdd = await measurePage(mobile);
  ok(afterAdd.produtosInView === true && afterAdd.shop.every(s => s.type === ''),
    '390 homepage: leftover Ver catálogo completo click after leftover add still opens leftover catálogo');
  ok(afterAdd.cartCount === '1',
    `390 homepage: leftover Ver catálogo completo should keep leftover Melancia 1/4 in leftover cart (got "${afterAdd.cartCount}")`);
  ok(afterAdd.waHref === 'https://wa.me/351932699850',
    `390 homepage: leftover privacy WhatsApp stays after leftover add click (got "${afterAdd.waHref}")`);

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
  assertShopLink('1280 homepage', wide, { phone: false });
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
  ok(wide.cabazCloseType === '' && wide.verType === '',
    '1280 homepage: leftover cabaz-modal close / leftover cabaz-ver stay without leftover type=button');
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
  ok(deskClick.ok && deskClick.type === '',
    `1280 homepage: leftover Ver catálogo completo click stays without leftover type=button (got "${deskClick.type}")`);
  await waitInView(desktop, 'produtos');
  const deskAfter = await measurePage(desktop);
  ok(deskAfter.produtosInView === true,
    '1280 homepage: leftover Ver catálogo completo click should scroll leftover catálogo into leftover view');
  ok(deskAfter.tabFrutasActive === true,
    '1280 homepage: leftover Ver catálogo completo click should keep leftover Frutas tab leftover active');
  assertShopLink('1280 after Ver catálogo completo', deskAfter, { phone: false });
  ok(deskAfter.waHref === 'https://wa.me/351932699850',
    `1280 homepage: leftover privacy WhatsApp stays after leftover Ver catálogo completo (got "${deskAfter.waHref}")`);
  ok(deskAfter.cartCount === '0' || deskAfter.cartCount === '',
    `1280 homepage: leftover Ver catálogo completo should not add leftover cabaz after click (got "${deskAfter.cartCount}")`);
  ok(deskAfter.catalogCount > 0,
    `1280 homepage: leftover Ver catálogo completo should keep leftover catalog cards (got ${deskAfter.catalogCount})`);
  ok(deskAfter.orderWaType === 'submit',
    `1280 homepage: leftover order WhatsApp stays leftover type=submit after leftover Ver catálogo completo (got "${deskAfter.orderWaType}")`);

  const deskLegumes = await clickShopLink(desktop, 'Ver todos os legumes →');
  ok(deskLegumes.ok && deskLegumes.type === '',
    `1280 homepage: leftover Ver todos os legumes click stays without leftover type=button (got "${deskLegumes.type}")`);
  await waitInView(desktop, 'produtos');
  const deskAfterLegumes = await measurePage(desktop);
  ok(deskAfterLegumes.produtosInView === true && deskAfterLegumes.tabLegumesActive === true,
    '1280 homepage: leftover Ver todos os legumes click should open leftover Legumes catálogo');
  assertShopLink('1280 after Ver todos os legumes', deskAfterLegumes, { phone: false });

  await addMelancia(desktop, '1280 after shop-link');
  const deskAddClick = await clickShopLink(desktop, 'Ver catálogo completo →');
  ok(deskAddClick.ok && deskAddClick.type === '',
    '1280 homepage: leftover Ver catálogo completo click after leftover add stays without leftover type=button');
  await waitInView(desktop, 'produtos');
  const deskAfterAdd = await measurePage(desktop);
  ok(deskAfterAdd.produtosInView === true && deskAfterAdd.shop.every(s => s.type === ''),
    '1280 homepage: leftover Ver catálogo completo click after leftover add still opens leftover catálogo');
  ok(deskAfterAdd.cartCount === '1',
    `1280 homepage: leftover Ver catálogo completo should keep leftover Melancia 1/4 in leftover cart (got "${deskAfterAdd.cartCount}")`);

  await browser.close();
  server.close();
  if (errors.length) {
    console.error('check-shop-link-tap-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
    process.exit(1);
  }
  console.log('check-shop-link-tap-browser: ok');
} catch (err) {
  try { await browser.close(); } catch {}
  try { server.close(); } catch {}
  console.error(err);
  process.exit(1);
}
