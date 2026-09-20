#!/usr/bin/env node
/** Chrome: leftover cabaz/CS dialogs + leftover catalog names + leftover credits links; add Melancia 1/4. */
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

async function leftoverDialogsAndNames(page, label) {
  const state = await page.evaluate(() => {
    const search = document.getElementById('search-input');
    const sort = document.getElementById('price-sort');
    const price = document.getElementById('filter-preco');
    const cs = document.getElementById('cs-pop');
    const box = document.querySelector('.cabaz-modal-box');
    const card = [...document.querySelectorAll('#grid-cabazes .product-card')]
      .find(c => /Cabaz Detox/i.test(c.textContent || ''));
    let title = '';
    if (window.abrirCabaz && card) {
      window.abrirCabaz(card.dataset.productId);
      title = document.getElementById('cabaz-modal-title')?.textContent || '';
      if (window.fecharCabaz) window.fecharCabaz();
    }
    return {
      searchName: search ? search.getAttribute('name') : '',
      searchLabel: search ? search.getAttribute('aria-label') : '',
      sortName: sort ? sort.getAttribute('name') : '',
      priceName: price ? price.getAttribute('name') : '',
      csModal: cs ? cs.getAttribute('aria-modal') : '',
      csRole: cs ? cs.getAttribute('role') : '',
      boxRole: box ? box.getAttribute('role') : '',
      boxModal: box ? box.getAttribute('aria-modal') : '',
      boxLabelled: box ? box.getAttribute('aria-labelledby') : '',
      title,
      addText: (document.getElementById('cabaz-modal-add')?.textContent || '').trim(),
    };
  });
  ok(state.searchName === 'pesquisa', `${label}: leftover search name=pesquisa (got "${state.searchName}")`);
  ok(/Pesquisar produtos/i.test(state.searchLabel || ''), `${label}: leftover search aria-label stays`);
  ok(state.sortName === 'ordenar', `${label}: leftover sort name=ordenar (got "${state.sortName}")`);
  ok(state.priceName === 'preco', `${label}: leftover price name=preco (got "${state.priceName}")`);
  ok(state.csRole === 'dialog' && state.csModal === 'true', `${label}: leftover CS pop is an aria-modal dialog`);
  ok(state.boxRole === 'dialog' && state.boxModal === 'true' && state.boxLabelled === 'cabaz-modal-title',
    `${label}: leftover cabaz box is a named dialog`);
  ok(/Cabaz Detox/i.test(state.title), `${label}: leftover cabaz dialog title is "${state.title}"`);
  ok(state.addText === '＋', `${label}: leftover cabaz-modal add stays a visible plus`);
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
    const csModal = cs ? cs.getAttribute('aria-modal') : '';
    const shown = cs ? cs.hidden === false : false;
    if (cs) cs.hidden = true;
    return { ok: true, count: document.getElementById('cart-count')?.textContent || '', csModal, shown };
  });
  ok(added.ok && added.count === '1', `${label}: add Melancia 1/4 (count=${added.count})`);
  ok(added.csModal === 'true', `${label}: leftover CS pop stays aria-modal after add`);
}

async function leftoverCredits(page, label) {
  await page.goto(base + 'creditos.html', { waitUntil: 'domcontentloaded', timeout: 60000 });
  const cred = await page.evaluate(() => {
    const back = document.querySelector('.credits-back');
    const links = [...document.querySelectorAll('.credits-wrap a')].filter(a => a !== back);
    return {
      backHref: back ? back.getAttribute('href') : '',
      backTarget: back ? back.getAttribute('target') : '',
      total: links.length,
      safe: links.filter(a =>
        a.target === '_blank' && (a.getAttribute('rel') || '').includes('noopener')
      ).length,
    };
  });
  ok(cred.backHref === 'index.html' && !cred.backTarget, `${label}: leftover credits back stays same-tab`);
  ok(cred.total >= 100 && cred.safe === cred.total,
    `${label}: leftover credits citations are noopener (${cred.safe}/${cred.total})`);
}

try {
  const desktop = await browser.newPage();
  desktop.on('pageerror', err => errors.push('1280 pageerror: ' + err.message));
  await openReady(desktop, 1280, 800);
  await leftoverDialogsAndNames(desktop, '1280');
  await addMelancia(desktop, '1280');
  await leftoverCredits(desktop, '1280');

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

  const hamburger = await mobile.evaluate(() => {
    const btn = document.querySelector('.hamburger');
    return {
      expanded: btn ? btn.getAttribute('aria-expanded') : 'missing',
      label: btn ? btn.getAttribute('aria-label') : '',
    };
  });
  ok(hamburger.expanded === null && /Menu/i.test(hamburger.label || ''),
    '390: leftover hamburger stays unlabeled-expanded (PR #70)');

  await leftoverDialogsAndNames(mobile, '390');
  await addMelancia(mobile, '390');
  await leftoverCredits(mobile, '390');

  await browser.close();
  server.close();
  if (errors.length) {
    console.error('check-cabaz-cs-credits-names-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
    process.exit(1);
  }
  console.log('check-cabaz-cs-credits-names-browser: ok');
} catch (err) {
  try { await browser.close(); } catch {}
  try { server.close(); } catch {}
  console.error(err);
  process.exit(1);
}
