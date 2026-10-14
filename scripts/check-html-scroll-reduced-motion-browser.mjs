#!/usr/bin/env node
/** Chrome: leftover html scroll-behavior is auto under reduced motion; cart and 4-item bar stay. */
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

async function scrollState(page) {
  return page.evaluate(() => {
    const html = document.documentElement;
    const cs = getComputedStyle(html);
    const hamburger = document.querySelector('.hamburger');
    const track = document.querySelector('.announcement-track');
    const produtos = document.querySelector('a[href="#produtos"]');
    const encomenda = document.querySelector('a[href="#encomenda"]');
    return {
      scrollBehavior: cs.scrollBehavior,
      copy: track ? (track.textContent || '').replace(/\s+/g, ' ').trim() : '',
      hamburgerExpanded: hamburger ? hamburger.getAttribute('aria-expanded') : 'missing',
      hasProdutos: !!produtos,
      hasEncomenda: !!encomenda,
      stylesheet: [...document.styleSheets].some(sheet => {
        try { return (sheet.href || '').includes('estilos.css?v=67'); } catch { return false; }
      }),
    };
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

try {
  const reduced = await browser.newPage();
  await reduced.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  reduced.on('pageerror', err => errors.push('390 reduced pageerror: ' + err.message));
  await openReady(reduced, 390, 844);
  const stopped = await scrollState(reduced);
  ok(/Encomende por WhatsApp e levante na loja/i.test(stopped.copy),
    `390 reduced: leftover pickup copy (got "${stopped.copy.slice(0, 80)}")`);
  ok(stopped.scrollBehavior === 'auto',
    `390 reduced: leftover html scroll-behavior should be auto (got ${stopped.scrollBehavior})`);
  ok(stopped.hasProdutos && stopped.hasEncomenda, '390 reduced: leftover hash CTAs stay');
  ok(stopped.hamburgerExpanded === null, '390 reduced: leftover hamburger stays without aria-expanded');
  ok(stopped.stylesheet, '390 reduced: leftover estilos.css?v=67 is in the live stylesheet');

  const bar = await reduced.evaluate(() => {
    return [...document.querySelectorAll('.mb-item')].map(el =>
      (el.textContent || '').replace(/\s+/g, ' ').trim()
    );
  });
  ok(bar.some(t => /Carrinho/i.test(t)), '390 reduced: 4-item bar still lists Carrinho');
  ok(bar.some(t => /Promoções/i.test(t)), '390 reduced: 4-item bar still lists Promoções');
  ok(bar.some(t => /WhatsApp/i.test(t)), '390 reduced: 4-item bar still lists WhatsApp');
  ok(bar.some(t => /Como Chegar/i.test(t)), '390 reduced: 4-item bar still lists Como Chegar');
  ok(bar.length === 4, `390 reduced: leftover 4-item bar stays (got ${bar.length})`);
  await addMelancia(reduced, '390 reduced');

  const motion = await browser.newPage();
  await motion.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }]);
  motion.on('pageerror', err => errors.push('1280 motion pageerror: ' + err.message));
  await openReady(motion, 1280, 800);
  const moving = await scrollState(motion);
  ok(/Encomende por WhatsApp e levante na loja/i.test(moving.copy),
    '1280 motion: leftover pickup copy stays');
  ok(moving.scrollBehavior === 'smooth',
    `1280 motion: leftover html scroll-behavior still smooth (got ${moving.scrollBehavior})`);
  ok(moving.hasProdutos && moving.hasEncomenda, '1280 motion: leftover hash CTAs stay');
  ok(moving.hamburgerExpanded === null, '1280 motion: leftover hamburger stays without aria-expanded');
  await addMelancia(motion, '1280 motion');

  const privacy = await motion.evaluate(() => {
    const link = [...document.querySelectorAll('footer a, footer button')]
      .find(el => /Privacidade/i.test(el.textContent || ''));
    if (link) link.click();
    const dialog = document.getElementById('privacy') || document.querySelector('.privacy-modal');
    return { clicked: !!link, open: !!(dialog && !dialog.hidden && getComputedStyle(dialog).display !== 'none') };
  });
  ok(privacy.clicked && privacy.open, '1280 motion: leftover footer Privacidade still opens leftover privacy');

  await browser.close();
  server.close();
  if (errors.length) {
    console.error('check-html-scroll-reduced-motion-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
    process.exit(1);
  }
  console.log('check-html-scroll-reduced-motion-browser: ok');
} catch (err) {
  try { await browser.close(); } catch {}
  try { server.close(); } catch {}
  console.error(err);
  process.exit(1);
}
