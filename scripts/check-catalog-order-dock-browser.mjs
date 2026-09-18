#!/usr/bin/env node
/**
 * Headless Chrome: catalog, order, reviews, and cookie banner sit left of
 * the desktop social dock; mobile still hides the dock.
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
const port = server.address().port;
const origin = `http://127.0.0.1:${port}/`;

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
    const c = document.getElementById('consent');
    if (c) c.hidden = false;
    const o = document.getElementById('offer-pop');
    if (o) o.hidden = true;
  });
  await page.waitForSelector('.social-panel');
  await page.waitForSelector('#grid-frutas .product-card, #grid-cabazes .product-card');

  const desktop = await page.evaluate(() => {
    const dock = document.querySelector('.social-panel');
    const dockBox = dock.getBoundingClientRect();
    const measure = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      el.scrollIntoView({ block: 'center' });
      const r = el.getBoundingClientRect();
      return { sel, right: r.right, left: r.left, top: r.top, bottom: r.bottom, hidden: !el.offsetParent && el.hidden };
    };
    return {
      dock: { left: dockBox.left, right: dockBox.right, display: getComputedStyle(dock).display },
      catalog: measure('#grid-frutas'),
      cabazes: measure('#grid-cabazes'),
      order: measure('.order-inner'),
      wa: measure('.btn-wa'),
      reviews: measure('.reviews-grid'),
      qs: measure('#quem-somos'),
      consent: measure('#consent'),
      chips: [...document.querySelectorAll('.social-link .social-label')].map(n => n.textContent.trim()),
    };
  });

  ok('desktop social dock is visible', desktop.dock.display !== 'none', `left=${Math.round(desktop.dock.left)}`);
  ok('chip labels unchanged', desktop.chips.includes('Fale Connosco') && desktop.chips.includes('Encomendar'));

  for (const [name, box] of [
    ['catalog grid', desktop.catalog],
    ['cabazes grid', desktop.cabazes],
    ['order inner', desktop.order],
    ['WhatsApp order button', desktop.wa],
    ['reviews grid', desktop.reviews],
    ['Quem Somos', desktop.qs],
    ['cookie banner', desktop.consent],
  ]) {
    const g = box ? gap(box, desktop.dock) : -999;
    ok(`${name} sits left of the dock`, box && g >= 16, box ? `gap=${g}px` : 'missing');
  }

  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await page.goto(origin, { waitUntil: 'networkidle0', timeout: 30000 });
  const mobile = await page.evaluate(() => {
    const dock = document.querySelector('.social-panel');
    const catalog = document.querySelector('#grid-frutas');
    const order = document.querySelector('.order-inner');
    const consent = document.getElementById('consent');
    return {
      dockDisplay: dock ? getComputedStyle(dock).display : 'missing',
      catalogRight: catalog ? catalog.getBoundingClientRect().right : 0,
      orderRight: order ? order.getBoundingClientRect().right : 0,
      consentRight: consent ? getComputedStyle(consent).right : '',
    };
  });
  ok('mobile hides the social dock', mobile.dockDisplay === 'none', mobile.dockDisplay);
  ok('mobile catalog is not inset 180px', mobile.catalogRight > 300, `right=${Math.round(mobile.catalogRight)}`);
  ok('mobile order is not inset 180px', mobile.orderRight > 300, `right=${Math.round(mobile.orderRight)}`);
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
