#!/usr/bin/env node
/** Chrome: leftover cookie/privacy Tab cycle; 4-item bar; search; add Melancia 1/4. */
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

async function openFresh(page, vw, vh) {
  await page.setViewport({ width: vw, height: vh, deviceScaleFactor: 1, isMobile: vw <= 430 });
  await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.evaluate(() => {
    try { localStorage.removeItem('mf_consent'); } catch (e) {}
    try { localStorage.removeItem('mf_cart'); } catch (e) {}
    try {
      localStorage.setItem('mf_coupon', JSON.stringify({
        code: 'WELCOME', status: 'dismissed', issuedAt: Date.now()
      }));
    } catch (e) {}
  });
  await page.reload({ waitUntil: 'networkidle0', timeout: 60000 });
  await page.evaluate(() => {
    const o = document.getElementById('offer-pop'); if (o) o.hidden = true;
  });
  await page.waitForFunction(() => {
    const yes = document.querySelector('.consent-yes');
    return yes && document.activeElement === yes;
  }, { timeout: 4000 }).catch(() => {});
}

async function leftoverConsentTrap(page, label) {
  const first = await page.evaluate(() => {
    const c = document.getElementById('consent');
    const yes = document.querySelector('.consent-yes');
    return {
      hidden: !c || c.hidden,
      text: (c ? c.textContent : '').replace(/\s+/g, ' ').trim(),
      focus: document.activeElement ? document.activeElement.className : '',
      yesLabel: yes ? (yes.textContent || '').trim() : '',
    };
  });
  ok(!first.hidden, `${label}: leftover cookie banner is visible`);
  ok(/Aceitar tudo/i.test(first.yesLabel) && /Só essenciais/i.test(first.text) && /Saber mais/i.test(first.text),
    `${label}: visible leftover cookie copy stays`);
  ok(/\bconsent-yes\b/.test(first.focus), `${label}: leftover Aceitar tudo is focused (got "${first.focus}")`);

  await page.keyboard.press('Tab');
  const afterTab = await page.evaluate(() => document.activeElement ? (document.activeElement.textContent || '').trim() : '');
  ok(/Saber mais/i.test(afterTab), `${label}: Tab from Aceitar tudo wraps to Saber mais (got "${afterTab}")`);

  await page.keyboard.press('Tab');
  const afterTab2 = await page.evaluate(() => document.activeElement ? (document.activeElement.textContent || '').trim() : '');
  ok(/Só essenciais/i.test(afterTab2), `${label}: Tab then lands on Só essenciais (got "${afterTab2}")`);

  await page.keyboard.down('Shift');
  await page.keyboard.press('Tab');
  await page.keyboard.up('Shift');
  const afterShift = await page.evaluate(() => document.activeElement ? (document.activeElement.textContent || '').trim() : '');
  ok(/Saber mais/i.test(afterShift), `${label}: Shift+Tab returns to Saber mais (got "${afterShift}")`);

  await page.evaluate(() => { if (window.abrirPrivacidade) window.abrirPrivacidade(); });
  await page.waitForFunction(() => {
    const close = document.querySelector('.privacy-close');
    return close && document.activeElement === close;
  }, { timeout: 4000 }).catch(() => {});

  const priv = await page.evaluate(() => {
    const modal = document.getElementById('privacy-modal');
    const title = document.getElementById('privacy-title');
    return {
      hidden: !modal || modal.hidden,
      title: title ? (title.textContent || '').trim() : '',
      focus: document.activeElement ? (document.activeElement.getAttribute('aria-label') || document.activeElement.textContent || '').trim() : '',
    };
  });
  ok(!priv.hidden, `${label}: leftover privacy dialog opens`);
  ok(/Política de Privacidade/i.test(priv.title), `${label}: leftover privacy title stays`);
  ok(/Fechar/i.test(priv.focus), `${label}: leftover Fechar is focused (got "${priv.focus}")`);

  await page.keyboard.down('Shift');
  await page.keyboard.press('Tab');
  await page.keyboard.up('Shift');
  const privLast = await page.evaluate(() => document.activeElement ? (document.activeElement.textContent || '').trim() : '');
  ok(/Repor consentimento/i.test(privLast), `${label}: Shift+Tab from Fechar wraps to Repor consentimento (got "${privLast}")`);

  await page.evaluate(() => { if (window.fecharPrivacidade) window.fecharPrivacidade(); });
  await page.waitForFunction(() => {
    const link = document.querySelector('.consent-link');
    return link && document.activeElement === link;
  }, { timeout: 4000 }).catch(() => {});
  const back = await page.evaluate(() => document.activeElement ? (document.activeElement.textContent || '').trim() : '');
  ok(/Saber mais/i.test(back), `${label}: leftover Fechar restores Saber mais (got "${back}")`);

  await page.evaluate(() => { if (window.definirConsentimento) window.definirConsentimento(false); });
  const gone = await page.evaluate(() => {
    const c = document.getElementById('consent');
    return !c || c.hidden;
  });
  ok(gone, `${label}: leftover Só essenciais hides the cookie banner`);
}

async function leftoverShop(page, label) {
  const burger = await page.evaluate(() => {
    const btn = document.querySelector('.hamburger');
    return btn ? btn.getAttribute('aria-expanded') : 'missing';
  });
  ok(burger === null || burger === '', `${label}: leftover hamburger stays without expanded (got ${burger})`);

  const found = await page.evaluate(() => {
    const input = document.getElementById('search-input');
    if (!input || !window.pesquisar) return { morango: false, tomate: false };
    input.value = 'morango';
    window.pesquisar();
    const morango = [...document.querySelectorAll('.shop-main .product-card')]
      .some(c => /morango/i.test(c.textContent || ''));
    input.value = 'tomate';
    window.pesquisar();
    const tomate = [...document.querySelectorAll('.shop-main .product-card')]
      .some(c => /tomate/i.test(c.textContent || ''));
    if (window.limparPesquisa) window.limparPesquisa();
    return { morango, tomate };
  });
  ok(found.morango, `${label}: leftover search still finds morango`);
  ok(found.tomate, `${label}: leftover search still finds tomate`);

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
  const desktop = await browser.newPage();
  desktop.on('pageerror', err => errors.push('1280 pageerror: ' + err.message));
  await openFresh(desktop, 1280, 800);
  await leftoverConsentTrap(desktop, '1280');
  await leftoverShop(desktop, '1280');

  const mobile = await browser.newPage();
  mobile.on('pageerror', err => errors.push('390 pageerror: ' + err.message));
  await openFresh(mobile, 390, 844);

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

  await leftoverConsentTrap(mobile, '390');
  await leftoverShop(mobile, '390');

  await browser.close();
  server.close();
  if (errors.length) {
    console.error('check-consent-privacy-trap-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
    process.exit(1);
  }
  console.log('check-consent-privacy-trap-browser: ok');
} catch (err) {
  try { await browser.close(); } catch {}
  try { server.close(); } catch {}
  console.error(err);
  process.exit(1);
}
