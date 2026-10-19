#!/usr/bin/env node
/** Chrome: leftover mobile-menu close ✕ is a 44px tap target on phones. */
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

async function openMenu(page) {
  return page.evaluate(() => {
    const hamburger = document.querySelector('.hamburger');
    const menu = document.getElementById('mobile-menu');
    if (!hamburger || !menu) return { ok: false, reason: 'missing' };
    if (!menu.classList.contains('open')) hamburger.click();
    return {
      ok: menu.classList.contains('open'),
      hamburgerType: hamburger.getAttribute('type') || '',
      hamburgerLabel: hamburger.getAttribute('aria-label') || '',
    };
  });
}

async function measureOpenMenu(page) {
  return page.evaluate(() => {
    const hamburger = document.querySelector('.hamburger');
    const menu = document.getElementById('mobile-menu');
    const close = document.querySelector('.mobile-close');
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
    const box = close ? close.getBoundingClientRect() : { width: 0, height: 0 };
    const closeStyle = close ? getComputedStyle(close) : null;
    const menuLinks = menu
      ? [...menu.querySelectorAll('a')].map(a => (a.textContent || '').trim())
      : [];
    return {
      menuOpen: menu?.classList.contains('open') === true,
      menuDisplay: menu ? getComputedStyle(menu).display : '',
      menuLinks,
      closeText: (close?.textContent || '').trim(),
      closeType: close?.getAttribute('type') || '',
      closeLabel: close?.getAttribute('aria-label') || '',
      closeHeight: box.height,
      closeWidth: box.width,
      closeDisplay: closeStyle?.display || '',
      closeMinHeight: closeStyle?.minHeight || '',
      closeMinWidth: closeStyle?.minWidth || '',
      closeFont: closeStyle?.fontSize || '',
      hamburgerType: hamburger?.getAttribute('type') || '',
      hamburgerLabel: hamburger?.getAttribute('aria-label') || '',
      hamburgerExpanded: hamburger?.getAttribute('aria-expanded'),
      hamburgerDisplay: hamburger ? getComputedStyle(hamburger).display : '',
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
      waHref: privacyWa?.getAttribute('href') || '',
      barWaHref: barWa?.getAttribute('href') || '',
      cartCount: document.getElementById('cart-count')?.textContent || '',
    };
  });
}

