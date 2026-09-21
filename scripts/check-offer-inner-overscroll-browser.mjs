#!/usr/bin/env node
/** Chrome: leftover welcome-offer inner overscroll; search + add Melancia 1/4. */
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

async function searchCatalog(page, label) {
  const hits = await page.evaluate(() => {
    const input = document.getElementById('search-input');
    if (!input || !window.pesquisar) return { morango: 0, tomate: 0 };
    input.value = 'morango';
    window.pesquisar();
    const morango = document.querySelectorAll('#grid-catalog .product-card').length;
    input.value = 'tomate';
    window.pesquisar();
    const tomate = document.querySelectorAll('#grid-catalog .product-card').length;
    input.value = '';
    if (window.limparPesquisa) window.limparPesquisa();
    else if (window.limparTudo) window.limparTudo();
    return { morango, tomate };
  });
  ok(hits.morango >= 1, `${label}: leftover search morango (${hits.morango})`);
  ok(hits.tomate >= 1, `${label}: leftover search tomate (${hits.tomate})`);
}

async function leftoverOfferInnerOverscroll(page, label) {
  const info = await page.evaluate(() => {
    if (window.limparTudo) window.limparTudo();
    if (window.mostrarCategoria) window.mostrarCategoria('frutas', document.getElementById('tab-frutas'));

    const styleOf = (el) => el ? getComputedStyle(el).overscrollBehavior : '';
    const overflowYOf = (el) => el ? getComputedStyle(el).overflowY : '';
    const maxHeightOf = (el) => el ? getComputedStyle(el).maxHeight : '';

    const offer = document.getElementById('offer-pop');
    const inner = document.querySelector('.reveal-inner');
    if (offer) offer.hidden = false;
    const offerHidden = offer ? offer.hidden : true;
    const title = document.querySelector('.reveal-title')?.textContent || '';
    const cta = document.querySelector('.reveal-cta')?.textContent || '';
    const later = document.querySelector('.reveal-later')?.textContent || '';
    const innerOverscroll = styleOf(inner);
    const innerOverflowY = overflowYOf(inner);
    const innerMaxHeight = maxHeightOf(inner);
    const offerBackdrop = styleOf(offer);
    if (offer) offer.hidden = true;

    const card = [...document.querySelectorAll('.shop-main .product-card')]
      .find(c => /Melancia 1\/4/i.test(c.textContent || ''));
    if (!card) return { ok: false, reason: 'card missing' };
    const btn = card.querySelector('.add-btn');
    if (btn) btn.click();
    const cs = document.getElementById('cs-pop');
    if (cs) cs.hidden = true;

    const ham = document.querySelector('.hamburger');
    const carousel = document.querySelector('.feature-grid.carousel');
    const sb = document.getElementById('shop-sidebar');
    const menu = document.getElementById('mobile-menu');
    const popRow = document.getElementById('cs-pop-row');
    const privacyBox = document.querySelector('.privacy-box');
    const productBox = document.querySelector('.product-modal-box');
    const cabazBox = document.querySelector('.cabaz-modal-box');
    const privacy = document.getElementById('privacy-modal');
    const product = document.getElementById('product-modal');
    const cabaz = document.getElementById('cabaz-modal');
    return {
      ok: true,
      count: document.getElementById('cart-count')?.textContent || '',
      offerHidden,
      title,
      cta,
      later,
      innerOverscroll,
      innerOverflowY,
      innerMaxHeight,
      offerBackdrop,
      hamburgerExpanded: ham ? ham.getAttribute('aria-expanded') : 'missing',
      carousel: styleOf(carousel),
      sidebar: styleOf(sb),
      menu: styleOf(menu),
      csRow: styleOf(popRow),
      privacyBox: styleOf(privacyBox),
      productBox: styleOf(productBox),
      cabazBox: styleOf(cabazBox),
      privacyBackdrop: styleOf(privacy),
      productBackdrop: styleOf(product),
      cabazBackdrop: styleOf(cabaz),
    };
  });

  ok(info.ok, `${label}: leftover Melancia 1/4 card (${info.reason || 'ok'})`);
  if (!info.ok) return;
  ok(info.offerHidden === false, `${label}: leftover welcome-offer still opens`);
  ok(/de desconto/i.test(info.title || ''), `${label}: leftover offer title stays (${info.title})`);
  ok(/receber oferta/i.test(info.cta || ''), `${label}: leftover Receber Oferta stays (${info.cta})`);
  ok(/agora não/i.test(info.later || ''), `${label}: leftover Agora não stays (${info.later})`);
  ok(/contain/i.test(info.innerOverscroll), `${label}: leftover .reveal-inner overscroll is contain (got "${info.innerOverscroll}")`);
  ok(
    info.innerOverflowY === 'auto' || info.innerOverflowY === 'scroll',
    `${label}: leftover .reveal-inner stays a vertical scroller (got "${info.innerOverflowY}")`
  );
  ok(
    info.innerMaxHeight === '100%' || info.innerMaxHeight === 'none' || parseFloat(info.innerMaxHeight) > 0,
    `${label}: leftover .reveal-inner keeps a max-height (got "${info.innerMaxHeight}")`
  );
  ok(info.count === '1', `${label}: add Melancia 1/4 (count=${info.count})`);
  ok(info.hamburgerExpanded == null, `${label}: leftover hamburger stays without aria-expanded`);
  ok(!/contain/i.test(info.offerBackdrop), `${label}: leftover offer-reveal overscroll stays for PR #27 (got "${info.offerBackdrop}")`);
  ok(!/contain/i.test(info.privacyBackdrop), `${label}: leftover privacy-modal overscroll stays for PR #27 (got "${info.privacyBackdrop}")`);
  ok(!/contain/i.test(info.productBackdrop), `${label}: leftover product-modal overscroll stays for PR #27 (got "${info.productBackdrop}")`);
  ok(!/contain/i.test(info.cabazBackdrop), `${label}: leftover cabaz-modal overscroll stays for PR #27 (got "${info.cabazBackdrop}")`);
  ok(!/contain/i.test(info.privacyBox), `${label}: leftover privacy-box overscroll stays for PR #101 (got "${info.privacyBox}")`);
  ok(!/contain/i.test(info.productBox), `${label}: leftover product-modal-box overscroll stays for PR #101 (got "${info.productBox}")`);
  ok(!/contain/i.test(info.cabazBox), `${label}: leftover cabaz-modal-box overscroll stays for PR #101 (got "${info.cabazBox}")`);
  ok(!/contain/i.test(info.carousel), `${label}: leftover featured-carousel overscroll stays for PR #99 (got "${info.carousel}")`);
  ok(!/contain/i.test(info.sidebar), `${label}: leftover shop-sidebar overscroll stays for PR #98 (got "${info.sidebar}")`);
  ok(!/contain/i.test(info.menu), `${label}: leftover mobile-menu overscroll stays for PR #98 (got "${info.menu}")`);
  ok(!/contain/i.test(info.csRow), `${label}: leftover cs-row overscroll stays for PR #100 (got "${info.csRow}")`);
}

