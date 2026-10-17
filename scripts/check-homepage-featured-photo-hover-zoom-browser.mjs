#!/usr/bin/env node
/** Chrome: leftover homepage featured photos zoom only on hover-capable pointers. */
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

async function measureFeatured(page) {
  const rest = await page.evaluate(() => {
    const card = [...document.querySelectorAll('#promo-grid .feature-product, #popular-grid .feature-product')]
      .find(c => /Melancia 1\/4/i.test(c.textContent || ''));
    const img = card ? card.querySelector('.feature-photo img') : null;
    const titles = [...document.querySelectorAll('.shop-feature .section-title')]
      .map(el => (el.textContent || '').replace(/\s+/g, ' ').trim());
    const hero = [...document.querySelectorAll('.hero-ctas a')]
      .map(a => (a.textContent || '').replace(/\s+/g, ' ').trim());
    const hoverRules = [];
    const unscoped = [];
    const shopUnscoped = [];
    const catalogUnscoped = [];
    const tileUnscoped = [];
    const scUnscoped = [];
    const qsUnscoped = [];
    for (const sheet of document.styleSheets) {
      let list;
      try { list = [...sheet.cssRules]; } catch { continue; }
      for (const rule of list) {
        if (rule instanceof CSSMediaRule && /\(hover:\s*hover\)/.test(rule.conditionText || '')) {
          for (const inner of rule.cssRules) {
            if (/\.feature-photo:hover/.test(inner.selectorText || '') &&
                /img/.test(inner.selectorText || '')) {
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
          if (/\.feature-photo:hover/.test(sel) && /img/.test(sel)) unscoped.push(sel);
          if (/\.product-card:hover/.test(sel) && /\.photo-wrap img/.test(sel)) shopUnscoped.push(sel);
          if (/\.seo-product-card:hover/.test(sel) && /\.seo-product-image img/.test(sel)) catalogUnscoped.push(sel);
          if (/\.cat-quick-btn:hover/.test(sel) && /img/.test(sel)) tileUnscoped.push(sel);
          if (/\.sc:hover/.test(sel) && /img/.test(sel)) scUnscoped.push(sel);
          if (/\.qs-photo:hover/.test(sel) && /img/.test(sel)) qsUnscoped.push(sel);
        }
      }
    }
    return {
      found: Boolean(card && img),
      restTransform: img ? getComputedStyle(img).transform : '',
      titles,
      hero,
      hoverRules,
      unscoped,
      shopUnscoped,
      catalogUnscoped,
      tileUnscoped,
      scUnscoped,
      qsUnscoped,
    };
  });
  const handle = await page.evaluateHandle(() => {
    const card = [...document.querySelectorAll('#promo-grid .feature-product, #popular-grid .feature-product')]
      .find(c => /Melancia 1\/4/i.test(c.textContent || ''));
    return card ? card.querySelector('.feature-photo') : null;
  });
  const photo = handle.asElement();
  if (photo) await photo.hover();
  await new Promise(r => setTimeout(r, 350));
  const hovered = await page.evaluate(() => {
    const card = [...document.querySelectorAll('#promo-grid .feature-product, #popular-grid .feature-product')]
      .find(c => /Melancia 1\/4/i.test(c.textContent || ''));
    const img = card ? card.querySelector('.feature-photo img') : null;
    const btn = card ? card.querySelector('.feature-photo') : null;
    return {
      transform: img ? getComputedStyle(img).transform : '',
      canHover: window.matchMedia('(hover: hover)').matches,
      photoHovered: btn ? btn.matches(':hover') : false,
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
  const phone = await measureFeatured(coarse);
  ok(phone.found, '390: leftover Melancia 1/4 featured photo is present');
  ok(phone.hoverRules.length === 1 && phone.hoverRules[0].transform === 'scale(1.045)',
    `390: leftover featured zoom lives in (hover: hover) (got ${JSON.stringify(phone.hoverRules)})`);
  ok(phone.unscoped.length === 0, `390: no unscoped leftover featured-photo zoom (got ${phone.unscoped.join(', ')})`);
  ok(phone.shopUnscoped.length === 1,
    `390: leftover shop-card zoom stays unscoped (PR #272) (got ${phone.shopUnscoped.join(', ')})`);
  ok(phone.catalogUnscoped.length === 1,
    `390: leftover catalog card zoom stays unscoped (PR #271) (got ${phone.catalogUnscoped.join(', ')})`);
  ok(phone.tileUnscoped.length >= 1,
    `390: leftover category-tile zoom stays unscoped (PR #273) (got ${phone.tileUnscoped.join(', ')})`);
  ok(phone.scUnscoped.length === 1,
    `390: leftover .sc zoom stays unscoped (got ${phone.scUnscoped.join(', ')})`);
  ok(phone.qsUnscoped.length === 1,
    `390: leftover .qs-photo zoom stays unscoped (got ${phone.qsUnscoped.join(', ')})`);
  ok(isIdentity(phone.restTransform), `390 rest transform identity (got ${phone.restTransform})`);
  ok(!phone.hovered.canHover && isIdentity(phone.hovered.transform),
    `390 hover:none should not sticky-zoom leftover featured photos (canHover=${phone.hovered.canHover}, transform=${phone.hovered.transform})`);
  ok(
    phone.titles.some(t => /Promoções da Semana/i.test(t)) &&
    phone.titles.some(t => /Frutas Populares/i.test(t)) &&
    phone.titles.some(t => /Fruta da Época/i.test(t)) &&
    phone.titles.some(t => /Legumes Frescos/i.test(t)),
    `390: leftover featured sections stay (got ${phone.titles.join(' / ')})`
  );
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
  const wide = await measureFeatured(fine);
  ok(wide.found, '1280: leftover Melancia 1/4 featured photo is present');
  ok(wide.hoverRules.length === 1 && wide.hoverRules[0].transform === 'scale(1.045)',
    `1280: leftover featured zoom lives in (hover: hover) (got ${JSON.stringify(wide.hoverRules)})`);
  ok(wide.unscoped.length === 0, `1280: no unscoped leftover featured-photo zoom (got ${wide.unscoped.join(', ')})`);
  ok(isIdentity(wide.restTransform), `1280 rest transform identity (got ${wide.restTransform})`);
  ok(!wide.hovered.canHover || /matrix\(1\.045|scale\(1\.045\)/.test(wide.hovered.transform),
    `1280: if the pointer can hover, leftover 1.045 zoom stays (canHover=${wide.hovered.canHover}, transform=${wide.hovered.transform})`);
  ok(wide.hero.some(t => /Ver Produtos/i.test(t)) && wide.hero.some(t => /Encomendar por WhatsApp/i.test(t)),
    `1280: leftover hero CTAs stay (got ${wide.hero.join(' / ')})`);
  await addMelancia(fine, '1280');

  await browser.close();
  server.close();
  if (errors.length) {
    console.error('check-homepage-featured-photo-hover-zoom-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
    process.exit(1);
  }
  console.log('check-homepage-featured-photo-hover-zoom-browser: ok');
} catch (err) {
  try { await browser.close(); } catch {}
  try { server.close(); } catch {}
  console.error(err);
  process.exit(1);
}
