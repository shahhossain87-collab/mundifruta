#!/usr/bin/env node
/**
 * Headless Chrome: Phase A main-column leftover taps are ≥44px at 390 and 1280,
 * search text cannot inject markup into filter tags, and add Melancia 1/4 still works.
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.xml': 'text/xml',
  '.txt': 'text/plain',
};

function startServer() {
  return new Promise(resolve => {
    const server = http.createServer((req, res) => {
      const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
      const file = path.join(root, urlPath === '/' ? 'index.html' : urlPath);
      if (!file.startsWith(root)) { res.writeHead(403).end(); return; }
      fs.readFile(file, (err, data) => {
        if (err) { res.writeHead(404).end('not found'); return; }
        res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
        res.end(data);
      });
    });
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function boxes(page, sel) {
  return page.$$eval(sel, els => els.map(el => {
    const r = el.getBoundingClientRect();
    return { w: r.width, h: r.height, text: (el.textContent || '').trim() };
  }));
}

async function dismissOverlays(page) {
  await page.evaluate(() => {
    const c = document.getElementById('consent');
    if (c) c.hidden = true;
    const o = document.getElementById('offer-pop');
    if (o) o.hidden = true;
    try {
      localStorage.setItem('mf_consent', 'essential');
      localStorage.removeItem('mf_cart');
    } catch (e) {}
  });
}

async function measureMainTaps(page) {
  await page.waitForSelector('.shop-main .add-btn');
  const adds = await page.$$eval('.shop-main .add-btn', els => els.filter(el => {
    const s = getComputedStyle(el);
    return s.display !== 'none' && s.visibility !== 'hidden';
  }).map(el => {
    const r = el.getBoundingClientRect();
    return { w: r.width, h: r.height, text: (el.textContent || '').trim() };
  }));
  assert(adds.length >= 1, 'expected catalog add buttons');
  for (const b of adds.slice(0, 8)) {
    assert(b.h >= 44, `add-btn height ${b.h} < 44 (${b.text})`);
  }

  const sort = await boxes(page, '.shop-main .price-sort');
  assert(sort.length === 1 && sort[0].h >= 44, `price-sort height ${sort[0]?.h} < 44`);

  await page.evaluate(() => document.getElementById('filter-promo')?.click());
  await page.waitForSelector('.filter-tag');
  const tags = await boxes(page, '.filter-tag');
  assert(tags.length >= 2, `expected active filter tags, got ${tags.length}`);
  for (const b of tags) {
    assert(b.h >= 44, `filter-tag height ${b.h} < 44 (${b.text})`);
  }

  await page.evaluate(() => document.querySelector('.filter-tag.clear-all')?.click());
  await page.waitForFunction(() => document.getElementById('active-filters')?.hidden);

  await page.focus('#search-input');
  await page.keyboard.type('<img src=x onerror=alert(1)>');
  await page.waitForSelector('.filter-tag');
  const injected = await page.evaluate(() => {
    const box = document.getElementById('active-filters');
    return {
      imgs: box.querySelectorAll('img').length,
      scripts: box.querySelectorAll('script').length,
      text: box.textContent,
    };
  });
  assert(injected.imgs === 0 && injected.scripts === 0, 'search query injected markup into filter tags');
  assert(injected.text.includes('<img src=x onerror=alert(1)>'), `filter tag lost the typed query: ${injected.text}`);

  const clear = await boxes(page, '.shop-main .search-clear.visible');
  assert(clear.length === 1 && clear[0].h >= 44 && clear[0].w >= 44, `search-clear size ${clear[0]?.w}x${clear[0]?.h} < 44`);
  const clearButtons = await page.$$eval('.shop-main .search-row button.search-clear.visible', els => els.length);
  assert(clearButtons === 1, `expected one custom search-clear, got ${clearButtons}`);

  await page.evaluate(() => document.querySelector('.filter-tag.clear-all')?.click());
  await page.waitForFunction(() => document.getElementById('active-filters')?.hidden);
}

const server = await startServer();
const { port } = server.address();
const origin = `http://127.0.0.1:${port}/`;
const browser = await puppeteer.launch({
  headless: 'new',
  executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome',
  args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
});

try {
  const page = await browser.newPage();

  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await page.goto(origin, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await dismissOverlays(page);
  await measureMainTaps(page);

  await page.evaluate(() => document.getElementById('tab-frutas')?.click());
  const added = await page.evaluate(() => {
    const card = [...document.querySelectorAll('.shop-main .product-card')].find(el =>
      (el.querySelector('.product-name')?.textContent || '').includes('Melancia 1/4')
    );
    const btn = card && card.querySelector('.add-btn');
    if (!btn) return false;
    btn.click();
    return true;
  });
  assert(added, 'could not add Melancia 1/4 from the catalog');
  await page.waitForFunction(() => {
    const n = document.getElementById('cart-count');
    return n && n.textContent.trim() !== '0';
  });

  const emptyH = await page.evaluate(() => {
    document.getElementById('search-input').value = 'zzzz-no-match';
    document.getElementById('search-input').dispatchEvent(new Event('input', { bubbles: true }));
    const btn = document.querySelector('.no-results .link-btn');
    return btn ? btn.getBoundingClientRect().height : 0;
  });
  assert(emptyH >= 44, `empty-results link-btn height ${emptyH} < 44`);

  await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1, isMobile: false, hasTouch: false });
  await page.goto(origin, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await dismissOverlays(page);
  await measureMainTaps(page);

  console.log('PASS  mobile + desktop main-column taps ≥44px');
  console.log('PASS  search query stays text in filter tags (no injected markup)');
  console.log('PASS  add Melancia 1/4 still updates the cart');
} finally {
  await browser.close();
  server.close();
}
