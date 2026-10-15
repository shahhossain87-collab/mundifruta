#!/usr/bin/env node
/** Chrome: leftover Fruta da Época shop-link opens leftover epoca; add Melancia 1/4. */
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

async function leftoverEpocaCta(page, label) {
  const before = await page.evaluate(() => {
    const links = [...document.querySelectorAll('.shop-link')].map(el => ({
      text: (el.textContent || '').replace(/\s+/g, ' ').trim(),
      onclick: el.getAttribute('onclick') || '',
    }));
    const epoca = links.find(l => /Explorar fruta/i.test(l.text));
    const frutas = links.find(l => /Ver todas as frutas/i.test(l.text));
    const legumes = links.find(l => /Ver todos os legumes/i.test(l.text));
    const catalogo = links.find(l => /Ver catálogo completo/i.test(l.text));
    const tile = [...document.querySelectorAll('.cat-quick-btn')]
      .find(el => /Fruta da Época/i.test(el.textContent || ''));
    return {
      epocaText: epoca ? epoca.text : '',
      epocaOnclick: epoca ? epoca.onclick : '',
      frutasOnclick: frutas ? frutas.onclick : '',
      legumesOnclick: legumes ? legumes.onclick : '',
      catalogoOnclick: catalogo ? catalogo.onclick : '',
      tileOnclick: tile ? tile.getAttribute('onclick') || '' : '',
      tabFrutas: document.getElementById('tab-frutas')?.getAttribute('aria-selected') || '',
    };
  });
  ok(/Explorar fruta →/.test(before.epocaText), `${label}: leftover Explorar fruta → copy stays`);
  ok(/abrirCatalogo\('epoca'\)/.test(before.epocaOnclick), `${label}: leftover Explorar fruta calls leftover epoca`);
  ok(/abrirCatalogo\('frutas'\)/.test(before.frutasOnclick), `${label}: leftover Ver todas as frutas still calls leftover frutas`);
  ok(/abrirCatalogo\('legumes'\)/.test(before.legumesOnclick), `${label}: leftover Ver todos os legumes still calls leftover legumes`);
  ok(/getElementById\('produtos'\)/.test(before.catalogoOnclick), `${label}: leftover Ver catálogo completo still scrolls leftover #produtos`);
  ok(/abrirCatalogo\('epoca'\)/.test(before.tileOnclick), `${label}: leftover category tile still calls leftover epoca`);

  const after = await page.evaluate(() => {
    const cta = [...document.querySelectorAll('.shop-link')]
      .find(el => /Explorar fruta/i.test(el.textContent || ''));
    if (!cta) return { ok: false, reason: 'cta missing' };
    cta.click();
    const tab = document.getElementById('tab-epoca');
    const frutas = document.getElementById('tab-frutas');
    const names = [...document.querySelectorAll('.shop-main .product-card .product-name')]
      .map(el => (el.textContent || '').trim());
    return {
      ok: true,
      ctaText: (cta.textContent || '').replace(/\s+/g, ' ').trim(),
      epocaSelected: tab ? tab.getAttribute('aria-selected') : '',
      epocaActive: tab ? tab.classList.contains('active') : false,
      frutasSelected: frutas ? frutas.getAttribute('aria-selected') : '',
      crumb: (document.getElementById('crumb-cat')?.textContent || '').trim(),
      count: (document.getElementById('catalog-count')?.textContent || '').trim(),
      cards: names.length,
      names,
    };
  });
  ok(after.ok, `${label}: leftover Explorar fruta is clickable`);
  ok(after.ctaText === 'Explorar fruta →', `${label}: leftover Explorar fruta → stays after click`);
  ok(after.epocaSelected === 'true' && after.epocaActive === true,
    `${label}: leftover Explorar fruta activates leftover Frutas da Época tab`);
  ok(after.frutasSelected === 'false', `${label}: leftover Frutas tab is not left selected`);
  ok(/Frutas da Época/i.test(after.crumb), `${label}: leftover crumb is Frutas da Época (got "${after.crumb}")`);
  ok(/Frutas da Época/i.test(after.count), `${label}: leftover catalog-count names Frutas da Época (got "${after.count}")`);
  ok(after.cards > 0 && after.cards < 40,
    `${label}: leftover epoca catalog shows a leftover subset (${after.cards} cards)`);

  const other = await page.evaluate(() => {
    const frutas = [...document.querySelectorAll('.shop-link')]
      .find(el => /Ver todas as frutas/i.test(el.textContent || ''));
    if (frutas) frutas.click();
    const tab = document.getElementById('tab-frutas');
    const epoca = document.getElementById('tab-epoca');
    const legumes = [...document.querySelectorAll('.shop-link')]
      .find(el => /Ver todos os legumes/i.test(el.textContent || ''));
    const afterFrutas = {
      frutasSelected: tab ? tab.getAttribute('aria-selected') : '',
      epocaSelected: epoca ? epoca.getAttribute('aria-selected') : '',
      crumb: (document.getElementById('crumb-cat')?.textContent || '').trim(),
    };
    if (legumes) legumes.click();
    const tabLeg = document.getElementById('tab-legumes');
    return {
      afterFrutas,
      legumesSelected: tabLeg ? tabLeg.getAttribute('aria-selected') : '',
      crumbLegumes: (document.getElementById('crumb-cat')?.textContent || '').trim(),
    };
  });
  ok(other.afterFrutas.frutasSelected === 'true', `${label}: leftover Ver todas as frutas still opens leftover Frutas`);
  ok(other.afterFrutas.epocaSelected === 'false', `${label}: leftover Época tab is cleared after leftover Frutas`);
  ok(/Frutas/i.test(other.afterFrutas.crumb) && !/Época/i.test(other.afterFrutas.crumb),
    `${label}: leftover Frutas crumb stays Frutas (got "${other.afterFrutas.crumb}")`);
  ok(other.legumesSelected === 'true', `${label}: leftover Ver todos os legumes still opens leftover Legumes`);
  ok(/Legumes/i.test(other.crumbLegumes), `${label}: leftover Legumes crumb stays Legumes (got "${other.crumbLegumes}")`);
}

