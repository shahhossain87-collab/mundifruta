#!/usr/bin/env node
/** Chrome: leftover homepage shop-card photos zoom only on hover-capable pointers. */
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

async function measureCard(page) {
  await page.evaluate(() => {
    if (window.mostrarCategoria) window.mostrarCategoria('frutas', document.getElementById('tab-frutas'));
  });
  const rest = await page.evaluate(() => {
    const card = [...document.querySelectorAll('.shop-main .product-card')]
      .find(c => /Melancia 1\/4/i.test(c.textContent || ''));
    const img = card ? card.querySelector('.photo-wrap img') : null;
    const add = card ? card.querySelector('.add-btn') : null;
    const hero = [...document.querySelectorAll('.hero-ctas a')]
      .map(a => (a.textContent || '').replace(/\s+/g, ' ').trim());
    const rules = [];
    for (const sheet of document.styleSheets) {
      let list;
      try { list = [...sheet.cssRules]; } catch { continue; }
      for (const rule of list) {
        if (!(rule instanceof CSSMediaRule)) continue;
        if (!/\(hover:\s*hover\)/.test(rule.conditionText || '')) continue;
        for (const inner of rule.cssRules) {
          if (/\.product-card:hover/.test(inner.selectorText || '') &&
              /\.photo-wrap img/.test(inner.selectorText || '')) {
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
            /\.product-card:hover/.test(rule.selectorText || '') &&
            /\.photo-wrap img/.test(rule.selectorText || '')) {
          unscoped.push(rule.selectorText);
        }
      }
    }
    const catalogUnscoped = [];
    for (const sheet of document.styleSheets) {
      let list;
      try { list = [...sheet.cssRules]; } catch { continue; }
      for (const rule of list) {
        if (rule instanceof CSSStyleRule &&
            /\.seo-product-card:hover/.test(rule.selectorText || '') &&
            /\.seo-product-image img/.test(rule.selectorText || '')) {
          catalogUnscoped.push(rule.selectorText);
        }
      }
    }
    return {
      found: Boolean(card && img),
      restTransform: img ? getComputedStyle(img).transform : '',
      addText: (add?.textContent || '').replace(/\s+/g, ' ').trim(),
      hero,
      hoverRules: rules,
      unscoped,
      catalogUnscoped,
    };
  });
  const handle = await page.evaluateHandle(() =>
    [...document.querySelectorAll('.shop-main .product-card')]
      .find(c => /Melancia 1\/4/i.test(c.textContent || ''))
  );
  const card = handle.asElement();
  if (card) await card.hover();
  await new Promise(r => setTimeout(r, 350));
  const hovered = await page.evaluate(() => {
    const card = [...document.querySelectorAll('.shop-main .product-card')]
      .find(c => /Melancia 1\/4/i.test(c.textContent || ''));
    const img = card ? card.querySelector('.photo-wrap img') : null;
    const canHover = window.matchMedia('(hover: hover)').matches;
    return {
      transform: img ? getComputedStyle(img).transform : '',
      canHover,
      cardHovered: card ? card.matches(':hover') : false,
    };
  });
  return { ...rest, hovered };
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
    const bar = [...document.querySelectorAll('.mb-item')].map(el =>
      (el.textContent || '').replace(/\s+/g, ' ').trim()
    );
    return { ok: true, count: document.getElementById('cart-count')?.textContent || '', bar };
  });
  ok(added.ok && added.count === '1', `${label}: add Melancia 1/4 (count=${added.count})`);
  return added;
}

try {
  const coarse = await browser.newPage();
  coarse.on('pageerror', err => errors.push('390 pageerror: ' + err.message));
  await openReady(coarse, 390, 844);
  const phone = await measureCard(coarse);
  ok(phone.found, '390: leftover Melancia 1/4 shop card is present');
  ok(phone.hoverRules.length === 1 && phone.hoverRules[0].transform === 'scale(1.09)',
    `390: leftover zoom lives in (hover: hover) (got ${JSON.stringify(phone.hoverRules)})`);
  ok(phone.unscoped.length === 0, `390: no unscoped leftover shop-card zoom (got ${phone.unscoped.join(', ')})`);
  ok(phone.catalogUnscoped.length === 1,
    `390: leftover catalog card zoom stays unscoped (PR #271) (got ${phone.catalogUnscoped.join(', ')})`);
  ok(isIdentity(phone.restTransform), `390 rest transform identity (got ${phone.restTransform})`);
  ok(!phone.hovered.canHover && isIdentity(phone.hovered.transform),
    `390 hover:none should not sticky-zoom leftover shop-card photos (canHover=${phone.hovered.canHover}, transform=${phone.hovered.transform})`);
  ok(phone.hero.some(t => /Ver Produtos/i.test(t)) && phone.hero.some(t => /Encomendar por WhatsApp/i.test(t)),
    `390: leftover hero CTAs stay (got ${phone.hero.join(' / ')})`);
  const bar = await coarse.evaluate(() =>
    [...document.querySelectorAll('.mb-item')].map(el =>
      (el.textContent || '').replace(/\s+/g, ' ').trim()
    )
  );
  ok(bar.some(t => /Carrinho/i.test(t)), '390: 4-item bar still lists Carrinho');
  ok(bar.some(t => /Promoções/i.test(t)), '390: 4-item bar still lists Promoções');
  ok(bar.some(t => /WhatsApp/i.test(t)), '390: 4-item bar still lists WhatsApp');
  ok(bar.some(t => /Como Chegar/i.test(t)), '390: 4-item bar still lists Como Chegar');
  ok(bar.length === 4, `390: leftover 4-item bar stays (got ${bar.length})`);
  await addMelancia(coarse, '390');

  const fine = await browser.newPage();
  fine.on('pageerror', err => errors.push('1280 pageerror: ' + err.message));
  await openReady(fine, 1280, 800);
  const wide = await measureCard(fine);
  ok(wide.found, '1280: leftover Melancia 1/4 shop card is present');
  ok(wide.hoverRules.length === 1 && wide.hoverRules[0].transform === 'scale(1.09)',
    `1280: leftover zoom lives in (hover: hover) (got ${JSON.stringify(wide.hoverRules)})`);
  ok(wide.unscoped.length === 0, `1280: no unscoped leftover shop-card zoom (got ${wide.unscoped.join(', ')})`);
  ok(isIdentity(wide.restTransform), `1280 rest transform identity (got ${wide.restTransform})`);
  ok(!wide.hovered.canHover || /matrix\(1\.09|scale\(1\.09\)/.test(wide.hovered.transform),
    `1280: if the pointer can hover, leftover 1.09 zoom stays (canHover=${wide.hovered.canHover}, transform=${wide.hovered.transform})`);
  ok(wide.hero.some(t => /Ver Produtos/i.test(t)) && wide.hero.some(t => /Encomendar por WhatsApp/i.test(t)),
    `1280: leftover hero CTAs stay (got ${wide.hero.join(' / ')})`);
  await addMelancia(fine, '1280');

  await browser.close();
  server.close();
  if (errors.length) {
    console.error('check-homepage-card-hover-zoom-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
    process.exit(1);
  }
  console.log('check-homepage-card-hover-zoom-browser: ok');
} catch (err) {
  try { await browser.close(); } catch {}
  try { server.close(); } catch {}
  console.error(err);
  process.exit(1);
}
