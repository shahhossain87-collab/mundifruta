#!/usr/bin/env node
/** Chrome: leftover hash-nav clearance under leftover fixed chrome; add Melancia 1/4. */
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

async function leftoverHashClearance(page, label) {
  const data = await page.evaluate(async () => {
    const chrome = () => {
      const bar = document.querySelector('.announcement-bar');
      const nav = document.getElementById('main-nav');
      const barBottom = bar ? bar.getBoundingClientRect().bottom : 0;
      const navBottom = nav ? nav.getBoundingClientRect().bottom : 0;
      return Math.max(barBottom, navBottom);
    };
    const pad = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop || '0');
    const jump = (id) => new Promise(resolve => {
      const el = document.getElementById(id);
      if (!el) return resolve({ id, missing: true });
      el.scrollIntoView({ behavior: 'auto', block: 'start' });
      requestAnimationFrame(() => {
        const top = el.getBoundingClientRect().top;
        resolve({
          id,
          top,
          chrome: chrome(),
          title: (el.querySelector('h1, h2')?.textContent || '').replace(/\s+/g, ' ').trim(),
        });
      });
    });

    const contacto = await jump('contacto');
    const cabazes = await jump('cabazes');
    const produtos = await jump('produtos');
    const encomenda = await jump('encomenda');

    return {
      pad,
      announcement: getComputedStyle(document.documentElement).getPropertyValue('--announcement-height').trim(),
      navHeight: getComputedStyle(document.documentElement).getPropertyValue('--nav-height').trim(),
      contacto,
      cabazes,
      produtos,
      encomenda,
      hamburgerExpanded: document.querySelector('.hamburger')?.getAttribute('aria-expanded') || '',
      headerCurrent: [...document.querySelectorAll('.nav-links a')]
        .some(a => a.getAttribute('aria-current') === 'page'),
      menuCurrent: [...document.querySelectorAll('#mobile-menu a')]
        .some(a => a.getAttribute('aria-current') === 'page'),
      footerCurrent: [...document.querySelectorAll('.footer-links a')]
        .some(a => a.getAttribute('aria-current') === 'page'),
      crumbCurrent: document.getElementById('crumb-cat')?.getAttribute('aria-current') || '',
      skip: !!document.querySelector('.skip-link, a[href="#search-input"], a[href="#conteudo"]'),
      main: !!document.querySelector('main'),
    };
  });

  ok(data.pad >= 120, `${label}: leftover scroll-padding-top is ${data.pad}px (need leftover chrome clearance)`);
  const cleared = (hit, name) => {
    if (hit.missing) return ok(false, `${label}: leftover #${name} missing`);
    ok(hit.top + 1 >= hit.chrome,
      `${label}: leftover #${name} top ${hit.top.toFixed(1)} clears leftover chrome ${hit.chrome.toFixed(1)}`);
    return hit;
  };
  cleared(data.contacto, 'contacto');
  cleared(data.cabazes, 'cabazes');
  cleared(data.produtos, 'produtos');
  cleared(data.encomenda, 'encomenda');
  ok(/Encontre-nos/i.test(data.contacto.title), `${label}: leftover Contacto title stays (${data.contacto.title})`);
  ok(/Os Nossos Cabazes/i.test(data.cabazes.title), `${label}: leftover Cabazes title stays (${data.cabazes.title})`);
  ok(data.hamburgerExpanded === '', `${label}: leftover hamburger stays without expanded`);
  ok(!data.headerCurrent && !data.menuCurrent && !data.footerCurrent && data.crumbCurrent === '',
    `${label}: leftover current-page markers stay for PR #92–#96`);
  ok(!data.skip && !data.main, `${label}: leftover skip / main stay for PR #2 / #21`);
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
  for (const [vw, vh, label] of [[390, 844, '390'], [1280, 800, '1280']]) {
    const page = await browser.newPage();
    page.on('pageerror', err => errors.push(`${label} pageerror: ${err.message}`));
    await openReady(page, vw, vh);
    await leftoverSearch(page, label);
    await leftoverHashClearance(page, label);

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
  console.error('check-scroll-padding-nav-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
  process.exit(1);
}
console.log('check-scroll-padding-nav-browser: ok');
