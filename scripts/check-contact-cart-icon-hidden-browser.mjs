#!/usr/bin/env node
/** Chrome: leftover contact / cart / pay decorative icons; add Melancia 1/4. */
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

async function leftoverIcons(page, label) {
  const data = await page.evaluate(() => {
    const icons = [...document.querySelectorAll('.contact-icon')];
    const mb = [...document.querySelectorAll('.mb-icon')];
    const fc = document.querySelector('.fc-icon');
    const titles = [...document.querySelectorAll('.order-card-title')].map(el => ({
      text: (el.textContent || '').replace(/\s+/g, ' ').trim(),
      hidden: [...el.querySelectorAll('[aria-hidden="true"]')].map(s => (s.textContent || '').trim()),
    }));
    const badges = [...document.querySelectorAll('.pay-badge')].map(el => ({
      text: (el.textContent || '').replace(/\s+/g, ' ').trim(),
      hidden: [...el.querySelectorAll('[aria-hidden="true"]')].map(s => (s.textContent || '').trim()),
    }));
    const strip = document.querySelector('.info-strip');
    const steps = document.querySelector('.order-steps-mini');
    const contact = document.getElementById('contacto');
    const order = document.getElementById('encomenda');
    const nav = document.getElementById('main-nav');
    const bar = document.getElementById('mobile-bar');
    return {
      contactCount: icons.length,
      contactHidden: icons.every(el => el.getAttribute('aria-hidden') === 'true'),
      contactVisible: icons.every(el => getComputedStyle(el).display !== 'none'),
      contactMarks: icons.map(el => (el.textContent || '').trim()),
      headings: [...document.querySelectorAll('#contacto h4')].map(el => (el.textContent || '').trim()),
      phone: document.querySelector('#contacto a[href="tel:932699850"]')?.textContent?.trim() || '',
      mbCount: mb.length,
      mbHidden: mb.every(el => el.getAttribute('aria-hidden') === 'true'),
      mbLabels: [...document.querySelectorAll('.mb-item .mb-label')].map(el => (el.textContent || '').trim()),
      fcHidden: fc ? fc.getAttribute('aria-hidden') === 'true' : false,
      fcMark: fc ? (fc.textContent || '').trim() : '',
      titles,
      badges,
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
      mainNavLabel: nav ? nav.getAttribute('aria-label') : null,
      barLabel: bar ? bar.getAttribute('aria-label') : null,
      hamburgerExpanded: document.querySelector('.hamburger')?.getAttribute('aria-expanded'),
      heroChip: (document.querySelector('.hero-chip')?.textContent || '').replace(/\s+/g, ' ').trim(),
      heroChipWrap: !!document.querySelector('.hero-chip [aria-hidden="true"]'),
    };
  });

  ok(data.contactCount === 4 && data.contactHidden && data.contactVisible,
    `${label}: leftover contact-icon aria-hidden (${data.contactCount}, hidden=${data.contactHidden})`);
  ok(data.contactMarks.includes('📍') && data.contactMarks.includes('📞'),
    `${label}: leftover contact icons still render`);
  ok(data.headings.includes('Morada') && data.headings.includes('Telefone / WhatsApp') && data.phone === '932 699 850',
    `${label}: leftover contact headings and phone stay`);
  ok(data.mbCount === 4 && data.mbHidden,
    `${label}: leftover mb-icon aria-hidden (${data.mbCount})`);
  ok(data.mbLabels.join('|') === 'Carrinho|Promoções|WhatsApp|Como Chegar',
    `${label}: leftover 4-item bar labels stay (${data.mbLabels.join('|')})`);
  ok(data.fcHidden && data.fcMark === '🛒',
    `${label}: leftover float-cart icon is aria-hidden`);
  ok(data.titles.length === 2 &&
    data.titles[0].text.includes('A Sua Encomenda') && data.titles[0].hidden.includes('🛒') &&
    data.titles[1].text.includes('Os Seus Dados') && data.titles[1].hidden.includes('📋'),
    `${label}: leftover order titles keep copy with hidden emojis`);
  ok(data.badges.length === 4 &&
    data.badges.some(b => b.text.includes('MB WAY') && b.hidden.includes('✓')) &&
    data.badges.some(b => b.text.includes('Levantamento na Loja') && b.hidden.includes('🛍️')),
    `${label}: leftover pay-badge marks are aria-hidden`);
  ok(data.stripTag === 'DIV' && data.stripLabel == null && !data.infoItemHidden,
    `${label}: leftover info-strip stays unnamed (PR #79)`);
  ok(data.stepsTag === 'DIV' && data.stepsLabel == null && !data.arrowHidden,
    `${label}: leftover order-steps-mini stays unnamed (PR #79)`);
  ok(data.contactTag === 'DIV' && data.contactLabel == null, `${label}: leftover contacto stays unnamed (PR #76)`);
  ok(data.orderTag === 'DIV' && data.orderLabel == null, `${label}: leftover encomenda stays unnamed (PR #76)`);
  ok(data.listLabel == null && data.formLabel == null, `${label}: leftover order list/form stay unnamed (PR #75)`);
  ok(data.mainNavLabel == null && data.barLabel == null, `${label}: leftover nav landmarks stay unnamed (PR #74)`);
  ok(data.hamburgerExpanded == null, `${label}: leftover hamburger stays without expanded (PR #70)`);
  ok(/Aberto Hoje/.test(data.heroChip) && !data.heroChipWrap,
    `${label}: leftover hero-chip stays unwrapped`);
}

