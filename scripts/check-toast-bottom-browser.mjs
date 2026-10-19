#!/usr/bin/env node
/** Chrome: leftover add-to-cart toast sits above leftover 4-item bar on phones. */
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

async function waitToastShown(page) {
  await page.waitForFunction(() => {
    const t = document.getElementById('toast');
    if (!t || !t.classList.contains('show')) return false;
    if (!(t.textContent || '').trim()) return false;
    return parseFloat(getComputedStyle(t).opacity || '0') > 0.9;
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
    const toast = document.getElementById('toast');
    const tcs = toast ? getComputedStyle(toast) : null;
    const tbox = toast ? toast.getBoundingClientRect() : null;
    const barBox = barEl ? barEl.getBoundingClientRect() : null;
    const scrollTop = document.getElementById('scroll-top');
    const scs = scrollTop ? getComputedStyle(scrollTop) : null;
    const privacyWa = document.querySelector('.privacy-box a[href^="https://wa.me/"]');
    const orderWa = document.querySelector('#order-form button.btn-wa');
    const hero = [...document.querySelectorAll('.hero-ctas a')].map(a =>
      (a.textContent || '').replace(/\s+/g, ' ').trim()
    );
    const enc = document.getElementById('encomenda');
    const frutasTab = document.getElementById('tab-frutas');
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
      toastText: (toast?.textContent || '').replace(/\s+/g, ' ').trim(),
      toastShow: toast?.classList.contains('show') === true,
      toastBottom: tcs ? tcs.bottom : '',
      toastLeft: tcs ? tcs.left : '',
      toastZ: tcs ? tcs.zIndex : '',
      toastPointer: tcs ? tcs.pointerEvents : '',
      toastWhiteSpace: tcs ? tcs.whiteSpace : '',
      toastOpacity: tcs ? tcs.opacity : '',
      toastBox: tbox ? { top: tbox.top, bottom: tbox.bottom, height: tbox.height, width: tbox.width } : null,
      aboveBar: tbox && barBox && barBox.height > 0 ? tbox.bottom <= barBox.top + 0.5 : null,
      gapAboveBar: tbox && barBox && barBox.height > 0 ? barBox.top - tbox.bottom : null,
      scrollTopType: scrollTop?.getAttribute('type') || '',
      scrollTopTitle: scrollTop?.getAttribute('title') || '',
      scrollTopText: (scrollTop?.textContent || '').trim(),
      scrollTopBottom: scs ? scs.bottom : '',
      waHref: privacyWa?.getAttribute('href') || '',
      orderWaType: orderWa?.getAttribute('type') || '',
      hero,
      cartCount: document.getElementById('cart-count')?.textContent || '',
      catalogCount: document.querySelectorAll('.shop-main .product-card').length,
      frutasActive: frutasTab?.classList.contains('active') === true,
      encomendaTitle: (enc?.querySelector('h2')?.textContent || '').replace(/\s+/g, ' ').trim(),
      csHidden: document.getElementById('cs-pop')?.hidden === true,
    };
  });
}

