#!/usr/bin/env node
/** Chrome: leftover cabaz-card add name + leftover sel-check hide; add Melancia 1/4. */
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

async function leftoverCabazAdd(page, label) {
  const info = await page.evaluate(() => {
    const card = [...document.querySelectorAll('#grid-cabazes .product-card')]
      .find(c => /Cabaz Detox/i.test(c.textContent || ''));
    const add = card ? card.querySelector('.add-btn') : null;
    const check = card ? card.querySelector('.sel-check') : null;
    const ver = card ? card.querySelector('.cabaz-ver') : null;
    return {
      addLabel: add ? add.getAttribute('aria-label') || '' : '',
      addText: add ? (add.textContent || '').trim() : '',
      addType: add ? add.getAttribute('type') : '',
      checkHidden: check ? check.getAttribute('aria-hidden') : '',
      verLabel: ver ? ver.getAttribute('aria-label') : null,
      verText: ver ? (ver.textContent || '').replace(/\s+/g, ' ').trim() : '',
      gridLabel: document.getElementById('grid-cabazes')?.getAttribute('aria-label') || '',
    };
  });
  ok(/Cabaz Detox/i.test(info.addLabel) && /Adicionar/i.test(info.addLabel),
    `${label}: leftover cabaz add name is "${info.addLabel}"`);
  ok(info.addText === '＋', `${label}: leftover cabaz add stays a visible plus`);
  ok(info.addType === 'button', `${label}: leftover cabaz add type=button`);
  ok(info.checkHidden === 'true', `${label}: leftover cabaz sel-check is aria-hidden`);
  ok(!info.verLabel, `${label}: leftover cabaz-ver name stays for PR #64`);
  ok(/Ver o que leva/i.test(info.verText), `${label}: leftover cabaz-ver copy unchanged`);
  ok(!info.gridLabel, `${label}: leftover cabaz grid label stays for PR #64`);
}

try {
  const desktop = await browser.newPage();
  desktop.on('pageerror', err => errors.push('1280 pageerror: ' + err.message));
  await openReady(desktop, 1280, 800);
  await leftoverCabazAdd(desktop, '1280');
  await addMelancia(desktop, '1280');

  const after = await desktop.evaluate(() => {
    const card = [...document.querySelectorAll('#grid-cabazes .product-card')]
      .find(c => /Cabaz Detox/i.test(c.textContent || ''));
    const add = card ? card.querySelector('.add-btn') : null;
    if (add) add.click();
    const cs = document.getElementById('cs-pop');
    if (cs) cs.hidden = true;
    return {
      label: add ? add.getAttribute('aria-label') || '' : '',
      text: add ? (add.textContent || '').trim() : '',
      count: document.getElementById('cart-count')?.textContent || '',
    };
  });
  ok(/Cabaz Detox/i.test(after.label), `1280: leftover cabaz add name survives add (got "${after.label}")`);
  ok(after.text === '＋', `1280: leftover cabaz add stays a visible plus after add`);
  ok(Number(after.count) >= 2, `1280: leftover Cabaz Detox add increments cart (count=${after.count})`);

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

  await leftoverCabazAdd(mobile, '390');
  await addMelancia(mobile, '390');

  await browser.close();
  server.close();
  if (errors.length) {
    console.error('check-cabaz-add-name-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
    process.exit(1);
  }
  console.log('check-cabaz-add-name-browser: ok');
} catch (err) {
  try { await browser.close(); } catch {}
  try { server.close(); } catch {}
  console.error(err);
  process.exit(1);
}
