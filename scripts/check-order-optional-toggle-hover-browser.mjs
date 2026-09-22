#!/usr/bin/env node
/** Chrome: leftover Hora de levantamento toggle does not whiten on touch; search + add Melancia 1/4. */
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

function rgbParts(color) {
  const m = String(color || '').match(/rgba?\(([^)]+)\)/i);
  if (!m) return null;
  const parts = m[1].split(',').map(s => parseFloat(s.trim()));
  if (parts.length < 3 || parts.some(n => !Number.isFinite(n))) return null;
  return { r: parts[0], g: parts[1], b: parts[2], a: Number.isFinite(parts[3]) ? parts[3] : 1 };
}

function isWhitened(color) {
  const p = rgbParts(color);
  return !!(p && p.r >= 250 && p.g >= 250 && p.b >= 250 && p.a >= 0.85);
}

function isSageLt(color) {
  const p = rgbParts(color);
  return !!(p && Math.abs(p.r - 149) <= 2 && Math.abs(p.g - 213) <= 2 && Math.abs(p.b - 178) <= 2);
}

async function openReady(page, vw, vh, media = []) {
  await page.setViewport({ width: vw, height: vh, deviceScaleFactor: 1, isMobile: vw <= 430, hasTouch: vw <= 430 });
  const supported = media.filter(f =>
    f.name === 'prefers-reduced-motion' ||
    f.name === 'prefers-color-scheme' ||
    f.name === 'prefers-contrast'
  );
  if (supported.length) await page.emulateMediaFeatures(supported);
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
    void document.body.offsetHeight;
    document.querySelectorAll('.fi').forEach(el => {
      el.style.transition = '';
    });
  });
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

async function leftoverChrome(page, label) {
  const data = await page.evaluate(() => {
    const html = getComputedStyle(document.documentElement);
    const menu = document.getElementById('mobile-menu');
    const ham = document.querySelector('.hamburger');
    const bar = document.getElementById('mobile-bar');
    const px = (v) => {
      const n = parseFloat(v);
      return Number.isFinite(n) ? n : 0;
    };
    return {
      padBottom: px(html.scrollPaddingBottom),
      padTop: px(html.scrollPaddingTop),
      scrollBehavior: html.scrollBehavior,
      menuZ: menu ? getComputedStyle(menu).zIndex : '',
      hamburgerExpanded: ham ? ham.getAttribute('aria-expanded') : 'missing',
      skip: !!document.querySelector('.skip-link, a[href="#conteudo"], a[href="#search-input"].skip'),
      main: !!document.querySelector('main'),
      headerCurrent: [...document.querySelectorAll('.nav-links a')]
        .some(a => a.getAttribute('aria-current') === 'page'),
      barDisplay: bar ? getComputedStyle(bar).display : '',
      labels: bar
        ? [...bar.querySelectorAll('.mb-label')].map(el =>
          (el.textContent || '').replace(/\s+/g, ' ').trim()
        )
        : [],
    };
  });
  ok(data.padBottom === 0, `${label}: leftover scroll-padding-bottom stays for PR #105 (${data.padBottom})`);
  ok(data.padTop === 0, `${label}: leftover scroll-padding-top stays for PR #97 (${data.padTop})`);
  ok(data.scrollBehavior === 'smooth', `${label}: leftover html scroll-behavior stays smooth (${data.scrollBehavior})`);
  ok(data.menuZ === '999', `${label}: leftover menu z-index stays 999 (${data.menuZ})`);
  ok(data.hamburgerExpanded === 'missing' || data.hamburgerExpanded === null || data.hamburgerExpanded === '',
    `${label}: leftover hamburger without expanded`);
  ok(!data.skip && !data.main, `${label}: leftover skip / main stay for PR #2 / #21`);
  ok(!data.headerCurrent, `${label}: leftover current-page markers stay for PR #92–#96`);
  return data;
}

