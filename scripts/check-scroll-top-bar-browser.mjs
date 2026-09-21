#!/usr/bin/env node
/** Chrome: leftover scroll-top clears leftover 4-item bar; search + add Melancia 1/4. */
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

async function leftoverChrome(page, label) {
  const data = await page.evaluate(() => {
    const html = getComputedStyle(document.documentElement);
    const menu = document.getElementById('mobile-menu');
    const ham = document.querySelector('.hamburger');
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
}

async function leftoverScrollTop(page, label, expectBar) {
  await page.evaluate(() => {
    window.scrollTo(0, Math.max(900, document.documentElement.scrollHeight - window.innerHeight));
    window.dispatchEvent(new Event('scroll'));
  });
  await page.waitForFunction(() => {
    const btn = document.getElementById('scroll-top');
    if (!btn || !btn.classList.contains('visible')) return false;
    return parseFloat(getComputedStyle(btn).opacity) > 0.9;
  }, { timeout: 5000 });

  const data = await page.evaluate(() => {
    const px = (v) => {
      const n = parseFloat(v);
      return Number.isFinite(n) ? n : 0;
    };
    const btn = document.getElementById('scroll-top');
    const bar = document.getElementById('mobile-bar');
    const btnStyle = btn ? getComputedStyle(btn) : null;
    const barBox = bar && getComputedStyle(bar).display !== 'none'
      ? bar.getBoundingClientRect()
      : null;
    const btnBox = btn ? btn.getBoundingClientRect() : null;
    return {
      title: btn ? btn.getAttribute('title') || '' : '',
      text: btn ? (btn.textContent || '').trim() : '',
      bottom: btnStyle ? btnStyle.bottom : '',
      bottomPx: btnStyle ? px(btnStyle.bottom) : 0,
      leftPx: btnStyle ? px(btnStyle.left) : 0,
      opacity: btnStyle ? btnStyle.opacity : '',
      barDisplay: bar ? getComputedStyle(bar).display : '',
      barTop: barBox ? barBox.top : null,
      btnBottom: btnBox ? btnBox.bottom : null,
      labels: bar
        ? [...bar.querySelectorAll('.mb-label')].map(el =>
            (el.textContent || '').replace(/\s+/g, ' ').trim()
          )
        : [],
    };
  });

  ok(/Voltar ao topo/i.test(data.title), `${label}: leftover scroll-top title stays (${data.title})`);
  ok(data.text === '▲', `${label}: leftover scroll-top mark stays ▲`);
  ok(parseFloat(data.opacity) > 0.5, `${label}: leftover scroll-top is visible after scroll`);

  if (expectBar) {
    ok(data.barDisplay === 'grid' || data.barDisplay === 'flex',
      `${label}: leftover 4-item bar stays visible (${data.barDisplay})`);
    ok(data.labels.join('|') === 'Carrinho|Promoções|WhatsApp|Como Chegar',
      `${label}: leftover 4-item labels stay (${data.labels.join('|')})`);
    ok(data.bottomPx >= 90, `${label}: leftover scroll-top bottom is ${data.bottomPx}px (need leftover denser-bar clearance)`);
    ok(data.barTop != null && data.btnBottom != null && data.btnBottom <= data.barTop + 1,
      `${label}: leftover scroll-top bottom ${data.btnBottom?.toFixed(1)} clears leftover bar ${data.barTop?.toFixed(1)}`);
  } else {
    ok(data.barDisplay === 'none', `${label}: leftover 4-item bar stays hidden on desktop (${data.barDisplay})`);
    ok(Math.abs(data.bottomPx - 28) < 1, `${label}: leftover desktop scroll-top stays 28px (${data.bottomPx})`);
    ok(Math.abs(data.leftPx - 28) < 1, `${label}: leftover desktop scroll-top stays left 28px (${data.leftPx})`);
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
  for (const [vw, vh, label, expectBar] of [
    [390, 844, '390', true],
    [1280, 800, '1280', false],
  ]) {
    const page = await browser.newPage();
    page.on('pageerror', err => errors.push(`${label} pageerror: ${err.message}`));
    await openReady(page, vw, vh);
    await leftoverSearch(page, label);
    await leftoverChrome(page, label);
    await leftoverScrollTop(page, label, expectBar);
    await addMelancia(page, label);
    await page.close();
  }
} finally {
  await browser.close();
  server.close();
}

if (errors.length) {
  console.error('check-scroll-top-bar-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
  process.exit(1);
}
console.log('check-scroll-top-bar-browser: ok');
