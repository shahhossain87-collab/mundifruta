#!/usr/bin/env node
/** Chrome: leftover privacy-dialog WhatsApp / email are 44px tap targets on phones. */
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

async function openHome(page, vw, vh) {
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

async function openPrivacy(page) {
  await page.evaluate(() => {
    if (typeof window.abrirPrivacidade === 'function') window.abrirPrivacidade();
    else {
      const modal = document.getElementById('privacy-modal');
      if (modal) modal.hidden = false;
    }
  });
}

async function measurePrivacy(page) {
  return page.evaluate(() => {
    const links = [...document.querySelectorAll('.privacy-box a')];
    const close = document.querySelector('.privacy-close');
    const reset = document.querySelector('.privacy-reset');
    const title = document.getElementById('privacy-title');
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
      labels: links.map(a => (a.textContent || '').trim()),
      hrefs: links.map(a => a.getAttribute('href') || ''),
      targets: links.map(a => a.getAttribute('target') || ''),
      rels: links.map(a => a.getAttribute('rel') || ''),
      heights: links.map(a => a.getBoundingClientRect().height),
      widths: links.map(a => a.getBoundingClientRect().width),
      displays: links.map(a => getComputedStyle(a).display),
      colors: links.map(a => getComputedStyle(a).color),
      title: (title?.textContent || '').trim(),
      closeLabel: close?.getAttribute('aria-label') || '',
      closeText: (close?.textContent || '').trim(),
      closeHeight: close ? close.getBoundingClientRect().height : 0,
      resetText: (reset?.textContent || '').trim(),
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
  await openHome(mobile, 390, 844);
  await openPrivacy(mobile);
  const phone = await measurePrivacy(mobile);
  ok(phone.modalHidden === false, '390 homepage: leftover privacy-dialog should open');
  ok(phone.title === 'Política de Privacidade',
    `390 homepage: leftover privacy title stays (got "${phone.title}")`);
  ok(phone.labels.join('|') === 'WhatsApp|email',
    `390 homepage: leftover privacy-dialog links stay (got ${phone.labels.join(' / ')})`);
  ok(phone.hrefs.join('|') === 'https://wa.me/351932699850|mailto:shahhossain87@gmail.com',
    `390 homepage: leftover privacy-dialog hrefs stay (got ${phone.hrefs.join(' / ')})`);
  ok(phone.targets[0] === '_blank' && phone.rels[0] === 'noopener',
    '390 homepage: leftover privacy WhatsApp keeps leftover target=_blank rel=noopener');
  for (let i = 0; i < phone.heights.length; i++) {
    ok(phone.heights[i] >= 44,
      `390 homepage: leftover ${phone.labels[i]} tap height >= 44px (got ${phone.heights[i]})`);
    ok(phone.displays[i] === 'flex' || phone.displays[i] === 'inline-flex',
      `390 homepage: leftover ${phone.labels[i]} should stay leftover flex / inline-flex (got ${phone.displays[i]})`);
    ok(phone.widths[i] > 20 && phone.widths[i] < 200,
      `390 homepage: leftover ${phone.labels[i]} should hug the label (got width ${phone.widths[i]})`);
  }
  ok(phone.closeLabel === 'Fechar' && phone.closeText === '✕',
    `390 homepage: leftover privacy close stays ✕ / Fechar (got "${phone.closeText}" / "${phone.closeLabel}")`);
  ok(phone.closeHeight < 40,
    `390 homepage: should not redo leftover privacy-close 44px tap (got ${phone.closeHeight})`);
  ok(phone.resetText === 'Repor consentimento',
    `390 homepage: leftover Repor consentimento stays (got "${phone.resetText}")`);
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
  ok(phone.bar.some(t => /Carrinho/i.test(t)), '390 homepage: 4-item bar still lists Carrinho');
  ok(phone.bar.some(t => /Promoções/i.test(t)), '390 homepage: 4-item bar still lists Promoções');
  ok(phone.bar.some(t => /WhatsApp/i.test(t)), '390 homepage: 4-item bar still lists WhatsApp');
  ok(phone.bar.some(t => /Como Chegar/i.test(t)), '390 homepage: 4-item bar still lists Como Chegar');
  ok(phone.bar.length === 4, `390 homepage: leftover 4-item bar stays (got ${phone.bar.length})`);

  const waClick = await mobile.evaluate(() => {
    const a = document.querySelector('.privacy-box a[href^="https://wa.me/"]');
    if (!a) return { ok: false, reason: 'whatsapp missing' };
    let href = '';
    a.addEventListener('click', event => {
      event.preventDefault();
      href = a.getAttribute('href') || '';
    }, { once: true });
    a.click();
    return { ok: true, href, text: (a.textContent || '').trim() };
  });
  ok(waClick.ok, '390 homepage: leftover privacy WhatsApp is clickable');
  ok(waClick.href === 'https://wa.me/351932699850' && waClick.text === 'WhatsApp',
    `390 homepage: leftover WhatsApp click keeps leftover wa.me/351932699850 (got "${waClick.href}" / "${waClick.text}")`);

  const mailClick = await mobile.evaluate(() => {
    const a = document.querySelector('.privacy-box a[href^="mailto:"]');
    if (!a) return { ok: false, reason: 'mailto missing' };
    let href = '';
    a.addEventListener('click', event => {
      event.preventDefault();
      href = a.getAttribute('href') || '';
    }, { once: true });
    a.click();
    return { ok: true, href, text: (a.textContent || '').trim() };
  });
  ok(mailClick.ok, '390 homepage: leftover privacy email is clickable');
  ok(mailClick.href === 'mailto:shahhossain87@gmail.com' && mailClick.text === 'email',
    `390 homepage: leftover mailto click keeps leftover shahhossain87@gmail.com (got "${mailClick.href}" / "${mailClick.text}")`);

  await mobile.evaluate(() => {
    if (typeof window.fecharPrivacidade === 'function') window.fecharPrivacidade();
    else {
      const modal = document.getElementById('privacy-modal');
      if (modal) modal.hidden = true;
    }
  });

  const added = await mobile.evaluate(() => {
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
  ok(added.ok && added.count === '1', `390 homepage: add Melancia 1/4 (count=${added.count})`);

  const catPage = await browser.newPage();
  catPage.on('pageerror', err => errors.push('390 Frutas pageerror: ' + err.message));
  await catPage.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true });
  await catPage.goto(`${base}categorias/frutas/`, { waitUntil: 'networkidle0', timeout: 60000 });
  const cat = await catPage.evaluate(() => {
    const logo = document.querySelector('.seo-header .logo');
    const footer = document.querySelector('.seo-footer a');
    const nav = [...document.querySelectorAll('.seo-nav a')].map(a => (a.textContent || '').trim());
    const ver = document.querySelector('.seo-text-link');
    return {
      logoHeight: logo ? logo.getBoundingClientRect().height : 0,
      footerHeight: footer ? footer.getBoundingClientRect().height : 0,
      nav,
      verText: (ver?.textContent || '').replace(/\s+/g, ' ').trim(),
      hasHamburger: Boolean(document.querySelector('.hamburger, .seo-hamburger, #mobile-menu')),
    };
  });
  ok(cat.nav.join('|') === 'Início|Frutas|Legumes|Promoções',
    `390 Frutas: wrapping nav stays Início / Frutas / Legumes / Promoções (got ${cat.nav.join(' / ')})`);
  ok(cat.logoHeight < 40, `390 Frutas: should not redo leftover catalog header-logo 44px tap (got ${cat.logoHeight})`);
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
  await openHome(desktop, 1280, 800);
  await openPrivacy(desktop);
  const wide = await measurePrivacy(desktop);
  ok(wide.modalHidden === false, '1280 homepage: leftover privacy-dialog should open');
  ok(wide.labels.join('|') === 'WhatsApp|email',
    `1280 homepage: leftover privacy-dialog links stay (got ${wide.labels.join(' / ')})`);
  ok(wide.hrefs.join('|') === 'https://wa.me/351932699850|mailto:shahhossain87@gmail.com',
    `1280 homepage: leftover privacy-dialog hrefs stay (got ${wide.hrefs.join(' / ')})`);
  for (let i = 0; i < wide.heights.length; i++) {
    ok(wide.heights[i] < 44,
      `1280 homepage: leftover ${wide.labels[i]} should hug the label, not force 44px (got ${wide.heights[i]})`);
  }
  ok(wide.hero.some(t => /Ver Produtos/i.test(t)), '1280 homepage: leftover Ver Produtos stays');
  ok(wide.hero.some(t => /Encomendar por WhatsApp/i.test(t)), '1280 homepage: leftover Encomendar por WhatsApp stays');

  await browser.close();
  server.close();
  if (errors.length) {
    console.error('check-privacy-box-links-tap-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
    process.exit(1);
  }
  console.log('check-privacy-box-links-tap-browser: ok');
} catch (err) {
  try { await browser.close(); } catch {}
  try { server.close(); } catch {}
  console.error(err);
  process.exit(1);
}
