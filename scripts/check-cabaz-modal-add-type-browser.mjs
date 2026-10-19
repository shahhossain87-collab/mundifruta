#!/usr/bin/env node
/** Chrome: leftover cabaz-modal-add / ＋ is type=button. */
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

async function openCabazDetox(page) {
  const opened = await page.evaluate(() => {
    const card = [...document.querySelectorAll('#grid-cabazes .product-card')]
      .find(c => /Cabaz Detox/i.test(c.textContent || ''));
    const ver = card ? card.querySelector('.cabaz-ver') : null;
    if (!ver) return { ok: false, reason: 'ver missing' };
    ver.click();
    return { ok: true, verText: (ver.textContent || '').replace(/\s+/g, ' ').trim(), verType: ver.getAttribute('type') || '' };
  });
  if (opened.ok) {
    await page.waitForFunction(
      () => {
        const box = document.querySelector('.cabaz-modal.open .cabaz-modal-box');
        if (!box) return false;
        const t = getComputedStyle(box).transform;
        return t === 'none' || t === 'matrix(1, 0, 0, 1, 0, 0)';
      },
      { timeout: 3000 }
    );
  }
  return opened;
}

async function measurePage(page) {
  return page.evaluate(() => {
    const close = document.querySelector('.cabaz-modal-close');
    const add = document.getElementById('cabaz-modal-add');
    const modal = document.getElementById('cabaz-modal');
    const title = document.getElementById('cabaz-modal-title');
    const sub = document.querySelector('.cabaz-modal-sub');
    const productClose = document.querySelector('.product-modal-close');
    const productAdd = document.getElementById('product-modal-add');
    const csClose = document.querySelector('.cs-pop-close');
    const skip = document.querySelector('.cs-pop-skip');
    const privacyClose = document.querySelector('.privacy-close');
    const reset = document.querySelector('.privacy-reset');
    const link = document.querySelector('.consent-link');
    const no = document.querySelector('.consent-no');
    const yes = document.querySelector('.consent-yes');
    const hamburger = document.querySelector('.hamburger');
    const navOrder = document.querySelector('.nav-order');
    const mobileClose = document.querySelector('.mobile-close');
    const searchClear = document.querySelector('.search-clear');
    const orderWa = document.querySelector('#order-form button.btn-wa');
    const privacyLinks = [...document.querySelectorAll('.privacy-box a')];
    const contact = [...document.querySelectorAll('.contact-card a')];
    const credit = document.querySelector('.footer-credit a');
    const footerLinks = [...document.querySelectorAll('.footer-links a')];
    const hero = [...document.querySelectorAll('.hero-ctas a')].map(a =>
      (a.textContent || '').replace(/\s+/g, ' ').trim()
    );
    const bar = [...document.querySelectorAll('.mb-item')].map(el =>
      (el.textContent || '').replace(/\s+/g, ' ').trim()
    );
    const privacyWa = document.querySelector('.privacy-box a[href^="https://wa.me/"]');
    const barWa = document.querySelector('.mb-item[href^="https://wa.me/"]');
    const ver = [...document.querySelectorAll('.cabaz-ver')]
      .find(btn => /Detox/i.test(btn.closest('.product-card')?.textContent || ''));
    return {
      closeLabel: close?.getAttribute('aria-label') || '',
      closeText: (close?.textContent || '').trim(),
      closeType: close?.getAttribute('type') || '',
      closeHeight: close ? close.getBoundingClientRect().height : 0,
      closeWidth: close ? close.getBoundingClientRect().width : 0,
      addText: (add?.textContent || '').trim(),
      addLabel: add?.getAttribute('aria-label') || '',
      addType: add?.getAttribute('type') || '',
      addClass: add?.className || '',
      addHeight: add ? add.getBoundingClientRect().height : 0,
      modalOpen: modal?.classList.contains('open') === true,
      overflow: document.body.style.overflow,
      titleText: (title?.textContent || '').trim(),
      subText: (sub?.textContent || '').trim(),
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
      hamburgerType: hamburger?.getAttribute('type') || '',
      navOrderType: navOrder?.getAttribute('type') || '',
      mobileCloseType: mobileClose?.getAttribute('type') || '',
      searchClearType: searchClear?.getAttribute('type') || '',
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
      verHeight: ver ? ver.getBoundingClientRect().height : 0,
      cartCount: document.getElementById('cart-count')?.textContent || '',
    };
  });
}

