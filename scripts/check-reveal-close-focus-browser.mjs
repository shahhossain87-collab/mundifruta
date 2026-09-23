#!/usr/bin/env node
/**
 * Chrome: leftover welcome-offer ✕ Fechar oferta keyboard ring;
 * leftover 4-item bar; leftover search morango/tomate; add Melancia 1/4.
 */
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

function hasRing(cs) {
  if (!cs) return false;
  const outline = cs.outlineStyle && cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth || '0') > 0;
  const shadow = cs.boxShadow && cs.boxShadow !== 'none';
  return Boolean(outline || shadow);
}

function isForest(color) {
  const c = String(color || '').replace(/\s+/g, '');
  return c === 'rgb(27,67,50)' || c === '#1B4332' || c === 'var(--forest)';
}

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
    document.querySelectorAll('.fi').forEach(el => {
      el.style.transition = 'none';
      el.classList.add('on');
    });
  });
}

async function leftoverChrome(page, label) {
  const chromeUi = await page.evaluate(() => {
    const hamburger = document.querySelector('.hamburger');
    const bar = [...document.querySelectorAll('.mb-item')].map(el =>
      (el.textContent || '').replace(/\s+/g, ' ').trim()
    );
    const burgerCs = hamburger ? getComputedStyle(hamburger) : null;
    return {
      burgerDisplay: burgerCs ? burgerCs.display : '',
      burgerExpanded: hamburger ? hamburger.getAttribute('aria-expanded') : 'missing',
      barDisplay: getComputedStyle(document.getElementById('mobile-bar') || document.body).display,
      bar,
    };
  });
  if (label === '390') {
    ok(chromeUi.burgerDisplay === 'flex', `${label}: leftover hamburger stays visible`);
    ok(chromeUi.burgerExpanded === null, `${label}: leftover hamburger stays without expanded`);
    ok(chromeUi.barDisplay !== 'none', `${label}: leftover 4-item bar stays visible`);
    ok(chromeUi.bar.some(t => /Carrinho/i.test(t)), `${label}: leftover 4-item bar still lists Carrinho`);
    ok(chromeUi.bar.some(t => /Promoções/i.test(t)), `${label}: leftover 4-item bar still lists Promoções`);
    ok(chromeUi.bar.some(t => /WhatsApp/i.test(t)), `${label}: leftover 4-item bar still lists WhatsApp`);
    ok(chromeUi.bar.some(t => /Como Chegar/i.test(t)), `${label}: leftover 4-item bar still lists Como Chegar`);
    ok(chromeUi.bar.length === 4, `${label}: leftover 4-item bar stays (got ${chromeUi.bar.length})`);
  }
}

async function leftoverSearch(page, label) {
  const found = await page.evaluate(() => {
    const search = document.getElementById('search-input');
    if (search) {
      search.value = 'morango';
      search.dispatchEvent(new Event('input', { bubbles: true }));
    }
    const morango = [...document.querySelectorAll('.shop-main .product-card')]
      .some(c => /Morango/i.test(c.textContent || ''));
    if (search) {
      search.value = 'tomate';
      search.dispatchEvent(new Event('input', { bubbles: true }));
    }
    const tomate = [...document.querySelectorAll('.shop-main .product-card')]
      .some(c => /Tomate/i.test(c.textContent || ''));
    if (window.limparTudo) window.limparTudo();
    if (window.mostrarCategoria) window.mostrarCategoria('frutas', document.getElementById('tab-frutas'));
    return { morango, tomate };
  });
  ok(found.morango, `${label}: leftover search morango still finds a card`);
  ok(found.tomate, `${label}: leftover search tomate still finds a card`);
}

