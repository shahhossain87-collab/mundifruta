#!/usr/bin/env node
/** Chrome: leftover catalog / cabaz / modal / cart qty marks; add Melancia 1/4. */
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

function qtyInfo(el) {
  if (!el) return null;
  return {
    text: (el.textContent || '').replace(/\s+/g, ' ').trim(),
    hidden: [...el.querySelectorAll('[aria-hidden="true"]')].map(s =>
      (s.textContent || '').replace(/\s+/g, ' ').trim()
    ),
    label: el.getAttribute('aria-label') || '',
  };
}

async function leftoverQtyMarks(page, label) {
  const data = await page.evaluate(() => {
    const info = (el) => {
      if (!el) return null;
      return {
        text: (el.textContent || '').replace(/\s+/g, ' ').trim(),
        hidden: [...el.querySelectorAll('[aria-hidden="true"]')].map(s =>
          (s.textContent || '').replace(/\s+/g, ' ').trim()
        ),
        label: el.getAttribute('aria-label') || '',
      };
    };
    document.querySelectorAll('.order-remove').forEach(b => b.click());
    if (window.limparTudo) window.limparTudo();
    if (window.mostrarCategoria) window.mostrarCategoria('frutas', document.getElementById('tab-frutas'));
    const card = [...document.querySelectorAll('.shop-main .product-card')]
      .find(c => /Melancia 1\/4/i.test(c.textContent || ''));
    if (!card) return { ok: false, reason: 'card missing' };
    const add = card.querySelector('.add-btn');
    if (add) add.click();
    const qtyBtns = [...card.querySelectorAll('.qty-btn')].map(info);
    const photo = card.querySelector('.photo-wrap');
    if (photo) photo.click();
    const modalMinus = info(document.querySelector('.product-modal-qty button[aria-label="Diminuir quantidade"]'));
    const modalPlus = info(document.querySelector('.product-modal-qty button[aria-label="Aumentar quantidade"]'));
    const modalAdd = document.getElementById('product-modal-add');
    if (window.fecharProduto) window.fecharProduto();
    const cartMinus = info(document.querySelector('.oi-stepper button[aria-label="Menos"]'));
    const cartPlusEl = document.querySelector('.oi-stepper button[aria-label="Mais"]');
    const cartPlus = info(cartPlusEl);
    if (cartPlusEl) cartPlusEl.click();
    const cartAfterPlus = document.querySelector('.oi-stepper b')?.textContent || '';
    const cartMinusEl = document.querySelector('.oi-stepper button[aria-label="Menos"]');
    if (cartMinusEl) cartMinusEl.click();
    const cartAfterMinus = document.querySelector('.oi-stepper b')?.textContent || '';
    const catalogPlus = card.querySelector('.qty-btn[aria-label="Aumentar"]');
    if (catalogPlus) catalogPlus.click();
    const catalogQty = card.querySelector('.qty-num')?.textContent || '';
    const catalogMinus = card.querySelector('.qty-btn[aria-label="Diminuir"]');
    if (catalogMinus) catalogMinus.click();
    const catalogQtyBack = card.querySelector('.qty-num')?.textContent || '';
    const detoxCard = [...document.querySelectorAll('#grid-cabazes .product-card')]
      .find(c => /Cabaz Detox/i.test(c.textContent || ''));
    const cabazAdd = detoxCard && detoxCard.querySelector('.add-btn');
    if (cabazAdd) cabazAdd.click();
    const cabazQty = detoxCard ? [...detoxCard.querySelectorAll('.qty-btn')].map(info) : [];
    const cs = document.getElementById('cs-pop');
    if (cs) cs.hidden = true;
    return {
      ok: true,
      count: document.getElementById('cart-count')?.textContent || '',
      addText: add ? (add.textContent || '').replace(/\s+/g, ' ').trim() : '',
      qtyBtns,
      modalMinus,
      modalPlus,
      modalAdd: modalAdd ? (modalAdd.textContent || '').trim() : '',
      cartMinus,
      cartPlus,
      cartAfterPlus,
      cartAfterMinus,
      catalogQty,
      catalogQtyBack,
      cabazQty,
      cabazAdd: cabazAdd ? (cabazAdd.textContent || '').replace(/\s+/g, ' ').trim() : '',
    };
  });

  ok(data.ok && Number(data.count) >= 1, `${label}: add Melancia 1/4 (count=${data.count})`);
  ok(
    data.qtyBtns && data.qtyBtns.length === 2 &&
    data.qtyBtns[0].label === 'Diminuir' && data.qtyBtns[0].hidden.includes('−') &&
    data.qtyBtns[1].label === 'Aumentar' && data.qtyBtns[1].hidden.includes('+'),
    `${label}: leftover catalog qty − / + are hidden (labels=${data.qtyBtns && data.qtyBtns.map(b => b.label)})`
  );
  ok(
    data.modalMinus && data.modalMinus.label === 'Diminuir quantidade' &&
    data.modalMinus.hidden.includes('−') &&
    data.modalPlus && data.modalPlus.label === 'Aumentar quantidade' &&
    data.modalPlus.hidden.includes('+'),
    `${label}: leftover product-modal qty − / + are hidden`
  );
  ok(
    data.cartMinus && data.cartMinus.label === 'Menos' && data.cartMinus.hidden.includes('−') &&
    data.cartPlus && data.cartPlus.label === 'Mais' && data.cartPlus.hidden.includes('+'),
    `${label}: leftover cart stepper − / + are hidden`
  );
  ok(
    data.cartAfterPlus === '2' && data.cartAfterMinus === '1' &&
    data.catalogQty === '2' && data.catalogQtyBack === '1',
    `${label}: leftover qty +/− still change quantity (cart=${data.cartAfterPlus}/${data.cartAfterMinus}, catalog=${data.catalogQty}/${data.catalogQtyBack})`
  );
  ok(
    data.cabazQty && data.cabazQty.length === 2 &&
    /Diminuir quantidade de Cabaz Detox/i.test(data.cabazQty[0].label) &&
    data.cabazQty[0].hidden.includes('−') &&
    /Aumentar quantidade de Cabaz Detox/i.test(data.cabazQty[1].label) &&
    data.cabazQty[1].hidden.includes('+'),
    `${label}: leftover cabaz qty − / + are hidden (labels=${data.cabazQty && data.cabazQty.map(b => b.label)})`
  );
  ok(
    /＋/.test(data.addText) && data.modalAdd === '＋' && /＋/.test(data.cabazAdd),
    `${label}: leftover add plus marks stay visible`
  );
}

async function leftoverSearchHamburger(page, label) {
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
    const ham = document.querySelector('.hamburger');
    return {
      morango,
      tomate,
      expanded: ham ? ham.getAttribute('aria-expanded') : null,
    };
  });
  ok(data.morango, `${label}: leftover search morango still finds a card`);
  ok(data.tomate, `${label}: leftover search tomate still finds a card`);
  ok(data.expanded === null, `${label}: leftover hamburger stays without expanded`);
}

try {
  const desktop = await browser.newPage();
  desktop.on('pageerror', err => errors.push('1280 pageerror: ' + err.message));
  await openReady(desktop, 1280, 800);
  await leftoverQtyMarks(desktop, '1280');
  await leftoverSearchHamburger(desktop, '1280');

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

  await leftoverQtyMarks(mobile, '390');
  await leftoverSearchHamburger(mobile, '390');

  await browser.close();
  server.close();
  if (errors.length) {
    console.error('check-qty-marks-hidden-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
    process.exit(1);
  }
  console.log('check-qty-marks-hidden-browser: ok');
} catch (err) {
  try { await browser.close(); } catch {}
  try { server.close(); } catch {}
  console.error(err);
  process.exit(1);
}
