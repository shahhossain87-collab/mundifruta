#!/usr/bin/env node
/** Chrome: leftover filter-chip / checkout / welcome-offer marks; add Melancia 1/4. */
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

async function leftoverMarks(page, label) {
  const data = await page.evaluate(() => {
    const promo = document.getElementById('filter-promo');
    const disp = document.getElementById('filter-disp');
    const wa = document.querySelector('#order-form .btn-wa, .order-btns .btn-wa');
    const lock = document.querySelector('.order-reassure');
    const cont = document.querySelector('.btn-continuar');
    const offer = document.querySelector('.reveal-cta');
    const heroChip = document.querySelector('.hero-chip');
    const qsChip = document.querySelector('.qs-chip');
    const nav = document.querySelector('.nav-order');
    const logo = document.querySelector('.gb-logo');
    const strip = document.querySelector('.info-strip');
    const steps = document.querySelector('.order-steps-mini');
    const contact = document.getElementById('contacto');
    const order = document.getElementById('encomenda');
    const mainNav = document.getElementById('main-nav');
    const bar = document.getElementById('mobile-bar');
    const filt = document.querySelector('.filtbtn');
    const shopLink = [...document.querySelectorAll('.shop-link')]
      .find(el => /Ver todas as frutas/.test(el.textContent || ''));
    return {
      promoText: promo ? (promo.textContent || '').replace(/\s+/g, ' ').trim() : '',
      promoHidden: promo
        ? [...promo.querySelectorAll('[aria-hidden="true"]')].map(s => (s.textContent || '').trim())
        : [],
      promoPressed: promo ? promo.getAttribute('aria-pressed') : null,
      dispText: disp ? (disp.textContent || '').replace(/\s+/g, ' ').trim() : '',
      dispHidden: disp
        ? [...disp.querySelectorAll('[aria-hidden="true"]')].map(s => (s.textContent || '').trim())
        : [],
      waText: wa ? (wa.textContent || '').replace(/\s+/g, ' ').trim() : '',
      waHidden: wa
        ? [...wa.querySelectorAll('[aria-hidden="true"]')].map(s => (s.textContent || '').trim())
        : [],
      lockText: lock ? (lock.textContent || '').replace(/\s+/g, ' ').trim() : '',
      lockHidden: lock
        ? [...lock.querySelectorAll('[aria-hidden="true"]')].map(s => (s.textContent || '').trim())
        : [],
      contText: cont ? (cont.textContent || '').replace(/\s+/g, ' ').trim() : '',
      contHidden: cont
        ? [...cont.querySelectorAll('[aria-hidden="true"]')].map(s => (s.textContent || '').trim())
        : [],
      offerText: offer ? (offer.textContent || '').replace(/\s+/g, ' ').trim() : '',
      offerHidden: offer
        ? [...offer.querySelectorAll('[aria-hidden="true"]')].map(s => (s.textContent || '').trim())
        : [],
      heroHidden: heroChip
        ? [...heroChip.querySelectorAll('[aria-hidden="true"]')].length
        : 0,
      qsHidden: qsChip
        ? [...qsChip.querySelectorAll('[aria-hidden="true"]')].length
        : 0,
      navHidden: nav
        ? [...nav.querySelectorAll('[aria-hidden="true"]')].some(el => (el.textContent || '').includes('🛒'))
        : false,
      gbLogoHidden: logo ? logo.getAttribute('aria-hidden') === 'true' : false,
      contactIconHidden: [...document.querySelectorAll('.contact-icon')]
        .some(el => el.getAttribute('aria-hidden') === 'true'),
      mbIconHidden: [...document.querySelectorAll('.mb-icon')]
        .some(el => el.getAttribute('aria-hidden') === 'true'),
      payWrap: !!document.querySelector('.pay-badge [aria-hidden="true"]'),
      orderTitleWrap: !!document.querySelector('.order-card-title [aria-hidden="true"]'),
      stripTag: strip ? strip.tagName : '',
      stripLabel: strip ? strip.getAttribute('aria-label') : null,
      infoItemHidden: strip
        ? [...strip.querySelectorAll('.info-item > span')].some(el => el.getAttribute('aria-hidden') === 'true')
        : false,
      stepsTag: steps ? steps.tagName : '',
      stepsLabel: steps ? steps.getAttribute('aria-label') : null,
      arrowHidden: steps
        ? [...steps.querySelectorAll('.osm-arrow')].some(el => el.getAttribute('aria-hidden') === 'true')
        : false,
      contactTag: contact ? contact.tagName : '',
      contactLabel: contact ? contact.getAttribute('aria-label') : null,
      orderTag: order ? order.tagName : '',
      orderLabel: order ? order.getAttribute('aria-label') : null,
      listLabel: document.getElementById('order-list')?.getAttribute('aria-label') ?? null,
      formLabel: document.getElementById('order-form')?.getAttribute('aria-label') ?? null,
      mainNavLabel: mainNav ? mainNav.getAttribute('aria-label') : null,
      barLabel: bar ? bar.getAttribute('aria-label') : null,
      hamburgerExpanded: document.querySelector('.hamburger')?.getAttribute('aria-expanded'),
      filtWrap: filt ? !!filt.querySelector('[aria-hidden="true"]') : false,
      shopLinkWrap: shopLink ? !!shopLink.querySelector('[aria-hidden="true"]') : false,
    };
  });

  ok(/Em promoção/.test(data.promoText) && data.promoHidden.includes('🏷️') && data.promoPressed === 'false',
    `${label}: leftover promo chip mark is aria-hidden`);
  ok(/Disponíveis/.test(data.dispText) && data.dispHidden.includes('✓'),
    `${label}: leftover disponíveis chip mark is aria-hidden`);
  ok(/Encomendar por WhatsApp/.test(data.waText) && data.waHidden.includes('📱'),
    `${label}: leftover checkout WhatsApp mark is aria-hidden`);
  ok(/Sem pagamento antecipado/.test(data.lockText) && data.lockHidden.includes('🔒'),
    `${label}: leftover checkout lock mark is aria-hidden`);
  ok(/Continuar a comprar/.test(data.contText) && data.contHidden.includes('←'),
    `${label}: leftover continuar arrow is aria-hidden`);
  ok(/Receber Oferta/.test(data.offerText) && data.offerHidden.includes('🎁'),
    `${label}: leftover welcome-offer gift mark is aria-hidden`);
  ok(data.heroHidden === 0 && data.qsHidden === 0 && !data.navHidden && !data.gbLogoHidden,
    `${label}: leftover hero / qs / nav-order / Google-badge marks stay for PR #81`);
  ok(!data.contactIconHidden && !data.mbIconHidden && !data.payWrap && !data.orderTitleWrap,
    `${label}: leftover contact / cart / pay / order-title icons stay for PR #80`);
  ok(data.stripTag === 'DIV' && data.stripLabel == null && !data.infoItemHidden,
    `${label}: leftover info-strip stays unnamed (PR #79)`);
  ok(data.stepsTag === 'DIV' && data.stepsLabel == null && !data.arrowHidden,
    `${label}: leftover order-steps-mini stays unnamed (PR #79)`);
  ok(data.contactTag === 'DIV' && data.contactLabel == null, `${label}: leftover contacto stays unnamed (PR #76)`);
  ok(data.orderTag === 'DIV' && data.orderLabel == null, `${label}: leftover encomenda stays unnamed (PR #76)`);
  ok(data.listLabel == null && data.formLabel == null, `${label}: leftover order list/form stay unnamed (PR #75)`);
  ok(data.mainNavLabel == null && data.barLabel == null, `${label}: leftover nav landmarks stay unnamed (PR #74)`);
  ok(data.hamburgerExpanded == null, `${label}: leftover hamburger stays without expanded (PR #70)`);
  ok(!data.filtWrap && !data.shopLinkWrap,
    `${label}: leftover Filtros gear and shop-link arrows stay unwrapped`);
}

