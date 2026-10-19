#!/usr/bin/env node
/** Chrome: leftover mobile-close ✕ is type=button. */
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
    const barItems = [...document.querySelectorAll('.mb-item')];
    const bar = barItems.map(el => (el.textContent || '').replace(/\s+/g, ' ').trim());
    const mbCart = barItems.find(el => /Carrinho/i.test(el.textContent || ''));
    const menuLinks = menu
      ? [...menu.querySelectorAll('a')].map(a => (a.textContent || '').trim())
      : [];
    const privacyWa = document.querySelector('.privacy-box a[href^="https://wa.me/"]');
    const barWa = document.querySelector('.mb-item[href^="https://wa.me/"]');
    const ver = [...document.querySelectorAll('.cabaz-ver')]
      .find(btn => /Detox/i.test(btn.closest('.product-card')?.textContent || ''));
    const box = mobileClose ? mobileClose.getBoundingClientRect() : { width: 0, height: 0 };
    const closeStyle = mobileClose ? getComputedStyle(mobileClose) : null;
    return {
      hamburgerType: hamburger?.getAttribute('type') || '',
      hamburgerLabel: hamburger?.getAttribute('aria-label') || '',
      hamburgerExpanded: hamburger?.getAttribute('aria-expanded'),
      hamburgerDisplay: hamburger ? getComputedStyle(hamburger).display : '',
      hamburgerBars: hamburger ? hamburger.querySelectorAll('span').length : 0,
      menuOpen: menu?.classList.contains('open') === true,
      menuLinks,
      mobileCloseText: (mobileClose?.textContent || '').trim(),
      mobileCloseType: mobileClose?.getAttribute('type') || '',
      mobileCloseLabel: mobileClose?.getAttribute('aria-label') || '',
      mobileCloseMinHeight: closeStyle?.minHeight || '',
      mobileCloseFont: closeStyle?.fontSize || '',
      mobileCloseHeight: box.height,
      mobileCloseWidth: box.width,
      navOrderType: navOrder?.getAttribute('type') || '',
      navOrderText: (navOrder?.textContent || '').replace(/\s+/g, ' ').trim(),
      searchClearType: searchClear?.getAttribute('type') || '',
      mbCartType: mbCart?.getAttribute('type') || '',
      mbCartTag: mbCart?.tagName || '',
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
    };
  });
}

