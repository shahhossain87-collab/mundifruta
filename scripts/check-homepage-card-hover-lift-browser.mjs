#!/usr/bin/env node
/** Chrome: leftover homepage shop cards lift only on hover-capable pointers. */
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
const isScale102 = value => {
  if (!value) return false;
  if (/scale\(1\.02\)/.test(value)) return true;
  const m = value.match(/^matrix\(([^)]+)\)$/);
  if (!m) return false;
  const parts = m[1].split(',').map(s => parseFloat(s.trim()));
  return parts.length === 6 && Math.abs(parts[0] - 1.02) < 0.005 && Math.abs(parts[3] - 1.02) < 0.005;
};
const isLift4 = value => {
  if (!value) return false;
  if (/translateY\(-4px\)/.test(value)) return true;
  const m = value.match(/^matrix\(([^)]+)\)$/);
  if (!m) return false;
  const parts = m[1].split(',').map(s => parseFloat(s.trim()));
  return parts.length === 6 &&
    Math.abs(parts[0] - 1) < 0.01 &&
    Math.abs(parts[3] - 1) < 0.01 &&
    Math.abs(parts[4]) < 0.5 &&
    Math.abs(parts[5] - (-4)) < 0.6;
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
    const hoverRules = [];
    const unscopedLift = [];
    const unscopedZoom = [];
    const catalogUnscoped = [];
    const scUnscopedLift = [];
    for (const sheet of document.styleSheets) {
      let list;
      try { list = [...sheet.cssRules]; } catch { continue; }
      for (const rule of list) {
        if (rule instanceof CSSMediaRule && /\(hover:\s*hover\)/.test(rule.conditionText || '')) {
          for (const inner of rule.cssRules) {
            if ((inner.selectorText || '') === '.product-card:hover') {
              hoverRules.push({
                media: rule.conditionText,
                selector: inner.selectorText,
                transform: inner.style.transform,
              });
            }
          }
        }
        if (rule instanceof CSSStyleRule) {
          const sel = rule.selectorText || '';
          if (sel === '.product-card:hover') unscopedLift.push(sel + ' ' + rule.style.transform);
          if (/\.product-card:hover/.test(sel) && /\.photo-wrap img/.test(sel)) {
            unscopedZoom.push(sel);
          }
          if (/\.seo-product-card:hover/.test(sel) && /\.seo-product-image img/.test(sel)) {
            catalogUnscoped.push(sel);
          }
          if (sel === '.sc:hover') scUnscopedLift.push(sel);
        }
      }
    }
    return {
      found: Boolean(card),
      restTransform: card ? getComputedStyle(card).transform : '',
      restImg: img ? getComputedStyle(img).transform : '',
      addText: (add?.textContent || '').replace(/\s+/g, ' ').trim(),
      hero,
      hoverRules,
      unscopedLift,
      unscopedZoom,
      catalogUnscoped,
      scUnscopedLift,
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
    const canHover = window.matchMedia('(hover: hover)').matches;
    return {
      transform: card ? getComputedStyle(card).transform : '',
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
  ok(
    phone.hoverRules.length === 3 &&
    phone.hoverRules.some(r => r.transform === 'translateY(-12px) scale(1.02)') &&
    phone.hoverRules.some(r => r.transform === 'translateY(-5px)') &&
    phone.hoverRules.some(r => r.transform === 'translateY(-4px)'),
    `390: leftover shop-card lifts live in (hover: hover) (got ${JSON.stringify(phone.hoverRules)})`
  );
  ok(phone.unscopedLift.length === 0, `390: no unscoped leftover shop-card lift (got ${phone.unscopedLift.join(', ')})`);
  ok(phone.unscopedZoom.length === 1,
    `390: leftover shop-card photo zoom stays unscoped (PR #272) (got ${phone.unscopedZoom.join(', ')})`);
  ok(phone.catalogUnscoped.length === 1,
    `390: leftover catalog card zoom stays unscoped (PR #271) (got ${phone.catalogUnscoped.join(', ')})`);
  ok(phone.scUnscopedLift.length === 1,
    `390: leftover unused .sc card lift stays unscoped (PR #277) (got ${phone.scUnscopedLift.join(', ')})`);
  ok(!phone.hovered.canHover,
    `390: hover:none pointer (canHover=${phone.hovered.canHover})`);
  ok(!isScale102(phone.hovered.transform),
    `390 hover:none should not sticky-scale leftover shop cards to 1.02 (transform=${phone.hovered.transform})`);
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
  ok(
    wide.hoverRules.length === 3 &&
    wide.hoverRules.some(r => r.transform === 'translateY(-12px) scale(1.02)') &&
    wide.hoverRules.some(r => r.transform === 'translateY(-5px)') &&
    wide.hoverRules.some(r => r.transform === 'translateY(-4px)'),
    `1280: leftover shop-card lifts live in (hover: hover) (got ${JSON.stringify(wide.hoverRules)})`
  );
  ok(wide.unscopedLift.length === 0, `1280: no unscoped leftover shop-card lift (got ${wide.unscopedLift.join(', ')})`);
  ok(!isScale102(wide.hovered.transform),
    `1280: leftover 1.02 scale must not win over later leftover 4px lift (transform=${wide.hovered.transform})`);
  ok(!wide.hovered.canHover || isIdentity(wide.hovered.transform) || isLift4(wide.hovered.transform),
    `1280: if the pointer can hover, leftover 4px lift or animation fill stays (canHover=${wide.hovered.canHover}, transform=${wide.hovered.transform})`);
  ok(wide.hero.some(t => /Ver Produtos/i.test(t)) && wide.hero.some(t => /Encomendar por WhatsApp/i.test(t)),
    `1280: leftover hero CTAs stay (got ${wide.hero.join(' / ')})`);
  await addMelancia(fine, '1280');

  await browser.close();
  server.close();
  if (errors.length) {
    console.error('check-homepage-card-hover-lift-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
    process.exit(1);
  }
  console.log('check-homepage-card-hover-lift-browser: ok');
} catch (err) {
  try { await browser.close(); } catch {}
  try { server.close(); } catch {}
  console.error(err);
  process.exit(1);
}