try {
  const desktop = await browser.newPage();
  desktop.on('pageerror', err => errors.push('1280 pageerror: ' + err.message));
  await openReady(desktop, 1280, 800);
  await leftoverMarks(desktop, '1280');
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
    const dest = document.getElementById('encomenda');
    if (dest) dest.scrollIntoView({ behavior: 'auto' });
    const wa = document.querySelector('#order-form .btn-wa, .order-btns .btn-wa');
    const lock = document.querySelector('.order-reassure');
    const cont = document.querySelector('.btn-continuar');
    return {
      heading: dest ? (dest.querySelector('.section-title')?.textContent || '').trim() : '',
      waHidden: wa ? [...wa.querySelectorAll('[aria-hidden="true"]')].map(s => (s.textContent || '').trim()) : [],
      lockHidden: lock ? [...lock.querySelectorAll('[aria-hidden="true"]')].map(s => (s.textContent || '').trim()) : [],
      contHidden: cont ? [...cont.querySelectorAll('[aria-hidden="true"]')].map(s => (s.textContent || '').trim()) : [],
    };
  });
  ok(jumped.heading === 'Encomendar Online' &&
    jumped.waHidden.includes('📱') && jumped.lockHidden.includes('🔒') && jumped.contHidden.includes('←'),
    '1280: leftover Encomendar still shows hidden checkout marks');

  const mobile = await browser.newPage();
  mobile.on('pageerror', err => errors.push('390 pageerror: ' + err.message));
  await openReady(mobile, 390, 844);

  const bar = await mobile.evaluate(() => {
    return [...document.querySelectorAll('.mb-item')].map(el => (el.textContent || '').replace(/\s+/g, ' ').trim());
  });
  ok(bar.some(t => /Carrinho/i.test(t)), '390: 4-item bar still lists Carrinho');
  ok(bar.some(t => /Promoções/i.test(t)), '390: 4-item bar still lists Promoções');
  ok(bar.some(t => /WhatsApp/i.test(t)), '390: 4-item bar still lists WhatsApp');
  ok(bar.some(t => /Como Chegar/i.test(t)), '390: 4-item bar still lists Como Chegar');
  ok(bar.length === 4, `390: leftover 4-item bar stays (got ${bar.length})`);

  await leftoverMarks(mobile, '390');
  await addMelancia(mobile, '390');

  await browser.close();
  server.close();
  if (errors.length) {
    console.error('check-filter-order-offer-hidden-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
    process.exit(1);
  }
  console.log('check-filter-order-offer-hidden-browser: ok');
} catch (err) {
  try { await browser.close(); } catch {}
  try { server.close(); } catch {}
  console.error(err);
  process.exit(1);
}