try {
  const mobile = await browser.newPage();
  mobile.on('pageerror', err => errors.push('390 pageerror: ' + err.message));
  await openReady(mobile, 390, 844);

  const phone = await measurePage(mobile);
  ok(phone.mobileCloseType === 'button',
    `390 homepage: leftover mobile-close should be leftover type=button (got "${phone.mobileCloseType}")`);
  ok(phone.mobileCloseText === '✕',
    `390 homepage: leftover mobile-close stays leftover ✕ (got "${phone.mobileCloseText}")`);
  ok(phone.mobileCloseLabel === '',
    `390 homepage: should not redo leftover mobile-close aria-label (PR #179) (got "${phone.mobileCloseLabel}")`);
  ok(phone.mobileCloseMinHeight !== '44px',
    `390 homepage: leftover mobile-close should stay leftover padded ✕, not force 44px (got min-height ${phone.mobileCloseMinHeight})`);
  ok(phone.mobileCloseFont === '32px',
    `390 homepage: leftover mobile-close stays leftover 2rem ✕ (got "${phone.mobileCloseFont}")`);
  ok(phone.menuOpen === false, '390 homepage: leftover mobile-menu should start closed');
  ok(phone.hamburgerType === '',
    `390 homepage: should not invent leftover type=button on leftover hamburger (got "${phone.hamburgerType}")`);
  ok(phone.hamburgerLabel === 'Menu',
    `390 homepage: leftover hamburger stays leftover Menu (got "${phone.hamburgerLabel}")`);
  ok(phone.hamburgerExpanded == null,
    `390 homepage: should not redo leftover hamburger aria-expanded (PR #70) (got "${phone.hamburgerExpanded}")`);
  ok(phone.hamburgerDisplay === 'flex',
    `390 homepage: leftover hamburger should stay leftover visible flex on leftover phones (got "${phone.hamburgerDisplay}")`);
  ok(phone.hamburgerBars === 3,
    `390 homepage: leftover hamburger stays leftover three bars (got ${phone.hamburgerBars})`);
  ok(phone.navOrderType === '',
    `390 homepage: should not invent leftover type=button on leftover Encomendar (got "${phone.navOrderType}")`);
  ok(/Encomendar/.test(phone.navOrderText),
    `390 homepage: leftover Encomendar stays (got "${phone.navOrderText}")`);
  ok(phone.searchClearType === '',
    `390 homepage: should not invent leftover type=button on leftover search-clear (got "${phone.searchClearType}")`);
  ok(phone.mbCartTag === 'BUTTON' && phone.mbCartType === '',
    `390 homepage: leftover 4-item bar Carrinho stays without leftover type=button (got "${phone.mbCartTag}" / "${phone.mbCartType}")`);
  ok(phone.cabazCloseText === '✕' && phone.cabazCloseType === '',
    '390 homepage: leftover cabaz-modal close stays ✕ without leftover type=button (PR #303)');
  ok(phone.cabazAddText === '＋' && phone.cabazAddType === '',
    '390 homepage: leftover cabaz-modal add stays ＋ without leftover type=button (PR #304)');
  ok(phone.productCloseText === '✕' && phone.productCloseType === 'button',
    '390 homepage: leftover product-modal close stays ✕ type=button');
  ok(phone.productAddText === '＋' && phone.productAddType === 'button',
    '390 homepage: leftover product-modal add stays ＋ type=button');
  ok(phone.csCloseText === '✕', '390 homepage: leftover cs-pop-close stays ✕');
  ok(phone.skipText === 'Continuar sem adicionar',
    `390 homepage: leftover Continuar sem adicionar stays (got "${phone.skipText}")`);
  ok(phone.privacyCloseText === '✕', '390 homepage: leftover privacy-close stays ✕');
  ok(phone.resetText === 'Repor consentimento',
    `390 homepage: leftover Repor consentimento stays (got "${phone.resetText}")`);
  ok(phone.linkText === 'Saber mais',
    `390 homepage: leftover Saber mais stays (got "${phone.linkText}")`);
  ok(phone.noText === 'Só essenciais',
    `390 homepage: leftover Só essenciais stays (got "${phone.noText}")`);
  ok(phone.yesText === 'Aceitar tudo',
    `390 homepage: leftover Aceitar tudo stays (got "${phone.yesText}")`);
  ok(phone.orderWaType === 'submit' && /Encomendar por WhatsApp/i.test(phone.orderWaText),
    `390 homepage: leftover order WhatsApp stays leftover type=submit (got "${phone.orderWaType}" / "${phone.orderWaText}")`);
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
  ok(phone.bar.some(t => /Promoções/i.test(t)), '390 homepage: leftover 4-item bar still lists Promoções');
  ok(phone.bar.some(t => /WhatsApp/i.test(t)), '390 homepage: leftover 4-item bar still lists WhatsApp');
  ok(phone.bar.some(t => /Como Chegar/i.test(t)), '390 homepage: leftover 4-item bar still lists Como Chegar');
  ok(phone.bar.length === 4, `390 homepage: leftover 4-item bar stays (got ${phone.bar.length})`);
  ok(phone.waHref === 'https://wa.me/351932699850',
    `390 homepage: leftover privacy WhatsApp stays wa.me/351932699850 (got "${phone.waHref}")`);
  ok(phone.barWaHref === 'https://wa.me/351932699850',
    `390 homepage: leftover bar WhatsApp stays wa.me/351932699850 (got "${phone.barWaHref}")`);
  ok(/👁 Ver o que leva/.test(phone.verText),
    `390 homepage: leftover Ver o que leva stays (got "${phone.verText}")`);
  ok(phone.verType === '',
    `390 homepage: leftover Ver o que leva stays without leftover type=button (got "${phone.verType}")`);
  ok(phone.verLabel === '',
    `390 homepage: leftover Ver o que leva stays without leftover aria-label (got "${phone.verLabel}")`);
  ok(phone.cartCount === '0' || phone.cartCount === '',
    `390 homepage: leftover mobile-close should not add leftover cabaz to leftover cart (got "${phone.cartCount}")`);

  const opened = await mobile.evaluate(() => {
    const hamburger = document.querySelector('.hamburger');
    if (!hamburger) return { ok: false, reason: 'hamburger missing' };
    hamburger.click();
    return {
      ok: true,
      type: hamburger.getAttribute('type') || '',
      label: hamburger.getAttribute('aria-label') || '',
    };
  });
  ok(opened.ok, '390 homepage: leftover hamburger should exist to open leftover mobile-menu');
  ok(opened.type === '',
    `390 homepage: leftover hamburger stays without leftover type=button on open (got "${opened.type}")`);
  ok(opened.label === 'Menu', '390 homepage: leftover hamburger stays leftover Menu on open');

  const afterOpen = await measurePage(mobile);
  ok(afterOpen.menuOpen === true, '390 homepage: leftover hamburger click should open leftover mobile-menu');
  ok(afterOpen.menuLinks.join('|') === 'Frutas|Legumes|Promoções|Cabazes|Como Funciona|Produtos|Quem Somos|Avaliações|Encomendar|Contacto',
    `390 homepage: leftover mobile-menu links stay after open (got ${afterOpen.menuLinks.join(' / ')})`);
  ok(afterOpen.mobileCloseType === 'button',
    `390 homepage: leftover mobile-close stays leftover type=button after open (got "${afterOpen.mobileCloseType}")`);
  ok(afterOpen.mobileCloseText === '✕',
    `390 homepage: leftover mobile-close stays leftover ✕ after open (got "${afterOpen.mobileCloseText}")`);
  ok(afterOpen.mobileCloseLabel === '',
    `390 homepage: leftover mobile-close stays without leftover aria-label after open (got "${afterOpen.mobileCloseLabel}")`);
  ok(afterOpen.mobileCloseMinHeight !== '44px',
    `390 homepage: leftover mobile-close should stay leftover padded ✕ after open (got min-height ${afterOpen.mobileCloseMinHeight})`);
  ok(afterOpen.mobileCloseHeight > 0 && afterOpen.mobileCloseWidth > 0,
    `390 homepage: leftover mobile-close should be leftover measurable after open (got ${afterOpen.mobileCloseWidth}×${afterOpen.mobileCloseHeight})`);
  ok(afterOpen.hamburgerType === '' && afterOpen.navOrderType === '' && afterOpen.searchClearType === '',
    '390 homepage: leftover hamburger / leftover Encomendar / leftover search-clear stay without leftover type=button after open');
  ok(afterOpen.mbCartType === '',
    `390 homepage: leftover 4-item bar Carrinho stays without leftover type=button after open (got "${afterOpen.mbCartType}")`);
  ok(afterOpen.cabazAddType === '' && afterOpen.cabazCloseType === '' && afterOpen.verType === '',
    '390 homepage: leftover cabaz-modal add / leftover cabaz-modal close / leftover cabaz-ver stay without leftover type=button after open');
  ok(afterOpen.orderWaType === 'submit',
    `390 homepage: leftover order WhatsApp stays leftover type=submit after open (got "${afterOpen.orderWaType}")`);
  ok(afterOpen.waHref === 'https://wa.me/351932699850',
    `390 homepage: leftover privacy WhatsApp stays after open (got "${afterOpen.waHref}")`);
  ok(afterOpen.barWaHref === 'https://wa.me/351932699850',
    `390 homepage: leftover bar WhatsApp stays after open (got "${afterOpen.barWaHref}")`);
  ok(afterOpen.cartCount === '0' || afterOpen.cartCount === '',
    `390 homepage: leftover mobile-close should not add leftover cabaz after open (got "${afterOpen.cartCount}")`);
  ok(afterOpen.overflow === '',
    `390 homepage: leftover mobile-close should not invent leftover overflow lock (got "${afterOpen.overflow}")`);
  ok(afterOpen.skipText === 'Continuar sem adicionar',
    `390 homepage: leftover Continuar sem adicionar stays after open (got "${afterOpen.skipText}")`);

  const closed = await mobile.evaluate(() => {
    const close = document.querySelector('.mobile-close');
    if (!close) return { ok: false };
    close.click();
    return {
      ok: true,
      type: close.getAttribute('type') || '',
      text: (close.textContent || '').trim(),
      label: close.getAttribute('aria-label') || '',
    };
  });
  ok(closed.ok && closed.type === 'button',
    `390 homepage: leftover mobile-close click stays leftover type=button (got "${closed.type}")`);
  ok(closed.text === '✕',
    `390 homepage: leftover mobile-close stays leftover ✕ on click (got "${closed.text}")`);
  ok(closed.label === '',
    `390 homepage: leftover mobile-close stays without leftover aria-label on click (got "${closed.label}")`);

  const afterClose = await measurePage(mobile);
  ok(afterClose.menuOpen === false, '390 homepage: leftover mobile-close click should hide leftover mobile-menu');
  ok(afterClose.mobileCloseType === 'button',
    `390 homepage: leftover mobile-close stays leftover type=button after close (got "${afterClose.mobileCloseType}")`);
  ok(afterClose.hamburgerType === '' && afterClose.navOrderType === '' && afterClose.searchClearType === '',
    '390 homepage: leftover hamburger / leftover Encomendar / leftover search-clear stay without leftover type=button after close');
  ok(afterClose.mbCartType === '',
    `390 homepage: leftover 4-item bar Carrinho stays without leftover type=button after close (got "${afterClose.mbCartType}")`);
  ok(afterClose.waHref === 'https://wa.me/351932699850',
    `390 homepage: leftover privacy WhatsApp stays after close (got "${afterClose.waHref}")`);
  ok(afterClose.barWaHref === 'https://wa.me/351932699850',
    `390 homepage: leftover bar WhatsApp stays after close (got "${afterClose.barWaHref}")`);
  ok(afterClose.cartCount === '0' || afterClose.cartCount === '',
    `390 homepage: leftover mobile-close should not add leftover cabaz after close (got "${afterClose.cartCount}")`);
  ok(afterClose.orderWaType === 'submit',
    `390 homepage: leftover order WhatsApp stays leftover type=submit after close (got "${afterClose.orderWaType}")`);

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
      hasHamburger: !!document.querySelector('.hamburger, #mobile-menu, [aria-label="Menu"], .mobile-close'),
    };
  });
  ok(cat.nav.join('|') === 'Início|Frutas|Legumes|Promoções',
    `390 Frutas: wrapping nav stays leftover Início / Frutas / Legumes / Promoções (got ${cat.nav.join(' / ')})`);
  ok(/MUNDIFRUTA/i.test(cat.footerText), `390 Frutas: leftover catalog footer stays (got "${cat.footerText}")`);
  ok(cat.footerHeight < 40, `390 Frutas: should not redo leftover catalog footer 44px tap (got ${cat.footerHeight})`);
  ok(cat.verText === 'Ver produto', `390 Frutas: leftover Ver produto copy (got "${cat.verText}")`);
  ok(!cat.hasHamburger, '390 Frutas: should not add a leftover SEO-page hamburger / leftover mobile-close');

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
    };
  });
  ok(prod.orderText === 'Ver no catálogo e encomendar',
    `390 Melancia: leftover Ver no catálogo e encomendar stays (got "${prod.orderText}")`);
  ok(prod.orderHref === '/?produto=melancia-1-4#produtos',
    `390 Melancia: leftover catalog href stays (got "${prod.orderHref}")`);
  ok(prod.orderWidth < 360, `390 Melancia: should not redo leftover full-width order CTA (got ${prod.orderWidth})`);

  const desktop = await browser.newPage();
  desktop.on('pageerror', err => errors.push('1280 pageerror: ' + err.message));
  await openReady(desktop, 1280, 800);
  const wide = await measurePage(desktop);
  ok(wide.mobileCloseType === 'button',
    `1280 homepage: leftover mobile-close should be leftover type=button (got "${wide.mobileCloseType}")`);
  ok(wide.mobileCloseText === '✕',
    `1280 homepage: leftover mobile-close stays leftover ✕ (got "${wide.mobileCloseText}")`);
  ok(wide.mobileCloseLabel === '',
    `1280 homepage: should not redo leftover mobile-close aria-label (PR #179) (got "${wide.mobileCloseLabel}")`);
  ok(wide.hamburgerType === '',
    `1280 homepage: should not invent leftover type=button on leftover hamburger (got "${wide.hamburgerType}")`);
  ok(wide.hamburgerLabel === 'Menu',
    `1280 homepage: leftover hamburger stays leftover Menu (got "${wide.hamburgerLabel}")`);
  ok(wide.hamburgerDisplay === 'none',
    `1280 homepage: leftover hamburger should stay leftover hidden on leftover desktop (got "${wide.hamburgerDisplay}")`);
  ok(wide.hamburgerExpanded == null,
    `1280 homepage: should not redo leftover hamburger aria-expanded (PR #70) (got "${wide.hamburgerExpanded}")`);
  ok(wide.menuOpen === false, '1280 homepage: leftover mobile-menu should stay closed');
  ok(wide.navOrderType === '' && wide.searchClearType === '',
    '1280 homepage: leftover Encomendar / leftover search-clear stay without leftover type=button');
  ok(wide.mbCartType === '',
    `1280 homepage: leftover 4-item bar Carrinho stays without leftover type=button (got "${wide.mbCartType}")`);
  ok(wide.cabazCloseType === '' && wide.cabazAddType === '' && wide.verType === '',
    '1280 homepage: leftover cabaz-modal close / leftover cabaz-modal add / leftover cabaz-ver stay without leftover type=button');
  ok(wide.orderWaType === 'submit',
    `1280 homepage: leftover order WhatsApp stays leftover type=submit (got "${wide.orderWaType}")`);
  ok(wide.hero.some(t => /Ver Produtos/i.test(t)), '1280 homepage: leftover Ver Produtos stays');
  ok(wide.hero.some(t => /Encomendar por WhatsApp/i.test(t)), '1280 homepage: leftover Encomendar por WhatsApp stays');
  ok(wide.waHref === 'https://wa.me/351932699850',
    `1280 homepage: leftover privacy WhatsApp stays wa.me/351932699850 (got "${wide.waHref}")`);
  ok(wide.cartCount === '0' || wide.cartCount === '',
    `1280 homepage: leftover mobile-close should not add leftover cabaz to leftover cart (got "${wide.cartCount}")`);

  const deskOpenClick = await desktop.evaluate(() => {
    const hamburger = document.querySelector('.hamburger');
    if (!hamburger) return { ok: false };
    hamburger.click();
    return { ok: true, type: hamburger.getAttribute('type') || '' };
  });
  ok(deskOpenClick.ok && deskOpenClick.type === '',
    `1280 homepage: leftover hamburger open stays without leftover type=button (got "${deskOpenClick.type}")`);
  const deskOpen = await measurePage(desktop);
  ok(deskOpen.menuOpen === true, '1280 homepage: leftover hamburger click should still toggle leftover mobile-menu');
  ok(deskOpen.menuLinks.join('|') === 'Frutas|Legumes|Promoções|Cabazes|Como Funciona|Produtos|Quem Somos|Avaliações|Encomendar|Contacto',
    `1280 homepage: leftover mobile-menu links stay after open (got ${deskOpen.menuLinks.join(' / ')})`);
  ok(deskOpen.mobileCloseType === 'button',
    `1280 homepage: leftover mobile-close stays leftover type=button after open (got "${deskOpen.mobileCloseType}")`);
  ok(deskOpen.waHref === 'https://wa.me/351932699850',
    `1280 homepage: leftover privacy WhatsApp stays after open (got "${deskOpen.waHref}")`);
  ok(deskOpen.cartCount === '0' || deskOpen.cartCount === '',
    `1280 homepage: leftover mobile-close should not add leftover cabaz after open (got "${deskOpen.cartCount}")`);

  const deskClose = await desktop.evaluate(() => {
    const close = document.querySelector('.mobile-close');
    if (!close) return { ok: false };
    close.click();
    return { ok: true, type: close.getAttribute('type') || '' };
  });
  ok(deskClose.ok && deskClose.type === 'button',
    `1280 homepage: leftover mobile-close click stays leftover type=button (got "${deskClose.type}")`);
  const deskAfter = await measurePage(desktop);
  ok(deskAfter.menuOpen === false, '1280 homepage: leftover mobile-close click should hide leftover mobile-menu');
  ok(deskAfter.mobileCloseType === 'button',
    `1280 homepage: leftover mobile-close stays leftover type=button after close (got "${deskAfter.mobileCloseType}")`);
  ok(deskAfter.waHref === 'https://wa.me/351932699850',
    `1280 homepage: leftover privacy WhatsApp stays after close (got "${deskAfter.waHref}")`);
  ok(deskAfter.cartCount === '0' || deskAfter.cartCount === '',
    `1280 homepage: leftover mobile-close should not add leftover cabaz after close (got "${deskAfter.cartCount}")`);

  await browser.close();
  server.close();
  if (errors.length) {
    console.error('check-mobile-close-type-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
    process.exit(1);
  }
  console.log('check-mobile-close-type-browser: ok');
} catch (err) {
  try { await browser.close(); } catch {}
  try { server.close(); } catch {}
  console.error(err);
  process.exit(1);
}
