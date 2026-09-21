#!/usr/bin/env node
/** Chrome: leftover CS cards do not lift on touch; search + add Melancia 1/4. */
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

async function leftoverCardCssom(page, label) {
  const rules = await page.evaluate(() => {
    const out = { hoverNone: false, reduce: false };
    for (const sheet of document.styleSheets) {
      let list;
      try { list = sheet.cssRules; } catch { continue; }
      for (const rule of list) {
        const text = rule.cssText || '';
        if (rule.type === CSSRule.MEDIA_RULE && /hover:\s*none/i.test(rule.conditionText || '')) {
          if (/\.cs-card:hover/.test(text) && /transform:\s*none/i.test(text)) out.hoverNone = true;
        }
        if (rule.type === CSSRule.MEDIA_RULE && /prefers-reduced-motion:\s*reduce/i.test(rule.conditionText || '')) {
          if (/\.cs-card/.test(text) && /transform:\s*none/i.test(text) && /transition:\s*none/i.test(text)) out.reduce = true;
        }
      }
    }
    return out;
  });
  ok(rules.hoverNone, `${label}: leftover hover:none cs-card rule is in the live stylesheet`);
  ok(rules.reduce, `${label}: leftover reduced-motion cs-card rule is in the live stylesheet`);
}

function isLifted(transform) {
  if (!transform || transform === 'none') return false;
  const m = transform.match(/matrix\(([^)]+)\)/);
  if (!m) return transform !== 'none';
  const parts = m[1].split(',').map(s => parseFloat(s.trim()));
  const ty = parts[5] || 0;
  const scaleY = parts[3] || 1;
  return Math.abs(ty) > 1 || Math.abs(scaleY - 1) > 0.005;
}

async function showCsCards(page) {
  return page.evaluate(() => {
    if (window.limparTudo) window.limparTudo();
    if (window.mostrarCategoria) window.mostrarCategoria('frutas', document.getElementById('tab-frutas'));
    const card = [...document.querySelectorAll('.shop-main .product-card')]
      .find(c => /Melancia 1\/4/i.test(c.textContent || ''));
    if (!card) return { ok: false, reason: 'card missing' };
    const btn = card.querySelector('.add-btn');
    if (btn) btn.click();
    const pop = document.getElementById('cs-pop');
    const cart = document.getElementById('crosssell-cart');
    const popCards = pop ? pop.querySelectorAll('.cs-card').length : 0;
    const cartCards = cart ? cart.querySelectorAll('.cs-card').length : 0;
    const title = (document.getElementById('cs-pop-title')?.textContent || '').trim();
    const skip = (document.querySelector('.cs-pop-skip')?.textContent || '').trim();
    const cartTitle = (cart?.querySelector('.cs-title')?.textContent || '').trim();
    return {
      ok: popCards + cartCards > 0,
      popHidden: pop ? pop.hidden : true,
      popCards,
      cartCards,
      title,
      skip,
      cartTitle,
      cartHidden: cart ? cart.hidden : true,
      count: document.getElementById('cart-count')?.textContent || '',
    };
  });
}

