#!/usr/bin/env node
/** Chrome: leftover featured / product-modal add names; add Melancia 1/4. */
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

async function leftoverFeaturedModalNames(page, label) {
  const names = await page.evaluate(() => {
    const feature = [...document.querySelectorAll('.feature-product')]
      .find(c => /Melancia 1\/4/i.test(c.textContent || ''));
    const featureAdd = feature ? feature.querySelector('.feature-add') : null;
    const catalog = [...document.querySelectorAll('.shop-main .product-card')]
      .find(c => /Melancia 1\/4/i.test(c.textContent || ''));
    const catalogAdd = catalog ? catalog.querySelector('.add-btn') : null;
    let modalLabel = '';
    let modalText = '';
    let modalQty = '';
    if (window.abrirProduto && catalog) {
      window.abrirProduto(catalog.dataset.productId);
      const add = document.getElementById('product-modal-add');
      modalLabel = add ? add.getAttribute('aria-label') || '' : '';
      modalText = (add?.textContent || '').trim();
      modalQty = document.querySelector('.product-modal-qty button')?.getAttribute('aria-label') || '';
      if (window.fecharProduto) window.fecharProduto();
    }
    const cabaz = [...document.querySelectorAll('#grid-cabazes .product-card')]
      .find(c => /Cabaz Detox/i.test(c.textContent || ''));
    const cabazAdd = cabaz ? cabaz.querySelector('.add-btn') : null;
    return {
      featureLabel: featureAdd ? featureAdd.getAttribute('aria-label') || '' : '',
      featureText: (featureAdd?.textContent || '').trim(),
      catalogLabel: catalogAdd ? catalogAdd.getAttribute('aria-label') || '' : '',
      catalogText: (catalogAdd?.textContent || '').trim(),
      modalLabel,
      modalText,
      modalQty,
      cabazLabel: cabazAdd ? cabazAdd.getAttribute('aria-label') || '' : '',
      cabazText: (cabazAdd?.textContent || '').trim(),
      hamburgerExpanded: document.querySelector('.hamburger')?.getAttribute('aria-expanded'),
    };
  });
  ok(/Melancia 1\/4/i.test(names.featureLabel) && /Adicionar/i.test(names.featureLabel),
    `${label}: leftover featured add name is "${names.featureLabel}"`);
  ok(names.featureText === '＋', `${label}: leftover featured add stays a visible plus`);
  ok(/Melancia 1\/4/i.test(names.modalLabel) && /Adicionar/i.test(names.modalLabel),
    `${label}: leftover product-modal add name is "${names.modalLabel}"`);
  ok(names.modalText === '＋', `${label}: leftover product-modal add stays a visible plus`);
  ok(names.modalQty === 'Diminuir quantidade',
    `${label}: leftover product-modal qty stays generic (got "${names.modalQty}")`);
  ok(!names.catalogLabel,
    `${label}: leftover catalog add stays unnamed (PR #70) (got "${names.catalogLabel}")`);
  ok(names.catalogText.includes('Adicionar'),
    `${label}: leftover catalog add keeps visible Adicionar`);
  ok(!names.cabazLabel,
    `${label}: leftover cabaz card add stays unnamed (PR #66) (got "${names.cabazLabel}")`);
  ok(names.cabazText === '＋', `${label}: leftover cabaz card add stays a visible plus`);
  ok(!names.hamburgerExpanded,
    `${label}: leftover hamburger stays without aria-expanded (PR #70)`);
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
    const feature = [...document.querySelectorAll('.feature-product')]
      .find(c => /Melancia 1\/4/i.test(c.textContent || ''));
    const featureAdd = feature ? feature.querySelector('.feature-add') : null;
    return {
      ok: true,
      count: document.getElementById('cart-count')?.textContent || '',
      featureLabel: featureAdd ? featureAdd.getAttribute('aria-label') || '' : '',
      featureText: (featureAdd?.textContent || '').trim(),
    };
  });
  ok(added.ok && added.count === '1', `${label}: add Melancia 1/4 (count=${added.count})`);
  ok(/Melancia 1\/4/i.test(added.featureLabel),
    `${label}: leftover featured add name survives add (got "${added.featureLabel}")`);
  ok(added.featureText === '＋', `${label}: leftover featured add stays a plus after add`);
}

try {
  const desktop = await browser.newPage();
  desktop.on('pageerror', err => errors.push('1280 pageerror: ' + err.message));
  await openReady(desktop, 1280, 800);
  await leftoverFeaturedModalNames(desktop, '1280');
  await addMelancia(desktop, '1280');

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

  const search = await mobile.evaluate(() => {
    const input = document.getElementById('search-input');
    if (!input || !window.pesquisar) return { ok: false };
    input.value = 'morango';
    window.pesquisar();
    const morango = [...document.querySelectorAll('.shop-main .product-card')]
      .some(c => /Morango/i.test(c.textContent || ''));
    input.value = 'tomate';
    window.pesquisar();
    const tomate = [...document.querySelectorAll('.shop-main .product-card')]
      .some(c => /Tomate/i.test(c.textContent || ''));
    if (window.limparPesquisa) window.limparPesquisa();
    if (window.mostrarCategoria) window.mostrarCategoria('frutas', document.getElementById('tab-frutas'));
    const ham = document.querySelector('.hamburger');
    return {
      ok: true,
      morango,
      tomate,
      hamLabel: ham ? ham.getAttribute('aria-label') || '' : '',
      hamExpanded: ham ? ham.getAttribute('aria-expanded') : null,
      menuOpen: document.getElementById('mobile-menu')?.classList.contains('open') || false,
    };
  });
  ok(search.ok && search.morango, '390: leftover search still finds morango');
  ok(search.tomate, '390: leftover search still finds tomate');
  ok(search.hamLabel === 'Menu' && search.hamExpanded == null && !search.menuOpen,
    '390: leftover hamburger stays Menu without expanded (PR #70)');

  await leftoverFeaturedModalNames(mobile, '390');
  await addMelancia(mobile, '390');

  await browser.close();
  server.close();
  if (errors.length) {
    console.error('check-featured-modal-add-names-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
    process.exit(1);
  }
  console.log('check-featured-modal-add-names-browser: ok');
} catch (err) {
  try { await browser.close(); } catch {}
  try { server.close(); } catch {}
  console.error(err);
  process.exit(1);
}