async function leftoverCloseRing(page, label) {
  const rules = await page.evaluate(() => {
    let found = false;
    for (const sheet of [...document.styleSheets]) {
      let sheetRules;
      try { sheetRules = [...sheet.cssRules]; } catch { continue; }
      for (const rule of sheetRules) {
        const text = rule.cssText || '';
        if (/\.reveal-close:focus-visible/.test(text) && /outline/.test(text)) found = true;
      }
    }
    return found;
  });
  ok(rules, `${label}: leftover welcome-offer close :focus-visible rule is in the live stylesheet`);

  const opened = await page.evaluate(() => {
    const pop = document.getElementById('offer-pop');
    if (pop) pop.hidden = false;
    const close = document.querySelector('.reveal-close');
    const later = document.querySelector('.reveal-later');
    const cta = document.querySelector('.reveal-cta');
    const title = document.querySelector('.reveal-title');
    return {
      open: pop ? !pop.hidden : false,
      title: title ? (title.textContent || '').trim() : '',
      later: later ? (later.textContent || '').trim() : '',
      cta: cta ? (cta.textContent || '').replace(/\s+/g, ' ').trim() : '',
      closeLabel: close ? (close.getAttribute('aria-label') || '').trim() : '',
      closeGlyph: close ? (close.textContent || '').trim() : '',
    };
  });
  ok(opened.open, `${label}: leftover welcome-offer sheet can open`);
  ok(/De Desconto/i.test(opened.title),
    `${label}: leftover welcome-offer title stays (got "${opened.title}")`);
  ok(opened.later === 'Agora não',
    `${label}: leftover later stays "Agora não"`);
  ok(/Receber Oferta/i.test(opened.cta),
    `${label}: leftover CTA stays Receber Oferta (got "${opened.cta}")`);
  ok(opened.closeLabel === 'Fechar oferta', `${label}: leftover close name stays Fechar oferta`);
  ok(opened.closeGlyph === '✕', `${label}: leftover close glyph stays ✕`);

  await page.waitForFunction(() => {
    const pop = document.getElementById('offer-pop');
    const close = document.querySelector('.reveal-close');
    if (!pop || !close || pop.hidden) return false;
    const cs = getComputedStyle(pop);
    return cs.display !== 'none' && parseFloat(cs.opacity) > 0.5;
  }, { timeout: 5000 });

  await page.evaluate(() => {
    const close = document.querySelector('.reveal-close');
    if (close) close.scrollIntoView({ block: 'center', inline: 'nearest' });
  });
  await page.focus('.reveal-close');
  await page.waitForFunction(() => {
    const close = document.querySelector('.reveal-close');
    if (!close || document.activeElement !== close) return false;
    const cs = getComputedStyle(close);
    const outline = cs.outlineStyle && cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth || '0') > 0;
    const shadow = cs.boxShadow && cs.boxShadow !== 'none';
    return Boolean(outline || shadow);
  }, { timeout: 5000 });

  const closeRing = await page.evaluate(() => {
    const close = document.querySelector('.reveal-close');
    if (!close) return null;
    const cs = getComputedStyle(close);
    return {
      active: document.activeElement === close,
      outlineStyle: cs.outlineStyle,
      outlineWidth: cs.outlineWidth,
      outlineColor: cs.outlineColor,
      boxShadow: cs.boxShadow,
    };
  });
  ok(!!closeRing, `${label}: leftover welcome-offer close exists`);
  if (!closeRing) return;
  ok(closeRing.active, `${label}: leftover welcome-offer close can take keyboard focus`);
  ok(hasRing(closeRing), `${label}: leftover welcome-offer close keyboard ring (outline=${closeRing.outlineStyle}/${closeRing.outlineWidth})`);
  ok(isForest(closeRing.outlineColor) || hasRing(closeRing), `${label}: leftover welcome-offer close ring stays forest`);

  const closed = await page.evaluate(() => {
    const close = document.querySelector('.reveal-close');
    if (close) close.click();
    return Boolean(document.getElementById('offer-pop')?.hidden);
  });
  ok(closed, `${label}: leftover ✕ / fecharOferta still closes leftover welcome-offer`);
}

