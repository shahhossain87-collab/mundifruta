#!/usr/bin/env node
/** Chrome: leftover cabaz-ver / 👁 Ver o que leva is type=button. */
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

async function findCabazDetoxVer(page) {
  return page.evaluate(() => {
    const card = [...document.querySelectorAll('#grid-cabazes .product-card')]
      .find(c => /Cabaz Detox/i.test(c.textContent || ''));
    const ver = card ? card.querySelector('.cabaz-ver') : null;
    if (!ver) return { ok: false, reason: 'ver missing' };
    return {
      ok: true,
      verText: (ver.textContent || '').replace(/\s+/g, ' ').trim(),
      verType: ver.getAttribute('type') || '',
      verLabel: ver.getAttribute('aria-label') || '',
      verHeight: ver.getBoundingClientRect().height,
      verWidth: ver.getBoundingClientRect().width,
    };
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
      modalOpen: modal?.classList.contains('open') === true,
      titleText: (title?.textContent || '').trim(),
      subText: (sub?.textContent || '').trim(),
      productCloseText: (productClose?.textContent || '').trim(),
      productCloseType: productClose?.getAttribute('type') || '',
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
    };
  });
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
  ok(barBefore.some(t => /Promoções/i.test(t)), '390 homepage: leftover 4-item bar still lists Promoções');
  ok(barBefore.some(t => /WhatsApp/i.test(t)), '390 homepage: leftover 4-item bar still lists WhatsApp');
  ok(barBefore.some(t => /Como Chegar/i.test(t)), '390 homepage: leftover 4-item bar still lists Como Chegar');
  ok(barBefore.length === 4, `390 homepage: leftover 4-item bar stays (got ${barBefore.length})`);

  const before = await findCabazDetoxVer(mobile);
  ok(before.ok, `390 homepage: leftover Cabaz Detox Ver o que leva should exist (${before.reason || 'ok'})`);
  ok(/👁 Ver o que leva/.test(before.verText || ''),
    `390 homepage: leftover Ver o que leva stays (got "${before.verText}")`);
  ok(before.verType === 'button',
    `390 homepage: leftover Ver o que leva should be leftover type=button (got "${before.verType}")`);
  ok(before.verLabel === '',
    `390 homepage: should not redo leftover cabaz-ver aria-label (got "${before.verLabel}")`);
  ok(before.verHeight < 44,
    `390 homepage: should not redo leftover cabaz-ver 44px tap (got ${before.verHeight})`);

  const opened = await openCabazDetox(mobile);
  ok(opened.ok, `390 homepage: leftover Ver o que leva should open leftover Cabaz Detox (${opened.reason || 'ok'})`);
  ok(/👁 Ver o que leva/.test(opened.verText || ''),
    `390 homepage: leftover Ver o que leva stays after click (got "${opened.verText}")`);
  ok(opened.verType === 'button',
    `390 homepage: leftover Ver o que leva stays leftover type=button after click (got "${opened.verType}")`);

  const phone = await measurePage(mobile);
  ok(phone.modalOpen === true, '390 homepage: leftover cabaz modal should open from leftover Ver o que leva');
  ok(/Cabaz Detox/i.test(phone.titleText),
    `390 homepage: leftover Cabaz Detox name stays (got "${phone.titleText}")`);
  ok(phone.subText === 'Este cabaz é composto pelos seguintes itens:',
    `390 homepage: leftover composition copy stays (got "${phone.subText}")`);
  ok(phone.closeLabel === 'Fechar' && phone.closeText === '✕',
    `390 homepage: leftover cabaz-modal close stays ✕ / Fechar (got "${phone.closeText}" / "${phone.closeLabel}")`);
  ok(phone.closeType === '',
    `390 homepage: should not invent leftover type=button on leftover cabaz-modal-close (got "${phone.closeType}")`);
  ok(phone.closeHeight === 34 && phone.closeWidth === 34,
    `390 homepage: leftover cabaz-modal close should stay leftover 34px circle (got ${phone.closeWidth}×${phone.closeHeight})`);
  ok(phone.addText === '＋', '390 homepage: leftover cabaz-modal add stays ＋');
  ok(phone.addType === '',
    `390 homepage: should not invent leftover type=button on leftover cabaz-modal-add (got "${phone.addType}")`);
  ok(phone.productCloseText === '✕', '390 homepage: leftover product-modal close stays ✕');
  ok(phone.productCloseType === 'button', '390 homepage: leftover product-modal close stays leftover type=button');
  ok(phone.csCloseText === '✕', '390 homepage: leftover cross-sell close stays ✕');
  ok(phone.skipText === 'Continuar sem adicionar',
    `390 homepage: leftover Continuar sem adicionar stays (got "${phone.skipText}")`);
  ok(phone.privacyCloseText === '✕', '390 homepage: leftover privacy close stays ✕');
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
  ok(phone.verType === 'button',
    `390 homepage: leftover Ver o que leva stays leftover type=button after open (got "${phone.verType}")`);
  ok(phone.verLabel === '',
    `390 homepage: leftover Ver o que leva stays without leftover aria-label after open (got "${phone.verLabel}")`);

  const afterClick = await mobile.evaluate(() => {
    const modal = document.getElementById('cabaz-modal');
    const skip = document.querySelector('.cs-pop-skip');
    const privacyWa = document.querySelector('.privacy-box a[href^="https://wa.me/"]');
    const barWa = document.querySelector('.mb-item[href^="https://wa.me/"]');
    const ver = [...document.querySelectorAll('.cabaz-ver')]
      .find(btn => /Detox/i.test(btn.closest('.product-card')?.textContent || ''));
    return {
      modalOpen: modal?.classList.contains('open') === true,
      overflow: document.body.style.overflow,
      skipText: (skip?.textContent || '').trim(),
      waHref: privacyWa?.getAttribute('href') || '',
      barWaHref: barWa?.getAttribute('href') || '',
      verText: (ver?.textContent || '').replace(/\s+/g, ' ').trim(),
      verType: ver?.getAttribute('type') || '',
      closeText: (document.querySelector('.cabaz-modal-close')?.textContent || '').trim(),
      cartCount: document.getElementById('cart-count')?.textContent || '',
    };
  });
  ok(afterClick.modalOpen === true, '390 homepage: leftover Ver o que leva click should keep leftover cabaz-modal open');
  ok(afterClick.overflow === 'hidden',
    `390 homepage: leftover body overflow should lock while leftover cabaz-modal is open (got "${afterClick.overflow}")`);
  ok(/👁 Ver o que leva/.test(afterClick.verText),
    `390 homepage: leftover Ver o que leva stays after click (got "${afterClick.verText}")`);
  ok(afterClick.verType === 'button',
    `390 homepage: leftover Ver o que leva stays leftover type=button after open (got "${afterClick.verType}")`);
  ok(afterClick.closeText === '✕', '390 homepage: leftover cabaz-modal close stays ✕ after open');
  ok(afterClick.skipText === 'Continuar sem adicionar',
    `390 homepage: leftover Continuar sem adicionar stays after open (got "${afterClick.skipText}")`);
  ok(afterClick.waHref === 'https://wa.me/351932699850',
    `390 homepage: leftover privacy WhatsApp stays after open (got "${afterClick.waHref}")`);
  ok(afterClick.barWaHref === 'https://wa.me/351932699850',
    `390 homepage: leftover bar WhatsApp stays after open (got "${afterClick.barWaHref}")`);
  ok(afterClick.cartCount === '0' || afterClick.cartCount === '',
    `390 homepage: leftover Ver o que leva should not add leftover cabaz to leftover cart (got "${afterClick.cartCount}")`);

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
  const deskVer = await findCabazDetoxVer(desktop);
  ok(deskVer.ok, '1280 homepage: leftover Cabaz Detox Ver o que leva should exist');
  ok(/👁 Ver o que leva/.test(deskVer.verText || ''),
    `1280 homepage: leftover Ver o que leva stays (got "${deskVer.verText}")`);
  ok(deskVer.verType === 'button',
    `1280 homepage: leftover Ver o que leva should be leftover type=button (got "${deskVer.verType}")`);
  ok(deskVer.verLabel === '',
    `1280 homepage: should not redo leftover cabaz-ver aria-label on desktop (got "${deskVer.verLabel}")`);
  ok(deskVer.verHeight < 44,
    `1280 homepage: leftover Ver o que leva should hug leftover sage padding, not force 44px (got ${deskVer.verHeight})`);
  const deskOpen = await openCabazDetox(desktop);
  ok(deskOpen.ok, '1280 homepage: leftover Ver o que leva should open leftover Cabaz Detox');
  const wide = await measurePage(desktop);
  ok(wide.modalOpen === true, '1280 homepage: leftover cabaz modal should open from leftover Ver o que leva');
  ok(/Cabaz Detox/i.test(wide.titleText),
    `1280 homepage: leftover Cabaz Detox name stays (got "${wide.titleText}")`);
  ok(wide.closeLabel === 'Fechar' && wide.closeText === '✕',
    `1280 homepage: leftover cabaz-modal close stays ✕ / Fechar (got "${wide.closeText}" / "${wide.closeLabel}")`);
  ok(wide.closeType === '',
    `1280 homepage: should not invent leftover type=button on leftover cabaz-modal-close (got "${wide.closeType}")`);
  ok(wide.closeHeight === 34 && wide.closeWidth === 34,
    `1280 homepage: leftover cabaz-modal close should stay leftover 34px circle (got ${wide.closeWidth}×${wide.closeHeight})`);
  ok(wide.addText === '＋', '1280 homepage: leftover cabaz-modal add stays ＋');
  ok(wide.addType === '',
    `1280 homepage: should not invent leftover type=button on leftover cabaz-modal-add (got "${wide.addType}")`);
  ok(wide.hamburgerType === '',
    `1280 homepage: should not invent leftover type=button on leftover hamburger (got "${wide.hamburgerType}")`);
  ok(wide.hero.some(t => /Ver Produtos/i.test(t)), '1280 homepage: leftover Ver Produtos stays');
  ok(wide.hero.some(t => /Encomendar por WhatsApp/i.test(t)), '1280 homepage: leftover Encomendar por WhatsApp stays');
  ok(wide.waHref === 'https://wa.me/351932699850',
    `1280 homepage: leftover privacy WhatsApp stays wa.me/351932699850 (got "${wide.waHref}")`);

  await browser.close();
  server.close();
  if (errors.length) {
    console.error('check-cabaz-ver-type-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
    process.exit(1);
  }
  console.log('check-cabaz-ver-type-browser: ok');
} catch (err) {
  try { await browser.close(); } catch {}
  try { server.close(); } catch {}
  console.error(err);
  process.exit(1);
}