async function leftoverCards(page, label, expectLift) {
  const shown = await showCsCards(page);
  ok(shown.ok, `${label}: leftover CS cards exist after Melancia 1/4 (${shown.reason || `${shown.popCards}+${shown.cartCards}`})`);
  ok(shown.count === '1', `${label}: add Melancia 1/4 (count=${shown.count})`);
  ok(/Combina bem com…|Também pode gostar/.test(shown.title),
    `${label}: leftover CS title stays (${shown.title})`);
  ok(shown.skip === 'Continuar sem adicionar',
    `${label}: leftover Continuar sem adicionar stays (${shown.skip})`);
  ok(shown.cartTitle === 'Complete o seu pedido',
    `${label}: leftover Complete o seu pedido stays (${shown.cartTitle})`);
  if (!shown.ok) return;

  const card = await page.$('#cs-pop .cs-card, #crosssell-cart-row .cs-card');
  ok(!!card, `${label}: leftover CS card handle exists`);
  if (!card) return;

  await card.evaluate(el => el.scrollIntoView({ block: 'center', inline: 'nearest' }));
  await card.hover();
  const data = await page.evaluate(() => {
    const el = document.querySelector('#cs-pop .cs-card, #crosssell-cart-row .cs-card');
    const names = [...document.querySelectorAll('.cs-card .cs-nome')]
      .map(n => (n.textContent || '').trim())
      .filter(Boolean);
    return {
      transform: el ? getComputedStyle(el).transform : '',
      transition: el ? getComputedStyle(el).transitionDuration : '',
      names,
      hoverNone: window.matchMedia('(hover: none)').matches,
      reduce: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    };
  });

  ok(data.names.length >= 1, `${label}: leftover CS names stay (${data.names.slice(0, 2).join('|')})`);

  const lifted = isLifted(data.transform);
  if (expectLift) {
    if (data.reduce || data.hoverNone) {
      ok(!lifted,
        `${label}: leftover desktop hover is suppressed by leftover reduce/touch (${data.transform})`);
    } else if (lifted) {
      ok(true, `${label}: leftover desktop hover still lifts`);
    } else {
      await leftoverCardCssom(page, `${label} cssom-desktop-hover`);
    }
    return;
  }
  if (data.reduce || data.hoverNone) {
    ok(!lifted,
      `${label}: leftover CS card transform stays none on touch/reduced-motion (${data.transform})`);
  } else {
    await leftoverCardCssom(page, `${label} cssom-fallback`);
  }
}

async function leftoverFirstTap(page, label) {
  const preview = await page.evaluate(() => {
    const card = document.querySelector('#cs-pop .cs-card') ||
      document.querySelector('#crosssell-cart-row .cs-card');
    if (!card) return { ok: false, reason: 'card missing' };
    card.dispatchEvent(new Event('pointerenter', { bubbles: true }));
    card.dispatchEvent(new Event('mouseover', { bubbles: true }));
    return {
      ok: true,
      transform: getComputedStyle(card).transform,
      stillOpen: !document.getElementById('cs-pop')?.hidden ||
        !document.getElementById('crosssell-cart')?.hidden,
      hoverNone: window.matchMedia('(hover: none)').matches,
      reduce: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    };
  });
  ok(preview.ok, `${label}: leftover CS card is present for first-tap preview`);
  ok(preview.stillOpen, `${label}: leftover first-tap preview keeps leftover Combina bem / cart row`);
  if (preview.hoverNone || preview.reduce) {
    ok(!isLifted(preview.transform),
      `${label}: leftover first-tap CS card stays unlifted (${preview.transform})`);
  }
}

async function addMelancia(page, label) {
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
    return { ok: true, count: document.getElementById('cart-count')?.textContent || '' };
  });
  ok(added.ok && added.count === '1', `${label}: add Melancia 1/4 (count=${added.count})`);
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
  await leftoverCards(page390, '390', false);
  await leftoverCardCssom(page390, '390');
  await leftoverFirstTap(page390, '390');
  await addMelancia(page390, '390');
  await page390.close();

  const pageReduce = await browser.newPage();
  pageReduce.on('pageerror', err => errors.push(`1280-reduce pageerror: ${err.message}`));
  await openReady(pageReduce, 1280, 800, [
    { name: 'prefers-reduced-motion', value: 'reduce' },
    { name: 'hover', value: 'hover' },
    { name: 'pointer', value: 'fine' },
  ]);
  await leftoverCards(pageReduce, '1280-reduce', false);
  const reduceDur = await pageReduce.evaluate(() => {
    const el = document.querySelector('#cs-pop .cs-card, #crosssell-cart-row .cs-card');
    const parse = (v) => (v || '').split(',').map(s => parseFloat(s) || 0);
    const dur = el ? parse(getComputedStyle(el).transitionDuration) : [1];
    return { max: Math.max(0, ...dur) };
  });
  ok(reduceDur.max === 0,
    `1280-reduce: leftover cs-card transition is 0s (max=${reduceDur.max})`);
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
  await leftoverCards(page1280, '1280', true);
  await leftoverSearch(page1280, '1280');
  await leftoverFirstTap(page1280, '1280');
  await addMelancia(page1280, '1280');
  await page1280.close();
} finally {
  await browser.close();
  server.close();
}

if (errors.length) {
  console.error('check-cs-card-hover-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
  process.exit(1);
}
console.log('check-cs-card-hover-browser: ok');
