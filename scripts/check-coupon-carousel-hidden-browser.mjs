#!/usr/bin/env node
/** Chrome: leftover coupon / carousel / cross-sell marks; add Melancia 1/4. */
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
    try {
      localStorage.setItem('mf_coupon', JSON.stringify({
        code: 'MUNDI10',
        status: 'available',
        issuedAt: Date.now(),
      }));
    } catch (e) {}
  });
  await page.reload({ waitUntil: 'networkidle0', timeout: 60000 });
  await page.evaluate(() => {
    const c = document.getElementById('consent'); if (c) c.hidden = true;
    const o = document.getElementById('offer-pop'); if (o) o.hidden = true;
  });
}

async function leftoverCouponCarousel(page, label) {
  const data = await page.evaluate(() => {
    const info = (el) => {
      if (!el) return null;
      return {
        text: (el.textContent || '').replace(/\s+/g, ' ').trim(),
        hidden: [...el.querySelectorAll('[aria-hidden="true"]')].map(s =>
          (s.textContent || '').replace(/\s+/g, ' ').trim()
        ),
        label: el.getAttribute('aria-label') || '',
      };
    };
    document.querySelectorAll('.order-remove').forEach(b => b.click());
    if (window.limparTudo) window.limparTudo();
    if (window.atualizarProgresso) window.atualizarProgresso();
    const reserved = info(document.getElementById('promo-progress'));
    const prev = info(document.querySelector('.carousel-nav.prev'));
    const next = info(document.querySelector('.carousel-nav.next'));
    const wraps = document.querySelectorAll('.carousel-wrap').length;
    return { reserved, prev, next, wraps };
  });

  ok(data.reserved, `${label}: leftover coupon progress box exists`);
  ok(
    data.reserved && /Cupão de 10€ reservado/i.test(data.reserved.text) &&
    data.reserved.hidden.some(h => /🎁/.test(h)),
    `${label}: leftover reserved coupon 🎁 is hidden (text="${data.reserved && data.reserved.text}")`
  );
  ok(
    data.reserved && /Adicione produtos até 40€/i.test(data.reserved.text),
    `${label}: leftover reserved coupon copy stays`
  );
  ok(data.wraps > 0, `${label}: leftover featured carousels still wrap`);
  ok(
    data.prev && data.prev.label === 'Anterior' && data.prev.hidden.includes('‹'),
    `${label}: leftover carousel prev ‹ is hidden (label="${data.prev && data.prev.label}")`
  );
  ok(
    data.next && data.next.label === 'Seguinte' && data.next.hidden.includes('›'),
    `${label}: leftover carousel next › is hidden (label="${data.next && data.next.label}")`
  );
}

async function leftoverProgressAndCs(page, label) {
  const added = await page.evaluate(() => {
    if (window.limparTudo) window.limparTudo();
    if (window.mostrarCategoria) window.mostrarCategoria('frutas', document.getElementById('tab-frutas'));
    const card = [...document.querySelectorAll('.shop-main .product-card')]
      .find(c => /Melancia 1\/4/i.test(c.textContent || ''));
    if (!card) return { ok: false, reason: 'card missing' };
    const btn = card.querySelector('.add-btn');
    if (btn) btn.click();
    const info = (el) => {
      if (!el) return null;
      return {
        text: (el.textContent || '').replace(/\s+/g, ' ').trim(),
        hidden: [...el.querySelectorAll('[aria-hidden="true"]')].map(s =>
          (s.textContent || '').replace(/\s+/g, ' ').trim()
        ),
      };
    };
    const progress = info(document.getElementById('promo-progress'));
    const csAdds = [...document.querySelectorAll('#cs-pop-row .cs-add')].map(el => ({
      text: (el.textContent || '').trim(),
      hidden: el.getAttribute('aria-hidden') === 'true',
    }));
    const cs = document.getElementById('cs-pop');
    if (cs) cs.hidden = true;
    return {
      ok: true,
      count: document.getElementById('cart-count')?.textContent || '',
      progress,
      csAdds,
    };
  });
  ok(added.ok && added.count === '1', `${label}: add Melancia 1/4 (count=${added.count})`);
  ok(
    added.progress && /Faltam/i.test(added.progress.text) &&
    added.progress.hidden.some(h => /🎁/.test(h)) &&
    /desconto de 10€/i.test(added.progress.text),
    `${label}: leftover Faltam coupon 🎁 is hidden (text="${added.progress && added.progress.text}")`
  );
  ok(
    added.csAdds.length > 0 && added.csAdds.every(a => a.text === '＋' && a.hidden),
    `${label}: leftover CS ＋ marks are hidden (n=${added.csAdds.length})`
  );

  const qualified = await page.evaluate(() => {
    const detoxCard = [...document.querySelectorAll('#grid-cabazes .product-card')]
      .find(c => /Cabaz Detox/i.test(c.textContent || ''));
    const add = detoxCard && detoxCard.querySelector('.add-btn');
    if (add) add.click();
    if (window.atualizarProgresso) window.atualizarProgresso();
    const el = document.getElementById('promo-progress');
    const cs = document.getElementById('cs-pop');
    if (cs) cs.hidden = true;
    return el ? {
      text: (el.textContent || '').replace(/\s+/g, ' ').trim(),
      hidden: [...el.querySelectorAll('[aria-hidden="true"]')].map(s =>
        (s.textContent || '').replace(/\s+/g, ' ').trim()
      ),
      qualified: el.classList.contains('qualificado'),
    } : null;
  });
  ok(
    qualified && qualified.qualified &&
    /Já atingiu o mínimo/i.test(qualified.text) &&
    qualified.hidden.some(h => /✅/.test(h)) &&
    /MUNDI10/i.test(qualified.text),
    `${label}: leftover qualified coupon ✅ is hidden (text="${qualified && qualified.text}")`
  );
}

async function leftoverSearchHamburger(page, label) {
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
    const ham = document.querySelector('.hamburger');
    return {
      morango,
      tomate,
      expanded: ham ? ham.getAttribute('aria-expanded') : null,
    };
  });
  ok(data.morango, `${label}: leftover search morango still finds a card`);
  ok(data.tomate, `${label}: leftover search tomate still finds a card`);
  ok(data.expanded === null, `${label}: leftover hamburger stays without expanded`);
}

try {
  const desktop = await browser.newPage();
  desktop.on('pageerror', err => errors.push('1280 pageerror: ' + err.message));
  await openReady(desktop, 1280, 800);
  await leftoverCouponCarousel(desktop, '1280');
  await leftoverProgressAndCs(desktop, '1280');
  await leftoverSearchHamburger(desktop, '1280');

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

  await leftoverCouponCarousel(mobile, '390');
  await leftoverProgressAndCs(mobile, '390');
  await leftoverSearchHamburger(mobile, '390');

  await browser.close();
  server.close();
  if (errors.length) {
    console.error('check-coupon-carousel-hidden-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
    process.exit(1);
  }
  console.log('check-coupon-carousel-hidden-browser: ok');
} catch (err) {
  try { await browser.close(); } catch {}
  try { server.close(); } catch {}
  console.error(err);
  process.exit(1);
}
