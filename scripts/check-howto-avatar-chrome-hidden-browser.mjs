#!/usr/bin/env node
/** Chrome: leftover mini how-to / avatar / hamburger / overlay marks; add Melancia 1/4. */
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
  });
  await page.reload({ waitUntil: 'networkidle0', timeout: 60000 });
  await page.evaluate(() => {
    const c = document.getElementById('consent'); if (c) c.hidden = true;
    const o = document.getElementById('offer-pop'); if (o) o.hidden = true;
  });
}

async function leftoverHowToAvatarChrome(page, label) {
  const data = await page.evaluate(() => {
    const steps = [...document.querySelectorAll('.osm-step')].map(el => ({
      text: (el.textContent || '').replace(/\s+/g, ' ').trim(),
      hidden: [...el.querySelectorAll('[aria-hidden="true"]')].map(s =>
        (s.textContent || '').replace(/\s+/g, ' ').trim()
      ),
    }));
    const arrows = [...document.querySelectorAll('.osm-arrow')].map(el =>
      (el.textContent || '').trim()
    );
    const avatars = [...document.querySelectorAll('.review-avatar')].map(el => ({
      text: (el.textContent || '').trim(),
      hidden: el.getAttribute('aria-hidden') || '',
    }));
    const authors = [...document.querySelectorAll('.review-author')].map(el =>
      (el.textContent || '').replace(/\s+/g, ' ').trim()
    );
    const ham = document.querySelector('.hamburger');
    const hamSpans = ham ? [...ham.querySelectorAll('span')] : [];
    const overlays = [...document.querySelectorAll('.cq-overlay')].map(el =>
      el.getAttribute('aria-hidden') || ''
    );
    const labels = [...document.querySelectorAll('.cq-label')].map(el =>
      (el.textContent || '').replace(/\s+/g, ' ').trim()
    );
    return {
      steps,
      arrows,
      avatars,
      authors,
      hamLabel: ham ? ham.getAttribute('aria-label') : null,
      hamExpanded: ham ? ham.getAttribute('aria-expanded') : 'missing',
      hamHidden: hamSpans.map(s => s.getAttribute('aria-hidden') || ''),
      overlays,
      labels,
    };
  });

  ok(
    data.steps.length === 5 &&
    data.steps.every(s => s.hidden.length === 1 && /^\d$/.test(s.hidden[0])) &&
    /Escolha os produtos/i.test(data.steps[0].text) &&
    /Adicione ao carrinho/i.test(data.steps[1].text) &&
    /Confirme o subtotal/i.test(data.steps[2].text) &&
    /Envie por WhatsApp/i.test(data.steps[3].text) &&
    /Levante na loja/i.test(data.steps[4].text),
    `${label}: leftover mini how-to numbers are hidden (steps=${JSON.stringify(data.steps)})`
  );
  ok(
    data.arrows.length === 4 && data.arrows.every(a => a === '→'),
    `${label}: leftover mini arrows stay unwrapped`
  );
  ok(
    data.avatars.length >= 3 &&
    data.avatars.every(a => a.hidden === 'true' && a.text) &&
    data.authors.some(t => /Ana Pinto/i.test(t)) &&
    data.authors.some(t => /Pedro Martins/i.test(t)) &&
    data.authors.some(t => /Eugene Nevezhin/i.test(t)),
    `${label}: leftover review avatars are hidden (authors=${data.authors})`
  );
  ok(
    data.hamLabel === 'Menu' &&
    data.hamExpanded === null &&
    data.hamHidden.length === 3 &&
    data.hamHidden.every(v => v === 'true'),
    `${label}: leftover hamburger bars are hidden without expanded`
  );
  ok(
    data.overlays.length === 7 && data.overlays.every(v => v === 'true') &&
    data.labels.some(t => /^Frutas/i.test(t)) &&
    data.labels.some(t => /^Legumes/i.test(t)) &&
    data.labels.some(t => /Carrinho/i.test(t)),
    `${label}: leftover category overlays are hidden (labels=${data.labels})`
  );
}

async function leftoverSearchAdd(page, label) {
  const data = await page.evaluate(() => {
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
    const card = [...document.querySelectorAll('.shop-main .product-card')]
      .find(c => /Melancia 1\/4/i.test(c.textContent || ''));
    const add = card && card.querySelector('.add-btn');
    if (add) add.click();
    const cs = document.getElementById('cs-pop');
    if (cs) cs.hidden = true;
    return {
      morango,
      tomate,
      count: document.getElementById('cart-count')?.textContent || '',
      addText: add ? (add.textContent || '').replace(/\s+/g, ' ').trim() : '',
    };
  });
  ok(data.morango, `${label}: leftover search morango still finds a card`);
  ok(data.tomate, `${label}: leftover search tomate still finds a card`);
  ok(Number(data.count) >= 1, `${label}: add Melancia 1/4 (count=${data.count})`);
  ok(/＋/.test(data.addText), `${label}: leftover catalog add plus stays visible`);
}

try {
  const desktop = await browser.newPage();
  desktop.on('pageerror', err => errors.push('1280 pageerror: ' + err.message));
  await openReady(desktop, 1280, 800);
  await leftoverHowToAvatarChrome(desktop, '1280');
  await leftoverSearchAdd(desktop, '1280');

  const mobile = await browser.newPage();
  mobile.on('pageerror', err => errors.push('390 pageerror: ' + err.message));
  await openReady(mobile, 390, 844);

  const bar = await mobile.evaluate(() => {
    return [...document.querySelectorAll('.mb-item')].map(el =>
      (el.textContent || '').replace(/\s+/g, ' ').trim()
    );
  });
  ok(bar.some(t => /Carrinho/i.test(t)), '390: 4-item bar still lists Carrinho');
  ok(bar.some(t => /Promoções/i.test(t)), '390: 4-item bar still lists Promoções');
  ok(bar.some(t => /WhatsApp/i.test(t)), '390: 4-item bar still lists WhatsApp');
  ok(bar.some(t => /Como Chegar/i.test(t)), '390: 4-item bar still lists Como Chegar');
  ok(bar.length === 4, `390: leftover 4-item bar stays (got ${bar.length})`);

  await leftoverHowToAvatarChrome(mobile, '390');
  await leftoverSearchAdd(mobile, '390');

  await browser.close();
  server.close();
  if (errors.length) {
    console.error('check-howto-avatar-chrome-hidden-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
    process.exit(1);
  }
  console.log('check-howto-avatar-chrome-hidden-browser: ok');
} catch (err) {
  try { await browser.close(); } catch {}
  try { server.close(); } catch {}
  console.error(err);
  process.exit(1);
}
