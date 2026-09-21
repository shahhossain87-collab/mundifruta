#!/usr/bin/env node
/** Chrome: leftover Quem Somos photos do not zoom on touch; search + add Melancia 1/4. */
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
    const quem = document.getElementById('quem-somos');
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
      quemTitle: quem ? (quem.querySelector('h2')?.textContent || '').trim() : '',
      quemIntro: quem ? (quem.querySelector('.qs-intro')?.textContent || '').replace(/\s+/g, ' ').trim() : '',
      photoCount: document.querySelectorAll('.qs-photo img').length,
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
  ok(data.quemTitle === 'Quem Somos', `${label}: leftover Quem Somos heading stays (${data.quemTitle})`);
  ok(/Há mais de 12 anos em Carnaxide/.test(data.quemIntro),
    `${label}: leftover Quem Somos story stays (${data.quemIntro})`);
  ok(data.photoCount >= 4, `${label}: leftover Quem Somos gallery photos stay (${data.photoCount})`);
  return data;
}

async function leftoverPhotoCssom(page, label) {
  const rules = await page.evaluate(() => {
    const out = { hoverNone: false, reduce: false };
    for (const sheet of document.styleSheets) {
      let list;
      try { list = sheet.cssRules; } catch { continue; }
      for (const rule of list) {
        const text = rule.cssText || '';
        if (rule.type === CSSRule.MEDIA_RULE && /hover:\s*none/i.test(rule.conditionText || '')) {
          if (/qs-photo:hover/.test(text) && /transform:\s*none/i.test(text)) out.hoverNone = true;
        }
        if (rule.type === CSSRule.MEDIA_RULE && /prefers-reduced-motion:\s*reduce/i.test(rule.conditionText || '')) {
          if (/qs-photo/.test(text) && /transform:\s*none/i.test(text) && /transition:\s*none/i.test(text)) out.reduce = true;
        }
      }
    }
    return out;
  });
  ok(rules.hoverNone, `${label}: leftover hover:none qs-photo rule is in the live stylesheet`);
  ok(rules.reduce, `${label}: leftover reduced-motion qs-photo rule is in the live stylesheet`);
}

function isZoomed(transform) {
  if (!transform || transform === 'none') return false;
  const m = transform.match(/matrix\(([^)]+)\)/);
  if (!m) return transform !== 'none';
  const parts = m[1].split(',').map(s => parseFloat(s.trim()));
  const scaleY = parts[3] || 1;
  return Math.abs(scaleY - 1) > 0.005;
}

async function leftoverPhotos(page, label, expectZoom) {
  const photo = await page.$('.qs-photo');
  ok(!!photo, `${label}: leftover Quem Somos photo exists`);
  if (!photo) return;

  await photo.evaluate(el => el.scrollIntoView({ block: 'center', inline: 'nearest' }));
  await photo.hover();
  const data = await page.evaluate(() => {
    const el = document.querySelector('.qs-photo');
    const img = el ? el.querySelector('img') : null;
    const alts = [...document.querySelectorAll('.qs-photo img')]
      .map(n => n.getAttribute('alt') || '');
    return {
      imgTransform: img ? getComputedStyle(img).transform : '',
      imgTransition: img ? getComputedStyle(img).transitionDuration : '',
      alts,
      hoverNone: window.matchMedia('(hover: none)').matches,
      reduce: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    };
  });

  ok(
    data.alts.every(t => /Mundi Fruta — seleção diária/.test(t)) && data.alts.length >= 4,
    `${label}: leftover Quem Somos photo alts stay (${data.alts.slice(0, 2).join('|')})`
  );

  const imgZoom = isZoomed(data.imgTransform);
  if (expectZoom) {
    if (data.reduce || data.hoverNone) {
      ok(!imgZoom,
        `${label}: leftover desktop hover is suppressed by leftover reduce/touch (${data.imgTransform})`);
    } else if (imgZoom) {
      ok(true, `${label}: leftover desktop hover still zooms`);
    } else {
      await leftoverPhotoCssom(page, `${label} cssom-desktop-hover`);
    }
    return;
  }
  if (data.reduce || data.hoverNone) {
    ok(!imgZoom,
      `${label}: leftover Quem Somos photo transform stays none on touch/reduced-motion (${data.imgTransform})`);
  } else {
    await leftoverPhotoCssom(page, `${label} cssom-fallback`);
  }
}

async function leftoverFirstTap(page, label) {
  const preview = await page.evaluate(() => {
    const photo = document.querySelector('.qs-photo img');
    if (!photo) return { ok: false, reason: 'photo missing' };
    photo.click();
    const img = document.querySelector('.qs-photo img');
    return {
      ok: true,
      transform: img ? getComputedStyle(img).transform : '',
      modalOpen: !!document.querySelector('.product-modal.open, .cabaz-modal.open'),
      hoverNone: window.matchMedia('(hover: none)').matches,
      reduce: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    };
  });
  ok(preview.ok, `${label}: leftover Quem Somos photo is tappable`);
  ok(!preview.modalOpen, `${label}: leftover first tap on Quem Somos does not open leftover product/cabaz modal`);
  if (preview.hoverNone || preview.reduce) {
    ok(!isZoomed(preview.transform),
      `${label}: leftover first-tap Quem Somos preview stays unzoomed (${preview.transform})`);
  }
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
  await leftoverPhotos(page390, '390', false);
  await leftoverPhotoCssom(page390, '390');
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
  await leftoverPhotos(pageReduce, '1280-reduce', false);
  const reduceDur = await pageReduce.evaluate(() => {
    const img = document.querySelector('.qs-photo img');
    const parse = (v) => (v || '').split(',').map(s => parseFloat(s) || 0);
    const imgDur = img ? parse(getComputedStyle(img).transitionDuration) : [1];
    return { imgMax: Math.max(0, ...imgDur) };
  });
  ok(reduceDur.imgMax === 0,
    `1280-reduce: leftover qs-photo transition is 0s (img=${reduceDur.imgMax})`);
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
  await leftoverPhotos(page1280, '1280', true);
  await leftoverSearch(page1280, '1280');
  await leftoverFirstTap(page1280, '1280');
  await addMelancia(page1280, '1280');
  await page1280.close();
} finally {
  await browser.close();
  server.close();
}

if (errors.length) {
  console.error('check-qs-photo-hover-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
  process.exit(1);
}
console.log('check-qs-photo-hover-browser: ok');
