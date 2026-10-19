#!/usr/bin/env node
/** Chrome: leftover Voltar ao topo sits above leftover 4-item bar on phones. */
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

async function scrollPast(page, y = 800) {
  await page.evaluate((top) => window.scrollTo(0, top), y);
  await page.waitForFunction(() => {
    const el = document.getElementById('scroll-top');
    return el && el.classList.contains('visible') && window.scrollY > 400;
  }, { timeout: 4000 });
}

async function measurePage(page) {
  return page.evaluate(() => {
    const hamburger = document.querySelector('.hamburger');
    const menu = document.getElementById('mobile-menu');
    const barEl = document.getElementById('mobile-bar');
    const bar = [...document.querySelectorAll('.mb-item')].map(el =>
      (el.textContent || '').replace(/\s+/g, ' ').trim()
    );
    const scrollTop = document.getElementById('scroll-top');
    const cs = scrollTop ? getComputedStyle(scrollTop) : null;
    const box = scrollTop ? scrollTop.getBoundingClientRect() : null;
    const barBox = barEl ? barEl.getBoundingClientRect() : null;
    const privacyWa = document.querySelector('.privacy-box a[href^="https://wa.me/"]');
    const orderWa = document.querySelector('#order-form button.btn-wa');
    const hero = [...document.querySelectorAll('.hero-ctas a')].map(a =>
      (a.textContent || '').replace(/\s+/g, ' ').trim()
    );
    const produtos = document.getElementById('produtos');
    const produtosBox = produtos ? produtos.getBoundingClientRect() : { top: 0, bottom: 0 };
    const enc = document.getElementById('encomenda');
    return {
      hamburgerType: hamburger?.getAttribute('type') || '',
      hamburgerLabel: hamburger?.getAttribute('aria-label') || '',
      hamburgerExpanded: hamburger?.getAttribute('aria-expanded'),
      hamburgerDisplay: hamburger ? getComputedStyle(hamburger).display : '',
      menuOpen: menu?.classList.contains('open') === true,
      barDisplay: barEl ? getComputedStyle(barEl).display : '',
      bar,
      barTop: barBox ? barBox.top : null,
      barHeight: barBox ? barBox.height : 0,
      scrollTopType: scrollTop?.getAttribute('type') || '',
      scrollTopTitle: scrollTop?.getAttribute('title') || '',
      scrollTopText: (scrollTop?.textContent || '').trim(),
      scrollTopOnclick: scrollTop?.getAttribute('onclick') || '',
      scrollTopVisible: scrollTop?.classList.contains('visible') === true,
      scrollTopBottom: cs ? cs.bottom : '',
      scrollTopLeft: cs ? cs.left : '',
      scrollTopWidth: cs ? cs.width : '',
      scrollTopHeight: cs ? cs.height : '',
      scrollTopBox: box ? { top: box.top, bottom: box.bottom, left: box.left, height: box.height, width: box.width } : null,
      aboveBar: box && barBox ? box.bottom <= barBox.top + 0.5 : null,
      gapAboveBar: box && barBox ? barBox.top - box.bottom : null,
      waHref: privacyWa?.getAttribute('href') || '',
      orderWaType: orderWa?.getAttribute('type') || '',
      hero,
      cartCount: document.getElementById('cart-count')?.textContent || '',
      catalogCount: document.querySelectorAll('.shop-main .product-card').length,
      produtosInView: produtosBox.top < window.innerHeight && produtosBox.bottom > 80,
      encomendaTitle: (enc?.querySelector('h2')?.textContent || '').replace(/\s+/g, ' ').trim(),
      y: window.scrollY,
    };
  });
}

async function clickScrollTop(page) {
  return page.evaluate(() => {
    const btn = document.getElementById('scroll-top');
    if (!btn) return { ok: false, reason: 'missing' };
    btn.click();
    return {
      ok: true,
      type: btn.getAttribute('type') || '',
      title: btn.getAttribute('title') || '',
      text: (btn.textContent || '').trim(),
    };
  });
}

async function waitAtTop(page) {
  await page.waitForFunction(() => window.scrollY < 8, { timeout: 5000 });
}

