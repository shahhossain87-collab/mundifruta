#!/usr/bin/env node
/** Chrome: leftover hero-chip / qs-chip / nav-order / Google-badge marks; add Melancia 1/4. */
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
    const chips = [...document.querySelectorAll('.hero-chip')].map(el => ({
      text: (el.textContent || '').replace(/\s+/g, ' ').trim(),
      hidden: [...el.querySelectorAll('[aria-hidden="true"]')].map(s => (s.textContent || '').trim()),
      visible: getComputedStyle(el).display !== 'none',
    }));
    const qs = [...document.querySelectorAll('.qs-chip')].map(el => ({
      text: (el.textContent || '').replace(/\s+/g, ' ').trim(),
      hidden: [...el.querySelectorAll('[aria-hidden="true"]')].map(s => (s.textContent || '').trim()),
      visible: getComputedStyle(el).display !== 'none',
    }));
    const nav = document.querySelector('.nav-order');
    const badge = document.getElementById('google-badge');
    const logo = badge ? badge.querySelector('.gb-logo') : null;
    const stars = badge ? badge.querySelector('.gb-stars') : null;
    const heroStars = document.querySelector('.hr-stars');
    const strip = document.querySelector('.info-strip');
    const steps = document.querySelector('.order-steps-mini');
    const contact = document.getElementById('contacto');
    const order = document.getElementById('encomenda');
    const mainNav = document.getElementById('main-nav');
    const bar = document.getElementById('mobile-bar');
    return {
      chips,
      qs,
      navText: nav ? (nav.textContent || '').replace(/\s+/g, ' ').trim() : '',
      navHidden: nav
        ? [...nav.querySelectorAll('[aria-hidden="true"]')].map(s => (s.textContent || '').trim())
        : [],
      navVisible: nav ? getComputedStyle(nav).display !== 'none' : false,
      gbLogoHidden: logo ? logo.getAttribute('aria-hidden') === 'true' : false,
      gbLogoMark: logo ? (logo.textContent || '').trim() : '',
      gbNota: document.getElementById('gb-nota')?.textContent?.trim() || '',
      gbTotal: document.getElementById('gb-total')?.textContent?.trim() || '',
      gbStarsHidden: stars ? stars.getAttribute('aria-hidden') : null,
      hrStarsHidden: heroStars ? heroStars.getAttribute('aria-hidden') : null,
      contactIconHidden: [...document.querySelectorAll('.contact-icon')]
        .some(el => el.getAttribute('aria-hidden') === 'true'),
      mbIconHidden: [...document.querySelectorAll('.mb-icon')]
        .some(el => el.getAttribute('aria-hidden') === 'true'),
      payWrap: !!document.querySelector('.pay-badge [aria-hidden="true"]'),
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
    };
  });

  ok(data.chips.length === 3 &&
    data.chips.some(c => /Aberto Hoje/.test(c.text) && c.hidden.includes('🕗')) &&
    data.chips.some(c => /Encomendas WhatsApp/.test(c.text) && c.hidden.includes('📱')) &&
    data.chips.some(c => /Levantamento na Loja/.test(c.text) && c.hidden.includes('🛍️')),
    `${label}: leftover hero-chip marks are aria-hidden`);
  ok(data.qs.length === 4 &&
    data.qs.some(c => /Frescura diária/.test(c.text) && c.hidden.includes('🌅')) &&
    data.qs.some(c => /Preços justos/.test(c.text) && c.hidden.includes('💶')) &&
    data.qs.some(c => /Atendimento próximo/.test(c.text) && c.hidden.includes('🤝')) &&
    data.qs.some(c => /Confiança da comunidade/.test(c.text) && c.hidden.includes('❤️')) &&
    data.qs.every(c => c.visible),
    `${label}: leftover qs-chip marks are aria-hidden`);
  ok(/Encomendar/.test(data.navText) && data.navHidden.includes('🛒'),
    `${label}: leftover nav-order cart mark is aria-hidden`);
  ok(data.gbLogoHidden && data.gbLogoMark === 'G' &&
    data.gbNota === '4,9' && /avaliações no Google/.test(data.gbTotal),
    `${label}: leftover Google-badge logo is aria-hidden; score/count stay`);
  ok(data.gbStarsHidden == null && data.hrStarsHidden == null,
    `${label}: leftover hero/badge stars stay for PR #32`);
  ok(!data.contactIconHidden && !data.mbIconHidden && !data.payWrap,
    `${label}: leftover contact / cart / pay icons stay for PR #80`);
  ok(data.stripTag === 'DIV' && data.stripLabel == null && !data.infoItemHidden,
    `${label}: leftover info-strip stays unnamed (PR #79)`);
  ok(data.stepsTag === 'DIV' && data.stepsLabel == null && !data.arrowHidden,
    `${label}: leftover order-steps-mini stays unnamed (PR #79)`);
  ok(data.contactTag === 'DIV' && data.contactLabel == null, `${label}: leftover contacto stays unnamed (PR #76)`);
  ok(data.orderTag === 'DIV' && data.orderLabel == null, `${label}: leftover encomenda stays unnamed (PR #76)`);
  ok(data.listLabel == null && data.formLabel == null, `${label}: leftover order list/form stay unnamed (PR #75)`);
  ok(data.mainNavLabel == null && data.barLabel == null, `${label}: leftover nav landmarks stay unnamed (PR #74)`);
  ok(data.hamburgerExpanded == null, `${label}: leftover hamburger stays without expanded (PR #70)`);
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
    const dest = document.getElementById('quem-somos');
    if (dest) dest.scrollIntoView({ behavior: 'auto' });
    return {
      heading: dest ? (dest.querySelector('.section-title')?.textContent || '').trim() : '',
      chips: [...document.querySelectorAll('.qs-chip')].map(el => ({
        text: (el.textContent || '').replace(/\s+/g, ' ').trim(),
        hidden: [...el.querySelectorAll('[aria-hidden="true"]')].map(s => (s.textContent || '').trim()),
      })),
    };
  });
  ok(jumped.heading === 'Quem Somos' && jumped.chips.length === 4 &&
    jumped.chips.every(c => c.hidden.length === 1),
    `1280: leftover Quem Somos still shows hidden qs-chips`);

  const reviews = await desktop.evaluate(() => {
    const dest = document.getElementById('avaliacoes');
    if (dest) dest.scrollIntoView({ behavior: 'auto' });
    return {
      heading: dest ? (dest.querySelector('.section-title')?.textContent || '').trim() : '',
      logoHidden: document.querySelector('.gb-logo')?.getAttribute('aria-hidden') === 'true',
    };
  });
  ok(reviews.heading === 'Avaliações' && reviews.logoHidden,
    '1280: leftover Avaliações still shows hidden Google-badge logo');

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
    console.error('check-hero-chip-qs-nav-badge-hidden-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
    process.exit(1);
  }
  console.log('check-hero-chip-qs-nav-badge-hidden-browser: ok');
} catch (err) {
  try { await browser.close(); } catch {}
  try { server.close(); } catch {}
  console.error(err);
  process.exit(1);
}
