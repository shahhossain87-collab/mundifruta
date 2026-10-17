#!/usr/bin/env node
/** Chrome: leftover product-page order CTA is full-width on phones, hugs content on desktop. */
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

async function measureCta(page, vw, vh) {
  await page.setViewport({ width: vw, height: vh, deviceScaleFactor: 1, isMobile: vw <= 430 });
  await page.goto(`${base}produtos/banana-madeira/`, { waitUntil: 'networkidle0', timeout: 60000 });
  return page.evaluate(() => {
    const link = document.querySelector('.seo-order-link');
    const parent = link ? link.parentElement : null;
    const cs = link ? getComputedStyle(link) : null;
    const nav = [...document.querySelectorAll('.seo-nav a')].map(a => (a.textContent || '').trim());
    return {
      text: (link?.textContent || '').replace(/\s+/g, ' ').trim(),
      href: link?.getAttribute('href') || '',
      width: link ? link.getBoundingClientRect().width : 0,
      height: link ? link.getBoundingClientRect().height : 0,
      parentWidth: parent ? parent.getBoundingClientRect().width : 0,
      minHeight: cs ? cs.minHeight : '',
      display: cs ? cs.display : '',
      nav,
    };
  });
}

try {
  const mobile = await browser.newPage();
  mobile.on('pageerror', err => errors.push('390 pageerror: ' + err.message));
  const phone = await measureCta(mobile, 390, 844);
  ok(phone.text === 'Ver no catálogo e encomendar', `390: leftover CTA copy (got "${phone.text}")`);
  ok(phone.href === '/?produto=banana-madeira#produtos', `390: leftover catalog href (got "${phone.href}")`);
  ok(phone.height >= 44, `390: leftover CTA tap height >= 44px (got ${phone.height})`);
  ok(phone.parentWidth > 0 && Math.abs(phone.width - phone.parentWidth) <= 2,
    `390: leftover CTA should fill the copy column (cta=${phone.width}, parent=${phone.parentWidth})`);
  ok(phone.nav.join('|') === 'Início|Frutas|Legumes|Promoções',
    `390: wrapping nav stays Início / Frutas / Legumes / Promoções (got ${phone.nav.join(' / ')})`);

  const desktop = await browser.newPage();
  desktop.on('pageerror', err => errors.push('1280 pageerror: ' + err.message));
  const wide = await measureCta(desktop, 1280, 800);
  ok(wide.text === 'Ver no catálogo e encomendar', `1280: leftover CTA copy (got "${wide.text}")`);
  ok(wide.href === '/?produto=banana-madeira#produtos', `1280: leftover catalog href (got "${wide.href}")`);
  ok(wide.parentWidth > 0 && wide.width < wide.parentWidth - 40,
    `1280: leftover CTA should hug its label, not stretch (cta=${wide.width}, parent=${wide.parentWidth})`);
  ok(wide.nav.join('|') === 'Início|Frutas|Legumes|Promoções',
    `1280: wrapping nav stays Início / Frutas / Legumes / Promoções (got ${wide.nav.join(' / ')})`);

  await browser.close();
  server.close();
  if (errors.length) {
    console.error('check-seo-order-link-mobile-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
    process.exit(1);
  }
  console.log('check-seo-order-link-mobile-browser: ok');
} catch (err) {
  try { await browser.close(); } catch {}
  try { server.close(); } catch {}
  console.error(err);
  process.exit(1);
}
