#!/usr/bin/env node
/** Chrome: leftover catalog breadcrumb links are 44px tap targets on phones. */
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

async function measureCrumbs(page, path, vw, vh) {
  await page.setViewport({ width: vw, height: vh, deviceScaleFactor: 1, isMobile: vw <= 430 });
  await page.goto(`${base}${path}`, { waitUntil: 'networkidle0', timeout: 60000 });
  return page.evaluate(() => {
    const crumbs = [...document.querySelectorAll('.seo-breadcrumbs a')];
    const nav = [...document.querySelectorAll('.seo-nav a')];
    const ver = document.querySelector('.seo-text-link');
    const order = document.querySelector('.seo-order-link');
    const boxes = crumbs.map(a => {
      const r = a.getBoundingClientRect();
      const cs = getComputedStyle(a);
      return {
        text: (a.textContent || '').trim(),
        href: a.getAttribute('href') || '',
        width: r.width,
        height: r.height,
        minHeight: cs.minHeight,
        display: cs.display,
      };
    });
    const navBoxes = nav.map(a => {
      const r = a.getBoundingClientRect();
      return { text: (a.textContent || '').trim(), height: r.height };
    });
    return {
      boxes,
      crumb: boxes.map(b => b.text),
      nav: navBoxes.map(b => b.text),
      navHeights: navBoxes.map(b => b.height),
      verText: (ver?.textContent || '').replace(/\s+/g, ' ').trim(),
      verHref: ver?.getAttribute('href') || '',
      verHeight: ver ? ver.getBoundingClientRect().height : 0,
      orderText: (order?.textContent || '').replace(/\s+/g, ' ').trim(),
      orderHref: order?.getAttribute('href') || '',
      orderWidth: order ? order.getBoundingClientRect().width : 0,
      hasHamburger: Boolean(document.querySelector('.hamburger, .seo-hamburger, #mobile-menu')),
    };
  });
}

async function leftoverHomepageBar(page) {
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true });
  await page.goto(base, { waitUntil: 'networkidle0', timeout: 60000 });
  await page.evaluate(() => {
    try { localStorage.setItem('mf_consent', 'essential'); } catch (e) {}
    try { localStorage.setItem('mf_coupon', JSON.stringify({ code: 'WELCOME', status: 'dismissed', issuedAt: Date.now() })); } catch (e) {}
  });
  await page.reload({ waitUntil: 'networkidle0', timeout: 60000 });
  await page.evaluate(() => {
    const c = document.getElementById('consent'); if (c) c.hidden = true;
    const o = document.getElementById('offer-pop'); if (o) o.hidden = true;
  });
  return page.evaluate(() => {
    const bar = [...document.querySelectorAll('.mb-item')].map(el =>
      (el.textContent || '').replace(/\s+/g, ' ').trim()
    );
    const hero = [...document.querySelectorAll('.hero-ctas a')].map(a =>
      (a.textContent || '').replace(/\s+/g, ' ').trim()
    );
    if (window.limparTudo) window.limparTudo();
    if (window.mostrarCategoria) window.mostrarCategoria('frutas', document.getElementById('tab-frutas'));
    const card = [...document.querySelectorAll('.shop-main .product-card')]
      .find(c => /Melancia 1\/4/i.test(c.textContent || ''));
    if (!card) return { ok: false, reason: 'card missing', bar, hero };
    const btn = card.querySelector('.add-btn');
    if (btn) btn.click();
    const cs = document.getElementById('cs-pop');
    if (cs) cs.hidden = true;
    return {
      ok: true,
      count: document.getElementById('cart-count')?.textContent || '',
      bar,
      hero,
    };
  });
}

