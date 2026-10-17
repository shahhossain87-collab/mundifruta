#!/usr/bin/env node
/** Chrome: leftover category-card photos zoom only on hover-capable pointers. */
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
  if (file.endsWith('/')) file += 'index.html';
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
const isIdentity = value => !value || value === 'none' || value === 'matrix(1, 0, 0, 1, 0, 0)';

async function measureCard(page, vw, vh) {
  await page.setViewport({ width: vw, height: vh, deviceScaleFactor: 1, isMobile: vw <= 430 });
  await page.goto(`${base}categorias/frutas/`, { waitUntil: 'networkidle0', timeout: 60000 });
  const rest = await page.evaluate(() => {
    const card = document.querySelector('.seo-product-card');
    const img = card ? card.querySelector('.seo-product-image img') : null;
    const link = card ? card.querySelector('.seo-text-link') : null;
    const nav = [...document.querySelectorAll('.seo-nav a')].map(a => (a.textContent || '').trim());
    const rules = [];
    for (const sheet of document.styleSheets) {
      let list;
      try { list = [...sheet.cssRules]; } catch { continue; }
      for (const rule of list) {
        if (!(rule instanceof CSSMediaRule)) continue;
        if (!/\(hover:\s*hover\)/.test(rule.conditionText || '')) continue;
        for (const inner of rule.cssRules) {
          if (/\.seo-product-card:hover/.test(inner.selectorText || '') &&
              /\.seo-product-image img/.test(inner.selectorText || '')) {
            rules.push({
              media: rule.conditionText,
              selector: inner.selectorText,
              transform: inner.style.transform,
            });
          }
        }
      }
    }
    const unscoped = [];
    for (const sheet of document.styleSheets) {
      let list;
      try { list = [...sheet.cssRules]; } catch { continue; }
      for (const rule of list) {
        if (rule instanceof CSSStyleRule &&
            /\.seo-product-card:hover/.test(rule.selectorText || '') &&
            /\.seo-product-image img/.test(rule.selectorText || '')) {
          unscoped.push(rule.selectorText);
        }
      }
    }
    return {
      restTransform: img ? getComputedStyle(img).transform : '',
      linkText: (link?.textContent || '').replace(/\s+/g, ' ').trim(),
      nav,
      hoverRules: rules,
      unscoped,
    };
  });
  const card = await page.$('.seo-product-card');
  if (card) await card.hover();
  await new Promise(r => setTimeout(r, 350));
  const hovered = await page.evaluate(() => {
    const img = document.querySelector('.seo-product-card .seo-product-image img');
    const canHover = window.matchMedia('(hover: hover)').matches;
    return {
      transform: img ? getComputedStyle(img).transform : '',
      canHover,
      cardHovered: document.querySelector('.seo-product-card')?.matches(':hover') || false,
    };
  });
  return { ...rest, hovered };
}

async function addMelancia(page, label) {
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true });
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
    const bar = [...document.querySelectorAll('.mobile-bar .mb-item, .mobile-bar a, .mobile-bar button')]
      .map(el => (el.textContent || '').replace(/\s+/g, ' ').trim())
      .filter(Boolean);
    return { ok: true, count: document.getElementById('cart-count')?.textContent || '', bar };
  });
  ok(added.ok && added.count === '1', `${label}: add Melancia 1/4 (count=${added.count})`);
}

try {
  const coarse = await browser.newPage();
  coarse.on('pageerror', err => errors.push('390 pageerror: ' + err.message));
  const phone = await measureCard(coarse, 390, 844);
  ok(phone.hoverRules.length === 1 && phone.hoverRules[0].transform === 'scale(1.04)',
    `390: leftover zoom lives in (hover: hover) (got ${JSON.stringify(phone.hoverRules)})`);
  ok(phone.unscoped.length === 0, `390: no unscoped leftover card zoom (got ${phone.unscoped.join(', ')})`);
  ok(isIdentity(phone.restTransform), `390 rest transform identity (got ${phone.restTransform})`);
  ok(!phone.hovered.canHover && isIdentity(phone.hovered.transform),
    `390 hover:none should not sticky-zoom leftover card photos (canHover=${phone.hovered.canHover}, transform=${phone.hovered.transform})`);
  ok(phone.linkText === 'Ver produto', `390: leftover Ver produto (got "${phone.linkText}")`);
  ok(phone.nav.join('|') === 'Início|Frutas|Legumes|Promoções',
    `390: wrapping nav stays Início / Frutas / Legumes / Promoções (got ${phone.nav.join(' / ')})`);

  const fine = await browser.newPage();
  fine.on('pageerror', err => errors.push('1280 pageerror: ' + err.message));
  const wide = await measureCard(fine, 1280, 800);
  ok(wide.hoverRules.length === 1 && wide.hoverRules[0].transform === 'scale(1.04)',
    `1280: leftover zoom lives in (hover: hover) (got ${JSON.stringify(wide.hoverRules)})`);
  ok(wide.unscoped.length === 0, `1280: no unscoped leftover card zoom (got ${wide.unscoped.join(', ')})`);
  ok(isIdentity(wide.restTransform), `1280 rest transform identity (got ${wide.restTransform})`);
  ok(!wide.hovered.canHover || /matrix\(1\.04|scale\(1\.04\)/.test(wide.hovered.transform),
    `1280: if the pointer can hover, leftover 1.04 zoom stays (canHover=${wide.hovered.canHover}, transform=${wide.hovered.transform})`);
  ok(wide.linkText === 'Ver produto', `1280: leftover Ver produto (got "${wide.linkText}")`);
  ok(wide.nav.join('|') === 'Início|Frutas|Legumes|Promoções',
    `1280: wrapping nav stays Início / Frutas / Legumes / Promoções (got ${wide.nav.join(' / ')})`);

  const home = await browser.newPage();
  home.on('pageerror', err => errors.push('home pageerror: ' + err.message));
  await addMelancia(home, '390 homepage');

  await browser.close();
  server.close();
  if (errors.length) {
    console.error('check-seo-card-hover-zoom-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
    process.exit(1);
  }
  console.log('check-seo-card-hover-zoom-browser: ok');
} catch (err) {
  try { await browser.close(); } catch {}
  try { server.close(); } catch {}
  console.error(err);
  process.exit(1);
}
