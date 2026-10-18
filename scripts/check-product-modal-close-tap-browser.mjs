#!/usr/bin/env node
/** Chrome: leftover product-preview modal close ✕ is a 44px tap target on phones. */
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

async function openReady(page, vw, vh, path = '/') {
  await page.setViewport({ width: vw, height: vh, deviceScaleFactor: 1, isMobile: vw <= 430 });
  await page.goto(new URL(path, base).href, { waitUntil: 'networkidle0', timeout: 60000 });
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

async function measureModal(page) {
  return page.evaluate(() => {
    const close = document.querySelector('.product-modal-close');
    const add = document.getElementById('product-modal-add');
    const qtyBtns = [...document.querySelectorAll('.product-modal-qty button')];
    const modal = document.getElementById('product-modal');
    const name = document.getElementById('product-modal-name');
    const csClose = document.querySelector('.cs-pop-close');
    const skip = document.querySelector('.cs-pop-skip');
    const cabazClose = document.querySelector('.cabaz-modal-close');
    const privacyClose = document.querySelector('.privacy-close');
    const reset = document.querySelector('.privacy-reset');
    const link = document.querySelector('.consent-link');
    const no = document.querySelector('.consent-no');
    const yes = document.querySelector('.consent-yes');
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
    return {
      closeLabel: close?.getAttribute('aria-label') || '',
      closeText: (close?.textContent || '').trim(),
      closeType: close?.getAttribute('type') || '',
      closeHeight: close ? close.getBoundingClientRect().height : 0,
      closeWidth: close ? close.getBoundingClientRect().width : 0,
      closeDisplay: close ? getComputedStyle(close).display : '',
      addText: (add?.textContent || '').trim(),
      qtyLabels: qtyBtns.map(b => b.getAttribute('aria-label') || ''),
      qtyTexts: qtyBtns.map(b => (b.textContent || '').trim()),
      modalOpen: modal?.classList.contains('open') === true,
      nameText: (name?.textContent || '').trim(),
      csCloseText: (csClose?.textContent || '').trim(),
      csCloseHeight: csClose ? csClose.getBoundingClientRect().height : 0,
      skipText: (skip?.textContent || '').trim(),
      skipHeight: skip ? skip.getBoundingClientRect().height : 0,
      cabazCloseText: (cabazClose?.textContent || '').trim(),
      cabazCloseHeight: cabazClose ? cabazClose.getBoundingClientRect().height : 0,
      cabazCloseWidth: cabazClose ? cabazClose.getBoundingClientRect().width : 0,
      privacyCloseText: (privacyClose?.textContent || '').trim(),
      privacyCloseHeight: privacyClose ? privacyClose.getBoundingClientRect().height : 0,
      resetText: (reset?.textContent || '').trim(),
      linkText: (link?.textContent || '').trim(),
      noText: (no?.textContent || '').trim(),
      yesText: (yes?.textContent || '').trim(),
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
    };
  });
}

try {
  const mobile = await browser.newPage();
  mobile.on('pageerror', err => errors.push('390 pageerror: ' + err.message));
  await openReady(mobile, 390, 844, '/?produto=melancia-1-4#produtos');
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

  const phone = await measureModal(mobile);
  ok(phone.modalOpen === true, '390 homepage: leftover product modal should open from ?produto=melancia-1-4');
  ok(/Melancia 1\/4/i.test(phone.nameText),
    `390 homepage: leftover Melancia 1/4 name stays (got "${phone.nameText}")`);
  ok(phone.closeLabel === 'Fechar' && phone.closeText === '✕',
    `390 homepage: leftover product-modal close stays ✕ / Fechar (got "${phone.closeText}" / "${phone.closeLabel}")`);
  ok(phone.closeType === 'button', '390 homepage: leftover product-modal close stays type=button');
  ok(phone.closeHeight >= 44,
    `390 homepage: leftover product-modal close tap height >= 44px (got ${phone.closeHeight})`);
  ok(phone.closeWidth >= 44,
    `390 homepage: leftover product-modal close tap width >= 44px (got ${phone.closeWidth})`);
  ok(phone.closeDisplay === 'flex' || phone.closeDisplay === 'inline-flex',
    `390 homepage: leftover product-modal close should stay leftover flex / inline-flex (got ${phone.closeDisplay})`);
  ok(phone.addText === '＋', `390 homepage: leftover product-modal add stays ＋ (got "${phone.addText}")`);
  ok(phone.qtyLabels.join('|') === 'Diminuir quantidade|Aumentar quantidade',
    `390 homepage: leftover qty names stay (got ${phone.qtyLabels.join(' / ')})`);
  ok(phone.qtyTexts.join('|') === '−|+',
    `390 homepage: leftover qty glyphs stay (got ${phone.qtyTexts.join(' / ')})`);
  ok(phone.csCloseText === '✕', '390 homepage: leftover cross-sell close stays ✕');
  ok(phone.csCloseHeight < 40,
    `390 homepage: should not redo leftover cs-pop-close 44px tap (got ${phone.csCloseHeight})`);
  ok(phone.skipText === 'Continuar sem adicionar',
    `390 homepage: leftover Continuar sem adicionar stays (got "${phone.skipText}")`);
  ok(phone.skipHeight < 50,
    `390 homepage: should not redo leftover Continuar sem adicionar 44px tap (got ${phone.skipHeight})`);
  ok(phone.cabazCloseText === '✕', '390 homepage: leftover cabaz-modal close stays ✕');
  ok(phone.cabazCloseHeight < 40 && phone.cabazCloseWidth < 40,
    `390 homepage: should not redo leftover cabaz-modal close 34px (got ${phone.cabazCloseWidth}×${phone.cabazCloseHeight})`);
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
  ok(phone.bar.some(t => /Promoções/i.test(t)), '390 homepage: leftover 4-item bar still lists Promoções');
  ok(phone.bar.some(t => /WhatsApp/i.test(t)), '390 homepage: leftover 4-item bar still lists WhatsApp');
  ok(phone.bar.some(t => /Como Chegar/i.test(t)), '390 homepage: leftover 4-item bar still lists Como Chegar');
  ok(phone.bar.length === 4, `390 homepage: leftover 4-item bar stays (got ${phone.bar.length})`);
  ok(phone.waHref === 'https://wa.me/351932699850',
    `390 homepage: leftover privacy WhatsApp stays wa.me/351932699850 (got "${phone.waHref}")`);
  ok(phone.barWaHref === 'https://wa.me/351932699850',
    `390 homepage: leftover bar WhatsApp stays wa.me/351932699850 (got "${phone.barWaHref}")`);

  await mobile.click('.product-modal-close');
  const afterClick = await mobile.evaluate(() => {
    const modal = document.getElementById('product-modal');
    const skip = document.querySelector('.cs-pop-skip');
    const privacyWa = document.querySelector('.privacy-box a[href^="https://wa.me/"]');
    const barWa = document.querySelector('.mb-item[href^="https://wa.me/"]');
    return {
      modalOpen: modal?.classList.contains('open') === true,
      overflow: document.body.style.overflow,
      skipText: (skip?.textContent || '').trim(),
      waHref: privacyWa?.getAttribute('href') || '',
      barWaHref: barWa?.getAttribute('href') || '',
      closeText: (document.querySelector('.product-modal-close')?.textContent || '').trim(),
    };
  });
  ok(afterClick.modalOpen === false, '390 homepage: leftover product-modal close click should hide leftover product-modal');
  ok(afterClick.overflow === '',
    `390 homepage: leftover body overflow should restore after close (got "${afterClick.overflow}")`);
  ok(afterClick.closeText === '✕', '390 homepage: leftover product-modal close stays ✕ after click');
  ok(afterClick.skipText === 'Continuar sem adicionar',
    `390 homepage: leftover Continuar sem adicionar stays after close (got "${afterClick.skipText}")`);
  ok(afterClick.waHref === 'https://wa.me/351932699850',
    `390 homepage: leftover privacy WhatsApp stays after close (got "${afterClick.waHref}")`);
  ok(afterClick.barWaHref === 'https://wa.me/351932699850',
    `390 homepage: leftover bar WhatsApp stays after close (got "${afterClick.barWaHref}")`);

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
  await openReady(desktop, 1280, 800, '/?produto=melancia-1-4#produtos');
  const wide = await measureModal(desktop);
  ok(wide.modalOpen === true, '1280 homepage: leftover product modal should open from ?produto=melancia-1-4');
  ok(/Melancia 1\/4/i.test(wide.nameText),
    `1280 homepage: leftover Melancia 1/4 name stays (got "${wide.nameText}")`);
  ok(wide.closeLabel === 'Fechar' && wide.closeText === '✕',
    `1280 homepage: leftover product-modal close stays ✕ / Fechar (got "${wide.closeText}" / "${wide.closeLabel}")`);
  ok(wide.closeHeight === 38 && wide.closeWidth === 38,
    `1280 homepage: leftover product-modal close should stay leftover 38px circle, not force 44px (got ${wide.closeWidth}×${wide.closeHeight})`);
  ok(wide.addText === '＋', '1280 homepage: leftover product-modal add stays ＋');
  ok(wide.hero.some(t => /Ver Produtos/i.test(t)), '1280 homepage: leftover Ver Produtos stays');
  ok(wide.hero.some(t => /Encomendar por WhatsApp/i.test(t)), '1280 homepage: leftover Encomendar por WhatsApp stays');
  ok(wide.waHref === 'https://wa.me/351932699850',
    `1280 homepage: leftover privacy WhatsApp stays wa.me/351932699850 (got "${wide.waHref}")`);

  await browser.close();
  server.close();
  if (errors.length) {
    console.error('check-product-modal-close-tap-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
    process.exit(1);
  }
  console.log('check-product-modal-close-tap-browser: ok');
} catch (err) {
  try { await browser.close(); } catch {}
  try { server.close(); } catch {}
  console.error(err);
  process.exit(1);
}
