#!/usr/bin/env node
/** Chrome: leftover reduced-motion ticker/scroll; search + add Melancia 1/4. */
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

async function openReady(page, vw, vh, reduced) {
  await page.emulateMediaFeatures(
    reduced
      ? [{ name: 'prefers-reduced-motion', value: 'reduce' }]
      : [{ name: 'prefers-reduced-motion', value: 'no-preference' }]
  );
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

async function searchCatalog(page, label) {
  const hits = await page.evaluate(() => {
    const input = document.getElementById('search-input');
    if (!input || !window.pesquisar) return { morango: 0, tomate: 0 };
    input.value = 'morango';
    window.pesquisar();
    const morango = document.querySelectorAll('#grid-catalog .product-card').length;
    input.value = 'tomate';
    window.pesquisar();
    const tomate = document.querySelectorAll('#grid-catalog .product-card').length;
    input.value = '';
    if (window.limparPesquisa) window.limparPesquisa();
    else if (window.limparTudo) window.limparTudo();
    return { morango, tomate };
  });
  ok(hits.morango >= 1, `${label}: leftover search morango (${hits.morango})`);
  ok(hits.tomate >= 1, `${label}: leftover search tomate (${hits.tomate})`);
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

async function leftoverMotion(page, label, expectReduced) {
  const info = await page.evaluate(() => {
    const html = getComputedStyle(document.documentElement);
    const track = document.querySelector('.announcement-track');
    const menu = document.getElementById('mobile-menu');
    const bar = document.getElementById('mobile-bar');
    const ham = document.querySelector('.hamburger');
    return {
      scrollBehavior: html.scrollBehavior,
      tickerAnimation: track ? getComputedStyle(track).animationName : '',
      tickerPlay: track ? getComputedStyle(track).animationPlayState : '',
      menuZ: menu ? getComputedStyle(menu).zIndex : '',
      barDisplay: bar ? getComputedStyle(bar).display : '',
      hamburgerExpanded: ham ? ham.getAttribute('aria-expanded') : 'missing',
      skip: !!document.querySelector('.skip-link, a[href="#conteudo"], a[href="#search-input"].skip'),
      main: !!document.querySelector('main'),
    };
  });
  if (expectReduced) {
    ok(info.scrollBehavior === 'auto', `${label}: leftover html scroll-behavior is auto (${info.scrollBehavior})`);
    ok(
      info.tickerAnimation === 'none' || info.tickerPlay === 'paused',
      `${label}: leftover ticker stopped (${info.tickerAnimation}/${info.tickerPlay})`
    );
  } else {
    ok(info.scrollBehavior === 'smooth', `${label}: leftover html scroll-behavior stays smooth (${info.scrollBehavior})`);
    ok(
      info.tickerAnimation !== 'none' && info.tickerAnimation !== '',
      `${label}: leftover ticker still runs without reduced motion (${info.tickerAnimation})`
    );
  }
  ok(info.menuZ === '999', `${label}: leftover menu z-index stays 999 (${info.menuZ})`);
  ok(info.hamburgerExpanded === 'missing' || info.hamburgerExpanded === null, `${label}: leftover hamburger without expanded`);
  ok(!info.skip && !info.main, `${label}: no leftover skip / main`);
  if (label.includes('390')) {
    ok(info.barDisplay === 'grid', `${label}: leftover 4-item bar visible (${info.barDisplay})`);
  }
}

try {
  const mobile = await browser.newPage();
  await openReady(mobile, 390, 844, false);
  await leftoverMotion(mobile, '390 motion', false);
  await searchCatalog(mobile, '390');
  await addMelancia(mobile, '390');
  await mobile.close();

  const mobileReduce = await browser.newPage();
  await openReady(mobileReduce, 390, 844, true);
  await leftoverMotion(mobileReduce, '390 reduce', true);
  await searchCatalog(mobileReduce, '390 reduce');
  await addMelancia(mobileReduce, '390 reduce');
  await mobileReduce.close();

  const desktop = await browser.newPage();
  await openReady(desktop, 1280, 800, false);
  await leftoverMotion(desktop, '1280 motion', false);
  await searchCatalog(desktop, '1280');
  await addMelancia(desktop, '1280');
  await desktop.close();

  const desktopReduce = await browser.newPage();
  await openReady(desktopReduce, 1280, 800, true);
  await leftoverMotion(desktopReduce, '1280 reduce', true);
  await searchCatalog(desktopReduce, '1280 reduce');
  await addMelancia(desktopReduce, '1280 reduce');
  await desktopReduce.close();
} finally {
  await browser.close();
  server.close();
}

if (errors.length) {
  console.error(errors.map(e => `FAIL: ${e}`).join('\n'));
  process.exit(1);
}
console.log('ok: leftover reduced-motion ticker + html scroll-behavior (Chrome 390 + 1280)');