try {
  const mobile = await browser.newPage();
  mobile.on('pageerror', err => errors.push('390 pageerror: ' + err.message));
  await openReady(mobile, 390, 844);
  await scrollPast(mobile, 800);
  const phone = await measurePage(mobile);
  ok(phone.scrollTopType === '',
    `390 homepage: should not redo leftover scroll-top type=button (got "${phone.scrollTopType}")`);
  ok(phone.scrollTopTitle === 'Voltar ao topo',
    `390 homepage: leftover title stays Voltar ao topo (got "${phone.scrollTopTitle}")`);
  ok(phone.scrollTopText === '▲',
    `390 homepage: leftover ▲ stays (got "${phone.scrollTopText}")`);
  ok(phone.scrollTopOnclick.includes("window.scrollTo({top:0,behavior:'smooth'})"),
    `390 homepage: leftover onclick stays leftover smooth scroll (got "${phone.scrollTopOnclick}")`);
  ok(phone.scrollTopVisible === true, '390 homepage: leftover Voltar ao topo should be leftover visible after leftover scroll');
  ok(phone.scrollTopBottom === '78px',
    `390 homepage: leftover computed bottom should be leftover 78px above leftover 4-item bar (got "${phone.scrollTopBottom}")`);
  ok(phone.scrollTopLeft === '28px',
    `390 homepage: leftover left stays leftover 28px (got "${phone.scrollTopLeft}")`);
  ok(phone.scrollTopWidth === '44px' && phone.scrollTopHeight === '44px',
    `390 homepage: leftover size stays leftover 44×44 (got ${phone.scrollTopWidth}×${phone.scrollTopHeight})`);
  ok(phone.barDisplay !== 'none' && phone.bar.length === 4,
    `390 homepage: leftover 4-item bar stays (display=${phone.barDisplay}, items=${phone.bar.length})`);
  ok(phone.bar.some(t => /Carrinho/i.test(t)), '390: 4-item bar still lists Carrinho');
  ok(phone.bar.some(t => /Promoções/i.test(t)), '390: 4-item bar still lists Promoções');
  ok(phone.bar.some(t => /WhatsApp/i.test(t)), '390: 4-item bar still lists WhatsApp');
  ok(phone.bar.some(t => /Como Chegar/i.test(t)), '390: 4-item bar still lists Como Chegar');
  ok(phone.aboveBar === true,
    `390 homepage: leftover Voltar ao topo should sit above leftover 4-item bar (gap=${phone.gapAboveBar})`);
  ok(phone.hamburgerType === '',
    `390 homepage: should not invent leftover type=button on leftover hamburger (got "${phone.hamburgerType}")`);
  ok(phone.hamburgerLabel === 'Menu',
    `390 homepage: leftover hamburger stays leftover Menu (got "${phone.hamburgerLabel}")`);
  ok(phone.hamburgerExpanded == null,
    `390 homepage: should not redo leftover hamburger aria-expanded (PR #70) (got "${phone.hamburgerExpanded}")`);
  ok(phone.menuOpen === false, '390 homepage: leftover mobile-menu should stay closed');
  ok(phone.waHref === 'https://wa.me/351932699850',
    `390 homepage: leftover privacy WhatsApp stays wa.me/351932699850 (got "${phone.waHref}")`);
  ok(phone.orderWaType === 'submit',
    `390 homepage: leftover order WhatsApp stays leftover type=submit (got "${phone.orderWaType}")`);
  ok(phone.hero.some(t => /Ver Produtos/i.test(t)), '390 homepage: leftover Ver Produtos stays');
  ok(phone.hero.some(t => /Encomendar por WhatsApp/i.test(t)), '390 homepage: leftover Encomendar por WhatsApp stays');
  ok(phone.encomendaTitle === 'Encomendar Online',
    `390 homepage: leftover Encomendar Online stays (got "${phone.encomendaTitle}")`);

  const phoneClick = await clickScrollTop(mobile);
  ok(phoneClick.ok && phoneClick.type === '' && phoneClick.title === 'Voltar ao topo' && phoneClick.text === '▲',
    `390 homepage: leftover Voltar ao topo click stays leftover ▲ without leftover type=button (got "${phoneClick.type}")`);
  await waitAtTop(mobile);
  const phoneTop = await measurePage(mobile);
  ok(phoneTop.y < 8, `390 homepage: leftover Voltar ao topo click should scroll leftover page to leftover topo (y=${phoneTop.y})`);
  ok(phoneTop.menuOpen === false, '390 homepage: leftover Voltar ao topo should keep leftover mobile-menu closed');
  ok(phoneTop.waHref === 'https://wa.me/351932699850',
    `390 homepage: leftover privacy WhatsApp stays after leftover Voltar ao topo (got "${phoneTop.waHref}")`);
  ok(phoneTop.scrollTopBottom === '78px',
    `390 homepage: leftover computed bottom stays leftover 78px after leftover click (got "${phoneTop.scrollTopBottom}")`);

  await addMelancia(mobile, '390 after scroll-top');
  await scrollPast(mobile, 800);
  const afterAddClick = await clickScrollTop(mobile);
  ok(afterAddClick.ok && afterAddClick.type === '',
    '390 homepage: leftover Voltar ao topo click after leftover add stays without leftover type=button');
  await waitAtTop(mobile);
  const afterAdd = await measurePage(mobile);
  ok(afterAdd.y < 8, `390 homepage: leftover Voltar ao topo click after leftover add still scrolls leftover topo (y=${afterAdd.y})`);
  ok(afterAdd.cartCount === '1',
    `390 homepage: leftover Voltar ao topo should keep leftover Melancia 1/4 in leftover cart (got "${afterAdd.cartCount}")`);
  ok(afterAdd.waHref === 'https://wa.me/351932699850',
    `390 homepage: leftover privacy WhatsApp stays after leftover add click (got "${afterAdd.waHref}")`);
  ok(afterAdd.scrollTopBottom === '78px',
    `390 homepage: leftover computed bottom stays leftover 78px after leftover add click (got "${afterAdd.scrollTopBottom}")`);

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
      hasBar: !!document.querySelector('.hamburger, #mobile-menu, [aria-label="Menu"], .mobile-close, .mb-item, #mobile-bar, #float-legumes, .float-legumes, #scroll-top, .scroll-top, .cat-quick-btn, .shop-link'),
    };
  });
  ok(cat.nav.join('|') === 'Início|Frutas|Legumes|Promoções',
    `390 Frutas: wrapping nav stays leftover Início / Frutas / Legumes / Promoções (got ${cat.nav.join(' / ')})`);
  ok(/MUNDIFRUTA/i.test(cat.footerText), `390 Frutas: leftover catalog footer stays (got "${cat.footerText}")`);
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
      hasFloat: !!document.querySelector('#float-legumes, .float-legumes, #scroll-top, .scroll-top, .cat-quick-btn, .shop-link'),
    };
  });
  ok(prod.orderText === 'Ver no catálogo e encomendar',
    `390 Melancia: leftover Ver no catálogo e encomendar stays (got "${prod.orderText}")`);
  ok(prod.orderHref === '/?produto=melancia-1-4#produtos',
    `390 Melancia: leftover catalog href stays (got "${prod.orderHref}")`);
  ok(!prod.hasFloat, '390 Melancia: should not invent leftover catalog float-legumes / leftover scroll-top / leftover cat-quick-btn / leftover shop-link');

  const desktop = await browser.newPage();
  desktop.on('pageerror', err => errors.push('1280 pageerror: ' + err.message));
  await openReady(desktop, 1280, 800);
  await scrollPast(desktop, 800);
  const wide = await measurePage(desktop);
  ok(wide.scrollTopType === '',
    `1280 homepage: should not redo leftover scroll-top type=button (got "${wide.scrollTopType}")`);
  ok(wide.scrollTopTitle === 'Voltar ao topo' && wide.scrollTopText === '▲',
    '1280 homepage: leftover ▲ / leftover Voltar ao topo stay');
  ok(wide.scrollTopVisible === true, '1280 homepage: leftover Voltar ao topo should be leftover visible after leftover scroll');
  ok(wide.scrollTopBottom === '28px',
    `1280 homepage: leftover computed bottom should stay leftover 28px on leftover desktop (got "${wide.scrollTopBottom}")`);
  ok(wide.scrollTopWidth === '44px' && wide.scrollTopHeight === '44px',
    `1280 homepage: leftover size stays leftover 44×44 (got ${wide.scrollTopWidth}×${wide.scrollTopHeight})`);
  ok(wide.hamburgerDisplay === 'none',
    `1280 homepage: leftover hamburger should stay leftover hidden on leftover desktop (got "${wide.hamburgerDisplay}")`);
  ok(wide.hamburgerExpanded == null,
    `1280 homepage: should not redo leftover hamburger aria-expanded (PR #70) (got "${wide.hamburgerExpanded}")`);
  ok(wide.menuOpen === false, '1280 homepage: leftover mobile-menu should stay closed');
  ok(wide.orderWaType === 'submit',
    `1280 homepage: leftover order WhatsApp stays leftover type=submit (got "${wide.orderWaType}")`);
  ok(wide.hero.some(t => /Ver Produtos/i.test(t)), '1280 homepage: leftover Ver Produtos stays');
  ok(wide.hero.some(t => /Encomendar por WhatsApp/i.test(t)), '1280 homepage: leftover Encomendar por WhatsApp stays');
  ok(wide.waHref === 'https://wa.me/351932699850',
    `1280 homepage: leftover privacy WhatsApp stays wa.me/351932699850 (got "${wide.waHref}")`);
  ok(wide.cartCount === '0' || wide.cartCount === '',
    `1280 homepage: leftover Voltar ao topo should not add leftover cabaz to leftover cart (got "${wide.cartCount}")`);
  ok(wide.encomendaTitle === 'Encomendar Online',
    `1280 homepage: leftover Encomendar Online stays (got "${wide.encomendaTitle}")`);

  const deskClick = await clickScrollTop(desktop);
  ok(deskClick.ok && deskClick.type === '',
    `1280 homepage: leftover Voltar ao topo click stays without leftover type=button (got "${deskClick.type}")`);
  await waitAtTop(desktop);
  const deskAfter = await measurePage(desktop);
  ok(deskAfter.y < 8, `1280 homepage: leftover Voltar ao topo click should scroll leftover page to leftover topo (y=${deskAfter.y})`);
  ok(deskAfter.scrollTopBottom === '28px',
    `1280 homepage: leftover computed bottom stays leftover 28px after leftover click (got "${deskAfter.scrollTopBottom}")`);
  ok(deskAfter.waHref === 'https://wa.me/351932699850',
    `1280 homepage: leftover privacy WhatsApp stays after leftover Voltar ao topo (got "${deskAfter.waHref}")`);
  ok(deskAfter.cartCount === '0' || deskAfter.cartCount === '',
    `1280 homepage: leftover Voltar ao topo should not add leftover cabaz after click (got "${deskAfter.cartCount}")`);
  ok(deskAfter.catalogCount > 0,
    `1280 homepage: leftover Voltar ao topo should keep leftover catalog cards (got ${deskAfter.catalogCount})`);
  ok(deskAfter.orderWaType === 'submit',
    `1280 homepage: leftover order WhatsApp stays leftover type=submit after leftover Voltar ao topo (got "${deskAfter.orderWaType}")`);

  await addMelancia(desktop, '1280 after scroll-top');
  await scrollPast(desktop, 800);
  const deskAddClick = await clickScrollTop(desktop);
  ok(deskAddClick.ok && deskAddClick.type === '',
    '1280 homepage: leftover Voltar ao topo click after leftover add stays without leftover type=button');
  await waitAtTop(desktop);
  const deskAfterAdd = await measurePage(desktop);
  ok(deskAfterAdd.y < 8, `1280 homepage: leftover Voltar ao topo click after leftover add still scrolls leftover topo (y=${deskAfterAdd.y})`);
  ok(deskAfterAdd.cartCount === '1',
    `1280 homepage: leftover Voltar ao topo should keep leftover Melancia 1/4 in leftover cart (got "${deskAfterAdd.cartCount}")`);
  ok(deskAfterAdd.scrollTopBottom === '28px',
    `1280 homepage: leftover computed bottom stays leftover 28px after leftover add click (got "${deskAfterAdd.scrollTopBottom}")`);

  await browser.close();
  server.close();
  if (errors.length) {
    console.error('check-scroll-top-bottom-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
    process.exit(1);
  }
  console.log('check-scroll-top-bottom-browser: ok');
} catch (err) {
  try { await browser.close(); } catch {}
  try { server.close(); } catch {}
  console.error(err);
  process.exit(1);
}