try {
  const mobile = await browser.newPage();
  mobile.on('pageerror', err => errors.push('390 pageerror: ' + err.message));
  await openReady(mobile, 390, 844);
  const phoneBefore = await measurePage(mobile);
  ok(phoneBefore.barDisplay !== 'none' && phoneBefore.bar.length === 4,
    `390 homepage: leftover 4-item bar stays (display=${phoneBefore.barDisplay}, items=${phoneBefore.bar.length})`);
  ok(phoneBefore.bar.some(t => /Carrinho/i.test(t)), '390: 4-item bar still lists Carrinho');
  ok(phoneBefore.bar.some(t => /Promoções/i.test(t)), '390: 4-item bar still lists Promoções');
  ok(phoneBefore.bar.some(t => /WhatsApp/i.test(t)), '390: 4-item bar still lists WhatsApp');
  ok(phoneBefore.bar.some(t => /Como Chegar/i.test(t)), '390: 4-item bar still lists Como Chegar');
  await addMelancia(mobile, '390');
  await waitToastShown(mobile);
  const phone = await measurePage(mobile);
  ok(phone.toastShow === true, '390 homepage: leftover toast should be leftover .show after leftover Melancia 1/4 add');
  ok(phone.toastText === '✓ Melancia 1/4 adicionado',
    `390 homepage: leftover toast copy stays leftover ✓ Melancia 1/4 adicionado (got "${phone.toastText}")`);
  ok(phone.toastBottom === '78px',
    `390 homepage: leftover computed toast bottom should be leftover 78px above leftover 4-item bar (got "${phone.toastBottom}")`);
  ok(phone.toastZ === '9999',
    `390 homepage: leftover toast z-index stays leftover 9999 (got "${phone.toastZ}")`);
  ok(phone.toastPointer === 'none',
    `390 homepage: leftover toast stays leftover pointer-events none (got "${phone.toastPointer}")`);
  ok(phone.toastWhiteSpace === 'nowrap',
    `390 homepage: leftover toast stays leftover nowrap (got "${phone.toastWhiteSpace}")`);
  ok(parseFloat(phone.toastOpacity) > 0.9,
    `390 homepage: leftover toast should be leftover visible (opacity=${phone.toastOpacity})`);
  ok(phone.barDisplay !== 'none' && phone.bar.length === 4,
    `390 homepage after add: leftover 4-item bar stays (display=${phone.barDisplay}, items=${phone.bar.length})`);
  ok(phone.bar.some(t => /Promoções/i.test(t)), '390 after add: 4-item bar still lists Promoções');
  ok(phone.bar.some(t => /WhatsApp/i.test(t)), '390 after add: 4-item bar still lists WhatsApp');
  ok(phone.bar.some(t => /Como Chegar/i.test(t)), '390 after add: 4-item bar still lists Como Chegar');
  ok(phone.aboveBar === true,
    `390 homepage: leftover toast should sit above leftover 4-item bar (gap=${phone.gapAboveBar})`);
  ok(phone.scrollTopBottom === '28px',
    `390 homepage: should not redo leftover scroll-top mobile bottom cascade (PR #316) (got "${phone.scrollTopBottom}")`);
  ok(phone.scrollTopType === '',
    `390 homepage: should not redo leftover scroll-top type=button (got "${phone.scrollTopType}")`);
  ok(phone.scrollTopTitle === 'Voltar ao topo' && phone.scrollTopText === '▲',
    '390 homepage: leftover ▲ / leftover Voltar ao topo stay');
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
  ok(phone.frutasActive === true, '390 homepage: leftover Frutas tab stays leftover active after leftover add');
  ok(phone.cartCount === '1',
    `390 homepage: leftover Melancia 1/4 stays in leftover cart (got "${phone.cartCount}")`);
  ok(phone.csHidden === true, '390 homepage: leftover cross-sell popup stays leftover closed for leftover toast measure');

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
      hasBar: !!document.querySelector('.hamburger, #mobile-menu, [aria-label="Menu"], .mobile-close, .mb-item, #mobile-bar, #float-legumes, .float-legumes, #scroll-top, .scroll-top, .cat-quick-btn, .shop-link, #toast, .toast'),
    };
  });
  ok(cat.nav.join('|') === 'Início|Frutas|Legumes|Promoções',
    `390 Frutas: wrapping nav stays leftover Início / Frutas / Legumes / Promoções (got ${cat.nav.join(' / ')})`);
  ok(/MUNDIFRUTA/i.test(cat.footerText), `390 Frutas: leftover catalog footer stays (got "${cat.footerText}")`);
  ok(cat.verText === 'Ver produto', `390 Frutas: leftover Ver produto copy (got "${cat.verText}")`);
  ok(!cat.hasBar, '390 Frutas: should not add a leftover SEO-page hamburger / leftover mobile-close / leftover 4-item bar / leftover float-legumes / leftover scroll-top / leftover cat-quick-btn / leftover shop-link / leftover toast');

  const prodPage = await browser.newPage();
  prodPage.on('pageerror', err => errors.push('390 Melancia pageerror: ' + err.message));
  await prodPage.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true });
  await prodPage.goto(`${base}produtos/melancia-1-4/`, { waitUntil: 'networkidle0', timeout: 60000 });
  const prod = await prodPage.evaluate(() => {
    const order = document.querySelector('.seo-order-link');
    return {
      orderText: (order?.textContent || '').replace(/\s+/g, ' ').trim(),
      orderHref: order?.getAttribute('href') || '',
      hasFloat: !!document.querySelector('#float-legumes, .float-legumes, #scroll-top, .scroll-top, .cat-quick-btn, .shop-link, #toast, .toast'),
    };
  });
  ok(prod.orderText === 'Ver no catálogo e encomendar',
    `390 Melancia: leftover Ver no catálogo e encomendar stays (got "${prod.orderText}")`);
  ok(prod.orderHref === '/?produto=melancia-1-4#produtos',
    `390 Melancia: leftover catalog href stays (got "${prod.orderHref}")`);
  ok(!prod.hasFloat, '390 Melancia: should not invent leftover catalog float-legumes / leftover scroll-top / leftover cat-quick-btn / leftover shop-link / leftover toast');

  const desktop = await browser.newPage();
  desktop.on('pageerror', err => errors.push('1280 pageerror: ' + err.message));
  await openReady(desktop, 1280, 800);
  await addMelancia(desktop, '1280');
  await waitToastShown(desktop);
  const wide = await measurePage(desktop);
  ok(wide.toastShow === true, '1280 homepage: leftover toast should be leftover .show after leftover Melancia 1/4 add');
  ok(wide.toastText === '✓ Melancia 1/4 adicionado',
    `1280 homepage: leftover toast copy stays leftover ✓ Melancia 1/4 adicionado (got "${wide.toastText}")`);
  ok(wide.toastBottom === '32px',
    `1280 homepage: leftover computed toast bottom should stay leftover 32px on leftover desktop (got "${wide.toastBottom}")`);
  ok(wide.toastZ === '9999',
    `1280 homepage: leftover toast z-index stays leftover 9999 (got "${wide.toastZ}")`);
  ok(wide.toastPointer === 'none',
    `1280 homepage: leftover toast stays leftover pointer-events none (got "${wide.toastPointer}")`);
  ok(parseFloat(wide.toastOpacity) > 0.9,
    `1280 homepage: leftover toast should be leftover visible (opacity=${wide.toastOpacity})`);
  ok(wide.scrollTopBottom === '28px',
    `1280 homepage: leftover scroll-top computed bottom stays leftover 28px on leftover desktop (got "${wide.scrollTopBottom}")`);
  ok(wide.scrollTopType === '',
    `1280 homepage: should not redo leftover scroll-top type=button (got "${wide.scrollTopType}")`);
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
  ok(wide.cartCount === '1',
    `1280 homepage: leftover Melancia 1/4 stays in leftover cart (got "${wide.cartCount}")`);
  ok(wide.frutasActive === true, '1280 homepage: leftover Frutas tab stays leftover active after leftover add');
  ok(wide.encomendaTitle === 'Encomendar Online',
    `1280 homepage: leftover Encomendar Online stays (got "${wide.encomendaTitle}")`);
  ok(wide.catalogCount > 0,
    `1280 homepage: leftover toast should keep leftover catalog cards (got ${wide.catalogCount})`);

  await browser.close();
  server.close();
  if (errors.length) {
    console.error('check-toast-bottom-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
    process.exit(1);
  }
  console.log('check-toast-bottom-browser: ok');
} catch (err) {
  try { await browser.close(); } catch {}
  try { server.close(); } catch {}
  console.error(err);
  process.exit(1);
}