async function leftoverStorefront(page, label) {
  const search = await page.evaluate(() => {
    const input = document.getElementById('search-input');
    if (!input || !window.pesquisar) return { ok: false };
    input.value = 'morango';
    window.pesquisar();
    const morango = [...document.querySelectorAll('.shop-main .product-card')].length;
    input.value = 'tomate';
    window.pesquisar();
    const tomate = [...document.querySelectorAll('.shop-main .product-card')].length;
    if (window.limparPesquisa) window.limparPesquisa();
    return { ok: true, morango, tomate };
  });
  ok(search.ok && search.morango > 0, `${label}: leftover search morango (${search.morango})`);
  ok(search.ok && search.tomate > 0, `${label}: leftover search tomate (${search.tomate})`);

  await addMelancia(page, label);
  const qty = await page.evaluate(() => {
    const card = [...document.querySelectorAll('.shop-main .product-card')]
      .find(c => /Melancia 1\/4/i.test(c.textContent || ''));
    const plus = card ? [...card.querySelectorAll('.qty-btn')].find(b => /\+|Mais|Aumentar/i.test(b.textContent + (b.getAttribute('aria-label') || ''))) : null;
    if (plus) plus.click();
    return document.getElementById('cart-count')?.textContent || '';
  });
  ok(qty === '2', `${label}: leftover + increments 1→2 (count=${qty})`);

  const dest = await page.evaluate(() => {
    const enc = document.getElementById('encomenda');
    if (window.irParaEncomenda) window.irParaEncomenda();
    return {
      hasEnc: !!enc,
      priv: typeof window.abrirPrivacidade === 'function',
    };
  });
  ok(dest.hasEnc && dest.priv, `${label}: leftover irParaEncomenda still targets leftover #encomenda and leftover Privacidade still opens`);
}

try {
  const desktop = await browser.newPage();
  desktop.on('pageerror', err => errors.push('1280 pageerror: ' + err.message));
  await openReady(desktop, 1280, 800);
  await leftoverEpocaCta(desktop, '1280');
  await leftoverStorefront(desktop, '1280');

  const tablet = await browser.newPage();
  tablet.on('pageerror', err => errors.push('768 pageerror: ' + err.message));
  await openReady(tablet, 768, 1024);
  await leftoverEpocaCta(tablet, '768');
  await addMelancia(tablet, '768');

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

  const menu = await mobile.evaluate(() => {
    const burger = document.querySelector('.hamburger');
    const close = document.querySelector('.mobile-close');
    const panel = document.getElementById('mobile-menu');
    if (window.toggleMenu) window.toggleMenu();
    const opened = panel ? getComputedStyle(panel).display !== 'none' && (panel.classList.contains('open') || getComputedStyle(panel).visibility !== 'hidden') : false;
    if (close) close.click();
    else if (window.toggleMenu) window.toggleMenu();
    const closed = panel ? !panel.classList.contains('open') : false;
    return {
      opened,
      closed,
      burgerLabel: burger ? burger.getAttribute('aria-label') : '',
      closeText: (close?.textContent || '').trim(),
    };
  });
  ok(menu.opened, '390: leftover hamburger still opens leftover menu');
  ok(menu.closed, '390: leftover ✕ still closes leftover menu');
  ok(menu.burgerLabel === 'Menu', '390: leftover hamburger stays named Menu');
  ok(menu.closeText === '✕', '390: leftover mobile-close stays a visible ✕');

  await leftoverEpocaCta(mobile, '390');
  await addMelancia(mobile, '390');

  await browser.close();
  server.close();
  if (errors.length) {
    console.error('check-epoca-featured-cta-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
    process.exit(1);
  }
  console.log('check-epoca-featured-cta-browser: ok');
} catch (err) {
  try { await browser.close(); } catch {}
  try { server.close(); } catch {}
  console.error(err);
  process.exit(1);
}
