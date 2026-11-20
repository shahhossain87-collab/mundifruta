#!/usr/bin/env node
/** Chrome: leftover homepage category tiles lift only on hover-capable pointers. */
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

async function openReady(page, vw, vh, path = '/') {
  await page.setViewport({ width: vw, height: vh, deviceScaleFactor: 1, isMobile: vw <= 430 });
  await page.goto(new URL(path, base).href, { waitUntil: 'networkidle0', timeout: 60000 });
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

async function measureTile(page) {
  const rest = await page.evaluate(() => {
    const tile = [...document.querySelectorAll('.homepage-category .cat-quick-btn')]
      .find(btn => /Frutas/i.test(btn.textContent || '') && !/Fruta da Época/i.test(btn.textContent || ''));
    const img = tile ? tile.querySelector('img') : null;
    const labels = [...document.querySelectorAll('.homepage-category .cat-quick-btn .cq-label')]
      .map(el => (el.textContent || '').replace(/\s+/g, ' ').trim());
    const types = [...document.querySelectorAll('.homepage-category .cat-quick-btn')]
      .map(el => el.getAttribute('type') || '');
    const hero = [...document.querySelectorAll('.hero-ctas a')]
      .map(a => (a.textContent || '').replace(/\s+/g, ' ').trim());
    const stepTitles = [...document.querySelectorAll('#como-funciona .step-title')]
      .map(el => (el.textContent || '').replace(/\s+/g, ' ').trim());
    const hoverRules = [];
    const unscopedLift = [];
    const unscopedZoom = [];
    const unscopedScroll = [];
    const unscopedWa = [];
    const unscopedBadge = [];
    const unscopedRating = [];
    const arrowUnscoped = [];
    const ghostUnscoped = [];
    const primUnscoped = [];
    const navOrderUnscoped = [];
    const ooUnscoped = [];
    const stepUnscoped = [];
    const csUnscoped = [];
    const contactUnscoped = [];
    const shopUnscopedLift = [];
    const shopUnscopedZoom = [];
    const catalogUnscoped = [];
    const scUnscopedLift = [];
    const hoverNoneLift = [];
    for (const sheet of document.styleSheets) {
      let list;
      try { list = [...sheet.cssRules]; } catch { continue; }
      for (const rule of list) {
        if (rule instanceof CSSMediaRule && /\(hover:\s*hover\)/.test(rule.conditionText || '')) {
          for (const inner of rule.cssRules) {
            const sel = inner.selectorText || '';
            if (/\.cat-quick-btn:hover/.test(sel) && !/img/.test(sel)) {
              hoverRules.push({
                media: rule.conditionText,
                selector: sel,
                transform: inner.style.transform,
              });
            }
          }
        }
        if (rule instanceof CSSMediaRule && /\(hover:\s*none\)/.test(rule.conditionText || '')) {
          for (const inner of rule.cssRules) {
            const sel = inner.selectorText || '';
            if (/\.cat-quick-btn:hover/.test(sel) && !/img/.test(sel) && /translateY/.test(inner.style.transform || '')) {
              hoverNoneLift.push(sel);
            }
          }
        }
        if (rule instanceof CSSStyleRule) {
          const sel = rule.selectorText || '';
          if (/\.cat-quick-btn:hover/.test(sel) && !/img/.test(sel) && /translateY/.test(rule.style.transform || '')) {
            unscopedLift.push(sel + ' ' + rule.style.transform);
          }
          if (/\.cat-quick-btn:hover/.test(sel) && /img/.test(sel)) unscopedZoom.push(sel);
          if (sel === '.scroll-top:hover' && /translateY/.test(rule.style.transform || '')) unscopedScroll.push(sel);
          if (sel === '.btn-wa:hover' && /translateY/.test(rule.style.transform || '')) unscopedWa.push(sel);
          if (sel === '.google-badge:hover' && /translateY/.test(rule.style.transform || '')) unscopedBadge.push(sel);
          if (sel === '.hero-rating:hover' && /translateY/.test(rule.style.transform || '')) unscopedRating.push(sel);
          if (sel === 'body.homepage .hero-ctas a:hover span' && /translate\(/.test(rule.style.transform || '')) arrowUnscoped.push(sel);
          if (sel === '.btn-ghost:hover' && /translateY/.test(rule.style.transform || '')) ghostUnscoped.push(sel);
          if (sel === '.btn-prim:hover' && /translateY/.test(rule.style.transform || '')) primUnscoped.push(sel);
          if (sel === '.nav-order:hover' && /translateY/.test(rule.style.transform || '')) navOrderUnscoped.push(sel);
          if (sel === '.oo-step:hover' && /translateY/.test(rule.style.transform || '')) ooUnscoped.push(sel);
          if (sel === '.step-card:hover' && /translateY/.test(rule.style.transform || '')) stepUnscoped.push(sel);
          if (sel === '.cs-card:hover' && /translateY/.test(rule.style.transform || '')) csUnscoped.push(sel);
          if (sel === '.contact-card:hover' && /translateY/.test(rule.style.transform || '')) contactUnscoped.push(sel);
          if (sel === '.product-card:hover') shopUnscopedLift.push(sel);
          if (/\.product-card:hover/.test(sel) && /\.photo-wrap img/.test(sel)) shopUnscopedZoom.push(sel);
          if (/\.seo-product-card:hover/.test(sel) && /\.seo-product-image img/.test(sel)) catalogUnscoped.push(sel);
          if (sel === '.sc:hover') scUnscopedLift.push(sel);
        }
      }
    }
    return {
      found: Boolean(tile),
      type: tile ? (tile.getAttribute('type') || '') : '',
      restTransform: tile ? getComputedStyle(tile).transform : '',
      restImg: img ? getComputedStyle(img).transform : '',
      labels,
      types,
      hero,
      stepTitles,
      hoverRules,
      unscopedLift: [...new Set(unscopedLift)],
      unscopedZoom,
      unscopedScroll,
      unscopedWa,
      unscopedBadge,
      unscopedRating,
      arrowUnscoped,
      ghostUnscoped,
      primUnscoped,
      navOrderUnscoped,
      ooUnscoped,
      stepUnscoped,
      csUnscoped,
      contactUnscoped,
      shopUnscopedLift,
      shopUnscopedZoom,
      catalogUnscoped,
      scUnscopedLift,
      hoverNoneLift,
    };
  });
  const handle = await page.evaluateHandle(() =>
    [...document.querySelectorAll('.homepage-category .cat-quick-btn')]
      .find(btn => /Frutas/i.test(btn.textContent || '') && !/Fruta da Época/i.test(btn.textContent || ''))
  );
  const tile = handle.asElement();
  if (tile) await tile.hover();
  await new Promise(r => setTimeout(r, 400));
  const hovered = await page.evaluate(() => {
    const tile = [...document.querySelectorAll('.homepage-category .cat-quick-btn')]
      .find(btn => /Frutas/i.test(btn.textContent || '') && !/Fruta da Época/i.test(btn.textContent || ''));
    const img = tile ? tile.querySelector('img') : null;
    const canHover = window.matchMedia('(hover: hover)').matches;
    return {
      transform: tile ? getComputedStyle(tile).transform : '',
      imgTransform: img ? getComputedStyle(img).transform : '',
      canHover,
      tileHovered: tile ? tile.matches(':hover') : false,
      type: tile ? (tile.getAttribute('type') || '') : '',
    };
  });
  return { ...rest, hovered };
}

function leftoverCssOk(sample, label) {
  ok(
    sample.hoverRules.length === 2 &&
    sample.hoverRules.every(r => r.transform === 'translateY(-4px)'),
    `${label}: leftover tile lifts live in (hover: hover) (got ${JSON.stringify(sample.hoverRules)})`
  );
  ok(sample.unscopedLift.length === 0, `${label}: no unscoped leftover category-tile lift (got ${sample.unscopedLift.join(', ')})`);
  ok(sample.hoverNoneLift.length === 0,
    `${label}: leftover category-tile hover:none reset stays out (got ${sample.hoverNoneLift.join(', ')})`);
  ok(sample.unscopedZoom.length === 2,
    `${label}: leftover category-tile photo zoom stays unscoped (PR #273) (got ${sample.unscopedZoom.join(', ')})`);
  ok(sample.unscopedScroll.length === 1,
    `${label}: leftover .scroll-top lift stays unscoped (PR #361) (got ${sample.unscopedScroll.join(', ')})`);
  ok(sample.unscopedWa.length === 1,
    `${label}: leftover .btn-wa lift stays unscoped (PR #360) (got ${sample.unscopedWa.join(', ')})`);
  ok(sample.unscopedBadge.length === 1,
    `${label}: leftover .google-badge lift stays unscoped (PR #359) (got ${sample.unscopedBadge.join(', ')})`);
  ok(sample.unscopedRating.length === 1,
    `${label}: leftover .hero-rating lift stays unscoped (PR #358) (got ${sample.unscopedRating.join(', ')})`);
  ok(sample.arrowUnscoped.length === 1,
    `${label}: leftover hero CTA arrow hover stays unscoped (PR #357) (got ${sample.arrowUnscoped.join(', ')})`);
  ok(sample.ghostUnscoped.length === 1,
    `${label}: leftover .btn-ghost lift stays unscoped (PR #355) (got ${sample.ghostUnscoped.join(', ')})`);
  ok(sample.primUnscoped.length === 1,
    `${label}: leftover .btn-prim lift stays unscoped (PR #354) (got ${sample.primUnscoped.join(', ')})`);
  ok(sample.navOrderUnscoped.length === 1,
    `${label}: leftover .nav-order lift stays unscoped (PR #356) (got ${sample.navOrderUnscoped.join(', ')})`);
  ok(sample.ooUnscoped.length === 1,
    `${label}: leftover unused Encomenda online oo-step lift stays unscoped (PR #353) (got ${sample.ooUnscoped.join(', ')})`);
  ok(sample.stepUnscoped.length === 1,
    `${label}: leftover Como Encomendar step-card lift stays unscoped (PR #352) (got ${sample.stepUnscoped.join(', ')})`);
  ok(sample.csUnscoped.length === 1,
    `${label}: leftover Combina bem cs-card lift stays unscoped (PR #351) (got ${sample.csUnscoped.join(', ')})`);
  ok(sample.contactUnscoped.length === 1,
    `${label}: leftover Encontre-nos contact-card lift stays unscoped (PR #280) (got ${sample.contactUnscoped.join(', ')})`);
  ok(sample.shopUnscopedLift.length === 3,
    `${label}: leftover shop-card lift stays unscoped (PR #278) (got ${sample.shopUnscopedLift.join(', ')})`);
  ok(sample.shopUnscopedZoom.length === 1,
    `${label}: leftover shop-card photo zoom stays unscoped (PR #272) (got ${sample.shopUnscopedZoom.join(', ')})`);
  ok(sample.catalogUnscoped.length === 1,
    `${label}: leftover catalog card zoom stays unscoped (PR #271) (got ${sample.catalogUnscoped.join(', ')})`);
  ok(sample.scUnscopedLift.length === 1,
    `${label}: leftover unused .sc card lift stays unscoped (PR #277) (got ${sample.scUnscopedLift.join(', ')})`);
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
    return { ok: true, count: document.getElementById('cart-count')?.textContent || '' };
  });
  ok(added.ok && added.count === '1', `${label}: add Melancia 1/4 (count=${added.count})`);
  return added;
}