async function leftoverPreviewQty(page, label) {
  const plusThenClose = await page.evaluate(() => {
    if (window.limparTudo) window.limparTudo();
    if (window.mostrarCategoria) window.mostrarCategoria('frutas', document.getElementById('tab-frutas'));
    const card = [...document.querySelectorAll('.shop-main .product-card')]
      .find(c => /Melancia 1\/4/i.test(c.textContent || ''));
    const id = card ? card.dataset.productId : '';
    if (id && window.abrirProduto) window.abrirProduto(id);
    const plus = [...document.querySelectorAll('.product-modal-qty button')]
      .find(b => (b.getAttribute('aria-label') || '') === 'Aumentar quantidade');
    const before = (document.getElementById('product-modal-qty')?.textContent || '').trim();
    if (plus) plus.click();
    const after = (document.getElementById('product-modal-qty')?.textContent || '').trim();
    const add = document.getElementById('product-modal-add');
    if (window.fecharProduto) window.fecharProduto();
    return {
      opened: Boolean(id),
      before,
      after,
      add: add ? (add.textContent || '').trim() : '',
      closed: !document.getElementById('product-modal')?.classList.contains('open'),
    };
  });
  ok(plusThenClose.opened, `${label}: leftover Melancia 1/4 product preview opens`);
  ok(plusThenClose.add === '＋', `${label}: leftover product-modal add stays a visible plus`);
  ok(plusThenClose.before === '1' && plusThenClose.after === '2',
    `${label}: leftover + increments 1→2 (${plusThenClose.before}→${plusThenClose.after})`);
  ok(plusThenClose.closed, `${label}: leftover ✕ / fecharProduto still closes leftover preview`);
}

async function addMelancia(page, label) {
  const added = await page.evaluate(() => {
    if (window.limparTudo) window.limparTudo();
    if (typeof carrinho === 'object' && carrinho) {
      Object.keys(carrinho).forEach(id => {
        if (typeof removerProduto === 'function') removerProduto(id);
      });
    }
    if (window.mostrarCategoria) window.mostrarCategoria('frutas', document.getElementById('tab-frutas'));
    const card = [...document.querySelectorAll('.shop-main .product-card')]
      .find(c => /Melancia 1\/4/i.test(c.textContent || ''));
    if (!card) return { ok: false, reason: 'card missing' };
    const btn = card.querySelector('.add-btn');
    if (btn) btn.click();
    const cs = document.getElementById('cs-pop');
    if (cs) cs.hidden = true;
    const plus = card.querySelectorAll('.qty-btn')[1];
    if (plus) plus.click();
    return {
      ok: true,
      count: document.getElementById('cart-count')?.textContent || '',
      qty: card.querySelector('.qty-num')?.textContent || '',
    };
  });
  ok(added.ok && added.count === '2', `${label}: add Melancia 1/4 then leftover + increments 1→2 (count=${added.count})`);
}

try {
  const desktop = await browser.newPage();
  desktop.on('pageerror', err => errors.push('1280 pageerror: ' + err.message));
  await openReady(desktop, 1280, 800);
  await leftoverCloseRing(desktop, '1280');
  await leftoverPreviewQty(desktop, '1280');
  await leftoverSearch(desktop, '1280');
  await addMelancia(desktop, '1280');

  const tablet = await browser.newPage();
  tablet.on('pageerror', err => errors.push('768 pageerror: ' + err.message));
  await openReady(tablet, 768, 1024);
  await leftoverCloseRing(tablet, '768');
  await leftoverPreviewQty(tablet, '768');

  const mobile = await browser.newPage();
  mobile.on('pageerror', err => errors.push('390 pageerror: ' + err.message));
  await openReady(mobile, 390, 844);
  await leftoverChrome(mobile, '390');
  await leftoverCloseRing(mobile, '390');
  await leftoverPreviewQty(mobile, '390');
  await leftoverSearch(mobile, '390');
  await addMelancia(mobile, '390');

  await browser.close();
  server.close();
  if (errors.length) {
    console.error('check-reveal-close-focus-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
    process.exit(1);
  }
  console.log('check-reveal-close-focus-browser: ok');
} catch (err) {
  try { await browser.close(); } catch {}
  try { server.close(); } catch {}
  console.error(err);
  process.exit(1);
}
