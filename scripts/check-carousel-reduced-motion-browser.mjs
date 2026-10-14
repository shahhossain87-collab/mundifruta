#!/usr/bin/env node
/** Chrome: leftover featured-row carousel prefers-reduced-motion. */
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

async function carouselState(page) {
  return page.evaluate(() => {
    const grids = [...document.querySelectorAll('.feature-grid.carousel')];
    const htmlBehavior = getComputedStyle(document.documentElement).scrollBehavior;
    const track = document.querySelector('.announcement-track');
    const ticker = track ? getComputedStyle(track).animationName : '';
    return {
      count: grids.length,
      behaviors: grids.map(g => getComputedStyle(g).scrollBehavior),
      cards: grids.map(g => g.children.length),
      hasPrev: !!document.querySelector('.carousel-nav.prev'),
      hasNext: !!document.querySelector('.carousel-nav.next'),
      htmlBehavior,
      ticker,
      promo: !!document.getElementById('promo-grid'),
      popular: !!document.getElementById('popular-grid'),
      season: !!document.getElementById('season-grid'),
      veg: !!document.getElementById('veg-featured-grid'),
    };
  });
}

async function clickNext(page) {
  return page.evaluate(async () => {
    const grid = document.querySelector('.feature-grid.carousel');
    const next = grid && grid.parentElement.querySelector('.carousel-nav.next');
    if (!grid || !next) return { ok: false, reason: 'missing nav' };
    const before = grid.scrollLeft;
    next.click();
    await new Promise(r => setTimeout(r, 80));
    return {
      ok: true,
      before,
      after: grid.scrollLeft,
      overflow: grid.scrollWidth > grid.clientWidth + 8,
    };
  });
}

try {
  const desktop = await browser.newPage();
  desktop.on('pageerror', err => errors.push('1280 pageerror: ' + err.message));
  await desktop.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }]);
  await openReady(desktop, 1280, 800);
  const smooth = await carouselState(desktop);
  ok(smooth.count >= 1, `1280: leftover featured carousels present (got ${smooth.count})`);
  ok(smooth.behaviors.every(b => b === 'smooth'), `1280: leftover carousel scroll-behavior stays smooth (got ${smooth.behaviors.join(',')})`);
  ok(smooth.hasPrev && smooth.hasNext, '1280: leftover carousel prev/next stay');
  ok(smooth.htmlBehavior === 'smooth', `1280: leftover html scroll-behavior stays smooth (got ${smooth.htmlBehavior})`);
  ok(smooth.promo && smooth.popular && smooth.season && smooth.veg, '1280: leftover featured-row ids stay');
  const moved = await clickNext(desktop);
  ok(moved.ok && (!moved.overflow || moved.after > moved.before),
    `1280: leftover next still scrolls (before=${moved.before} after=${moved.after} overflow=${moved.overflow})`);

  const reduced = await browser.newPage();
  reduced.on('pageerror', err => errors.push('1280-reduce pageerror: ' + err.message));
  await reduced.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await openReady(reduced, 1280, 800);
  const auto = await carouselState(reduced);
  ok(auto.count >= 1, `1280-reduce: leftover featured carousels present (got ${auto.count})`);
  ok(auto.behaviors.every(b => b === 'auto'), `1280-reduce: leftover carousel scroll-behavior is auto (got ${auto.behaviors.join(',')})`);
  ok(auto.hasPrev && auto.hasNext, '1280-reduce: leftover carousel prev/next stay');
  ok(auto.htmlBehavior === 'smooth', `1280-reduce: leftover html scroll-behavior stays smooth (got ${auto.htmlBehavior})`);
  ok(/ticker/i.test(auto.ticker), `1280-reduce: leftover ticker still animates (got ${auto.ticker})`);
  const movedAuto = await clickNext(reduced);
  ok(movedAuto.ok && (!movedAuto.overflow || movedAuto.after > movedAuto.before),
    `1280-reduce: leftover next still scrolls (before=${movedAuto.before} after=${movedAuto.after})`);

  const mobile = await browser.newPage();
  mobile.on('pageerror', err => errors.push('390-reduce pageerror: ' + err.message));
  await mobile.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await openReady(mobile, 390, 844);
  const mobileState = await carouselState(mobile);
  ok(mobileState.count >= 1, `390-reduce: leftover featured carousels present (got ${mobileState.count})`);
  ok(mobileState.behaviors.every(b => b === 'auto'), `390-reduce: leftover carousel scroll-behavior is auto (got ${mobileState.behaviors.join(',')})`);
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

  await browser.close();
  server.close();
  if (errors.length) {
    console.error('check-carousel-reduced-motion-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
    process.exit(1);
  }
  console.log('check-carousel-reduced-motion-browser: ok');
} catch (err) {
  try { await browser.close(); } catch {}
  try { server.close(); } catch {}
  console.error(err);
  process.exit(1);
}
