#!/usr/bin/env node
/**
 * Headless Chrome: after adding Melancia 1/4, the cross-sell popup must sit
 * left of the always-open WhatsApp chips on laptop widths. Mobile keeps the
 * centered popup and hidden dock.
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

async function loadPuppeteer() {
  const candidates = [
    'puppeteer-core',
    'puppeteer',
    '/tmp/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js',
  ];
  for (const spec of candidates) {
    try {
      const href = spec.startsWith('/') ? pathToFileURL(spec).href : spec;
      const mod = await import(href);
      return mod.default || mod;
    } catch {}
  }
  throw new Error('Install puppeteer-core to run this check');
}

const root = join(fileURLToPath(new URL('..', import.meta.url)));
const CHROME = process.env.CHROME_PATH || '/usr/bin/google-chrome';
const MIME = {
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
  const url = new URL(req.url || '/', 'http://127.0.0.1');
  let file = url.pathname === '/' ? '/index.html' : url.pathname;
  try {
    const body = await readFile(join(root, decodeURIComponent(file)));
    res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404); res.end('not found');
  }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const port = server.address().port;
const origin = `http://127.0.0.1:${port}/`;

const puppeteer = await loadPuppeteer();
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu'],
});

function gap(el, dock) {
  return Math.round(dock.left - el.right);
}
function overlap(a, b) {
  const x = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
  const y = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
  return { w: Math.round(x), h: Math.round(y), area: Math.round(x * y) };
}

async function runView(name, viewport) {
  const page = await browser.newPage();
  await page.evaluateOnNewDocument(() => {
    try { localStorage.removeItem('mf_cart'); } catch {}
  });
  await page.setViewport({ ...viewport, deviceScaleFactor: 1 });
  await page.goto(origin, { waitUntil: 'networkidle0', timeout: 30000 });
  await page.evaluate(() => {
    const c = document.getElementById('consent'); if (c) c.hidden = true;
    const o = document.getElementById('offer-pop'); if (o) o.hidden = true;
    document.body.style.overflow = '';
  });
  await page.waitForFunction(() => document.querySelectorAll('#grid-frutas .add-btn').length > 0);

  const add = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('#grid-frutas .product-card')];
    const card = cards.find(el => /Melancia 1\/4/.test(el.textContent || ''));
    const btn = card?.querySelector('.add-btn');
    if (btn) btn.click();
    return {
      found: Boolean(btn),
      badge: document.getElementById('cart-count')?.textContent || '',
    };
  });
  await page.waitForFunction(() => {
    const pop = document.getElementById('cs-pop');
    return pop && !pop.hidden && pop.getBoundingClientRect().width > 0;
  }, { timeout: 5000 });

  const m = await page.evaluate(() => {
    const box = el => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return {
        left: r.left, right: r.right, top: r.top, bottom: r.bottom, w: r.width, h: r.height,
        display: cs.display, visibility: cs.visibility,
        text: (el.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 90),
      };
    };
    const wa = [...document.querySelectorAll('.social-wa')].map(box);
    const dock = wa.reduce((acc, w) => ({
      left: Math.min(acc.left, w.left), right: Math.max(acc.right, w.right),
      top: Math.min(acc.top, w.top), bottom: Math.max(acc.bottom, w.bottom),
    }), { left: Infinity, right: -Infinity, top: Infinity, bottom: -Infinity });
    return {
      dockDisplay: getComputedStyle(document.querySelector('.social-panel')).display,
      dock: dock.left === Infinity ? null : dock,
      waLabels: [...document.querySelectorAll('.social-wa .social-label')].map(el => el.textContent.trim()),
      csPop: box(document.getElementById('cs-pop')),
      skip: box(document.querySelector('.cs-pop-skip')),
      title: document.getElementById('cs-pop-title')?.textContent || '',
      badge: document.getElementById('cart-count')?.textContent || '',
      mbCount: document.querySelectorAll('.mb-item').length,
    };
  });
  await page.close();
  return { name, viewport, add, m };
}

const results = [];
const checks = [];
function ok(name, pass, detail = '') {
  checks.push({ name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`);
}

try {
  results.push(await runView('769', { width: 769, height: 700, isMobile: false, hasTouch: false }));
  results.push(await runView('900', { width: 900, height: 700, isMobile: false, hasTouch: false }));
  results.push(await runView('1024', { width: 1024, height: 768, isMobile: false, hasTouch: false }));
  results.push(await runView('1280', { width: 1280, height: 800, isMobile: false, hasTouch: false }));
  results.push(await runView('390', { width: 390, height: 844, isMobile: true, hasTouch: true }));

  for (const r of results) {
    ok(`${r.name}: Melancia 1/4 added`, r.add.found && (r.m.badge === '1' || r.add.badge === '1'), `badge=${r.m.badge}`);
    ok(`${r.name}: suggestion popup visible`, r.m.csPop && r.m.csPop.display !== 'none' && r.m.csPop.w > 0, r.m.title);
    ok(`${r.name}: WhatsApp chip labels unchanged`, r.m.waLabels.includes('Fale Connosco') && r.m.waLabels.includes('Encomendar'));

    if (r.name === '390') {
      ok('390: social dock hidden', r.m.dockDisplay === 'none');
      ok('390: popup stays centered (not 200px-right)', Math.abs((r.m.csPop.left + r.m.csPop.right) / 2 - 195) < 30, `mid=${((r.m.csPop.left + r.m.csPop.right) / 2).toFixed(0)}`);
      ok('390: 4-item mobile bar', r.m.mbCount === 4);
    } else {
      const g = gap(r.m.csPop, r.m.dock);
      const ov = overlap(r.m.csPop, r.m.dock);
      ok(`${r.name}: popup does not overlap the dock`, ov.area === 0, `overlap=${ov.w}x${ov.h}`);
      ok(`${r.name}: popup sits left of the dock with ≥20px gap`, g >= 20, `gap=${g}px popRight=${Math.round(r.m.csPop.right)} dockLeft=${Math.round(r.m.dock.left)}`);
      ok(`${r.name}: skip control is still tappable`, r.m.skip && r.m.skip.w > 100, r.m.skip?.text);
    }
  }
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