function leftoverCopy(phone, label) {
  ok(phone.closeText === '✕',
    `${label}: leftover mobile-close stays leftover ✕ (got "${phone.closeText}")`);
  ok(phone.closeType === 'submit' || phone.closeType === '',
    `${label}: leftover mobile-close should stay without invented type=button (got "${phone.closeType}")`);
  ok(phone.closeLabel === '',
    `${label}: should not redo leftover mobile-close aria-label (PR #179) (got "${phone.closeLabel}")`);
  ok(phone.closeDisplay === 'flex' || phone.closeDisplay === 'inline-flex',
    `${label}: leftover mobile-close should stay leftover flex / inline-flex (got ${phone.closeDisplay})`);
  ok(phone.closeFont === '32px',
    `${label}: leftover mobile-close stays leftover 2rem ✕ (got "${phone.closeFont}")`);
  ok(phone.hamburgerType === '',
    `${label}: should not invent leftover type=button on leftover hamburger (got "${phone.hamburgerType}")`);
  ok(phone.hamburgerLabel === 'Menu',
    `${label}: leftover hamburger stays leftover Menu (got "${phone.hamburgerLabel}")`);
  ok(phone.hamburgerExpanded == null,
    `${label}: should not redo leftover hamburger aria-expanded (PR #70) (got "${phone.hamburgerExpanded}")`);
  ok(phone.menuLinks.includes('Frutas') && phone.menuLinks.includes('Legumes') &&
    phone.menuLinks.includes('Promoções') && phone.menuLinks.includes('Cabazes'),
    `${label}: leftover mobile-menu still lists Frutas / Legumes / Promoções / Cabazes (got ${phone.menuLinks.join(' / ')})`);
  ok(!phone.menuLinks.includes('Ervas') && !phone.menuLinks.includes('Época'),
    `${label}: should not redo leftover mobile-menu Ervas / Época (PR #231) (got ${phone.menuLinks.join(' / ')})`);
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

  const opened = await openMenu(mobile);
  ok(opened.ok, `390 homepage: leftover hamburger should open leftover mobile-menu (got ${opened.reason || 'ok'})`);
  const phone = await measureOpenMenu(mobile);
  ok(phone.menuOpen === true, '390 homepage: leftover mobile-menu should open from leftover hamburger');
  ok(phone.hamburgerDisplay === 'flex',
    `390 homepage: leftover hamburger should stay leftover visible flex on leftover phones (got "${phone.hamburgerDisplay}")`);
  leftoverCopy(phone, '390 homepage');
  ok(phone.closeHeight >= 44,
    `390 homepage: leftover mobile-close tap height >= 44px (got ${phone.closeHeight})`);
  ok(phone.closeWidth >= 44,
    `390 homepage: leftover mobile-close tap width >= 44px (got ${phone.closeWidth})`);
  ok(phone.productCloseHeight < 40,
    `390 homepage: should not redo leftover product-modal-close 44px tap (got ${phone.productCloseHeight})`);
  ok(phone.privacyCloseHeight < 40,
    `390 homepage: should not redo leftover privacy-close 44px tap (got ${phone.privacyCloseHeight})`);
  ok(phone.cabazCloseHeight < 40,
    `390 homepage: should not redo leftover cabaz-modal-close 44px tap (got ${phone.cabazCloseHeight})`);

  await mobile.click('.mobile-close');
  const afterClick = await mobile.evaluate(() => {
    const menu = document.getElementById('mobile-menu');
    const privacyWa = document.querySelector('.privacy-box a[href^="https://wa.me/"]');
    const barWa = document.querySelector('.mb-item[href^="https://wa.me/"]');
    return {
      menuOpen: menu?.classList.contains('open') === true,
      closeText: (document.querySelector('.mobile-close')?.textContent || '').trim(),
      waHref: privacyWa?.getAttribute('href') || '',
      barWaHref: barWa?.getAttribute('href') || '',
      cartCount: document.getElementById('cart-count')?.textContent || '',
    };
  });
  ok(afterClick.menuOpen === false, '390 homepage: leftover mobile-close click should hide leftover mobile-menu');
  ok(afterClick.closeText === '✕', '390 homepage: leftover mobile-close stays ✕ after click');
  ok(afterClick.waHref === 'https://wa.me/351932699850',
    `390 homepage: leftover privacy WhatsApp stays after close (got "${afterClick.waHref}")`);
  ok(afterClick.barWaHref === 'https://wa.me/351932699850',
    `390 homepage: leftover bar WhatsApp stays after close (got "${afterClick.barWaHref}")`);
  ok(afterClick.cartCount === '0' || afterClick.cartCount === '',
    `390 homepage: leftover close should not change leftover cart (got "${afterClick.cartCount}")`);

  await addMelancia(mobile, '390 homepage');
  const reopened = await openMenu(mobile);
  ok(reopened.ok, '390 homepage: leftover hamburger should reopen leftover mobile-menu after leftover Melancia 1/4 add');
  await mobile.click('.mobile-close');
  const afterAdd = await mobile.evaluate(() => ({
    menuOpen: document.getElementById('mobile-menu')?.classList.contains('open') === true,
    cartCount: document.getElementById('cart-count')?.textContent || '',
    barWaHref: document.querySelector('.mb-item[href^="https://wa.me/"]')?.getAttribute('href') || '',
  }));
  ok(afterAdd.menuOpen === false, '390 homepage: leftover mobile-close still hides leftover mobile-menu after leftover Melancia 1/4 add');
  ok(afterAdd.cartCount === '1',
    `390 homepage: leftover close should keep leftover Melancia 1/4 cart (got "${afterAdd.cartCount}")`);
  ok(afterAdd.barWaHref === 'https://wa.me/351932699850',
    `390 homepage: leftover bar WhatsApp stays after leftover Melancia 1/4 close (got "${afterAdd.barWaHref}")`);

  const mid = await browser.newPage();
  mid.on('pageerror', err => errors.push('640 pageerror: ' + err.message));
  await openReady(mid, 640, 844);
  const midOpen = await openMenu(mid);
  ok(midOpen.ok, '640 homepage: leftover hamburger should open leftover mobile-menu');
  const midPhone = await measureOpenMenu(mid);
  leftoverCopy(midPhone, '640 homepage');
  ok(midPhone.closeHeight >= 44,
    `640 homepage: leftover mobile-close tap height >= 44px (got ${midPhone.closeHeight})`);
  ok(midPhone.closeWidth >= 44,
    `640 homepage: leftover mobile-close tap width >= 44px (got ${midPhone.closeWidth})`);
  await mid.click('.mobile-close');
  const midClosed = await mid.evaluate(() =>
    document.getElementById('mobile-menu')?.classList.contains('open') === true
  );
  ok(midClosed === false, '640 homepage: leftover mobile-close click should hide leftover mobile-menu');

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
    };
  });
  ok(cat.nav.join('|') === 'Início|Frutas|Legumes|Promoções',
    `390 Frutas: wrapping nav stays leftover Início / Frutas / Legumes / Promoções (got ${cat.nav.join(' / ')})`);
  ok(/MUNDIFRUTA/i.test(cat.footerText), `390 Frutas: leftover catalog footer stays (got "${cat.footerText}")`);
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
    };
  });
  ok(prod.orderText === 'Ver no catálogo e encomendar',
    `390 Melancia: leftover Ver no catálogo e encomendar stays (got "${prod.orderText}")`);
  ok(prod.orderHref === '/?produto=melancia-1-4#produtos',
    `390 Melancia: leftover catalog href stays (got "${prod.orderHref}")`);

  const desktop = await browser.newPage();
  desktop.on('pageerror', err => errors.push('1280 pageerror: ' + err.message));
  await openReady(desktop, 1280, 800);
  const deskOpen = await desktop.evaluate(() => {
    const hamburger = document.querySelector('.hamburger');
    const menu = document.getElementById('mobile-menu');
    if (!menu) return { ok: false };
    menu.classList.add('open');
    return {
      ok: menu.classList.contains('open'),
      hamburgerDisplay: hamburger ? getComputedStyle(hamburger).display : '',
    };
  });
  ok(deskOpen.ok, '1280 homepage: leftover mobile-menu can be leftover unhidden for leftover measure');
  ok(deskOpen.hamburgerDisplay === 'none',
    `1280 homepage: leftover hamburger should stay leftover hidden on leftover desktop (got "${deskOpen.hamburgerDisplay}")`);
  const wide = await measureOpenMenu(desktop);
  leftoverCopy(wide, '1280 homepage');
  ok(wide.closeHeight < 44 && wide.closeWidth < 44,
    `1280 homepage: leftover mobile-close should hug leftover ✕, not force 44px (got ${wide.closeWidth}×${wide.closeHeight})`);
  ok(wide.closeMinHeight !== '44px' && wide.closeMinWidth !== '44px',
    `1280 homepage: leftover mobile-close min-size should stay leftover auto, not 44px (got ${wide.closeMinHeight} / ${wide.closeMinWidth})`);
  ok(wide.hero.some(t => /Ver Produtos/i.test(t)), '1280 homepage: leftover Ver Produtos stays');
  ok(wide.waHref === 'https://wa.me/351932699850',
    `1280 homepage: leftover privacy WhatsApp stays wa.me/351932699850 (got "${wide.waHref}")`);

  await browser.close();
  server.close();
  if (errors.length) {
    console.error('check-mobile-close-tap-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
    process.exit(1);
  }
  console.log('check-mobile-close-tap-browser: ok');
} catch (err) {
  try { await browser.close(); } catch {}
  try { server.close(); } catch {}
  console.error(err);
  process.exit(1);
}
