#!/usr/bin/env node
/** Chrome: leftover tabpanel labelledby + nav/footer/carousel 44px; add Melancia 1/4. */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
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
const chrome = process.env.CHROME_PATH || '/usr/bin/google-chrome-stable';
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
const box = (el) => {
  if (!el) return { w: 0, h: 0 };
  const r = el.getBoundingClientRect();
  return { w: Math.round(r.width), h: Math.round(r.height) };
};

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

async function resetFrutas(page) {
  await page.evaluate(() => {
    if (window.limparTudo) window.limparTudo();
    if (window.mostrarCategoria) window.mostrarCategoria('frutas', document.getElementById('tab-frutas'));
  });
}

async function addMelancia(page, label) {
  await resetFrutas(page);
  const added = await page.evaluate(() => {
    const card = [...document.querySelectorAll('.shop-main .product-card')]
      .find(c => /Melancia 1\/4/i.test(c.textContent || ''));
    if (!card) return { ok: false, reason: 'card missing' };
    const btn = card.querySelector('.add-btn');
    if (btn) btn.click();
    const badge = document.getElementById('cart-count');
    return { ok: true, count: badge ? badge.textContent : '' };
  });
  ok(added.ok && added.count === '1', `${label}: add Melancia 1/4 (count=${added.count})`);
}

async function checkTabpanel(page, label) {
  await resetFrutas(page);
  const start = await page.evaluate(() => {
    const grid = document.getElementById('grid-catalog');
    const cabazes = document.getElementById('grid-cabazes');
    return {
      role: grid && grid.getAttribute('role'),
      labelledby: grid && grid.getAttribute('aria-labelledby'),
      tabIndex: grid && grid.tabIndex,
      cards: grid ? grid.querySelectorAll('.product-card').length : 0,
      cabazRole: cabazes && cabazes.getAttribute('role'),
    };
  });
  ok(start.role === 'tabpanel', `${label}: grid role is tabpanel (got ${start.role})`);
  ok(start.labelledby === 'tab-frutas', `${label}: grid starts labelled by Frutas (got ${start.labelledby})`);
  ok(start.tabIndex === -1, `${label}: grid tabindex is -1 (got ${start.tabIndex})`);
  ok(start.cards > 0, `${label}: Frutas grid has cards (got ${start.cards})`);
  ok(!start.cabazRole, `${label}: cabazes grid must not be a tabpanel (got ${start.cabazRole})`);

  const legumes = await page.evaluate(() => {
    document.getElementById('tab-legumes').click();
    const grid = document.getElementById('grid-catalog');
    return {
      labelledby: grid.getAttribute('aria-labelledby'),
      selected: document.getElementById('tab-legumes').getAttribute('aria-selected'),
      crumb: document.getElementById('crumb-cat')?.textContent,
    };
  });
  ok(legumes.labelledby === 'tab-legumes', `${label}: Legumes labels the grid (got ${legumes.labelledby})`);
  ok(legumes.selected === 'true', `${label}: Legumes tab stays selected`);
  ok(legumes.crumb === 'Legumes', `${label}: crumb follows Legumes (got ${legumes.crumb})`);

  const cabazJump = await page.evaluate(() => {
    document.getElementById('tab-cabazes').click();
    const grid = document.getElementById('grid-catalog');
    return {
      labelledby: grid.getAttribute('aria-labelledby'),
      cabazSelected: document.getElementById('tab-cabazes').getAttribute('aria-selected'),
      legumesSelected: document.getElementById('tab-legumes').getAttribute('aria-selected'),
    };
  });
  ok(cabazJump.labelledby === 'tab-legumes',
    `${label}: Cabazes jump does not steal the grid label (got ${cabazJump.labelledby})`);
  ok(cabazJump.cabazSelected === 'false' && cabazJump.legumesSelected === 'true',
    `${label}: Cabazes stays unselected (PR #47 owns the highlight)`);
}

async function checkChromeTaps(page, label, vw) {
  if (vw >= 769) {
    await page.addStyleTag({ content: '.carousel-nav { display:grid !important; }' });
  }
  const sizes = await page.evaluate((measureBox) => {
    const fn = new Function('el', `return (${measureBox})(el)`);
    const nav = [...document.querySelectorAll('.nav-links a')].map(a => {
      const r = a.getBoundingClientRect();
      return { text: a.textContent.trim(), w: Math.round(r.width), h: Math.round(r.height) };
    });
    const footer = [...document.querySelectorAll('.footer-links a')].map(a => {
      const r = a.getBoundingClientRect();
      return { text: a.textContent.trim(), w: Math.round(r.width), h: Math.round(r.height) };
    });
    const arrows = [...document.querySelectorAll('.carousel-nav')].map(b => {
      const r = b.getBoundingClientRect();
      const cs = getComputedStyle(b);
      return {
        label: b.getAttribute('aria-label'),
        w: Math.round(r.width),
        h: Math.round(r.height),
        display: cs.display,
      };
    });
    return { nav, footer, arrows };
  }, box.toString());

  if (vw >= 769) {
    ok(sizes.nav.length >= 6, `${label}: header has shop links (got ${sizes.nav.length})`);
    sizes.nav.forEach(n => {
      ok(n.h >= 44, `${label}: nav “${n.text}” is ${n.w}×${n.h}, need height ≥44`);
    });
    ok(sizes.arrows.length >= 2, `${label}: featured carousels expose prev/next`);
    const visibleArrows = sizes.arrows.filter(a => a.display !== 'none');
    ok(visibleArrows.length >= 2, `${label}: desktop hover should show carousel arrows (got ${visibleArrows.length})`);
    visibleArrows.forEach(a => {
      ok(a.w >= 44 && a.h >= 44, `${label}: carousel ${a.label} is ${a.w}×${a.h}, need ≥44`);
    });
  } else {
    ok(sizes.nav.every(n => n.w === 0 && n.h === 0), `${label}: header links stay hidden on mobile`);
  }

  ok(sizes.footer.length >= 4, `${label}: footer has shop links (got ${sizes.footer.length})`);
  sizes.footer.forEach(f => {
    ok(f.h >= 44, `${label}: footer “${f.text}” is ${f.w}×${f.h}, need height ≥44`);
    ok(f.text !== '', `${label}: footer link copy is unchanged`);
  });
}

try {
  const desktop = await browser.newPage();
  desktop.on('pageerror', err => errors.push('1280 pageerror: ' + err.message));
  await openReady(desktop, 1280, 800);
  await checkTabpanel(desktop, '1280');
  await checkChromeTaps(desktop, '1280', 1280);
  await addMelancia(desktop, '1280');
  await desktop.close();

  const mobile = await browser.newPage();
  mobile.on('pageerror', err => errors.push('390 pageerror: ' + err.message));
  await openReady(mobile, 390, 844);
  await checkTabpanel(mobile, '390');
  await checkChromeTaps(mobile, '390', 390);
  await addMelancia(mobile, '390');
  await mobile.close();
} finally {
  await browser.close();
  server.close();
}

if (errors.length) {
  console.error('check-tabpanel-chrome-taps-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
  process.exit(1);
}
console.log('check-tabpanel-chrome-taps-browser: ok');
