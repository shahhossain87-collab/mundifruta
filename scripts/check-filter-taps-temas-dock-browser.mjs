#!/usr/bin/env node
/**
 * Headless Chrome: 44px sidebar taps at 390px (open drawer) and 1280px
 * (sticky sidebar); theme chips clear the dock at 900px.
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
    return { w: r.width, h: r.height, right: r.right, top: r.top, left: r.left };
  }));
}

async function dismissOverlays(page) {
  await page.evaluate(() => {
    const c = document.getElementById('consent');
    if (c) c.hidden = true;
    const o = document.getElementById('offer-pop');
    if (o) o.hidden = true;
    try { localStorage.setItem('mf_consent', 'essential'); } catch (e) {}
  });
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

  // Mobile: open Filtros and measure drawer controls.
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await page.goto(origin, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await dismissOverlays(page);
  await page.waitForSelector('.filtbtn');
  await page.click('.filtbtn');
  await page.waitForSelector('.shop-sidebar.open');

  const cat = await boxes(page, '.shop-sidebar.open .cat-tab');
  assert(cat.length >= 4, `expected category tabs, got ${cat.length}`);
  for (const b of cat) {
    assert(b.h >= 44, `category tab height ${b.h} < 44`);
  }

  const chips = await boxes(page, '.shop-sidebar.open .filter-chip');
  assert(chips.length >= 2, `expected filter chips, got ${chips.length}`);
  for (const b of chips) {
    assert(b.h >= 44, `filter chip height ${b.h} < 44`);
  }

  const sub = await boxes(page, '.shop-sidebar.open .subcat-chip');
  assert(sub.length >= 1, `expected subcategory chips, got ${sub.length}`);
  for (const b of sub) {
    assert(b.h >= 44, `subcategory chip height ${b.h} < 44`);
  }

  const price = await boxes(page, '.shop-sidebar.open .filter-select');
  assert(price.length === 1 && price[0].h >= 44, `price select height ${price[0]?.h} < 44`);

  // Add Melancia 1/4 still works (drawer closes on category; add from catalog).
  await page.click('.shop-sidebar.open .sidebar-close');
  await page.waitForFunction(() => !document.querySelector('.shop-sidebar.open'));
  const added = await page.evaluate(() => {
    const card = [...document.querySelectorAll('.product-card')].find(el =>
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

  // Desktop 1280: sticky sidebar taps + no theme-chip overlap with dock.
  await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1, isMobile: false, hasTouch: false });
  await page.goto(origin, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await dismissOverlays(page);
  await page.waitForSelector('.shop-sidebar .cat-tab');

  const deskCat = await boxes(page, '.shop-sidebar .cat-tab');
  for (const b of deskCat) {
    assert(b.h >= 44, `desktop category tab height ${b.h} < 44`);
  }
  const deskChip = await boxes(page, '.shop-sidebar .filter-chip');
  for (const b of deskChip) {
    assert(b.h >= 44, `desktop filter chip height ${b.h} < 44`);
  }

  await page.evaluate(() => document.getElementById('avaliacoes')?.scrollIntoView({ block: 'center' }));
  await page.waitForSelector('.tema-chip');
  const overlap1280 = await page.evaluate(() => {
    const dock = document.querySelector('.social-panel');
    const chips = [...document.querySelectorAll('.tema-chip')];
    const dr = dock.getBoundingClientRect();
    return chips.map(c => {
      const r = c.getBoundingClientRect();
      const gap = dr.left - r.right;
      return { text: c.textContent.trim(), gap, chipRight: r.right, dockLeft: dr.left };
    });
  });
  for (const row of overlap1280) {
    assert(row.gap >= 16, `1280px theme chip "${row.text}" gap ${row.gap}px (chip ${row.chipRight} dock ${row.dockLeft})`);
  }

  // 900px is the leftover overlap band from PR #39.
  await page.setViewport({ width: 900, height: 800, deviceScaleFactor: 1, isMobile: false, hasTouch: false });
  await page.goto(origin, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await dismissOverlays(page);
  await page.evaluate(() => document.getElementById('avaliacoes')?.scrollIntoView({ block: 'center' }));
  await page.waitForSelector('.tema-chip');
  const overlap900 = await page.evaluate(() => {
    const dock = document.querySelector('.social-panel');
    const chips = [...document.querySelectorAll('.tema-chip')];
    const dr = dock.getBoundingClientRect();
    return {
      dockDisplay: getComputedStyle(dock).display,
      rows: chips.map(c => {
        const r = c.getBoundingClientRect();
        return { text: c.textContent.trim(), gap: dr.left - r.right, chipRight: r.right, dockLeft: dr.left };
      }),
    };
  });
  assert(overlap900.dockDisplay !== 'none', 'social dock should be visible at 900px');
  for (const row of overlap900.rows) {
    assert(row.gap >= 16, `900px theme chip "${row.text}" gap ${row.gap}px (chip ${row.chipRight} dock ${row.dockLeft})`);
  }

  // Mobile: dock hidden, theme row has no 180px gutter.
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await page.goto(origin, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await dismissOverlays(page);
  const mobileDock = await page.evaluate(() => {
    const dock = document.querySelector('.social-panel');
    const row = document.querySelector('.temas-row');
    const cs = getComputedStyle(row);
    return {
      dockDisplay: getComputedStyle(dock).display,
      marginRight: cs.marginRight,
    };
  });
  assert(mobileDock.dockDisplay === 'none', `mobile dock display is ${mobileDock.dockDisplay}`);
  const mr = parseFloat(mobileDock.marginRight) || 0;
  assert(mr < 40, `mobile temas-row margin-right should not keep the desktop gutter, got ${mr}`);

  console.log('PASS  mobile drawer taps ≥44px; desktop sidebar taps ≥44px');
  console.log('PASS  theme chips clear the dock at 900 and 1280; mobile has no gutter');
  console.log('PASS  add Melancia 1/4 still updates the cart');
} finally {
  await browser.close();
  server.close();
}