try {
  const mobile = await browser.newPage();
  mobile.on('pageerror', err => errors.push('390 pageerror: ' + err.message));
  await openReady(mobile, 390, 844);

  const opened = await openCabazDetox(mobile);
  ok(opened.ok, '390 homepage: leftover Ver o que leva should open leftover Cabaz Detox');
  ok(/👁 Ver o que leva/.test(opened.verText || ''),
    `390 homepage: leftover Ver o que leva stays (got "${opened.verText}")`);
  ok(opened.verType === '',
    `390 homepage: should not redo leftover cabaz-ver type=button (PR #302) (got "${opened.verType}")`);

  const phone = await measurePage(mobile);
  ok(phone.modalOpen === true, '390 homepage: leftover cabaz modal should open from leftover Ver o que leva');
  ok(/Cabaz Detox/i.test(phone.titleText),
    `390 homepage: leftover Cabaz Detox name stays (got "${phone.titleText}")`);
  ok(phone.subText === 'Este cabaz é composto pelos seguintes itens:',
    `390 homepage: leftover cabaz composition copy stays (got "${phone.subText}")`);
  ok(phone.closeLabel === 'Fechar' && phone.closeText === '✕',
    `390 homepage: leftover cabaz-modal close stays ✕ / Fechar (got "${phone.closeText}" / "${phone.closeLabel}")`);
  ok(phone.closeType === '',
    `390 homepage: should not redo leftover cabaz-modal-close type=button (PR #303) (got "${phone.closeType}")`);
  ok(phone.closeHeight === 34 && phone.closeWidth === 34,
    `390 homepage: leftover cabaz-modal close should stay leftover 34px circle, not force 44px (got ${phone.closeWidth}×${phone.closeHeight})`);
  ok(phone.addText === '＋', '390 homepage: leftover cabaz-modal add stays ＋');
  ok(/Cabaz Detox/i.test(phone.addLabel) && /Adicionar/i.test(phone.addLabel),
    `390 homepage: leftover cabaz-modal add name stays (got "${phone.addLabel}")`);
  ok(phone.addType === 'button',
    `390 homepage: leftover cabaz-modal add should be leftover type=button (got "${phone.addType}")`);
  ok(/\bbtn-wa\b/.test(phone.addClass) && /\bcabaz-modal-add\b/.test(phone.addClass),
    `390 homepage: leftover cabaz-modal add should stay leftover btn-wa cabaz-modal-add (got "${phone.addClass}")`);
  ok(phone.addHeight >= 48,
    `390 homepage: leftover cabaz-modal add already meets leftover padded height, not a 44px slice (got ${phone.addHeight})`);
  ok(phone.overflow === 'hidden',
    `390 homepage: leftover body overflow should lock while leftover cabaz-modal is open (got "${phone.overflow}")`);
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
  ok(phone.hamburgerType === '',
    `390 homepage: should not invent leftover type=button on leftover hamburger (got "${phone.hamburgerType}")`);
  ok(phone.navOrderType === '',
    `390 homepage: should not invent leftover type=button on leftover Encomendar (got "${phone.navOrderType}")`);
  ok(phone.mobileCloseType === '',
    `390 homepage: should not invent leftover type=button on leftover mobile-close (got "${phone.mobileCloseType}")`);
  ok(phone.searchClearType === '',
    `390 homepage: should not invent leftover type=button on leftover search-clear (got "${phone.searchClearType}")`);
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
  ok(phone.bar.some(t => /Promoções/i.test(t)), '390 homepage: leftover 4-item bar still lists Promoções after open');
  ok(phone.bar.some(t => /WhatsApp/i.test(t)), '390 homepage: leftover 4-item bar still lists WhatsApp after open');
  ok(phone.bar.some(t => /Como Chegar/i.test(t)), '390 homepage: leftover 4-item bar still lists Como Chegar after open');
  ok(phone.bar.length === 4, `390 homepage: leftover 4-item bar stays after open (got ${phone.bar.length})`);
  ok(phone.waHref === 'https://wa.me/351932699850',
    `390 homepage: leftover privacy WhatsApp stays wa.me/351932699850 (got "${phone.waHref}")`);
  ok(phone.barWaHref === 'https://wa.me/351932699850',
    `390 homepage: leftover bar WhatsApp stays wa.me/351932699850 (got "${phone.barWaHref}")`);
  ok(/👁 Ver o que leva/.test(phone.verText),
    `390 homepage: leftover Ver o que leva stays after open (got "${phone.verText}")`);
  ok(phone.verType === '',
    `390 homepage: leftover Ver o que leva stays without leftover type=button after open (got "${phone.verType}")`);
  ok(phone.verLabel === '',
    `390 homepage: leftover Ver o que leva stays without leftover aria-label after open (got "${phone.verLabel}")`);
  ok(phone.cartCount === '0' || phone.cartCount === '',
    `390 homepage: leftover Ver o que leva should not add leftover cabaz to leftover cart (got "${phone.cartCount}")`);

  const added = await mobile.evaluate(() => {
    const add = document.getElementById('cabaz-modal-add');
    if (!add) return { ok: false, reason: 'add missing' };
    add.click();
    const cs = document.getElementById('cs-pop');
    if (cs) cs.hidden = true;
    return {
      ok: true,
      addType: add.getAttribute('type') || '',
      addText: (add.textContent || '').trim(),
      addLabel: add.getAttribute('aria-label') || '',
    };
  });
  ok(added.ok, '390 homepage: leftover cabaz-modal add ＋ should exist to click');
  ok(added.addType === 'button',
    `390 homepage: leftover cabaz-modal add stays leftover type=button on click (got "${added.addType}")`);
  ok(added.addText === '＋', '390 homepage: leftover cabaz-modal add stays ＋ on click');
  ok(/Cabaz Detox/i.test(added.addLabel) && /Adicionar/i.test(added.addLabel),
    `390 homepage: leftover cabaz-modal add name stays on click (got "${added.addLabel}")`);
  await mobile.waitForFunction(
    () => !document.getElementById('cabaz-modal')?.classList.contains('open'),
    { timeout: 3000 }
  );

  const afterClick = await mobile.evaluate(() => {
    const modal = document.getElementById('cabaz-modal');
    const skip = document.querySelector('.cs-pop-skip');
    const privacyWa = document.querySelector('.privacy-box a[href^="https://wa.me/"]');
    const barWa = document.querySelector('.mb-item[href^="https://wa.me/"]');
    const close = document.querySelector('.cabaz-modal-close');
    const add = document.getElementById('cabaz-modal-add');
    const hamburger = document.querySelector('.hamburger');
    const navOrder = document.querySelector('.nav-order');
    const mobileClose = document.querySelector('.mobile-close');
    const searchClear = document.querySelector('.search-clear');
    const orderWa = document.querySelector('#order-form button.btn-wa');
    const ver = [...document.querySelectorAll('.cabaz-ver')]
      .find(btn => /Detox/i.test(btn.closest('.product-card')?.textContent || ''));
    const orderList = (document.getElementById('order-list')?.textContent || '').replace(/\s+/g, ' ').trim();
    return {
      modalOpen: modal?.classList.contains('open') === true,
      overflow: document.body.style.overflow,
      skipText: (skip?.textContent || '').trim(),
      waHref: privacyWa?.getAttribute('href') || '',
      barWaHref: barWa?.getAttribute('href') || '',
      verText: (ver?.textContent || '').replace(/\s+/g, ' ').trim(),
      verType: ver?.getAttribute('type') || '',
      closeText: (close?.textContent || '').trim(),
      closeType: close?.getAttribute('type') || '',
      addText: (add?.textContent || '').trim(),
      addType: add?.getAttribute('type') || '',
      hamburgerType: hamburger?.getAttribute('type') || '',
      navOrderType: navOrder?.getAttribute('type') || '',
      mobileCloseType: mobileClose?.getAttribute('type') || '',
      searchClearType: searchClear?.getAttribute('type') || '',
      orderWaType: orderWa?.getAttribute('type') || '',
      cartCount: document.getElementById('cart-count')?.textContent || '',
      orderList,
    };
  });
  ok(afterClick.modalOpen === false, '390 homepage: leftover cabaz-modal add click should hide leftover cabaz-modal');
  ok(afterClick.overflow === '',
    `390 homepage: leftover body overflow should restore after leftover cabaz-modal add (got "${afterClick.overflow}")`);
  ok(afterClick.closeText === '✕', '390 homepage: leftover cabaz-modal close stays ✕ after add');
  ok(afterClick.closeType === '',
    `390 homepage: leftover cabaz-modal close stays without leftover type=button after add (got "${afterClick.closeType}")`);
  ok(afterClick.addText === '＋', '390 homepage: leftover cabaz-modal add stays ＋ after add');
  ok(afterClick.addType === 'button',
    `390 homepage: leftover cabaz-modal-add stays leftover type=button after add (got "${afterClick.addType}")`);
  ok(/👁 Ver o que leva/.test(afterClick.verText),
    `390 homepage: leftover Ver o que leva stays after add (got "${afterClick.verText}")`);
  ok(afterClick.verType === '',
    `390 homepage: leftover Ver o que leva stays without leftover type=button after add (got "${afterClick.verType}")`);
  ok(afterClick.skipText === 'Continuar sem adicionar',
    `390 homepage: leftover Continuar sem adicionar stays after add (got "${afterClick.skipText}")`);
  ok(afterClick.waHref === 'https://wa.me/351932699850',
    `390 homepage: leftover privacy WhatsApp stays after add (got "${afterClick.waHref}")`);
  ok(afterClick.barWaHref === 'https://wa.me/351932699850',
    `390 homepage: leftover bar WhatsApp stays after add (got "${afterClick.barWaHref}")`);
  ok(afterClick.hamburgerType === '' && afterClick.navOrderType === '' &&
    afterClick.mobileCloseType === '' && afterClick.searchClearType === '',
    '390 homepage: leftover hamburger / Encomendar / mobile-close / search-clear stay without leftover type=button after add');
  ok(afterClick.orderWaType === 'submit',
    `390 homepage: leftover order WhatsApp stays leftover type=submit after add (got "${afterClick.orderWaType}")`);
  ok(afterClick.cartCount === '1',
    `390 homepage: leftover cabaz-modal add should add leftover Cabaz Detox to leftover cart (got "${afterClick.cartCount}")`);
  ok(/Cabaz Detox/i.test(afterClick.orderList),
    `390 homepage: leftover order list should name leftover Cabaz Detox after add (got "${afterClick.orderList}")`);

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
      hasHamburger: !!document.querySelector('.hamburger, #mobile-menu, [aria-label="Menu"]'),
    };
  });
  ok(cat.nav.join('|') === 'Início|Frutas|Legumes|Promoções',
    `390 Frutas: wrapping nav stays leftover Início / Frutas / Legumes / Promoções (got ${cat.nav.join(' / ')})`);
  ok(/MUNDIFRUTA/i.test(cat.footerText), `390 Frutas: leftover catalog footer stays (got "${cat.footerText}")`);
  ok(cat.footerHeight < 40, `390 Frutas: should not redo leftover catalog footer 44px tap (got ${cat.footerHeight})`);
  ok(cat.verText === 'Ver produto', `390 Frutas: leftover Ver produto copy (got "${cat.verText}")`);
  ok(!cat.hasHamburger, '390 Frutas: should not add a leftover SEO-page hamburger');

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
  const deskOpen = await openCabazDetox(desktop);
  ok(deskOpen.ok, '1280 homepage: leftover Ver o que leva should open leftover Cabaz Detox');
  const wide = await measurePage(desktop);
  ok(wide.modalOpen === true, '1280 homepage: leftover cabaz modal should open from leftover Ver o que leva');
  ok(/Cabaz Detox/i.test(wide.titleText),
    `1280 homepage: leftover Cabaz Detox name stays (got "${wide.titleText}")`);
  ok(wide.closeLabel === 'Fechar' && wide.closeText === '✕',
    `1280 homepage: leftover cabaz-modal close stays ✕ / Fechar (got "${wide.closeText}" / "${wide.closeLabel}")`);
  ok(wide.closeType === '',
    `1280 homepage: should not redo leftover cabaz-modal-close type=button (PR #303) (got "${wide.closeType}")`);
  ok(wide.closeHeight === 34 && wide.closeWidth === 34,
    `1280 homepage: leftover cabaz-modal close should stay leftover 34px circle (got ${wide.closeWidth}×${wide.closeHeight})`);
  ok(wide.addText === '＋', '1280 homepage: leftover cabaz-modal add stays ＋');
  ok(wide.addType === 'button',
    `1280 homepage: leftover cabaz-modal add should be leftover type=button (got "${wide.addType}")`);
  ok(wide.hamburgerType === '',
    `1280 homepage: should not invent leftover type=button on leftover hamburger (got "${wide.hamburgerType}")`);
  ok(wide.verType === '',
    `1280 homepage: should not redo leftover cabaz-ver type=button (PR #302) (got "${wide.verType}")`);
  ok(wide.orderWaType === 'submit',
    `1280 homepage: leftover order WhatsApp stays leftover type=submit (got "${wide.orderWaType}")`);
  ok(wide.hero.some(t => /Ver Produtos/i.test(t)), '1280 homepage: leftover Ver Produtos stays');
  ok(wide.hero.some(t => /Encomendar por WhatsApp/i.test(t)), '1280 homepage: leftover Encomendar por WhatsApp stays');
  ok(wide.waHref === 'https://wa.me/351932699850',
    `1280 homepage: leftover privacy WhatsApp stays wa.me/351932699850 (got "${wide.waHref}")`);
  ok(wide.cartCount === '0' || wide.cartCount === '',
    `1280 homepage: leftover Ver o que leva should not add leftover cabaz to leftover cart (got "${wide.cartCount}")`);

  const deskAdded = await desktop.evaluate(() => {
    const add = document.getElementById('cabaz-modal-add');
    if (!add) return { ok: false };
    add.click();
    const cs = document.getElementById('cs-pop');
    if (cs) cs.hidden = true;
    return { ok: true, addType: add.getAttribute('type') || '' };
  });
  ok(deskAdded.ok && deskAdded.addType === 'button',
    `1280 homepage: leftover cabaz-modal add click stays leftover type=button (got "${deskAdded.addType}")`);
  await desktop.waitForFunction(
    () => !document.getElementById('cabaz-modal')?.classList.contains('open'),
    { timeout: 3000 }
  );
  const deskAfter = await desktop.evaluate(() => ({
    modalOpen: document.getElementById('cabaz-modal')?.classList.contains('open') === true,
    overflow: document.body.style.overflow,
    waHref: document.querySelector('.privacy-box a[href^="https://wa.me/"]')?.getAttribute('href') || '',
    addType: document.getElementById('cabaz-modal-add')?.getAttribute('type') || '',
    closeType: document.querySelector('.cabaz-modal-close')?.getAttribute('type') || '',
    cartCount: document.getElementById('cart-count')?.textContent || '',
    orderList: (document.getElementById('order-list')?.textContent || '').replace(/\s+/g, ' ').trim(),
  }));
  ok(deskAfter.modalOpen === false, '1280 homepage: leftover cabaz-modal add click should hide leftover cabaz-modal');
  ok(deskAfter.overflow === '',
    `1280 homepage: leftover body overflow should restore after leftover cabaz-modal add (got "${deskAfter.overflow}")`);
  ok(deskAfter.addType === 'button',
    `1280 homepage: leftover cabaz-modal-add stays leftover type=button after add (got "${deskAfter.addType}")`);
  ok(deskAfter.closeType === '',
    `1280 homepage: leftover cabaz-modal-close stays without leftover type=button after add (got "${deskAfter.closeType}")`);
  ok(deskAfter.waHref === 'https://wa.me/351932699850',
    `1280 homepage: leftover privacy WhatsApp stays after add (got "${deskAfter.waHref}")`);
  ok(deskAfter.cartCount === '1',
    `1280 homepage: leftover cabaz-modal add should add leftover Cabaz Detox to leftover cart (got "${deskAfter.cartCount}")`);
  ok(/Cabaz Detox/i.test(deskAfter.orderList),
    `1280 homepage: leftover order list should name leftover Cabaz Detox after add (got "${deskAfter.orderList}")`);

  await browser.close();
  server.close();
  if (errors.length) {
    console.error('check-cabaz-modal-add-type-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
    process.exit(1);
  }
  console.log('check-cabaz-modal-add-type-browser: ok');
} catch (err) {
  try { await browser.close(); } catch {}
  try { server.close(); } catch {}
  console.error(err);
  process.exit(1);
}
