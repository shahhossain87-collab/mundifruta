#!/usr/bin/env node
/**
 * Chrome: leftover mobile Filtros / drawer-close keyboard rings;
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
  return chromeUi;
}

async function leftoverFiltrosRing(page, label) {
  const rules = await page.evaluate(() => {
    const out = { filt: false, close: false };
    for (const sheet of [...document.styleSheets]) {
      let rules;
      try { rules = [...sheet.cssRules]; } catch { continue; }
      for (const rule of rules) {
        const text = rule.cssText || '';
        if (/\.filtbtn:focus-visible/.test(text) && /outline/.test(text)) out.filt = true;
        if (/\.sidebar-close:focus-visible/.test(text) && /outline/.test(text)) out.close = true;
      }
    }
    return out;
  });
  ok(rules.filt, `${label}: leftover Filtros :focus-visible rule is in the live stylesheet`);
  ok(rules.close, `${label}: leftover drawer-close :focus-visible rule is in the live stylesheet`);

  const filt = await page.$('.filtbtn');
  ok(!!filt, `${label}: leftover Filtros control exists`);
  if (!filt) return;

  await page.evaluate(() => {
    const shop = document.getElementById('produtos');
    if (shop) shop.scrollIntoView({ block: 'center' });
  });

  await filt.focus();
  const filtRing = await page.evaluate(() => {
    const btn = document.querySelector('.filtbtn');
    const cs = btn ? getComputedStyle(btn) : null;
    return {
      display: cs ? cs.display : '',
      outlineStyle: cs ? cs.outlineStyle : '',
      outlineWidth: cs ? cs.outlineWidth : '',
      outlineColor: cs ? cs.outlineColor : '',
      boxShadow: cs ? cs.boxShadow : '',
      label: (btn?.getAttribute('aria-label') || '').trim(),
      text: (btn?.textContent || '').replace(/\s+/g, ' ').trim(),
      active: document.activeElement === btn,
    };
  });
  ok(/Filtros/i.test(filtRing.text), `${label}: leftover Filtros label stays Filtros (got "${filtRing.text}")`);
  ok(filtRing.label === 'Abrir filtros e categorias', `${label}: leftover Filtros name stays Abrir filtros e categorias`);
  if (filtRing.display !== 'none') {
    ok(filtRing.active && hasRing(filtRing),
      `${label}: leftover Filtros keyboard ring (outline=${filtRing.outlineStyle}/${filtRing.outlineWidth}, shadow=${filtRing.boxShadow})`);
  }

  await page.evaluate(() => { if (window.toggleFiltros) window.toggleFiltros(); });
  const close = await page.$('.sidebar-close');
  ok(!!close, `${label}: leftover drawer close exists`);
  if (!close) return;

  await close.focus();
  const closeRing = await page.evaluate(() => {
    const btn = document.querySelector('.sidebar-close');
    const sb = document.getElementById('shop-sidebar');
    const cs = btn ? getComputedStyle(btn) : null;
    return {
      display: cs ? cs.display : '',
      outlineStyle: cs ? cs.outlineStyle : '',
      outlineWidth: cs ? cs.outlineWidth : '',
      boxShadow: cs ? cs.boxShadow : '',
      label: (btn?.getAttribute('aria-label') || '').trim(),
      open: sb ? sb.classList.contains('open') : false,
      active: document.activeElement === btn,
    };
  });
  ok(closeRing.label === 'Fechar filtros', `${label}: leftover drawer close name stays Fechar filtros`);
  ok(closeRing.open, `${label}: leftover Filtros still opens leftover drawer`);
  if (closeRing.display !== 'none') {
    ok(closeRing.active && hasRing(closeRing),
      `${label}: leftover drawer-close keyboard ring (outline=${closeRing.outlineStyle}/${closeRing.outlineWidth})`);
  }

  await page.evaluate(() => { if (window.fecharFiltros) window.fecharFiltros(); });
  const closed = await page.evaluate(() => {
    const sb = document.getElementById('shop-sidebar');
    return sb ? !sb.classList.contains('open') : false;
  });
  ok(closed, `${label}: leftover Fechar filtros still closes leftover drawer`);
}

async function leftoverSearch(page, label) {
  await page.evaluate(() => {
    const input = document.getElementById('search-input');
    if (input) {
      input.value = 'morango';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });
  const morango = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('.shop-main .product-card')]
      .map(c => (c.textContent || '').replace(/\s+/g, ' '));
    return cards.some(t => /morango/i.test(t));
  });
  ok(morango, `${label}: leftover search morango still finds leftover Morangos`);

  await page.evaluate(() => {
    const input = document.getElementById('search-input');
    if (input) {
      input.value = 'tomate';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });
  const tomate = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('.shop-main .product-card')]
      .map(c => (c.textContent || '').replace(/\s+/g, ' '));
    return cards.some(t => /tomate/i.test(t));
  });
  ok(tomate, `${label}: leftover search tomate still finds leftover Tomate`);
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
    const plus = card.querySelectorAll('.qty-btn')[1];
    if (plus) plus.click();
    const qty = card.querySelector('[data-qty-id]')?.textContent || '';
    return { ok: true, count: document.getElementById('cart-count')?.textContent || '', qty };
  });
  ok(added.ok && added.count === '2', `${label}: add Melancia 1/4 + increment 1→2 (count=${added.count}, qty=${added.qty})`);
}

try {
  const mobile = await browser.newPage();
  mobile.on('pageerror', err => errors.push('390 pageerror: ' + err.message));
  await openReady(mobile, 390, 844);

  const chrome390 = await leftoverChrome(mobile, '390');
  ok(chrome390.burgerDisplay === 'flex', `390: leftover hamburger stays visible (${chrome390.burgerDisplay})`);
  ok(chrome390.burgerExpanded === null || chrome390.burgerExpanded === 'missing',
    `390: leftover hamburger stays without expanded (got ${chrome390.burgerExpanded})`);
  ok(chrome390.bar.some(t => /Carrinho/i.test(t)), '390: leftover 4-item bar still lists Carrinho');
  ok(chrome390.bar.some(t => /Promoções/i.test(t)), '390: leftover 4-item bar still lists Promoções');
  ok(chrome390.bar.some(t => /WhatsApp/i.test(t)), '390: leftover 4-item bar still lists WhatsApp');
  ok(chrome390.bar.some(t => /Como Chegar/i.test(t)), '390: leftover 4-item bar still lists Como Chegar');
  ok(chrome390.bar.length === 4, `390: leftover 4-item bar stays (got ${chrome390.bar.length})`);

  await leftoverFiltrosRing(mobile, '390');
  await leftoverSearch(mobile, '390');
  await addMelancia(mobile, '390');

  const tablet = await browser.newPage();
  tablet.on('pageerror', err => errors.push('768 pageerror: ' + err.message));
  await openReady(tablet, 768, 900);
  await leftoverFiltrosRing(tablet, '768');

  const desktop = await browser.newPage();
  desktop.on('pageerror', err => errors.push('1280 pageerror: ' + err.message));
  await openReady(desktop, 1280, 800);
  const chrome1280 = await leftoverChrome(desktop, '1280');
  ok(chrome1280.barDisplay === 'none',
    `1280: leftover 4-item bar stays hidden on desktop (${chrome1280.barDisplay})`);
  await leftoverFiltrosRing(desktop, '1280');
  await leftoverSearch(desktop, '1280');
  await addMelancia(desktop, '1280');

  await browser.close();
  server.close();
  if (errors.length) {
    console.error('check-filtbtn-focus-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
    process.exit(1);
  }
  console.log('check-filtbtn-focus-browser: ok');
} catch (err) {
  try { await browser.close(); } catch {}
  try { server.close(); } catch {}
  console.error(err);
  process.exit(1);
}
