#!/usr/bin/env node
/** Chrome: leftover info-strip / order-steps-mini landmarks; add Melancia 1/4. */
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

async function leftoverLandmarks(page, label) {
  const data = await page.evaluate(() => {
    const strip = document.querySelector('.info-strip');
    const steps = document.querySelector('.order-steps-mini');
    const hero = document.getElementById('inicio');
    const popular = document.getElementById('populares');
    const season = document.getElementById('verao');
    const veg = document.getElementById('legumes-frescos');
    const shop = document.getElementById('produtos');
    const promo = document.getElementById('promocoes');
    const cabaz = document.getElementById('cabazes');
    const reviews = document.getElementById('avaliacoes');
    const about = document.getElementById('quem-somos');
    const how = document.getElementById('como-funciona');
    const order = document.getElementById('encomenda');
    const contact = document.getElementById('contacto');
    const footerNav = document.querySelector('.footer-links');
    const menu = document.getElementById('mobile-menu');
    const shortcuts = document.querySelector('.cat-quick');
    const form = document.getElementById('order-form');
    const list = document.getElementById('order-list');
    const nav = document.getElementById('main-nav');
    const bar = document.getElementById('mobile-bar');
    return {
      stripTag: strip ? strip.tagName : '',
      stripLabel: strip ? strip.getAttribute('aria-label') || '' : '',
      stripText: strip ? (strip.textContent || '').replace(/\s+/g, ' ').trim() : '',
      stripIconsHidden: strip
        ? [...strip.querySelectorAll('.info-item > span')].every(el => el.getAttribute('aria-hidden') === 'true')
        : false,
      stepsTag: steps ? steps.tagName : '',
      stepsLabel: steps ? steps.getAttribute('aria-label') || '' : '',
      stepsText: steps ? (steps.textContent || '').replace(/\s+/g, ' ').trim() : '',
      howTitle: how ? (how.querySelector('.section-title')?.textContent || '').trim() : '',
      arrowsHidden: steps
        ? [...steps.querySelectorAll('.osm-arrow')].every(el => el.getAttribute('aria-hidden') === 'true')
          && steps.querySelectorAll('.osm-arrow').length === 4
        : false,
      heroTag: hero ? hero.tagName : '',
      heroLabel: hero ? hero.getAttribute('aria-label') : null,
      popularTag: popular ? popular.tagName : '',
      popularLabel: popular ? popular.getAttribute('aria-label') : null,
      seasonTag: season ? season.tagName : '',
      seasonLabel: season ? season.getAttribute('aria-label') : null,
      vegTag: veg ? veg.tagName : '',
      vegLabel: veg ? veg.getAttribute('aria-label') : null,
      shopTag: shop ? shop.tagName : '',
      shopLabel: shop ? shop.getAttribute('aria-label') : null,
      promoTag: promo ? promo.tagName : '',
      promoLabel: promo ? promo.getAttribute('aria-label') : null,
      cabazTag: cabaz ? cabaz.tagName : '',
      cabazLabel: cabaz ? cabaz.getAttribute('aria-label') : null,
      reviewsTag: reviews ? reviews.tagName : '',
      reviewsLabel: reviews ? reviews.getAttribute('aria-label') : null,
      aboutTag: about ? about.tagName : '',
      aboutLabel: about ? about.getAttribute('aria-label') : null,
      howTag: how ? how.tagName : '',
      howLabel: how ? how.getAttribute('aria-label') : null,
      orderTag: order ? order.tagName : '',
      orderLabel: order ? order.getAttribute('aria-label') : null,
      contactTag: contact ? contact.tagName : '',
      contactLabel: contact ? contact.getAttribute('aria-label') : null,
      footerTag: footerNav ? footerNav.tagName : '',
      footerLabel: footerNav ? footerNav.getAttribute('aria-label') : null,
      menuTag: menu ? menu.tagName : '',
      menuLabel: menu ? menu.getAttribute('aria-label') : null,
      shortcutTag: shortcuts ? shortcuts.tagName : '',
      formLabel: form ? form.getAttribute('aria-label') : null,
      listLabel: list ? list.getAttribute('aria-label') : null,
      mainNavLabel: nav ? nav.getAttribute('aria-label') : null,
      barLabel: bar ? bar.getAttribute('aria-label') : null,
      hamburgerExpanded: document.querySelector('.hamburger')?.getAttribute('aria-expanded'),
    };
  });
  ok(data.stripTag === 'SECTION' && data.stripLabel === 'Levantamento na Loja'
    && /Seg–Dom: 8:00 – 20:00/.test(data.stripText)
    && /932 699 850/.test(data.stripText)
    && /Levantamento na Loja/.test(data.stripText)
    && data.stripIconsHidden,
    `${label}: leftover info-strip is ${data.stripTag} "${data.stripLabel}"`);
  ok(data.stepsTag === 'SECTION' && data.stepsLabel === 'Como Encomendar'
    && data.howTitle === 'Como Encomendar'
    && /Escolha os produtos/.test(data.stepsText)
    && /Levante na loja/.test(data.stepsText)
    && data.arrowsHidden,
    `${label}: leftover order-steps-mini is ${data.stepsTag} "${data.stepsLabel}"`);
  ok(data.heroTag === 'DIV' && data.heroLabel == null, `${label}: leftover inicio stays unnamed (PR #78)`);
  ok(data.popularTag === 'DIV' && data.popularLabel == null, `${label}: leftover populares stays unnamed (PR #78)`);
  ok(data.seasonTag === 'DIV' && data.seasonLabel == null, `${label}: leftover verao stays unnamed (PR #78)`);
  ok(data.vegTag === 'DIV' && data.vegLabel == null, `${label}: leftover legumes-frescos stays unnamed (PR #78)`);
  ok(data.shopTag === 'SECTION' && data.shopLabel == null, `${label}: leftover produtos stays unnamed (PR #77)`);
  ok(data.promoTag === 'DIV' && data.promoLabel == null, `${label}: leftover promocoes stays unnamed (PR #77)`);
  ok(data.cabazTag === 'DIV' && data.cabazLabel == null, `${label}: leftover cabazes stays unnamed (PR #77)`);
  ok(data.reviewsTag === 'DIV' && data.reviewsLabel == null, `${label}: leftover avaliacoes stays unnamed (PR #77)`);
  ok(data.aboutTag === 'DIV' && data.aboutLabel == null, `${label}: leftover quem-somos stays unnamed (PR #77)`);
  ok(data.howTag === 'DIV' && data.howLabel == null, `${label}: leftover como-funciona stays unnamed (PR #76)`);
  ok(data.orderTag === 'DIV' && data.orderLabel == null, `${label}: leftover encomenda stays unnamed (PR #76)`);
  ok(data.contactTag === 'DIV' && data.contactLabel == null, `${label}: leftover contacto stays unnamed (PR #76)`);
  ok(data.footerTag === 'DIV' && data.footerLabel == null, `${label}: leftover footer-links stays a div (PR #76)`);
  ok(data.menuTag === 'DIV' && data.menuLabel == null, `${label}: leftover mobile-menu stays unnamed (PR #75)`);
  ok(data.shortcutTag === 'DIV', `${label}: leftover cat-quick stays a div (PR #75)`);
  ok(data.formLabel == null, `${label}: leftover order-form stays unnamed (PR #75)`);
  ok(data.listLabel == null, `${label}: leftover order-list stays unnamed (PR #75)`);
  ok(data.mainNavLabel == null, `${label}: leftover main-nav stays unnamed (PR #74)`);
  ok(data.barLabel == null, `${label}: leftover mobile-bar stays unnamed (PR #74)`);
  ok(data.hamburgerExpanded == null, `${label}: leftover hamburger stays without expanded (PR #70)`);
}

