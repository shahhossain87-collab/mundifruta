#!/usr/bin/env node
/** Chrome: leftover consent-banner Saber mais is a 44px tap target on phones. */
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

async function openHomeWithConsent(page, vw, vh) {
  await page.setViewport({ width: vw, height: vh, deviceScaleFactor: 1, isMobile: vw <= 430 });
  await page.goto(base, { waitUntil: 'networkidle0', timeout: 60000 });
  await page.evaluate(() => {
    try { localStorage.removeItem('mf_consent'); } catch (e) {}
    try { localStorage.removeItem('mf_cart'); } catch (e) {}
    try { localStorage.setItem('mf_coupon', JSON.stringify({ code: 'WELCOME', status: 'dismissed', issuedAt: Date.now() })); } catch (e) {}
  });
  await page.reload({ waitUntil: 'networkidle0', timeout: 60000 });
  await page.evaluate(() => {
    const c = document.getElementById('consent'); if (c) c.hidden = false;
    const o = document.getElementById('offer-pop'); if (o) o.hidden = true;
  });
}

async function measureConsent(page) {
  return page.evaluate(() => {
    const link = document.querySelector('.consent-link');
    const no = document.querySelector('.consent-no');
    const yes = document.querySelector('.consent-yes');
    const close = document.querySelector('.privacy-close');
    const reset = document.querySelector('.privacy-reset');
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
    return {
      linkText: (link?.textContent || '').trim(),
      linkType: link?.getAttribute('type') || '',
      linkHeight: link ? link.getBoundingClientRect().height : 0,
      linkWidth: link ? link.getBoundingClientRect().width : 0,
      linkDisplay: link ? getComputedStyle(link).display : '',
      linkColor: link ? getComputedStyle(link).color : '',
      noText: (no?.textContent || '').trim(),
      yesText: (yes?.textContent || '').trim(),
      consentHidden: document.getElementById('consent')?.hidden === true,
      closeLabel: close?.getAttribute('aria-label') || '',
      closeText: (close?.textContent || '').trim(),
      closeHeight: close ? close.getBoundingClientRect().height : 0,
      resetText: (reset?.textContent || '').trim(),
      privacyLabels: privacyLinks.map(a => (a.textContent || '').trim()),
      privacyHrefs: privacyLinks.map(a => a.getAttribute('href') || ''),
      privacyHeights: privacyLinks.map(a => a.getBoundingClientRect().height),
      modalHidden: document.getElementById('privacy-modal')?.hidden === true,
      contactLabels: contact.map(a => (a.textContent || '').trim()),
      contactHeights: contact.map(a => a.getBoundingClientRect().height),
      creditText: (credit?.textContent || '').trim(),
      creditHref: credit?.getAttribute('href') || '',
      creditHeight: credit ? credit.getBoundingClientRect().height : 0,
      footerLinks: footerLinks.map(a => (a.textContent || '').trim()),
      footerLinkHeights: footerLinks.map(a => a.getBoundingClientRect().height),
      hero,
      bar,
    };
  });
}