try {
  const coarse = await browser.newPage();
  coarse.on('pageerror', err => errors.push('390 pageerror: ' + err.message));
  await openReady(coarse, 390, 844);
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
  const phone = await measureTile(coarse);
  leftoverCssOk(phone, '390');
  ok(phone.found, '390: leftover Frutas category tile is present');
  ok(phone.type === '' && phone.types.every(t => t === ''),
    `390: leftover category tiles stay without type=button (got ${phone.types.join(',')})`);
  ok(isIdentity(phone.restTransform), `390 rest transform identity (got ${phone.restTransform})`);
  ok(!phone.hovered.canHover,
    `390: hover:none pointer (canHover=${phone.hovered.canHover})`);
  ok(!isLift4(phone.hovered.transform),
    `390 hover:none should not sticky-lift leftover category tiles (transform=${phone.hovered.transform})`);
  ok(
    phone.labels.some(t => /^Frutas/i.test(t)) &&
    phone.labels.some(t => /Legumes/i.test(t)) &&
    phone.labels.some(t => /Cabazes/i.test(t)) &&
    phone.labels.some(t => /Promoções/i.test(t)) &&
    phone.labels.some(t => /Ervas frescas/i.test(t)) &&
    phone.labels.some(t => /Fruta da Época/i.test(t)) &&
    phone.labels.some(t => /Carrinho/i.test(t)),
    `390: leftover category tiles stay (got ${phone.labels.join(' / ')})`
  );
  ok(phone.hero.some(t => /Ver Produtos/i.test(t)) && phone.hero.some(t => /Encomendar por WhatsApp/i.test(t)),
    `390: leftover hero CTAs stay (got ${phone.hero.join(' / ')})`);
  ok(
    phone.stepTitles.includes('Escolha os Produtos') &&
    phone.stepTitles.includes('Levante na Loja') &&
    phone.stepTitles.length === 5,
    `390: leftover Como Encomendar 5 passos stay (got ${phone.stepTitles.join(' / ')})`
  );
  const afterClick = await coarse.evaluate(() => {
    const tile = [...document.querySelectorAll('.homepage-category .cat-quick-btn')]
      .find(btn => /Frutas/i.test(btn.textContent || '') && !/Fruta da Época/i.test(btn.textContent || ''));
    tile?.click();
    const tab = document.getElementById('tab-frutas');
    return {
      type: tile ? (tile.getAttribute('type') || '') : '',
      tabActive: tab ? tab.classList.contains('active') : false,
      tabSelected: tab ? tab.getAttribute('aria-selected') : '',
      menuOpen: document.getElementById('mobile-menu')?.classList.contains('open') || false,
    };
  });
  ok(afterClick.type === '',
    `390 after leftover Frutas tap: leftover tile stays without type=button (got ${afterClick.type})`);
  ok(afterClick.tabActive && afterClick.tabSelected === 'true',
    `390 leftover Frutas tap opens leftover Frutas catalog (active=${afterClick.tabActive} aria-selected=${afterClick.tabSelected})`);
  ok(!afterClick.menuOpen, '390 leftover Frutas tap: leftover mobile-menu stays closed');
  await addMelancia(coarse, '390');
  const afterAdd = await coarse.evaluate(() => ({
    count: document.getElementById('cart-count')?.textContent || '',
    wa: document.querySelector('.mb-item[href*="wa.me/351932699850"]')?.getAttribute('href') || '',
  }));
  ok(afterAdd.count === '1', `390 after leftover Frutas tap + Melancia 1/4: leftover cart stays (count=${afterAdd.count})`);
  ok(/wa\.me\/351932699850/.test(afterAdd.wa),
    `390 leftover 4-item bar WhatsApp stays wa.me/351932699850 (got ${afterAdd.wa})`);

  const productPhone = await browser.newPage();
  productPhone.on('pageerror', err => errors.push('390 product pageerror: ' + err.message));
  await openReady(productPhone, 390, 844, '/produtos/banana-madeira/');
  const productHero = await productPhone.evaluate(() => ({
    tiles: document.querySelectorAll('.cat-quick-btn').length,
    ctas: document.querySelectorAll('.hero-ctas a').length,
    wa: document.querySelectorAll('.btn-wa').length,
    scroll: document.querySelectorAll('.scroll-top, #scroll-top').length,
  }));
  ok(productHero.tiles === 0, `390 product: leftover cat-quick-btn stays homepage-only (got ${productHero.tiles})`);
  ok(productHero.ctas === 0, `390 product: leftover hero-ctas stay homepage-only (got ${productHero.ctas})`);
  ok(productHero.wa === 0, `390 product: leftover .btn-wa stays homepage-only (got ${productHero.wa})`);
  ok(productHero.scroll === 0, `390 product: leftover scroll-top stays homepage-only (got ${productHero.scroll})`);
  const orderLink = await productPhone.evaluate(() => {
    const btn = document.querySelector('.seo-order-link');
    return {
      found: Boolean(btn),
      label: btn ? (btn.textContent || '').replace(/\s+/g, ' ').trim() : '',
      href: btn ? btn.getAttribute('href') || '' : '',
    };
  });
  ok(orderLink.found, '390 product: leftover Ver no catálogo e encomendar is present');
  ok(/Ver no catálogo e encomendar/i.test(orderLink.label) && /produto=banana-madeira#produtos/.test(orderLink.href),
    `390 product: leftover order CTA stays (got "${orderLink.label}" ${orderLink.href})`);

  const fine = await browser.newPage();
  fine.on('pageerror', err => errors.push('1280 pageerror: ' + err.message));
  await openReady(fine, 1280, 800);
  const wide = await measureTile(fine);
  leftoverCssOk(wide, '1280');
  ok(wide.found, '1280: leftover Frutas category tile is present');
  ok(wide.type === '',
    `1280: leftover Frutas tile stays without type=button (got ${wide.type})`);
  ok(isIdentity(wide.restTransform), `1280 rest transform identity (got ${wide.restTransform})`);
  ok(!wide.hovered.canHover || isIdentity(wide.hovered.transform) || isLift4(wide.hovered.transform),
    `1280: if the pointer can hover, leftover 4px lift or animation fill stays (canHover=${wide.hovered.canHover}, transform=${wide.hovered.transform})`);
  ok(wide.hero.some(t => /Ver Produtos/i.test(t)) && wide.hero.some(t => /Encomendar por WhatsApp/i.test(t)),
    `1280: leftover hero CTAs stay (got ${wide.hero.join(' / ')})`);
  ok(
    wide.stepTitles.includes('Escolha os Produtos') &&
    wide.stepTitles.includes('Levante na Loja') &&
    wide.stepTitles.length === 5,
    `1280: leftover Como Encomendar 5 passos stay (got ${wide.stepTitles.join(' / ')})`
  );
  await addMelancia(fine, '1280');

  await browser.close();
  server.close();
  if (errors.length) {
    console.error('check-homepage-category-tile-hover-lift-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
    process.exit(1);
  }
  console.log('check-homepage-category-tile-hover-lift-browser: ok');
} catch (err) {
  try { await browser.close(); } catch {}
  try { server.close(); } catch {}
  console.error(err);
  process.exit(1);
}
