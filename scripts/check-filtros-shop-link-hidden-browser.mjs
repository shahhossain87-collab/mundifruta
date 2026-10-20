#!/usr/bin/env node
/** Chrome: leftover Filtros / shop-link / reviews-cta marks; add Melancia 1/4. */
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
    const filt = document.querySelector('.filtbtn');
    const links = [...document.querySelectorAll('.shop-link')].map(el => ({
      text: (el.textContent || '').replace(/\s+/g, ' ').trim(),
      hidden: [...el.querySelectorAll('[aria-hidden="true"]')].map(s => (s.textContent || '').trim()),
      onclick: el.getAttribute('onclick') || '',
    }));
    const reviews = document.getElementById('reviews-cta');
    const promo = document.getElementById('filter-promo');
    const wa = document.querySelector('#order-form .btn-wa, .order-btns .btn-wa');
    const heroChip = document.querySelector('.hero-chip');
    const qsChip = document.querySelector('.qs-chip');
    const nav = document.querySelector('.nav-order');
    const logo = document.querySelector('.gb-logo');
    const contact = document.querySelector('.contact-icon');
    const hamburger = document.querySelector('.hamburger');
    const epoca = links.find(l => /Explorar fruta/.test(l.text));
    return {
      filtText: filt ? (filt.textContent || '').replace(/\s+/g, ' ').trim() : '',
      filtHidden: filt
        ? [...filt.querySelectorAll('[aria-hidden="true"]')].map(s => (s.textContent || '').trim())
        : [],
      filtLabel: filt ? filt.getAttribute('aria-label') || '' : '',
      filtDisplay: filt ? getComputedStyle(filt).display : '',
      links,
      reviewsText: reviews ? (reviews.textContent || '').replace(/\s+/g, ' ').trim() : '',
      reviewsHidden: reviews
        ? [...reviews.querySelectorAll('[aria-hidden="true"]')].map(s => (s.textContent || '').trim())
        : [],
      promoHidden: promo
        ? [...promo.querySelectorAll('[aria-hidden="true"]')].length
        : 0,
      waHidden: wa
        ? [...wa.querySelectorAll('[aria-hidden="true"]')].length
        : 0,
      heroHidden: heroChip
        ? [...heroChip.querySelectorAll('[aria-hidden="true"]')].length
        : 0,
      qsHidden: qsChip
        ? [...qsChip.querySelectorAll('[aria-hidden="true"]')].length
        : 0,
      navHidden: nav
        ? [...nav.querySelectorAll('[aria-hidden="true"]')].length
        : 0,
      logoHidden: logo ? logo.getAttribute('aria-hidden') : null,
      contactHidden: contact ? contact.getAttribute('aria-hidden') : null,
      hamburgerExpanded: hamburger ? hamburger.getAttribute('aria-expanded') : null,
      epocaOnclick: epoca ? epoca.onclick : '',
    };
  });

  ok(data.filtText.includes('Filtros') && data.filtHidden.includes('⚙️'),
    `${label}: leftover Filtros gear is hidden (text="${data.filtText}")`);
  ok(data.filtLabel === 'Abrir filtros e categorias',
    `${label}: leftover Filtros aria-label stays`);

  const catalogo = data.links.find(l => /Ver catálogo completo/.test(l.text));
  const frutas = data.links.find(l => /Ver todas as frutas/.test(l.text));
  const epoca = data.links.find(l => /Explorar fruta/.test(l.text));
  const legumes = data.links.find(l => /Ver todos os legumes/.test(l.text));
  ok(catalogo && catalogo.hidden.includes('→') && /produtos/.test(catalogo.onclick),
    `${label}: leftover catálogo arrow hidden`);
  ok(frutas && frutas.hidden.includes('→') && /abrirCatalogo\('frutas'\)/.test(frutas.onclick),
    `${label}: leftover frutas arrow hidden`);
  ok(epoca && epoca.hidden.includes('→') && /abrirCatalogo\('frutas'\)/.test(epoca.onclick),
    `${label}: leftover Explorar fruta still jumps to frutas`);
  ok(legumes && legumes.hidden.includes('→') && /abrirCatalogo\('legumes'\)/.test(legumes.onclick),
    `${label}: leftover legumes arrow hidden`);
  ok(data.reviewsText.includes('Ver todas as avaliações no Google') && data.reviewsHidden.includes('→'),
    `${label}: leftover reviews-cta arrow hidden`);

  ok(data.promoHidden === 0 && data.waHidden === 0,
    `${label}: must not hide leftover filter-chip / checkout marks (PR #82)`);
  ok(data.heroHidden === 0 && data.qsHidden === 0 && data.navHidden === 0 && data.logoHidden !== 'true',
    `${label}: must not hide leftover hero / qs / nav / badge marks (PR #81)`);
  ok(data.contactHidden !== 'true',
    `${label}: must not hide leftover contact icons (PR #80)`);
  ok(data.hamburgerExpanded == null,
    `${label}: leftover hamburger stays without expanded (PR #70)`);
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
    const dest = document.getElementById('populares');
    if (dest) dest.scrollIntoView({ behavior: 'auto' });
    const link = [...document.querySelectorAll('.shop-link')]
      .find(el => /Ver todas as frutas/.test(el.textContent || ''));
    return {
      heading: dest ? (dest.querySelector('.section-title')?.textContent || '').trim() : '',
      hidden: link
        ? [...link.querySelectorAll('[aria-hidden="true"]')].map(s => (s.textContent || '').trim())
        : [],
      text: link ? (link.textContent || '').replace(/\s+/g, ' ').trim() : '',
    };
  });
  ok(jumped.heading === 'Frutas Populares' && jumped.hidden.includes('→') && /Ver todas as frutas/.test(jumped.text),
    '1280: leftover Populares still shows hidden shop-link arrow');

  const shopJump = await desktop.evaluate(() => {
    const link = [...document.querySelectorAll('.shop-link')]
      .find(el => /Ver todas as frutas/.test(el.textContent || ''));
    if (link) link.click();
    const tab = document.getElementById('tab-frutas');
    return {
      selected: tab ? tab.getAttribute('aria-selected') : null,
      cards: document.querySelectorAll('.shop-main .product-card').length,
    };
  });
  ok(shopJump.selected === 'true' && shopJump.cards >= 1,
    `1280: leftover Ver todas as frutas still opens Frutas (${shopJump.cards} cards)`);

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

  const mobileFilt = await mobile.evaluate(() => {
    const filt = document.querySelector('.filtbtn');
    return {
      display: filt ? getComputedStyle(filt).display : '',
      text: filt ? (filt.textContent || '').replace(/\s+/g, ' ').trim() : '',
      hidden: filt
        ? [...filt.querySelectorAll('[aria-hidden="true"]')].map(s => (s.textContent || '').trim())
        : [],
    };
  });
  ok(mobileFilt.display !== 'none' && mobileFilt.text.includes('Filtros') && mobileFilt.hidden.includes('⚙️'),
    `390: leftover Filtros still visible (display=${mobileFilt.display})`);

  const drawer = await mobile.evaluate(() => {
    const filt = document.querySelector('.filtbtn');
    if (filt) filt.click();
    const sidebar = document.getElementById('shop-sidebar');
    const promo = document.getElementById('filter-promo');
    return {
      open: document.body.classList.contains('filtros-open'),
      sidebarHidden: sidebar ? sidebar.getAttribute('hidden') : null,
      promoText: promo ? (promo.textContent || '').replace(/\s+/g, ' ').trim() : '',
    };
  });
  ok(drawer.open && /Em promoção/.test(drawer.promoText),
    `390: leftover Filtros still opens the drawer (open=${drawer.open})`);
  await mobile.evaluate(() => {
    if (window.toggleFiltros && document.body.classList.contains('filtros-open')) window.toggleFiltros();
  });

  await leftoverMarks(mobile, '390');
  await addMelancia(mobile, '390');

  await browser.close();
  server.close();
  if (errors.length) {
    console.error('check-filtros-shop-link-hidden-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
    process.exit(1);
  }
  console.log('check-filtros-shop-link-hidden-browser: ok');
} catch (err) {
  try { await browser.close(); } catch {}
  try { server.close(); } catch {}
  console.error(err);
  process.exit(1);
}