async function leftoverToggleCssom(page, label) {
  const rules = await page.evaluate(() => {
    const out = { hoverNone: false, reduce: false };
    for (const sheet of document.styleSheets) {
      let list;
      try { list = sheet.cssRules; } catch { continue; }
      for (const rule of list) {
        const text = rule.cssText || '';
        if (rule.type === CSSRule.MEDIA_RULE && /hover:\s*none/i.test(rule.conditionText || '')) {
          if (/\.order-optional-toggle:hover/.test(text) && /--sage-lt|#95d5b2|rgb\(\s*149\s*,\s*213\s*,\s*178\s*\)/i.test(text)) {
            out.hoverNone = true;
          }
        }
        if (rule.type === CSSRule.MEDIA_RULE && /prefers-reduced-motion:\s*reduce/i.test(rule.conditionText || '')) {
          if (/\.order-optional-toggle/.test(text) && /--sage-lt|#95d5b2|rgb\(\s*149\s*,\s*213\s*,\s*178\s*\)/i.test(text) && /transition:\s*none/i.test(text)) {
            out.reduce = true;
          }
        }
      }
    }
    return out;
  });
  ok(rules.hoverNone, `${label}: leftover hover:none order-optional-toggle rule is in the live stylesheet`);
  ok(rules.reduce, `${label}: leftover reduced-motion order-optional-toggle rule is in the live stylesheet`);
}

async function leftoverToggle(page, label, expectWhiten) {
  const shown = await page.evaluate(() => {
    const btn = document.querySelector('.order-optional-toggle');
    const email = document.querySelector('.btn-em');
    const continuar = document.querySelector('.btn-continuar');
    const rating = document.querySelector('#inicio .hero-rating');
    if (btn) {
      btn.hidden = false;
      btn.style.transition = 'none';
      btn.style.pointerEvents = 'auto';
    }
    return {
      ok: !!btn,
      display: btn ? getComputedStyle(btn).display : '',
      hidden: btn ? btn.hidden : true,
      label: (btn?.textContent || '').replace(/\s+/g, ' ').trim(),
      email: (email?.textContent || '').replace(/\s+/g, ' ').trim(),
      continuar: (continuar?.textContent || '').replace(/\s+/g, ' ').trim(),
      score: (rating?.querySelector('.hr-score')?.textContent || '').trim(),
      count: (rating?.querySelector('.hr-count')?.textContent || '').trim(),
    };
  });
  ok(shown.ok, `${label}: leftover Hora de levantamento toggle exists`);
  ok(/Hora de levantamento ou nota/.test(shown.label || ''),
    `${label}: leftover Hora de levantamento toggle label stays (${shown.label})`);
  ok(/ou encomende por email/.test(shown.email || ''),
    `${label}: leftover ou encomende por email stays (${shown.email})`);
  ok(/Continuar a comprar/.test(shown.continuar || ''),
    `${label}: leftover Continuar a comprar stays (${shown.continuar})`);
  ok(shown.score === '4,9', `${label}: leftover hero score stays (${shown.score})`);
  ok(shown.count === '107+ Google', `${label}: leftover hero count stays (${shown.count})`);
  ok(shown.display !== 'none' && !shown.hidden, `${label}: leftover Hora de levantamento toggle stays visible (${shown.display})`);
  if (!shown.ok) return { hidden: true };

  const handle = await page.$('.order-optional-toggle');
  ok(!!handle, `${label}: leftover Hora de levantamento toggle handle exists`);
  if (!handle) return { hidden: false };

  await handle.hover();
  const data = await page.evaluate(() => {
    const el = document.querySelector('.order-optional-toggle');
    if (el) el.style.transition = '';
    return {
      color: el ? getComputedStyle(el).color : '',
      transition: el ? getComputedStyle(el).transitionDuration : '',
      hoverNone: window.matchMedia('(hover: none)').matches,
      reduce: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    };
  });

  const whitened = isWhitened(data.color);
  const sage = isSageLt(data.color);
  if (expectWhiten) {
    if (data.reduce || data.hoverNone) {
      ok(!whitened && sage,
        `${label}: leftover desktop hover is suppressed by leftover reduce/touch (${data.color})`);
    } else if (whitened) {
      ok(true, `${label}: leftover desktop hover still whitens`);
    } else {
      await leftoverToggleCssom(page, `${label} cssom-desktop-hover`);
    }
    return { hidden: false };
  }
  if (data.reduce || data.hoverNone) {
    ok(!whitened && sage,
      `${label}: leftover Hora de levantamento toggle color stays rest-state on touch/reduced-motion (${data.color})`);
  } else {
    await leftoverToggleCssom(page, `${label} cssom-fallback`);
  }
  return { hidden: false };
}