try {
  const mobile = await browser.newPage();
  mobile.on('pageerror', err => errors.push('390 pageerror: ' + err.message));
  await openHomeWithConsent(mobile, 390, 844);
  const phone = await measureConsent(mobile);
  ok(phone.consentHidden === false, '390 homepage: leftover consent banner should show');
  ok(phone.linkText === 'Saber mais',
    `390 homepage: leftover Saber mais stays (got "${phone.linkText}")`);
  ok(phone.linkType === 'button', '390 homepage: leftover Saber mais stays type=button');
  ok(phone.linkHeight >= 44,
    `390 homepage: leftover Saber mais tap height >= 44px (got ${phone.linkHeight})`);
  ok(phone.linkDisplay === 'flex' || phone.linkDisplay === 'inline-flex',
    `390 homepage: leftover Saber mais should stay leftover flex / inline-flex (got ${phone.linkDisplay})`);
  ok(phone.linkWidth > 40 && phone.linkWidth < 200,
    `390 homepage: leftover Saber mais should hug the label (got width ${phone.linkWidth})`);
  ok(phone.noText === 'Só essenciais',
    `390 homepage: leftover Só essenciais stays (got "${phone.noText}")`);
  ok(phone.yesText === 'Aceitar tudo',
    `390 homepage: leftover Aceitar tudo stays (got "${phone.yesText}")`);
  ok(phone.closeLabel === 'Fechar' && phone.closeText === '✕',
    `390 homepage: leftover privacy close stays ✕ / Fechar (got "${phone.closeText}" / "${phone.closeLabel}")`);
  ok(phone.closeHeight < 40,
    `390 homepage: should not redo leftover privacy-close 44px tap (got ${phone.closeHeight})`);
  ok(phone.resetText === 'Repor consentimento',
    `390 homepage: leftover Repor consentimento stays (got "${phone.resetText}")`);
  ok(phone.privacyLabels.join('|') === 'WhatsApp|email',
    `390 homepage: leftover privacy-dialog links stay (got ${phone.privacyLabels.join(' / ')})`);
  for (let i = 0; i < phone.privacyHeights.length; i++) {
    ok(phone.privacyHeights[i] < 40,
      `390 homepage: should not redo leftover privacy ${phone.privacyLabels[i]} 44px tap (got ${phone.privacyHeights[i]})`);
  }
  ok(phone.contactLabels.join('|') === '932 699 850|shahhossain87@gmail.com',
    `390 homepage: leftover Encontre-nos links stay (got ${phone.contactLabels.join(' / ')})`);
  for (let i = 0; i < phone.contactHeights.length; i++) {
    ok(phone.contactHeights[i] < 40,
      `390 homepage: should not redo leftover Encontre-nos ${phone.contactLabels[i]} 44px tap (got ${phone.contactHeights[i]})`);
  }
  ok(phone.creditText === 'Shah Hossain',
    `390 homepage: leftover Shah Hossain stays (got "${phone.creditText}")`);
  ok(phone.creditHref === 'mailto:shahhossain050187@gmail.com',
    `390 homepage: leftover Shah Hossain mailto stays (got "${phone.creditHref}")`);
  ok(phone.creditHeight < 40,
    `390 homepage: should not redo leftover footer-credit 44px tap (got ${phone.creditHeight})`);
  ok(phone.footerLinks.join('|') === 'Produtos|Frutas|Legumes|Quem Somos|Encomendar|Contacto|Privacidade|Créditos das fotos',
    `390 homepage: leftover footer shop-links stay (got ${phone.footerLinks.join(' / ')})`);
  for (let i = 0; i < phone.footerLinkHeights.length; i++) {
    ok(phone.footerLinkHeights[i] < 40,
      `390 homepage: should not redo leftover footer ${phone.footerLinks[i]} 44px tap (got ${phone.footerLinkHeights[i]})`);
  }
  ok(phone.hero.some(t => /Ver Produtos/i.test(t)), '390 homepage: leftover Ver Produtos stays');
  ok(phone.hero.some(t => /Encomendar por WhatsApp/i.test(t)), '390 homepage: leftover Encomendar por WhatsApp stays');
  ok(phone.bar.some(t => /Carrinho/i.test(t)), '390 homepage: leftover 4-item bar still lists Carrinho');
  ok(phone.bar.some(t => /Promoções/i.test(t)), '390 homepage: leftover 4-item bar still lists Promoções');
  ok(phone.bar.some(t => /WhatsApp/i.test(t)), '390 homepage: leftover 4-item bar still lists WhatsApp');
  ok(phone.bar.some(t => /Como Chegar/i.test(t)), '390 homepage: leftover 4-item bar still lists Como Chegar');
  ok(phone.bar.length === 4, `390 homepage: leftover 4-item bar stays (got ${phone.bar.length})`);

  await mobile.click('.consent-link');
  const afterClick = await mobile.evaluate(() => {
    const modal = document.getElementById('privacy-modal');
    const links = [...document.querySelectorAll('.privacy-box a')];
    const close = document.querySelector('.privacy-close');
    const reset = document.querySelector('.privacy-reset');
    return {
      modalHidden: modal?.hidden === true,
      hrefs: links.map(a => a.getAttribute('href') || ''),
      labels: links.map(a => (a.textContent || '').trim()),
      heights: links.map(a => a.getBoundingClientRect().height),
      closeLabel: close?.getAttribute('aria-label') || '',
      closeText: (close?.textContent || '').trim(),
      closeHeight: close ? close.getBoundingClientRect().height : 0,
      resetText: (reset?.textContent || '').trim(),
      resetHeight: reset ? reset.getBoundingClientRect().height : 0,
    };
  });
  ok(afterClick.modalHidden === false, '390 homepage: leftover Saber mais click should open leftover privacy-dialog');
  ok(afterClick.labels.join('|') === 'WhatsApp|email',
    `390 homepage: leftover privacy-dialog links stay after Saber mais (got ${afterClick.labels.join(' / ')})`);
  ok(afterClick.hrefs.join('|') === 'https://wa.me/351932699850|mailto:shahhossain87@gmail.com',
    `390 homepage: leftover privacy-dialog hrefs stay after Saber mais (got ${afterClick.hrefs.join(' / ')})`);
  for (let i = 0; i < afterClick.heights.length; i++) {
    ok(afterClick.heights[i] < 40,
      `390 homepage: leftover Saber mais should not redo leftover privacy ${afterClick.labels[i]} 44px tap (got ${afterClick.heights[i]})`);
  }
  ok(afterClick.closeLabel === 'Fechar' && afterClick.closeText === '✕',
    `390 homepage: leftover privacy close stays ✕ / Fechar after Saber mais (got "${afterClick.closeText}" / "${afterClick.closeLabel}")`);
  ok(afterClick.closeHeight < 40,
    `390 homepage: leftover Saber mais should not redo leftover privacy-close 44px tap (got ${afterClick.closeHeight})`);
  ok(afterClick.resetText === 'Repor consentimento',
    `390 homepage: leftover Repor consentimento stays after Saber mais (got "${afterClick.resetText}")`);
  ok(afterClick.resetHeight < 50,
    `390 homepage: leftover Saber mais should not redo leftover Repor consentimento 44px tap (got ${afterClick.resetHeight})`);

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
  await openHomeWithConsent(desktop, 1280, 800);
  const wide = await measureConsent(desktop);
  ok(wide.consentHidden === false, '1280 homepage: leftover consent banner should show');
  ok(wide.linkText === 'Saber mais',
    `1280 homepage: leftover Saber mais stays (got "${wide.linkText}")`);
  ok(wide.linkHeight < 44,
    `1280 homepage: leftover Saber mais should hug the label, not force 44px (got ${wide.linkHeight})`);
  ok(wide.noText === 'Só essenciais', '1280 homepage: leftover Só essenciais stays');
  ok(wide.yesText === 'Aceitar tudo', '1280 homepage: leftover Aceitar tudo stays');
  ok(wide.hero.some(t => /Ver Produtos/i.test(t)), '1280 homepage: leftover Ver Produtos stays');
  ok(wide.hero.some(t => /Encomendar por WhatsApp/i.test(t)), '1280 homepage: leftover Encomendar por WhatsApp stays');

  await browser.close();
  server.close();
  if (errors.length) {
    console.error('check-consent-link-tap-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
    process.exit(1);
  }
  console.log('check-consent-link-tap-browser: ok');
} catch (err) {
  try { await browser.close(); } catch {}
  try { server.close(); } catch {}
  console.error(err);
  process.exit(1);
}
