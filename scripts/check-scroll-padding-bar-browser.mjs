#!/usr/bin/env node
/** Chrome: leftover mobile-bar scroll-padding-bottom; search + add Melancia 1/4. */
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

async function leftoverBarClearance(page, label, expectBar) {
  const data = await page.evaluate(() => {
    const px = (v) => {
      const n = parseFloat(v);
      return Number.isFinite(n) ? n : 0;
    };
    const padBottom = px(getComputedStyle(document.documentElement).scrollPaddingBottom);
    const padTop = px(getComputedStyle(document.documentElement).scrollPaddingTop);
    const html = getComputedStyle(document.documentElement);
    const menu = document.getElementById('mobile-menu');
    const bar = document.getElementById('mobile-bar');
    const ham = document.querySelector('.hamburger');
    const measure = (el) => {
      if (!el) return { missing: true };
      window.scrollTo(0, 0);
      el.scrollIntoView({ behavior: 'instant', block: 'nearest' });
      const box = el.getBoundingClientRect();
      const barBox = bar && getComputedStyle(bar).display !== 'none'
        ? bar.getBoundingClientRect()
        : null;
      return {
        missing: false,
        bottom: box.bottom,
        top: box.top,
        text: (el.textContent || '').replace(/\s+/g, ' ').trim(),
        barTop: barBox ? barBox.top : null,
        barDisplay: bar ? getComputedStyle(bar).display : '',
      };
    };

    const wa = measure(document.querySelector('#encomenda .btn-wa'));
    const footer = measure(document.querySelector('.footer-credit a'));

    return {
      padBottom,
      padTop,
      scrollBehavior: html.scrollBehavior,
      menuZ: menu ? getComputedStyle(menu).zIndex : '',
      barDisplay: bar ? getComputedStyle(bar).display : '',
      hamburgerExpanded: ham ? ham.getAttribute('aria-expanded') : 'missing',
      skip: !!document.querySelector('.skip-link, a[href="#conteudo"], a[href="#search-input"].skip'),
      main: !!document.querySelector('main'),
      headerCurrent: [...document.querySelectorAll('.nav-links a')]
        .some(a => a.getAttribute('aria-current') === 'page'),
      wa,
      footer,
    };
  });

  if (expectBar) {
    ok(data.padBottom >= 70, `${label}: leftover scroll-padding-bottom is ${data.padBottom}px (need leftover bar clearance)`);
    ok(data.barDisplay === 'grid' || data.barDisplay === 'flex',
      `${label}: leftover 4-item bar stays visible (${data.barDisplay})`);
    const cleared = (hit, name) => {
      if (hit.missing) return ok(false, `${label}: leftover ${name} missing`);
      ok(hit.barTop != null && hit.bottom <= hit.barTop + 1,
        `${label}: leftover ${name} bottom ${hit.bottom.toFixed(1)} clears leftover bar ${hit.barTop.toFixed(1)}`);
    };
    cleared(data.wa, 'WhatsApp checkout CTA');
    cleared(data.footer, 'footer control');
    ok(/Encomendar por WhatsApp/i.test(data.wa.text),
      `${label}: leftover WhatsApp CTA copy stays (${data.wa.text})`);
  } else {
    ok(data.padBottom === 0, `${label}: leftover scroll-padding-bottom stays 0 on desktop (${data.padBottom})`);
    ok(data.barDisplay === 'none', `${label}: leftover 4-item bar stays hidden on desktop (${data.barDisplay})`);
  }

  ok(data.padTop === 0, `${label}: leftover scroll-padding-top stays for PR #97 (${data.padTop})`);
  ok(data.scrollBehavior === 'smooth', `${label}: leftover html scroll-behavior stays smooth (${data.scrollBehavior})`);
  ok(data.menuZ === '999', `${label}: leftover menu z-index stays 999 (${data.menuZ})`);
  ok(data.hamburgerExpanded === 'missing' || data.hamburgerExpanded === null || data.hamburgerExpanded === '',
    `${label}: leftover hamburger without expanded`);
  ok(!data.skip && !data.main, `${label}: leftover skip / main stay for PR #2 / #21`);
  ok(!data.headerCurrent, `${label}: leftover current-page markers stay for PR #92–#96`);
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
  for (const [vw, vh, label, expectBar] of [
    [390, 844, '390', true],
    [1280, 800, '1280', false],
  ]) {
    const page = await browser.newPage();
    page.on('pageerror', err => errors.push(`${label} pageerror: ${err.message}`));
    await openReady(page, vw, vh);
    await leftoverSearch(page, label);
    await leftoverBarClearance(page, label, expectBar);

    if (label === '390') {
      const bar = await page.evaluate(() =>
        [...document.querySelectorAll('#mobile-bar .mb-label')].map(el =>
          (el.textContent || '').replace(/\s+/g, ' ').trim()
        )
      );
      ok(bar.join('|') === 'Carrinho|Promoções|WhatsApp|Como Chegar',
        `390: leftover 4-item labels stay (${bar.join('|')})`);
    }

    await addMelancia(page, label);
    await page.close();
  }
} finally {
  await browser.close();
  server.close();
}

if (errors.length) {
  console.error('check-scroll-padding-bar-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
  process.exit(1);
}
console.log('check-scroll-padding-bar-browser: ok');