try {
  const mobile = await browser.newPage();
  mobile.on('pageerror', err => errors.push('390 pageerror: ' + err.message));
  const phoneCat = await measureCrumbs(mobile, 'categorias/frutas/', 390, 844);
  ok(phoneCat.crumb.join('|') === 'Início',
    `390 Frutas: leftover breadcrumb stays Início (got ${phoneCat.crumb.join(' / ')})`);
  ok(phoneCat.boxes.length === 1, `390 Frutas: leftover one breadcrumb link (got ${phoneCat.boxes.length})`);
  for (const box of phoneCat.boxes) {
    ok(box.height >= 44, `390 Frutas: leftover breadcrumb ${box.text} tap height >= 44px (got ${box.height})`);
    ok(box.display.includes('flex'), `390 Frutas: leftover breadcrumb ${box.text} should stay inline-flex (got ${box.display})`);
  }
  ok(phoneCat.nav.join('|') === 'Início|Frutas|Legumes|Promoções',
    `390 Frutas: wrapping nav stays Início / Frutas / Legumes / Promoções (got ${phoneCat.nav.join(' / ')})`);
  for (const height of phoneCat.navHeights) {
    ok(height < 40, `390 Frutas: should not redo leftover wrapping-nav 44px tap (got ${height})`);
  }
  ok(phoneCat.verText === 'Ver produto', `390 Frutas: leftover Ver produto copy (got "${phoneCat.verText}")`);
  ok(phoneCat.verHref === '../../produtos/melancia-1-4/' || phoneCat.verHref.includes('produtos/'),
    `390 Frutas: leftover Ver produto href (got "${phoneCat.verHref}")`);
  ok(phoneCat.verHeight < 40, `390 Frutas: should not redo leftover Ver produto 44px tap (got ${phoneCat.verHeight})`);
  ok(!phoneCat.hasHamburger, '390 Frutas: should not add a leftover SEO-page hamburger');

  const phoneProd = await measureCrumbs(mobile, 'produtos/melancia-1-4/', 390, 844);
  ok(phoneProd.crumb.join('|') === 'Início|Frutas',
    `390 Melancia: leftover breadcrumb stays Início / Frutas (got ${phoneProd.crumb.join(' / ')})`);
  ok(phoneProd.boxes.length === 2, `390 Melancia: leftover two breadcrumb links (got ${phoneProd.boxes.length})`);
  for (const box of phoneProd.boxes) {
    ok(box.height >= 44, `390 Melancia: leftover breadcrumb ${box.text} tap height >= 44px (got ${box.height})`);
    ok(box.display.includes('flex'), `390 Melancia: leftover breadcrumb ${box.text} should stay inline-flex (got ${box.display})`);
  }
  ok(phoneProd.nav.join('|') === 'Início|Frutas|Legumes|Promoções',
    `390 Melancia: wrapping nav stays Início / Frutas / Legumes / Promoções (got ${phoneProd.nav.join(' / ')})`);
  ok(phoneProd.orderText === 'Ver no catálogo e encomendar',
    `390 Melancia: leftover Ver no catálogo e encomendar stays (got "${phoneProd.orderText}")`);
  ok(phoneProd.orderHref === '/?produto=melancia-1-4#produtos',
    `390 Melancia: leftover catalog href stays (got "${phoneProd.orderHref}")`);
  ok(phoneProd.orderWidth < 360, `390 Melancia: should not redo leftover full-width order CTA (got ${phoneProd.orderWidth})`);

  const desktop = await browser.newPage();
  desktop.on('pageerror', err => errors.push('1280 pageerror: ' + err.message));
  const wideCat = await measureCrumbs(desktop, 'categorias/frutas/', 1280, 800);
  ok(wideCat.crumb.join('|') === 'Início',
    `1280 Frutas: leftover breadcrumb stays Início (got ${wideCat.crumb.join(' / ')})`);
  for (const box of wideCat.boxes) {
    ok(box.height < 44, `1280 Frutas: leftover breadcrumb ${box.text} should hug the label, not force 44px (got ${box.height})`);
  }
  ok(wideCat.verText === 'Ver produto', `1280 Frutas: leftover Ver produto copy (got "${wideCat.verText}")`);

  const wideProd = await measureCrumbs(desktop, 'produtos/melancia-1-4/', 1280, 800);
  ok(wideProd.crumb.join('|') === 'Início|Frutas',
    `1280 Melancia: leftover breadcrumb stays Início / Frutas (got ${wideProd.crumb.join(' / ')})`);
  for (const box of wideProd.boxes) {
    ok(box.height < 44, `1280 Melancia: leftover breadcrumb ${box.text} should hug the label, not force 44px (got ${box.height})`);
  }
  ok(wideProd.orderText === 'Ver no catálogo e encomendar',
    `1280 Melancia: leftover Ver no catálogo e encomendar stays (got "${wideProd.orderText}")`);

  const home = await leftoverHomepageBar(mobile);
  ok(home.ok && home.count === '1', `390 homepage: add Melancia 1/4 (count=${home.count})`);
  ok(home.bar.some(t => /Carrinho/i.test(t)), '390 homepage: 4-item bar still lists Carrinho');
  ok(home.bar.some(t => /Promoções/i.test(t)), '390 homepage: 4-item bar still lists Promoções');
  ok(home.bar.some(t => /WhatsApp/i.test(t)), '390 homepage: 4-item bar still lists WhatsApp');
  ok(home.bar.some(t => /Como Chegar/i.test(t)), '390 homepage: 4-item bar still lists Como Chegar');
  ok(home.bar.length === 4, `390 homepage: leftover 4-item bar stays (got ${home.bar.length})`);
  ok(home.hero.some(t => /Ver Produtos/i.test(t)), '390 homepage: leftover Ver Produtos stays');
  ok(home.hero.some(t => /Encomendar por WhatsApp/i.test(t)), '390 homepage: leftover Encomendar por WhatsApp stays');

  await browser.close();
  server.close();
  if (errors.length) {
    console.error('check-seo-breadcrumb-tap-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
    process.exit(1);
  }
  console.log('check-seo-breadcrumb-tap-browser: ok');
} catch (err) {
  try { await browser.close(); } catch {}
  try { server.close(); } catch {}
  console.error(err);
  process.exit(1);
}
