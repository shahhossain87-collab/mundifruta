#!/usr/bin/env node
/** Chrome: leftover named-add plus / photo-fallback marks; add Melancia 1/4. */
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
  });
  await page.reload({ waitUntil: 'networkidle0', timeout: 60000 });
  await page.evaluate(() => {
    const c = document.getElementById('consent'); if (c) c.hidden = true;
    const o = document.getElementById('offer-pop'); if (o) o.hidden = true;
  });
}

async function leftoverNamedAddFallback(page, label) {
  const data = await page.evaluate(() => {
    const search = document.getElementById('search-input');
    if (search) {
      search.value = 'morango';
      search.dispatchEvent(new Event('input', { bubbles: true }));
    }
    const morango = [...document.querySelectorAll('.shop-main .product-card')]
      .some(c => /Morango/i.test(c.textContent || ''));
    if (search) {
      search.value = 'tomate';
      search.dispatchEvent(new Event('input', { bubbles: true }));
    }
    const tomate = [...document.querySelectorAll('.shop-main .product-card')]
      .some(c => /Tomate/i.test(c.textContent || ''));
    if (window.limparTudo) window.limparTudo();
    if (window.mostrarCategoria) window.mostrarCategoria('frutas', document.getElementById('tab-frutas'));

    const card = [...document.querySelectorAll('.shop-main .product-card')]
      .find(c => /Melancia 1\/4/i.test(c.textContent || ''));
    const add = card && card.querySelector('.add-btn');
    const before = add ? {
      text: (add.textContent || '').replace(/\s+/g, ' ').trim(),
      hidden: [...add.querySelectorAll('[aria-hidden="true"]')].map(s =>
        (s.textContent || '').replace(/\s+/g, ' ').trim()
      ),
    } : null;
    if (add) add.click();
    const cs = document.getElementById('cs-pop');
    if (cs) cs.hidden = true;
    const after = add ? (add.textContent || '').replace(/\s+/g, ' ').trim() : '';

    const img = card && card.querySelector('.photo-wrap img');
    if (img && typeof window.erroImagem === 'function') {
      img.dataset.emoji = img.dataset.emoji || '🍉';
      window.erroImagem(img);
    }
    const fallback = card && card.querySelector('.photo-fallback');

    const featured = document.querySelector('.feature-add');
    const cabazAdd = [...document.querySelectorAll('#grid-cabazes .add-btn')][0];
    const modalAdd = document.getElementById('product-modal-add');
    const cabazModalAdd = document.getElementById('cabaz-modal-add');

    const detoxCard = [...document.querySelectorAll('#grid-cabazes .product-card')]
      .find(c => /Cabaz Detox/i.test(c.textContent || ''));
    const detoxId = detoxCard && detoxCard.dataset.productId;
    if (detoxId && window.abrirCabaz) window.abrirCabaz(detoxId);
    const cabazModalName = cabazModalAdd ? cabazModalAdd.getAttribute('aria-label') || '' : '';
    const cabazModalHidden = cabazModalAdd
      ? [...cabazModalAdd.querySelectorAll('[aria-hidden="true"]')].map(s =>
          (s.textContent || '').replace(/\s+/g, ' ').trim()
        )
      : [];
    if (window.fecharCabaz) window.fecharCabaz();

    const csCard = document.querySelector('.cs-card img');
    if (csCard) {
      const ev = new Event('error');
      csCard.dispatchEvent(ev);
      if (typeof csCard.onerror === 'function') csCard.onerror(ev);
    }
    const csEmoji = document.querySelector('.cs-emoji');

    const ham = document.querySelector('.hamburger');
    return {
      morango,
      tomate,
      count: document.getElementById('cart-count')?.textContent || '',
      before,
      after,
      fallbackHidden: fallback ? fallback.getAttribute('aria-hidden') || '' : '',
      fallbackText: fallback ? (fallback.textContent || '').trim() : '',
      featuredText: featured ? (featured.textContent || '').trim() : '',
      featuredHidden: featured ? featured.querySelector('[aria-hidden="true"]') : null,
      cabazAddText: cabazAdd ? (cabazAdd.textContent || '').trim() : '',
      cabazAddHidden: cabazAdd ? cabazAdd.querySelector('[aria-hidden="true"]') : null,
      modalText: modalAdd ? (modalAdd.textContent || '').trim() : '',
      modalHidden: modalAdd ? modalAdd.querySelector('[aria-hidden="true"]') : null,
      cabazModalName,
      cabazModalHidden,
      cabazModalVisible: cabazModalAdd ? (cabazModalAdd.textContent || '').trim() : '',
      csEmojiHidden: csEmoji ? csEmoji.getAttribute('aria-hidden') || '' : 'none',
      hamExpanded: ham ? ham.getAttribute('aria-expanded') : 'missing',
    };
  });

  ok(data.morango, `${label}: leftover search morango still finds a card`);
  ok(data.tomate, `${label}: leftover search tomate still finds a card`);
  ok(Number(data.count) >= 1, `${label}: add Melancia 1/4 (count=${data.count})`);
  ok(
    data.before &&
    data.before.hidden.includes('＋') &&
    /Adicionar/i.test(data.before.text),
    `${label}: leftover catalog add plus is hidden (before=${JSON.stringify(data.before)})`
  );
  ok(/＋/.test(data.after), `${label}: leftover catalog add plus stays visible after add`);
  ok(
    data.fallbackHidden === 'true' && data.fallbackText,
    `${label}: leftover photo-fallback is hidden (text=${data.fallbackText})`
  );
  ok(
    data.featuredText === '＋' && !data.featuredHidden,
    `${label}: leftover featured plus-only add stays unwrapped`
  );
  ok(
    data.cabazAddText === '＋' && !data.cabazAddHidden,
    `${label}: leftover cabaz-card plus-only add stays unwrapped`
  );
  ok(
    data.modalText === '＋' && !data.modalHidden,
    `${label}: leftover product-modal plus-only add stays unwrapped`
  );
  ok(
    /Adicionar Cabaz Detox ao carrinho/i.test(data.cabazModalName) &&
    data.cabazModalHidden.includes('＋') &&
    data.cabazModalVisible === '＋',
    `${label}: leftover cabaz-modal plus is hidden (name=${data.cabazModalName})`
  );
  ok(
    data.hamExpanded === null,
    `${label}: leftover hamburger stays without expanded`
  );
}

try {
  const desktop = await browser.newPage();
  desktop.on('pageerror', err => errors.push('1280 pageerror: ' + err.message));
  await openReady(desktop, 1280, 800);
  await leftoverNamedAddFallback(desktop, '1280');

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

  await leftoverNamedAddFallback(mobile, '390');

  await browser.close();
  server.close();
  if (errors.length) {
    console.error('check-named-add-photo-fallback-hidden-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
    process.exit(1);
  }
  console.log('check-named-add-photo-fallback-hidden-browser: ok');
} catch (err) {
  try { await browser.close(); } catch {}
  try { server.close(); } catch {}
  console.error(err);
  process.exit(1);
}
