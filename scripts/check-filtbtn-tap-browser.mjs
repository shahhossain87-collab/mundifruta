#!/usr/bin/env node
/** Chrome: leftover catalog Filtros is a 44px tap target on phones. */
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

async function measureFiltros(page) {
  return page.evaluate(() => {
    const filt = document.querySelector('.filtbtn');
    const sidebar = document.getElementById('shop-sidebar');
    const backdrop = document.getElementById('shop-backdrop');
    const close = document.querySelector('.sidebar-close');
    const mobileClose = document.querySelector('.mobile-close');
    const cabazClose = document.querySelector('.cabaz-modal-close');
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
    const bar = [...document.querySelectorAll('.mb-item')].map(el =>
      (el.textContent || '').replace(/\s+/g, ' ').trim()
    );
    const privacyWa = document.querySelector('.privacy-box a[href^="https://wa.me/"]');
    const barWa = document.querySelector('.mb-item[href^="https://wa.me/"]');
    const box = filt ? filt.getBoundingClientRect() : { width: 0, height: 0 };
    const filtStyle = filt ? getComputedStyle(filt) : null;
    const closeBox = close ? close.getBoundingClientRect() : { width: 0, height: 0 };
    const tabs = [...document.querySelectorAll('#cat-tabs .cat-tab')].map(el =>
      (el.textContent || '').replace(/\s+/g, ' ').trim()
    );
    return {
      drawerOpen: sidebar?.classList.contains('open') === true,
      sidebarDisplay: sidebar ? getComputedStyle(sidebar).display : '',
      backdropHidden: backdrop ? backdrop.hidden : null,
      bodyOpen: document.body.classList.contains('filtros-open'),
      closeText: (close?.textContent || '').trim(),
      closeType: close?.getAttribute('type') || '',
      closeLabel: close?.getAttribute('aria-label') || '',
      closeHeight: closeBox.height,
      closeWidth: closeBox.width,
      filtType: filt?.getAttribute('type') || '',
      filtLabel: filt?.getAttribute('aria-label') || '',
      filtText: (filt?.textContent || '').replace(/\s+/g, ' ').trim(),
      filtDisplay: filtStyle?.display || '',
      filtHeight: box.height,
      filtWidth: box.width,
      filtMinHeight: filtStyle?.minHeight || '',
      filtMinWidth: filtStyle?.minWidth || '',
      filtPadding: filtStyle ? `${filtStyle.paddingTop} ${filtStyle.paddingRight} ${filtStyle.paddingBottom} ${filtStyle.paddingLeft}` : '',
      filtFont: filtStyle?.fontSize || '',
      mobileCloseText: (mobileClose?.textContent || '').trim(),
      mobileCloseHeight: mobileClose ? mobileClose.getBoundingClientRect().height : 0,
      cabazCloseText: (cabazClose?.textContent || '').trim(),
      cabazCloseHeight: cabazClose ? cabazClose.getBoundingClientRect().height : 0,
      productCloseText: (productClose?.textContent || '').trim(),
      productCloseHeight: productClose ? productClose.getBoundingClientRect().height : 0,
      csCloseText: (csClose?.textContent || '').trim(),
      skipText: (skip?.textContent || '').trim(),
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
      tabs,
      waHref: privacyWa?.getAttribute('href') || '',
      barWaHref: barWa?.getAttribute('href') || '',
      cartCount: document.getElementById('cart-count')?.textContent || '',
    };
  });
}