try {
  const desktop = await browser.newPage();
  desktop.on('pageerror', err => errors.push('1280 pageerror: ' + err.message));
  await openReady(desktop, 1280, 800);
  await leftoverIcons(desktop, '1280');
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
    const dest = document.getElementById('contacto');
    if (dest) dest.scrollIntoView({ behavior: 'auto' });
    return {
      heading: dest ? (dest.querySelector('.section-title')?.textContent || '').trim() : '',
      icons: [...document.querySelectorAll('.contact-icon')].map(el => el.getAttribute('aria-hidden')),
    };
  });
  ok(jumped.heading === 'Encontre-nos' && jumped.icons.every(v => v === 'true'),
    `1280: leftover Encontre-nos still shows hidden contact icons`);

  const mobile = await browser.newPage();
  mobile.on('pageerror', err => errors.push('390 pageerror: ' + err.message));
  await openReady(mobile, 390, 844);

  const bar = await mobile.evaluate(() => {
    return [...document.querySelectorAll('.mb-item')].map(el => ({
      text: (el.textContent || '').replace(/\s+/g, ' ').trim(),
      iconHidden: el.querySelector('.mb-icon')?.getAttribute('aria-hidden') === 'true',
    }));
  });
  ok(bar.some(t => /Carrinho/i.test(t.text)), '390: 4-item bar still lists Carrinho');
  ok(bar.some(t => /Promoções/i.test(t.text)), '390: 4-item bar still lists Promoções');
  ok(bar.some(t => /WhatsApp/i.test(t.text)), '390: 4-item bar still lists WhatsApp');
  ok(bar.some(t => /Como Chegar/i.test(t.text)), '390: 4-item bar still lists Como Chegar');
  ok(bar.length === 4, `390: leftover 4-item bar stays (got ${bar.length})`);
  ok(bar.every(t => t.iconHidden), '390: leftover mobile-bar icons stay aria-hidden');

  await leftoverIcons(mobile, '390');
  await addMelancia(mobile, '390');

  await browser.close();
  server.close();
  if (errors.length) {
    console.error('check-contact-cart-icon-hidden-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
    process.exit(1);
  }
  console.log('check-contact-cart-icon-hidden-browser: ok');
} catch (err) {
  try { await browser.close(); } catch {}
  try { server.close(); } catch {}
  console.error(err);
  process.exit(1);
}
