#!/usr/bin/env node
/** Chrome: leftover pagination / tema-chip / optional / scroll-top marks; add Melancia 1/4. */
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
    const pager = document.getElementById('pagination-catalog');
    const buttons = pager ? [...pager.querySelectorAll('button')].map(el => ({
      text: (el.textContent || '').replace(/\s+/g, ' ').trim(),
      hidden: [...el.querySelectorAll('[aria-hidden="true"]')].map(s => (s.textContent || '').trim()),
      label: el.getAttribute('aria-label'),
    })) : [];
    const pageStatus = pager ? (pager.querySelector(':scope > span')?.textContent || '').trim() : '';
    const temas = [...document.querySelectorAll('.tema-chip')].map(el => ({
      text: (el.textContent || '').replace(/\s+/g, ' ').trim(),
      hidden: [...el.querySelectorAll('[aria-hidden="true"]')].map(s => (s.textContent || '').trim()),
    }));
    const optional = document.getElementById('order-optional-toggle');
    const scroll = document.getElementById('scroll-top');
    const filt = document.querySelector('.filtbtn');
    const promo = document.getElementById('filter-promo');
    const shop = document.querySelector('.shop-link');
    const heroChip = document.querySelector('.hero-chip');
    const contact = document.querySelector('.contact-icon');
    const hamburger = document.querySelector('.hamburger');
    const ticker = document.querySelector('.announcement-track > span');
    return {
      buttons,
      pageStatus,
      pagerChildren: pager ? pager.children.length : 0,
      temas,
      optionalText: optional ? (optional.textContent || '').replace(/\s+/g, ' ').trim() : '',
      optionalHidden: optional
        ? [...optional.querySelectorAll('[aria-hidden="true"]')].map(s => (s.textContent || '').trim())
        : [],
      optionalHintOpacity: optional
        ? getComputedStyle([...optional.querySelectorAll('span')].find(s => !s.hasAttribute('aria-hidden')) || optional).opacity
        : '',
      plusOpacity: optional
        ? getComputedStyle(optional.querySelector('[aria-hidden="true"]') || optional).opacity
        : '',
      scrollTitle: scroll ? scroll.getAttribute('title') : '',
      scrollLabel: scroll ? scroll.getAttribute('aria-label') : null,
      scrollHidden: scroll
        ? [...scroll.querySelectorAll('[aria-hidden="true"]')].map(s => (s.textContent || '').trim())
        : [],
      filtHidden: filt
        ? [...filt.querySelectorAll('[aria-hidden="true"]')].length
        : 0,
      promoHidden: promo
        ? [...promo.querySelectorAll('[aria-hidden="true"]')].length
        : 0,
      shopHidden: shop
        ? [...shop.querySelectorAll('[aria-hidden="true"]')].length
        : 0,
      heroHidden: heroChip
        ? [...heroChip.querySelectorAll('[aria-hidden="true"]')].length
        : 0,
      contactHidden: contact ? contact.getAttribute('aria-hidden') : null,
      hamburgerExpanded: hamburger ? hamburger.getAttribute('aria-expanded') : null,
      tickerEmojiHidden: ticker
        ? [...ticker.querySelectorAll('[aria-hidden="true"]')].length
        : 0,
    };
  });

  ok(data.pagerChildren >= 3, `${label}: leftover pagination still renders (${data.pagerChildren} children)`);
  const prev = data.buttons.find(b => /Anterior/.test(b.text));
  const next = data.buttons.find(b => /Seguinte/.test(b.text));
  ok(!!prev && prev.hidden.includes('←') && prev.label === 'Página anterior',
    `${label}: leftover Anterior arrow is hidden (text="${prev ? prev.text : ''}")`);
  ok(!!next && next.hidden.includes('→') && next.label === 'Página seguinte',
    `${label}: leftover Seguinte arrow is hidden (text="${next ? next.text : ''}")`);
  ok(/Página \d+ de \d+/.test(data.pageStatus),
    `${label}: leftover page-status copy stays (${data.pageStatus})`);

  ok(data.temas.length >= 5, `${label}: leftover review chips still render (${data.temas.length})`);
  ok(data.temas.every(t => t.hidden.includes('✓')),
    `${label}: leftover tema-chip checks are hidden`);
  ok(data.temas.some(t => /Frescura/.test(t.text)), `${label}: leftover Frescura chip stays`);
  ok(data.temas.some(t => /Simpatia/.test(t.text)), `${label}: leftover Simpatia chip stays`);

  ok(/Hora de levantamento ou nota/.test(data.optionalText) && data.optionalHidden.includes('+'),
    `${label}: leftover order-optional plus is hidden (text="${data.optionalText}")`);
  ok(/\(opcional\)/.test(data.optionalText), `${label}: leftover (opcional) copy stays`);
  ok(Number.parseFloat(data.optionalHintOpacity) < 1,
    `${label}: leftover (opcional) fade stays (opacity=${data.optionalHintOpacity})`);
  ok(Number.parseFloat(data.plusOpacity) === 1,
    `${label}: leftover optional plus stays at parent opacity (opacity=${data.plusOpacity})`);

  ok(data.scrollTitle === 'Voltar ao topo' && data.scrollHidden.includes('▲'),
    `${label}: leftover scroll-top triangle is hidden`);
  ok(data.scrollLabel == null, `${label}: leftover scroll-top stays without aria-label (PR #28)`);

  ok(data.filtHidden === 0 && data.promoHidden === 0 && data.shopHidden === 0,
    `${label}: must not hide leftover Filtros / filter-chip / shop-link marks (PR #83 / #82)`);
  ok(data.heroHidden === 0 && data.contactHidden !== 'true' && data.tickerEmojiHidden === 0,
    `${label}: must not hide leftover hero / contact / ticker marks (PR #81 / #80 / #84)`);
  ok(data.hamburgerExpanded == null,
    `${label}: leftover hamburger stays without expanded (PR #70)`);
}