function leftoverCopy(phone, label) {
  ok(phone.filtType === 'button',
    `${label}: leftover Filtros should keep leftover type=button (got "${phone.filtType}")`);
  ok(phone.filtLabel === 'Abrir filtros e categorias',
    `${label}: leftover Filtros stays leftover Abrir filtros e categorias (got "${phone.filtLabel}")`);
  ok(/Filtros/i.test(phone.filtText),
    `${label}: leftover Filtros copy stays (got "${phone.filtText}")`);
  ok(phone.filtDisplay === 'flex' || phone.filtDisplay === 'inline-flex',
    `${label}: leftover Filtros should stay leftover flex / inline-flex on leftover drawer (got ${phone.filtDisplay})`);
  ok(phone.filtFont === '13.6px',
    `${label}: leftover Filtros stays leftover .85rem (got "${phone.filtFont}")`);
  ok(phone.closeText === '✕',
    `${label}: leftover sidebar-close stays leftover ✕ (got "${phone.closeText}")`);
  ok(phone.closeType === 'button',
    `${label}: leftover sidebar-close should keep leftover type=button (got "${phone.closeType}")`);
  ok(phone.closeLabel === 'Fechar filtros',
    `${label}: leftover sidebar-close stays leftover Fechar filtros (got "${phone.closeLabel}")`);
  ok(phone.tabs.some(t => /Frutas/i.test(t)) && phone.tabs.some(t => /Legumes/i.test(t)) &&
    phone.tabs.some(t => /Promoções/i.test(t)) && phone.tabs.some(t => /Cabazes/i.test(t)),
    `${label}: leftover drawer still lists Frutas / Legumes / Promoções / Cabazes (got ${phone.tabs.join(' / ')})`);
  ok(phone.mobileCloseText === '✕', `${label}: leftover mobile-menu close stays ✕`);
  ok(phone.cabazCloseText === '✕', `${label}: leftover cabaz-modal close stays ✕`);
  ok(phone.productCloseText === '✕', `${label}: leftover product-modal close stays ✕`);
  ok(phone.csCloseText === '✕', `${label}: leftover cross-sell close stays ✕`);
  ok(phone.skipText === 'Continuar sem adicionar',
    `${label}: leftover Continuar sem adicionar stays (got "${phone.skipText}")`);
  ok(phone.privacyCloseText === '✕', `${label}: leftover privacy close stays ✕`);
  ok(phone.resetText === 'Repor consentimento',
    `${label}: leftover Repor consentimento stays (got "${phone.resetText}")`);
  ok(phone.linkText === 'Saber mais', `${label}: leftover Saber mais stays (got "${phone.linkText}")`);
  ok(phone.noText === 'Só essenciais', `${label}: leftover Só essenciais stays (got "${phone.noText}")`);
  ok(phone.yesText === 'Aceitar tudo', `${label}: leftover Aceitar tudo stays (got "${phone.yesText}")`);
  ok(phone.orderWaType === 'submit' && /Encomendar por WhatsApp/i.test(phone.orderWaText),
    `${label}: leftover order WhatsApp stays leftover type=submit (got "${phone.orderWaType}" / "${phone.orderWaText}")`);
  ok(phone.privacyLabels.join('|') === 'WhatsApp|email',
    `${label}: leftover privacy-dialog links stay (got ${phone.privacyLabels.join(' / ')})`);
  ok(phone.privacyHrefs.join('|') === 'https://wa.me/351932699850|mailto:shahhossain87@gmail.com',
    `${label}: leftover privacy-dialog hrefs stay (got ${phone.privacyHrefs.join(' / ')})`);
  ok(phone.contactLabels.join('|') === '932 699 850|shahhossain87@gmail.com',
    `${label}: leftover Encontre-nos links stay (got ${phone.contactLabels.join(' / ')})`);
  ok(phone.creditText === 'Shah Hossain', `${label}: leftover Shah Hossain stays (got "${phone.creditText}")`);
  ok(phone.creditHref === 'mailto:shahhossain050187@gmail.com',
    `${label}: leftover Shah Hossain mailto stays (got "${phone.creditHref}")`);
  ok(phone.footerLinks.join('|') === 'Produtos|Frutas|Legumes|Quem Somos|Encomendar|Contacto|Privacidade|Créditos das fotos',
    `${label}: leftover footer shop-links stay (got ${phone.footerLinks.join(' / ')})`);
  ok(phone.hero.some(t => /Ver Produtos/i.test(t)), `${label}: leftover Ver Produtos stays`);
  ok(phone.hero.some(t => /Encomendar por WhatsApp/i.test(t)), `${label}: leftover Encomendar por WhatsApp stays`);
  ok(phone.bar.some(t => /Carrinho/i.test(t)), `${label}: leftover 4-item bar still lists Carrinho`);
  ok(phone.bar.some(t => /Promoções/i.test(t)), `${label}: leftover 4-item bar still lists Promoções`);
  ok(phone.bar.some(t => /WhatsApp/i.test(t)), `${label}: leftover 4-item bar still lists WhatsApp`);
  ok(phone.bar.some(t => /Como Chegar/i.test(t)), `${label}: leftover 4-item bar still lists Como Chegar`);
  ok(phone.bar.length === 4, `${label}: leftover 4-item bar stays (got ${phone.bar.length})`);
  ok(phone.waHref === 'https://wa.me/351932699850',
    `${label}: leftover privacy WhatsApp stays wa.me/351932699850 (got "${phone.waHref}")`);
  ok(phone.barWaHref === 'https://wa.me/351932699850',
    `${label}: leftover bar WhatsApp stays wa.me/351932699850 (got "${phone.barWaHref}")`);
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
  return added;
}