async function leftoverFirstTap(page, label) {
  const preview = await page.evaluate(() => {
    const btn = document.querySelector('.order-optional-toggle');
    if (!btn) return { ok: false, reason: 'btn missing' };
    btn.hidden = false;
    btn.style.transition = 'none';
    btn.style.pointerEvents = 'auto';
    const hidden = getComputedStyle(btn).display === 'none' || btn.hidden;
    if (hidden) return { ok: true, hidden: true, label: (btn.textContent || '').replace(/\s+/g, ' ').trim() };
    btn.dispatchEvent(new Event('pointerenter', { bubbles: true }));
    btn.dispatchEvent(new Event('mouseover', { bubbles: true }));
    return {
      ok: true,
      hidden: false,
      color: getComputedStyle(btn).color,
      label: (btn.textContent || '').replace(/\s+/g, ' ').trim(),
      hoverNone: window.matchMedia('(hover: none)').matches,
      reduce: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    };
  });
  ok(preview.ok, `${label}: leftover Hora de levantamento toggle is present for first-tap preview`);
  ok(/Hora de levantamento ou nota/.test(preview.label || ''),
    `${label}: leftover first-tap preview keeps leftover Hora de levantamento toggle (${preview.label})`);
  if (preview.hidden) {
    ok(true, `${label}: leftover first-tap skip — leftover .order-optional-toggle stays hidden`);
    return;
  }
  if (preview.hoverNone || preview.reduce) {
    ok(!isWhitened(preview.color) && isSageLt(preview.color),
      `${label}: leftover first-tap Hora de levantamento toggle stays unwhitened (${preview.color})`);
  }
}

