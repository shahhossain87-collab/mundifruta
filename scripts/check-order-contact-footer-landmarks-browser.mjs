#!/usr/bin/env node
/** Chrome: leftover how-to / order / contact / footer landmarks; add Melancia 1/4. */
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

async function leftoverLandmarks(page, label) {
  const data = await page.evaluate(() => {
    const how = document.getElementById('como-funciona');
    const order = document.getElementById('encomenda');
    const contact = document.getElementById('contacto');
    const footerNav = document.querySelector('.footer-links');
    const menu = document.getElementById('mobile-menu');
    const shortcuts = document.querySelector('.cat-quick');
    const form = document.getElementById('order-form');
    const list = document.getElementById('order-list');
    const nav = document.getElementById('main-nav');
    const bar = document.getElementById('mobile-bar');
    const footerHrefs = footerNav
      ? [...footerNav.querySelectorAll('a')].map(a => a.getAttribute('href') || '')
      : [];
    return {
      howTag: how ? how.tagName : '',
      howLabel: how ? how.getAttribute('aria-label') || '' : '',
      howTitle: how ? (how.querySelector('.section-title')?.textContent || '').trim() : '',
      orderTag: order ? order.tagName : '',
      orderLabel: order ? order.getAttribute('aria-label') || '' : '',
      orderTitle: order ? (order.querySelector('.section-title')?.textContent || '').trim() : '',
      contactTag: contact ? contact.tagName : '',
      contactLabel: contact ? contact.getAttribute('aria-label') || '' : '',
      contactTitle: contact ? (contact.querySelector('.section-title')?.textContent || '').trim() : '',
      footerTag: footerNav ? footerNav.tagName : '',
      footerLabel: footerNav ? footerNav.getAttribute('aria-label') || '' : '',
      footerHrefs,
      menuTag: menu ? menu.tagName : '',
      menuLabel: menu ? menu.getAttribute('aria-label') : null,
      shortcutTag: shortcuts ? shortcuts.tagName : '',
      formLabel: form ? form.getAttribute('aria-label') : null,
      listLabel: list ? list.getAttribute('aria-label') : null,
      mainNavLabel: nav ? nav.getAttribute('aria-label') : null,
      barLabel: bar ? bar.getAttribute('aria-label') : null,
      hamburgerExpanded: document.querySelector('.hamburger')?.getAttribute('aria-expanded'),
    };
  });
  ok(data.howTag === 'SECTION' && data.howLabel === 'Como Encomendar' && data.howTitle === 'Como Encomendar',
    `${label}: leftover como-funciona is ${data.howTag} "${data.howLabel}"`);
  ok(data.orderTag === 'SECTION' && data.orderLabel === 'Encomendar Online' && data.orderTitle === 'Encomendar Online',
    `${label}: leftover encomenda is ${data.orderTag} "${data.orderLabel}"`);
  ok(data.contactTag === 'SECTION' && data.contactLabel === 'Encontre-nos' && data.contactTitle === 'Encontre-nos',
    `${label}: leftover contacto is ${data.contactTag} "${data.contactLabel}"`);
  ok(data.footerTag === 'NAV' && data.footerLabel === 'MUNDIFRUTA',
    `${label}: leftover footer-links is ${data.footerTag} "${data.footerLabel}"`);
  ok(data.footerHrefs.includes('#produtos') && data.footerHrefs.includes('#encomenda') && data.footerHrefs.includes('creditos.html'),
    `${label}: leftover footer hashes stay (${data.footerHrefs.join(', ')})`);
  ok(data.menuTag === 'DIV' && data.menuLabel == null, `${label}: leftover mobile-menu stays unnamed (PR #75)`);
  ok(data.shortcutTag === 'DIV', `${label}: leftover cat-quick stays a div (PR #75)`);
  ok(data.formLabel == null, `${label}: leftover order-form stays unnamed (PR #75)`);
  ok(data.listLabel == null, `${label}: leftover order-list stays unnamed (PR #75)`);
  ok(data.mainNavLabel == null, `${label}: leftover main-nav stays unnamed (PR #74)`);
  ok(data.barLabel == null, `${label}: leftover mobile-bar stays unnamed (PR #74)`);
  ok(data.hamburgerExpanded == null, `${label}: leftover hamburger stays without expanded (PR #70)`);
}

try {
  const desktop = await browser.newPage();
  desktop.on('pageerror', err => errors.push('1280 pageerror: ' + err.message));
  await openReady(desktop, 1280, 800);
  await leftoverLandmarks(desktop, '1280');
  await addMelancia(desktop, '1280');

  const search = await desktop.evaluate(() => {
    const input = document.getElementById('search-input');
    if (!input) return { morango: 0, tomate: 0 };
    input.value = 'morango';
    if (window.pesquisar) window.pesquisar();
    const morango = document.querySelectorAll('.shop-main .product-card').length;
    input.value = 'tomate';
    if (window.pesquisar) window.pesquisar();
    const tomate = document.querySelectorAll('.shop-main .product-card').length;
    if (window.limparPesquisa) window.limparPesquisa();
    return { morango, tomate };
  });
  ok(search.morango >= 1, `1280: leftover search morango (${search.morango})`);
  ok(search.tomate >= 1, `1280: leftover search tomate (${search.tomate})`);

  const jumped = await desktop.evaluate(() => {
    const dest = document.getElementById('contacto');
    if (dest) dest.scrollIntoView({ behavior: 'auto' });
    const phone = dest ? dest.querySelector('a[href^="tel:"]') : null;
    return {
      id: dest ? dest.id : '',
      label: dest ? dest.getAttribute('aria-label') || '' : '',
      phone: phone ? (phone.textContent || '').replace(/\s+/g, ' ').trim() : '',
    };
  });
  ok(jumped.id === 'contacto' && jumped.label === 'Encontre-nos' && /932/.test(jumped.phone),
    `1280: leftover Contacto jump still lands on Encontre-nos (${jumped.phone})`);

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

  await leftoverLandmarks(mobile, '390');
  await addMelancia(mobile, '390');

  await browser.close();
  server.close();
  if (errors.length) {
    console.error('check-order-contact-footer-landmarks-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
    process.exit(1);
  }
  console.log('check-order-contact-footer-landmarks-browser: ok');
} catch (err) {
  try { await browser.close(); } catch {}
  try { server.close(); } catch {}
  console.error(err);
  process.exit(1);
}