try {
  const mobile = await browser.newPage();
  mobile.on('pageerror', err => errors.push('390 pageerror: ' + err.message));
  await openReady(mobile, 390, 844);

  const barBefore = await mobile.evaluate(() =>
    [...document.querySelectorAll('.mb-item')].map(el =>
      (el.textContent || '').replace(/\s+/g, ' ').trim()
    )
  );
  ok(barBefore.some(t => /Carrinho/i.test(t)), '390 homepage: leftover 4-item bar still lists Carrinho');
  ok(barBefore.length === 4, `390 homepage: leftover 4-item bar stays (got ${barBefore.length})`);

  const phone = await measureFiltros(mobile);
  leftoverCopy(phone, '390 homepage');
  ok(phone.filtHeight >= 44,
    `390 homepage: leftover Filtros tap height >= 44px (got ${phone.filtHeight})`);
  ok(phone.filtWidth >= 44,
    `390 homepage: leftover Filtros tap width stays leftover wider than 44px (got ${phone.filtWidth})`);
  ok(phone.filtMinHeight === '44px',
    `390 homepage: leftover Filtros min-height should be leftover 44px (got ${phone.filtMinHeight})`);
  ok(phone.filtMinWidth !== '44px',
    `390 homepage: leftover Filtros should not invent leftover min-width 44px (got ${phone.filtMinWidth})`);
  ok(phone.closeHeight < 40,
    `390 homepage: should not redo leftover sidebar-close 44px tap (got ${phone.closeHeight})`);
  ok(phone.productCloseHeight < 40,
    `390 homepage: should not redo leftover product-modal-close 44px tap (got ${phone.productCloseHeight})`);
  ok(phone.privacyCloseHeight < 40,
    `390 homepage: should not redo leftover privacy-close 44px tap (got ${phone.privacyCloseHeight})`);
  ok(phone.cabazCloseHeight < 40,
    `390 homepage: should not redo leftover cabaz-modal-close 44px tap (got ${phone.cabazCloseHeight})`);
  ok(phone.mobileCloseHeight < 40,
    `390 homepage: should not redo leftover mobile-close 44px tap (got ${phone.mobileCloseHeight})`);

  const opened = await mobile.evaluate(() => {
    const filt = document.querySelector('.filtbtn');
    const sidebar = document.getElementById('shop-sidebar');
    const backdrop = document.getElementById('shop-backdrop');
    if (!filt || !sidebar) return { ok: false, reason: 'missing' };
    filt.click();
    return {
      ok: sidebar.classList.contains('open'),
      backdropHidden: backdrop ? backdrop.hidden : null,
      bodyOpen: document.body.classList.contains('filtros-open'),
    };
  });
  ok(opened.ok, `390 homepage: leftover Filtros click should open leftover filter drawer (got ${opened.reason || 'ok'})`);
  ok(opened.bodyOpen === true, '390 homepage: leftover Filtros should set leftover filtros-open');
  ok(opened.backdropHidden === false, '390 homepage: leftover shop-backdrop should show with leftover drawer');

  await mobile.evaluate(() => document.querySelector('.sidebar-close')?.click());
  const afterClick = await mobile.evaluate(() => {
    const sidebar = document.getElementById('shop-sidebar');
    const backdrop = document.getElementById('shop-backdrop');
    const privacyWa = document.querySelector('.privacy-box a[href^="https://wa.me/"]');
    const barWa = document.querySelector('.mb-item[href^="https://wa.me/"]');
    return {
      drawerOpen: sidebar?.classList.contains('open') === true,
      backdropHidden: backdrop ? backdrop.hidden : null,
      bodyOpen: document.body.classList.contains('filtros-open'),
      filtText: (document.querySelector('.filtbtn')?.textContent || '').replace(/\s+/g, ' ').trim(),
      waHref: privacyWa?.getAttribute('href') || '',
      barWaHref: barWa?.getAttribute('href') || '',
      cartCount: document.getElementById('cart-count')?.textContent || '',
    };
  });
  ok(afterClick.drawerOpen === false, '390 homepage: leftover ✕ click should hide leftover filter drawer');
  ok(afterClick.backdropHidden === true, '390 homepage: leftover ✕ click should hide leftover shop-backdrop');
  ok(afterClick.bodyOpen === false, '390 homepage: leftover ✕ click should clear leftover filtros-open');
  ok(/Filtros/i.test(afterClick.filtText), '390 homepage: leftover Filtros stays after leftover close');
  ok(afterClick.waHref === 'https://wa.me/351932699850',
    `390 homepage: leftover privacy WhatsApp stays after close (got "${afterClick.waHref}")`);
  ok(afterClick.barWaHref === 'https://wa.me/351932699850',
    `390 homepage: leftover bar WhatsApp stays after close (got "${afterClick.barWaHref}")`);
  ok(afterClick.cartCount === '0' || afterClick.cartCount === '',
    `390 homepage: leftover Filtros should not change leftover cart (got "${afterClick.cartCount}")`);

  await addMelancia(mobile, '390 homepage');
  const reopened = await mobile.evaluate(() => {
    const filt = document.querySelector('.filtbtn');
    const sidebar = document.getElementById('shop-sidebar');
    if (!filt || !sidebar) return { ok: false };
    filt.click();
    return { ok: sidebar.classList.contains('open') };
  });
  ok(reopened.ok, '390 homepage: leftover Filtros should reopen leftover filter drawer after leftover Melancia 1/4 add');
  await mobile.evaluate(() => document.querySelector('.sidebar-close')?.click());
  const afterAdd = await mobile.evaluate(() => ({
    drawerOpen: document.getElementById('shop-sidebar')?.classList.contains('open') === true,
    bodyOpen: document.body.classList.contains('filtros-open'),
    cartCount: document.getElementById('cart-count')?.textContent || '',
    barWaHref: document.querySelector('.mb-item[href^="https://wa.me/"]')?.getAttribute('href') || '',
    frutasActive: document.getElementById('tab-frutas')?.classList.contains('active') === true,
    menuOpen: document.getElementById('mobile-menu')?.classList.contains('open') === true,
  }));
  ok(afterAdd.drawerOpen === false, '390 homepage: leftover ✕ still hides leftover filter drawer after leftover Melancia 1/4 add');
  ok(afterAdd.bodyOpen === false, '390 homepage: leftover filtros-open stays leftover off after leftover Melancia 1/4 close');
  ok(afterAdd.cartCount === '1',
    `390 homepage: leftover Filtros should keep leftover Melancia 1/4 cart (got "${afterAdd.cartCount}")`);
  ok(afterAdd.frutasActive === true, '390 homepage: leftover Frutas tab stays leftover active after leftover close');
  ok(afterAdd.menuOpen === false, '390 homepage: leftover mobile-menu stays leftover closed after leftover close');
  ok(afterAdd.barWaHref === 'https://wa.me/351932699850',
    `390 homepage: leftover bar WhatsApp stays after leftover Melancia 1/4 close (got "${afterAdd.barWaHref}")`);

  const mid = await browser.newPage();
  mid.on('pageerror', err => errors.push('640 pageerror: ' + err.message));
  await openReady(mid, 640, 844);
  const midPhone = await measureFiltros(mid);
  leftoverCopy(midPhone, '640 homepage');
  ok(midPhone.filtHeight >= 44,
    `640 homepage: leftover Filtros tap height >= 44px (got ${midPhone.filtHeight})`);
  ok(midPhone.filtWidth >= 44,
    `640 homepage: leftover Filtros tap width stays leftover wider than 44px (got ${midPhone.filtWidth})`);
  const midOpen = await mid.evaluate(() => {
    const filt = document.querySelector('.filtbtn');
    const sidebar = document.getElementById('shop-sidebar');
    if (!filt || !sidebar) return { ok: false };
    filt.click();
    return { ok: sidebar.classList.contains('open') };
  });
  ok(midOpen.ok, '640 homepage: leftover Filtros click should open leftover filter drawer');
  await mid.evaluate(() => document.querySelector('.sidebar-close')?.click());
  const midClosed = await mid.evaluate(() => ({
    drawerOpen: document.getElementById('shop-sidebar')?.classList.contains('open') === true,
    bodyOpen: document.body.classList.contains('filtros-open'),
  }));
  ok(midClosed.drawerOpen === false, '640 homepage: leftover ✕ click should hide leftover filter drawer');
  ok(midClosed.bodyOpen === false, '640 homepage: leftover ✕ click should clear leftover filtros-open');

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
      hasFiltbtn: !!document.querySelector('.filtbtn, .sidebar-close'),
    };
  });
  ok(cat.nav.join('|') === 'Início|Frutas|Legumes|Promoções',
    `390 Frutas: wrapping nav stays leftover Início / Frutas / Legumes / Promoções (got ${cat.nav.join(' / ')})`);
  ok(/MUNDIFRUTA/i.test(cat.footerText), `390 Frutas: leftover catalog footer stays (got "${cat.footerText}")`);
  ok(cat.verText === 'Ver produto', `390 Frutas: leftover Ver produto copy (got "${cat.verText}")`);
  ok(!cat.hasHamburger, '390 Frutas: should not add a leftover SEO-page hamburger');
  ok(!cat.hasFiltbtn, '390 Frutas: should not add leftover catalog Filtros');

  const prodPage = await browser.newPage();
  prodPage.on('pageerror', err => errors.push('390 Melancia pageerror: ' + err.message));
  await prodPage.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true });
  await prodPage.goto(`${base}produtos/melancia-1-4/`, { waitUntil: 'networkidle0', timeout: 60000 });
  const prod = await prodPage.evaluate(() => {
    const order = document.querySelector('.seo-order-link');
    return {
      orderText: (order?.textContent || '').replace(/\s+/g, ' ').trim(),
      orderHref: order?.getAttribute('href') || '',
    };
  });
  ok(prod.orderText === 'Ver no catálogo e encomendar',
    `390 Melancia: leftover Ver no catálogo e encomendar stays (got "${prod.orderText}")`);
  ok(prod.orderHref === '/?produto=melancia-1-4#produtos',
    `390 Melancia: leftover catalog href stays (got "${prod.orderHref}")`);

  const tablet = await browser.newPage();
  tablet.on('pageerror', err => errors.push('900 pageerror: ' + err.message));
  await openReady(tablet, 900, 800);
  const tabPhone = await measureFiltros(tablet);
  leftoverCopy(tabPhone, '900 homepage');
  ok(tabPhone.filtHeight < 44,
    `900 homepage: leftover Filtros should hug leftover ⚙️ Filtros, not force 44px (got ${tabPhone.filtWidth}×${tabPhone.filtHeight})`);
  ok(tabPhone.filtMinHeight !== '44px' && tabPhone.filtMinWidth !== '44px',
    `900 homepage: leftover Filtros min-size should stay leftover auto, not 44px (got ${tabPhone.filtMinHeight} / ${tabPhone.filtMinWidth})`);
  const tabOpen = await tablet.evaluate(() => {
    const filt = document.querySelector('.filtbtn');
    const sidebar = document.getElementById('shop-sidebar');
    if (!filt || !sidebar) return { ok: false };
    filt.click();
    return { ok: sidebar.classList.contains('open') };
  });
  ok(tabOpen.ok, '900 homepage: leftover Filtros click should open leftover filter drawer');
  await tablet.evaluate(() => document.querySelector('.sidebar-close')?.click());
  const tabClosed = await tablet.evaluate(() =>
    document.getElementById('shop-sidebar')?.classList.contains('open') === true
  );
  ok(tabClosed === false, '900 homepage: leftover ✕ click should hide leftover filter drawer');

  const desktop = await browser.newPage();
  desktop.on('pageerror', err => errors.push('1280 pageerror: ' + err.message));
  await openReady(desktop, 1280, 800);
  const wide = await desktop.evaluate(() => {
    const close = document.querySelector('.sidebar-close');
    const filt = document.querySelector('.filtbtn');
    const filtStyle = filt ? getComputedStyle(filt) : null;
    const box = filt ? filt.getBoundingClientRect() : { width: 0, height: 0 };
    const privacyWa = document.querySelector('.privacy-box a[href^="https://wa.me/"]');
    const hero = [...document.querySelectorAll('.hero-ctas a')].map(a =>
      (a.textContent || '').replace(/\s+/g, ' ').trim()
    );
    return {
      closeDisplay: close ? getComputedStyle(close).display : '',
      closeText: (close?.textContent || '').trim(),
      filtDisplay: filtStyle?.display || '',
      filtMinHeight: filtStyle?.minHeight || '',
      filtMinWidth: filtStyle?.minWidth || '',
      filtHeight: box.height,
      filtWidth: box.width,
      filtText: (filt?.textContent || '').replace(/\s+/g, ' ').trim(),
      filtType: filt?.getAttribute('type') || '',
      filtLabel: filt?.getAttribute('aria-label') || '',
      waHref: privacyWa?.getAttribute('href') || '',
      hero,
    };
  });
  ok(wide.filtDisplay === 'none',
    `1280 homepage: leftover Filtros should stay leftover hidden on leftover desktop (got "${wide.filtDisplay}")`);
  ok(wide.closeDisplay === 'none',
    `1280 homepage: leftover sidebar-close should stay leftover hidden on leftover desktop (got "${wide.closeDisplay}")`);
  ok(/Filtros/i.test(wide.filtText), '1280 homepage: leftover Filtros stays leftover ⚙️ Filtros');
  ok(wide.filtType === 'button', '1280 homepage: leftover Filtros keeps leftover type=button');
  ok(wide.filtLabel === 'Abrir filtros e categorias', '1280 homepage: leftover Abrir filtros e categorias stays');
  ok(wide.filtMinHeight !== '44px' && wide.filtMinWidth !== '44px',
    `1280 homepage: leftover Filtros min-size should stay leftover auto, not 44px (got ${wide.filtMinHeight} / ${wide.filtMinWidth})`);
  ok(wide.hero.some(t => /Ver Produtos/i.test(t)), '1280 homepage: leftover Ver Produtos stays');
  ok(wide.waHref === 'https://wa.me/351932699850',
    `1280 homepage: leftover privacy WhatsApp stays wa.me/351932699850 (got "${wide.waHref}")`);

  await browser.close();
  server.close();
  if (errors.length) {
    console.error('check-filtbtn-tap-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
    process.exit(1);
  }
  console.log('check-filtbtn-tap-browser: ok');
} catch (err) {
  try { await browser.close(); } catch {}
  try { server.close(); } catch {}
  console.error(err);
  process.exit(1);
}