try {
  const desktop = await browser.newPage();
  desktop.on('pageerror', err => errors.push('1280 pageerror: ' + err.message));
  await openReady(desktop, 1280, 800);
  await leftoverOfferInnerOverscroll(desktop, '1280');
  await searchCatalog(desktop, '1280');

  const mobile = await browser.newPage();
  mobile.on('pageerror', err => errors.push('390 pageerror: ' + err.message));
  await openReady(mobile, 390, 844);

  const bar = await mobile.evaluate(() => {
    return [...document.querySelectorAll('.mb-item')].map(el =>
      (el.textContent || '').replace(/\s+/g, ' ').trim()
    );
  });
  ok(bar.some(t => /Carrinho/i.test(t)), '390: 4-item bar still lists Carrinho');
  ok(bar.some(t => /Promoções/i.test(t)), '390: 4-item bar still lists Promoções');
  ok(bar.some(t => /WhatsApp/i.test(t)), '390: 4-item bar still lists WhatsApp');
  ok(bar.some(t => /Como Chegar/i.test(t)), '390: 4-item bar still lists Como Chegar');
  ok(bar.length === 4, `390: leftover 4-item bar stays (got ${bar.length})`);

  await leftoverOfferInnerOverscroll(mobile, '390');
  await searchCatalog(mobile, '390');

  await browser.close();
  server.close();
  if (errors.length) {
    console.error('check-offer-inner-overscroll-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
    process.exit(1);
  }
  console.log('check-offer-inner-overscroll-browser: ok');
} catch (err) {
  try { await browser.close(); } catch {}
  try { server.close(); } catch {}
  console.error(err);
  process.exit(1);
}