try {
  const desktop = await browser.newPage();
  desktop.on('pageerror', err => errors.push('1280 pageerror: ' + err.message));
  await openReady(desktop, 1280, 800);
  await leftoverLandmarks(desktop, '1280');
  await addMelancia(desktop, '1280');

  const search = await desktop.evaluate(() => {
    const input = document.getElementById('search-input');
    if (!input) return { morango: 0, tomate: 0 };
    input.value = 'morango';
    if (window.pesquisar) window.pesquisar();
    const morango = document.querySelectorAll('.shop-main .product-card').length;
    input.value = 'tomate';
    if (window.pesquisar) window.pesquisar();
    const tomate = document.querySelectorAll('.shop-main .product-card').length;
    if (window.limparPesquisa) window.limparPesquisa();
    return { morango, tomate };
  });
  ok(search.morango >= 1, `1280: leftover search morango (${search.morango})`);
  ok(search.tomate >= 1, `1280: leftover search tomate (${search.tomate})`);

  const jumped = await desktop.evaluate(() => {
    const dest = document.querySelector('.order-steps-mini');
    if (dest) dest.scrollIntoView({ behavior: 'auto' });
    const how = document.getElementById('como-funciona');
    return {
      tag: dest ? dest.tagName : '',
      label: dest ? dest.getAttribute('aria-label') || '' : '',
      howTitle: how ? (how.querySelector('.section-title')?.textContent || '').trim() : '',
    };
  });
  ok(jumped.tag === 'SECTION' && jumped.label === 'Como Encomendar' && jumped.howTitle === 'Como Encomendar',
    `1280: leftover Como Encomendar mini still matches the how-to title`);

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

  await leftoverLandmarks(mobile, '390');
  await addMelancia(mobile, '390');

  await browser.close();
  server.close();
  if (errors.length) {
    console.error('check-info-order-mini-landmarks-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
    process.exit(1);
  }
  console.log('check-info-order-mini-landmarks-browser: ok');
} catch (err) {
  try { await browser.close(); } catch {}
  try { server.close(); } catch {}
  console.error(err);
  process.exit(1);
}
