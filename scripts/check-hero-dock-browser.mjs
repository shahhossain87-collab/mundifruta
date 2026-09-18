#!/usr/bin/env node
/**
 * Headless Chrome: first-paint hero pickup chip sits left of the desktop
 * social dock at 1024px (where it previously overlapped) and 1280px;
 * mobile still hides the dock and the hero chips.
 */
import http from 'node:http';
import { createReadStream, existsSync } from 'node:fs';
import { extname, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

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

async function firstPaint(page, width, height) {
  await page.setViewport({ width, height, deviceScaleFactor: 1 });
  await page.goto(origin, { waitUntil: 'networkidle0', timeout: 30000 });
  await page.evaluate(() => {
    const o = document.getElementById('offer-pop');
    if (o) o.hidden = true;
    const c = document.getElementById('consent');
    if (c) c.hidden = true;
  });
  await page.waitForSelector('.social-panel');
  await page.waitForSelector('.hero-content');
  return page.evaluate(() => {
    const dockEl = document.querySelector('.social-panel');
    const dock = dockEl.getBoundingClientRect();
    const box = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height, text: el.textContent.trim() };
    };
    const chips = [...document.querySelectorAll('.hero-chip')];
    return {
      dock: { left: dock.left, right: dock.right, top: dock.top, bottom: dock.bottom, display: getComputedStyle(dockEl).display },
      chips: [...document.querySelectorAll('.social-link .social-label')].map(n => n.textContent.trim()),
      lastHeroChip: box(chips[chips.length - 1]),
      hero: box(document.querySelector('.hero-content')),
      comprar: box(document.querySelector('.hero-ctas .btn-prim')),
      hours: box(document.querySelector('.hero-chip')),
    };
  });
}

try {
  const page = await browser.newPage();

  const laptop = await firstPaint(page, 1024, 768);
  ok('1024 social dock is visible', laptop.dock.display !== 'none', `left=${Math.round(laptop.dock.left)}`);
  ok('chip labels unchanged', laptop.chips.includes('Fale Connosco') && laptop.chips.includes('Encomendar'));
  ok(
    '1024 first-paint pickup chip sits left of the dock',
    laptop.lastHeroChip && laptop.lastHeroChip.text.includes('Levantamento na Loja') && gap(laptop.lastHeroChip, laptop.dock) >= 16,
    laptop.lastHeroChip ? `gap=${gap(laptop.lastHeroChip, laptop.dock)}px text=${laptop.lastHeroChip.text}` : 'missing'
  );
  ok(
    '1024 hero content sits left of the dock',
    laptop.hero && gap(laptop.hero, laptop.dock) >= 16,
    laptop.hero ? `gap=${gap(laptop.hero, laptop.dock)}px` : 'missing'
  );
  ok(
    '1024 hours chip still visible on first paint',
    laptop.hours && laptop.hours.text.includes('8h') && laptop.hours.bottom > laptop.hours.top,
    laptop.hours ? laptop.hours.text : 'missing'
  );
  ok(
    '1024 Comprar Agora still visible',
    laptop.comprar && laptop.comprar.text.includes('Comprar Agora') && laptop.comprar.width > 100,
    laptop.comprar ? laptop.comprar.text : 'missing'
  );

  const desktop = await firstPaint(page, 1280, 800);
  ok(
    '1280 first-paint pickup chip sits left of the dock',
    desktop.lastHeroChip && desktop.lastHeroChip.text.includes('Levantamento na Loja') && gap(desktop.lastHeroChip, desktop.dock) >= 16,
    desktop.lastHeroChip ? `gap=${gap(desktop.lastHeroChip, desktop.dock)}px` : 'missing'
  );
  ok(
    '1280 hero content sits left of the dock',
    desktop.hero && gap(desktop.hero, desktop.dock) >= 16,
    desktop.hero ? `gap=${gap(desktop.hero, desktop.dock)}px` : 'missing'
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
    const chip = document.querySelector('.hero-chip');
    const cta = document.querySelector('.hero-ctas');
    const mb = document.querySelectorAll('.mb-item');
    const heading = document.querySelector('.hero-heading');
    return {
      dockDisplay: dock ? getComputedStyle(dock).display : 'missing',
      chipDisplay: chip ? getComputedStyle(chip).display : 'missing',
      ctaDisplay: cta ? getComputedStyle(cta).display : 'missing',
      mbCount: mb.length,
      heading: heading ? heading.textContent.replace(/\s+/g, ' ').trim() : '',
    };
  });
  ok('mobile hides the social dock', mobile.dockDisplay === 'none', mobile.dockDisplay);
  ok('mobile still hides hero chips (unchanged ≤700px)', mobile.chipDisplay === 'none', mobile.chipDisplay);
  ok('mobile bottom bar still has 4 items', mobile.mbCount === 4, `count=${mobile.mbCount}`);
  ok('mobile hero heading copy unchanged', mobile.heading.includes('Fruta') && mobile.heading.includes('Frescos Todos os Dias'), mobile.heading);
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
