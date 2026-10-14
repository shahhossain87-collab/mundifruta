#!/usr/bin/env node
/** Chrome: generated catalog pages sit at the top (no homepage header offset). */
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
  if (file.endsWith('/')) file += 'index.html';
  if (file === '/index.html' || file === '/') file = '/index.html';
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

async function openPath(page, path, vw, vh) {
  await page.setViewport({ width: vw, height: vh, deviceScaleFactor: 1, isMobile: vw <= 430 });
  await page.goto(new URL(path, base).href, { waitUntil: 'networkidle0', timeout: 60000 });
}

async function seoHeaderAtTop(page, label) {
  const layout = await page.evaluate(() => {
    const body = document.body;
    const header = document.querySelector('.seo-header');
    const box = header ? header.getBoundingClientRect() : null;
    const cs = getComputedStyle(body);
    return {
      className: body.className,
      paddingTop: cs.paddingTop,
      headerTop: box ? box.top : null,
      headerHeight: box ? box.height : null,
      title: document.querySelector('h1')?.textContent?.trim() || '',
      orderHref: document.querySelector('.seo-order-link')?.getAttribute('href') || '',
    };
  });
  ok(layout.className.includes('seo-page'), `${label}: body.seo-page`);
  ok(parseFloat(layout.paddingTop) === 0, `${label}: body padding-top is 0 (got ${layout.paddingTop})`);
  ok(layout.headerTop !== null && layout.headerTop <= 1, `${label}: SEO header at top (top=${layout.headerTop})`);
  return layout;
}

async function addMelancia(page, label) {
  const added = await page.evaluate(() => {
    try { localStorage.setItem('mf_consent', 'essential'); } catch (e) {}
    try { localStorage.removeItem('mf_cart'); } catch (e) {}
    const c = document.getElementById('consent'); if (c) c.hidden = true;
    const o = document.getElementById('offer-pop'); if (o) o.hidden = true;
    if (window.limparTudo) window.limparTudo();
    if (window.mostrarCategoria) window.mostrarCategoria('frutas', document.getElementById('tab-frutas'));
    const card = [...document.querySelectorAll('.shop-main .product-card')]
      .find(el => /Melancia 1\/4/i.test(el.textContent || ''));
    if (!card) return { ok: false, reason: 'card missing' };
    const btn = card.querySelector('.add-btn');
    if (btn) btn.click();
    const cs = document.getElementById('cs-pop');
    if (cs) cs.hidden = true;
    return { ok: true, count: document.getElementById('cart-count')?.textContent || '' };
  });
  ok(added.ok && added.count === '1', `${label}: leftover add Melancia 1/4 (count=${added.count})`);
}

try {
  for (const vw of [390, 1280]) {
    const vh = vw === 390 ? 844 : 800;
    const page = await browser.newPage();
    page.on('pageerror', err => errors.push(`${vw} pageerror: ${err.message}`));

    await openPath(page, 'categorias/frutas/', vw, vh);
    const cat = await seoHeaderAtTop(page, `${vw} frutas`);
    ok(/Frutas/i.test(cat.title), `${vw} frutas: leftover h1 stays Frutas (got "${cat.title}")`);

    await openPath(page, 'produtos/morango-500g/', vw, vh);
    const product = await seoHeaderAtTop(page, `${vw} morango`);
    ok(/Morango 500g/i.test(product.title), `${vw} morango: leftover name stays (got "${product.title}")`);
    ok(product.orderHref.includes('produto=morango-500g'),
      `${vw} morango: leftover order link stays ${product.orderHref}`);

    await page.close();
  }

  const home = await browser.newPage();
  home.on('pageerror', err => errors.push('homepage pageerror: ' + err.message));
  await openPath(home, '/', 1280, 800);
  await addMelancia(home, '1280 homepage');
  const homePad = await home.evaluate(() => getComputedStyle(document.body).paddingTop);
  ok(parseFloat(homePad) > 80, `1280 homepage keeps leftover fixed-header padding (got ${homePad})`);

  await browser.close();
  server.close();
  if (errors.length) {
    console.error('check-seo-page-padding-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
    process.exit(1);
  }
  console.log('check-seo-page-padding-browser: ok');
} catch (err) {
  try { await browser.close(); } catch {}
  try { server.close(); } catch {}
  console.error(err);
  process.exit(1);
}