async function leftoverOptionalReveal(page, label) {
  const data = await page.evaluate(() => {
    const dest = document.getElementById('encomenda');
    if (dest) dest.scrollIntoView({ behavior: 'auto' });
    const toggle = document.getElementById('order-optional-toggle');
    const fields = document.getElementById('order-optional');
    if (toggle) toggle.click();
    return {
      toggleHidden: toggle ? toggle.hidden : null,
      fieldsHidden: fields ? fields.hidden : null,
      pickup: !!document.getElementById('cust-levantamento'),
      notes: !!document.getElementById('cust-notas'),
    };
  });
  ok(data.toggleHidden === true && data.fieldsHidden === false && data.pickup && data.notes,
    `${label}: leftover optional toggle still reveals pickup/notes`);
}

async function leftoverPaginationClick(page, label) {
  const data = await page.evaluate(() => {
    const dest = document.getElementById('produtos');
    if (dest) dest.scrollIntoView({ behavior: 'auto' });
    const next = [...document.querySelectorAll('#pagination-catalog button')]
      .find(el => /Seguinte/.test(el.textContent || ''));
    if (next) next.click();
    const status = document.querySelector('#pagination-catalog > span');
    const firstName = document.querySelector('.shop-main .product-name');
    return {
      status: status ? (status.textContent || '').trim() : '',
      first: firstName ? (firstName.textContent || '').trim() : '',
    };
  });
  ok(/Página 2 de/.test(data.status),
    `${label}: leftover Seguinte still turns the page (${data.status})`);
  ok(data.first.length > 0, `${label}: leftover page 2 still has catalog cards (${data.first})`);
}

try {
  const desktop = await browser.newPage();
  desktop.on('pageerror', err => errors.push('1280 pageerror: ' + err.message));
  await openReady(desktop, 1280, 800);
  await leftoverMarks(desktop, '1280');
  await leftoverPaginationClick(desktop, '1280');
  await leftoverOptionalReveal(desktop, '1280');
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
  await leftoverPaginationClick(mobile, '390');
  await leftoverOptionalReveal(mobile, '390');
  await addMelancia(mobile, '390');

  await browser.close();
  server.close();
  if (errors.length) {
    console.error('check-pagination-tema-optional-scroll-hidden-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
    process.exit(1);
  }
  console.log('check-pagination-tema-optional-scroll-hidden-browser: ok');
} catch (err) {
  try { await browser.close(); } catch {}
  try { server.close(); } catch {}
  console.error(err);
  process.exit(1);
}