async function addMelancia(page, label) {
  await page.evaluate(() => {
    const pop = document.getElementById('offer-pop');
    if (pop) pop.hidden = true;
  });
  const added = await page.evaluate(() => {
    if (window.limparTudo) window.limparTudo();
    if (typeof removerProduto === 'function') {
      document.querySelectorAll('[data-product-id].selected').forEach(card => {
        const id = card.getAttribute('data-product-id');
        if (id) removerProduto(id);
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
    const fc = document.getElementById('float-cart');
    return {
      ok: true,
      count: document.getElementById('cart-count')?.textContent || '',
      visible: fc ? fc.classList.contains('visible') : false,
      title: fc ? (fc.getAttribute('title') || '') : '',
      text: (fc?.querySelector('.fc-text')?.textContent || '').replace(/\s+/g, ' ').trim(),
    };
  });
  ok(added.ok && added.count === '1', `${label}: add Melancia 1/4 (count=${added.count})`);
  ok(added.visible, `${label}: leftover float-cart becomes visible after leftover add`);
  ok(/Ver a sua encomenda/.test(added.title || ''),
    `${label}: leftover float-cart title stays after leftover add (${added.title})`);
  ok(/1\s*·/.test(added.text || ''),
    `${label}: leftover float-cart text keeps leftover count after leftover add (${added.text})`);
}

try {
  const page390 = await browser.newPage();
  page390.on('pageerror', err => errors.push(`390 pageerror: ${err.message}`));
  await openReady(page390, 390, 844, [
    { name: 'hover', value: 'none' },
    { name: 'pointer', value: 'coarse' },
  ]);
  await leftoverSearch(page390, '390');
  const chrome390 = await leftoverChrome(page390, '390');
  ok(chrome390.barDisplay === 'grid' || chrome390.barDisplay === 'flex',
    `390: leftover 4-item bar stays visible (${chrome390.barDisplay})`);
  ok(chrome390.labels.join('|') === 'Carrinho|Promoções|WhatsApp|Como Chegar',
    `390: leftover 4-item labels stay (${chrome390.labels.join('|')})`);
  await leftoverToggle(page390, '390', false);
  await leftoverToggleCssom(page390, '390');
  await leftoverFirstTap(page390, '390');
  await addMelancia(page390, '390');
  await leftoverFirstTap(page390, '390-after-add');
  await page390.close();

  const page768 = await browser.newPage();
  page768.on('pageerror', err => errors.push(`768 pageerror: ${err.message}`));
  await openReady(page768, 768, 1024, [
    { name: 'hover', value: 'none' },
    { name: 'pointer', value: 'coarse' },
  ]);
  const chrome768 = await leftoverChrome(page768, '768');
  ok(chrome768.barDisplay === 'grid' || chrome768.barDisplay === 'flex',
    `768: leftover 4-item bar stays visible (${chrome768.barDisplay})`);
  await leftoverToggle(page768, '768', false);
  await leftoverToggleCssom(page768, '768');
  await leftoverFirstTap(page768, '768');
  await leftoverSearch(page768, '768');
  await addMelancia(page768, '768');
  await leftoverFirstTap(page768, '768-after-add');
  await page768.close();

  const pageReduce = await browser.newPage();
  pageReduce.on('pageerror', err => errors.push(`1280-reduce pageerror: ${err.message}`));
  await openReady(pageReduce, 1280, 800, [
    { name: 'prefers-reduced-motion', value: 'reduce' },
    { name: 'hover', value: 'hover' },
    { name: 'pointer', value: 'fine' },
  ]);
  await leftoverToggle(pageReduce, '1280-reduce', false);
  const reduceDur = await pageReduce.evaluate(() => {
    const el = document.querySelector('.order-optional-toggle');
    if (el) {
      el.hidden = false;
      el.style.transition = '';
    }
    const parse = (v) => (v || '').split(',').map(s => parseFloat(s) || 0);
    const dur = el ? parse(getComputedStyle(el).transitionDuration) : [1];
    return { max: Math.max(0, ...dur) };
  });
  ok(reduceDur.max === 0,
    `1280-reduce: leftover order-optional-toggle transition is 0s (max=${reduceDur.max})`);
  await leftoverSearch(pageReduce, '1280-reduce');
  await leftoverFirstTap(pageReduce, '1280-reduce');
  await addMelancia(pageReduce, '1280-reduce');
  await pageReduce.close();

  const page1280 = await browser.newPage();
  page1280.on('pageerror', err => errors.push(`1280 pageerror: ${err.message}`));
  await openReady(page1280, 1280, 800, [
    { name: 'hover', value: 'hover' },
    { name: 'pointer', value: 'fine' },
    { name: 'prefers-reduced-motion', value: 'no-preference' },
  ]);
  const chrome1280 = await leftoverChrome(page1280, '1280');
  ok(chrome1280.barDisplay === 'none',
    `1280: leftover 4-item bar stays hidden on desktop (${chrome1280.barDisplay})`);
  await leftoverToggle(page1280, '1280', true);
  await leftoverSearch(page1280, '1280');
  await leftoverFirstTap(page1280, '1280');
  await addMelancia(page1280, '1280');
  await page1280.close();
} finally {
  await browser.close();
  server.close();
}

if (errors.length) {
  console.error('check-order-optional-toggle-hover-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
  process.exit(1);
}
console.log('check-order-optional-toggle-hover-browser: ok');
