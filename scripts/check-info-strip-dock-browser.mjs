#!/usr/bin/env node
/**
 * Headless Chrome: homepage info strip and reviews CTA sit left of the
 * desktop social dock; mobile still hides the dock and the info strip.
 */
import http from 'node:http';
import { createReadStream, existsSync } from 'node:fs';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const TYPES = {
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

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const url = decodeURIComponent((req.url || '/').split('?')[0]);
      const file = join(root, url === '/' ? 'index.html' : url.replace(/^\//, ''));
      if (!file.startsWith(root) || !existsSync(file)) {
        res.writeHead(404); res.end('not found'); return;
      }
      res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream' });
      createReadStream(file).pipe(res);
    });
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

function gap(a, b) {
  return Math.round(b.left - a.right);
}

const server = await startServer();
const origin = `http://127.0.0.1:${server.address().port}/`;

const puppeteer = (await import('puppeteer-core')).default;
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome-stable',
  args: ['--no-sandbox', '--disable-gpu', '--headless=new'],
  headless: true,
});

const checks = [];
function ok(name, pass, detail = '') {
  checks.push({ name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
}

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });
  await page.goto(origin, { waitUntil: 'networkidle0', timeout: 30000 });
  await page.evaluate(() => {
    const o = document.getElementById('offer-pop');
    if (o) o.hidden = true;
    const c = document.getElementById('consent');
    if (c) c.hidden = true;
  });
  await page.waitForSelector('.social-panel');
  await page.waitForSelector('.info-strip-inner');

  const desktop = await page.evaluate(() => {
    const dock = document.querySelector('.social-panel').getBoundingClientRect();
    const box = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height, text: el.textContent.trim() };
    };
    return {
      dock: { left: dock.left, right: dock.right, top: dock.top, bottom: dock.bottom, display: getComputedStyle(document.querySelector('.social-panel')).display },
      chips: [...document.querySelectorAll('.social-link .social-label')].map(n => n.textContent.trim()),
      pickup: box(document.querySelector('.info-item:last-child')),
      strip: box(document.querySelector('.info-strip-inner')),
      hours: box(document.querySelector('.info-item')),
      cta: box(document.querySelector('.reviews-cta')),
    };
  });

  ok('desktop social dock is visible', desktop.dock.display !== 'none', `left=${Math.round(desktop.dock.left)}`);
  ok('chip labels unchanged', desktop.chips.includes('Fale Connosco') && desktop.chips.includes('Encomendar'));
  ok(
    'first-paint pickup chip sits left of the dock',
    desktop.pickup && gap(desktop.pickup, desktop.dock) >= 16,
    desktop.pickup ? `gap=${gap(desktop.pickup, desktop.dock)}px text=${desktop.pickup.text}` : 'missing'
  );
  ok(
    'info strip inner sits left of the dock',
    desktop.strip && gap(desktop.strip, desktop.dock) >= 16,
    desktop.strip ? `gap=${gap(desktop.strip, desktop.dock)}px` : 'missing'
  );
  ok(
    'hours chip still visible on first paint',
    desktop.hours && desktop.hours.text.includes('8:00') && desktop.hours.bottom > desktop.hours.top,
    desktop.hours ? desktop.hours.text : 'missing'
  );

  await page.evaluate(() => document.getElementById('avaliacoes')?.scrollIntoView({ block: 'center' }));
  const reviews = await page.evaluate(() => {
    const dock = document.querySelector('.social-panel').getBoundingClientRect();
    const cta = document.querySelector('.reviews-cta');
    const r = cta.getBoundingClientRect();
    return {
      dockLeft: dock.left,
      cta: { left: r.left, right: r.right, width: r.width, height: r.height, text: cta.textContent.trim() },
    };
  });
  ok(
    'reviews CTA hugs its label (not full-bleed)',
    reviews.cta.width < 520 && reviews.cta.height >= 44 && reviews.cta.text.includes('Ver todas as avaliações no Google'),
    `w=${Math.round(reviews.cta.width)} h=${Math.round(reviews.cta.height)}`
  );
  ok(
    'reviews CTA sits left of the dock',
    gap(reviews.cta, { left: reviews.dockLeft }) >= 16,
    `gap=${gap(reviews.cta, { left: reviews.dockLeft })}px`
  );

  const add = await page.evaluate(() => {
    const card = [...document.querySelectorAll('#grid-frutas .product-card')]
      .find(c => c.textContent.includes('Melancia 1/4'));
    card?.querySelector('.add-btn')?.click();
    return document.getElementById('cart-count')?.textContent || '';
  });
  ok('add Melancia 1/4 still updates the cart badge', add === '1', `count=${add}`);

  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await page.goto(origin, { waitUntil: 'networkidle0', timeout: 30000 });
  await page.evaluate(() => {
    const o = document.getElementById('offer-pop');
    if (o) o.hidden = true;
    const c = document.getElementById('consent');
    if (c) c.hidden = true;
  });
  const mobile = await page.evaluate(() => {
    const dock = document.querySelector('.social-panel');
    const strip = document.querySelector('.info-strip');
    const cta = document.querySelector('.reviews-cta');
    const mb = document.querySelectorAll('.mb-item');
    cta.scrollIntoView({ block: 'center' });
    const r = cta.getBoundingClientRect();
    return {
      dockDisplay: dock ? getComputedStyle(dock).display : 'missing',
      stripDisplay: strip ? getComputedStyle(strip).display : 'missing',
      mbCount: mb.length,
      ctaHeight: r.height,
      ctaWidth: r.width,
    };
  });
  ok('mobile hides the social dock', mobile.dockDisplay === 'none', mobile.dockDisplay);
  ok('mobile hides the info strip (unchanged ≤700px)', mobile.stripDisplay === 'none', mobile.stripDisplay);
  ok('mobile bottom bar still has 4 items', mobile.mbCount === 4, `count=${mobile.mbCount}`);
  ok('mobile reviews CTA stays at least 44px tall', mobile.ctaHeight >= 44, `h=${Math.round(mobile.ctaHeight)}`);
} finally {
  await browser.close();
  server.close();
}

const failed = checks.filter(c => !c.pass);
if (failed.length) {
  console.error(`\n${failed.length} check(s) failed.`);
  process.exit(1);
}
console.log(`\nAll ${checks.length} checks passed.`);
