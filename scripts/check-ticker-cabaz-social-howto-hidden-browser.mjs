#!/usr/bin/env node
/** Chrome: leftover ticker / cabaz-ver / social / how-to marks; add Melancia 1/4. */
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

async function leftoverMarks(page, label) {
  const data = await page.evaluate(() => {
    const items = [...document.querySelectorAll('.announcement-track > span')].map(el => ({
      text: (el.textContent || '').replace(/\s+/g, ' ').trim(),
      hidden: [...el.querySelectorAll('[aria-hidden="true"]')].map(s => (s.textContent || '').trim()),
    }));
    const unique = [];
    for (const item of items) {
      if (!unique.some(u => u.text === item.text)) unique.push(item);
    }
    const socials = [...document.querySelectorAll('.social-link')].map(el => ({
      text: (el.textContent || '').replace(/\s+/g, ' ').trim(),
      iconHidden: el.querySelector('.social-icon')?.getAttribute('aria-hidden') || null,
    }));
    const steps = [...document.querySelectorAll('.step-card')].map(el => ({
      title: (el.querySelector('.step-title')?.textContent || '').trim(),
      numHidden: el.querySelector('.step-num')?.getAttribute('aria-hidden') || null,
      iconHidden: el.querySelector('.step-icon')?.getAttribute('aria-hidden') || null,
    }));
    const filt = document.querySelector('.filtbtn');
    const promo = document.getElementById('filter-promo');
    const shop = document.querySelector('.shop-link');
    const heroChip = document.querySelector('.hero-chip');
    const contact = document.querySelector('.contact-icon');
    const hamburger = document.querySelector('.hamburger');
    return {
      tickerCount: items.length,
      unique,
      socials,
      steps,
      filtHidden: filt
        ? [...filt.querySelectorAll('[aria-hidden="true"]')].length
        : 0,
      promoHidden: promo
        ? [...promo.querySelectorAll('[aria-hidden="true"]')].length
        : 0,
      shopHidden: shop
        ? [...shop.querySelectorAll('[aria-hidden="true"]')].length
        : 0,
      heroHidden: heroChip
        ? [...heroChip.querySelectorAll('[aria-hidden="true"]')].length
        : 0,
      contactHidden: contact ? contact.getAttribute('aria-hidden') : null,
      hamburgerExpanded: hamburger ? hamburger.getAttribute('aria-expanded') : null,
    };
  });

  ok(data.tickerCount === 16, `${label}: leftover ticker still has 16 items (got ${data.tickerCount})`);
  const need = [
    ['🎁', /10€ de desconto na primeira compra acima de 40€/],
    ['🛒', /Encomende por WhatsApp e levante na loja/],
    ['🍉', /Melancia 1\/4 aprox\. 3 kg/],
    ['🍋', /Limão biológico 1,99€\/kg/],
    ['🍅', /Tomate salada biológico 1,99€\/kg/],
    ['🥒', /Curgete biológica 2,49€\/kg/],
    ['🚚', /Entregas rápidas para Carnaxide e Oeiras/],
    ['🎉', /Produtos frescos, selecionados todos os dias/],
  ];
  for (const [mark, copy] of need) {
    const hit = data.unique.find(u => copy.test(u.text) && u.hidden.includes(mark));
    ok(!!hit, `${label}: leftover ticker ${mark} is hidden with visible copy`);
  }

  ok(data.socials.length === 4, `${label}: leftover social dock still has 4 chips`);
  ok(data.socials.every(s => s.iconHidden === 'true'),
    `${label}: leftover social-icon SVGs are hidden`);
  ok(data.socials.some(s => /Fale Connosco/.test(s.text)), `${label}: leftover Fale Connosco stays`);
  ok(data.socials.some(s => /Avalie-nos/.test(s.text)), `${label}: leftover Avalie-nos stays`);
  ok(data.socials.some(s => /Como Chegar/.test(s.text)), `${label}: leftover Como Chegar stays`);
  ok(data.socials.some(s => /Encomendar/.test(s.text)), `${label}: leftover Encomendar dock stays`);

  ok(data.steps.length === 5, `${label}: leftover how-to still has 5 steps`);
  ok(data.steps.every(s => s.numHidden === 'true' && s.iconHidden === 'true'),
    `${label}: leftover how-to step numbers are hidden`);
  ok(data.steps.some(s => s.title === 'Escolha os Produtos'), `${label}: leftover how-to title stays`);
  ok(data.steps.some(s => s.title === 'Levante na Loja'), `${label}: leftover how-to pickup title stays`);

  ok(data.filtHidden === 0 && data.promoHidden === 0 && data.shopHidden === 0,
    `${label}: must not hide leftover Filtros / filter-chip / shop-link marks (PR #83 / #82)`);
  ok(data.heroHidden === 0 && data.contactHidden !== 'true',
    `${label}: must not hide leftover hero / contact marks (PR #81 / #80)`);
  ok(data.hamburgerExpanded == null,
    `${label}: leftover hamburger stays without expanded (PR #70)`);
}

async function leftoverCabaz(page, label) {
  const data = await page.evaluate(() => {
    const dest = document.getElementById('cabazes');
    if (dest) dest.scrollIntoView({ behavior: 'auto' });
    const btn = document.querySelector('.cabaz-ver');
    const card = btn ? btn.closest('.product-card') : null;
    return {
      text: btn ? (btn.textContent || '').replace(/\s+/g, ' ').trim() : '',
      hidden: btn
        ? [...btn.querySelectorAll('[aria-hidden="true"]')].map(s => (s.textContent || '').trim())
        : [],
      label: btn ? btn.getAttribute('aria-label') : null,
      display: btn ? getComputedStyle(btn).display : '',
      name: card ? (card.querySelector('.product-name')?.textContent || '').trim() : '',
    };
  });
  ok(/Ver o que leva/.test(data.text) && data.hidden.includes('👁'),
    `${label}: leftover cabaz-ver eye is hidden (text="${data.text}")`);
  ok(data.label == null, `${label}: leftover cabaz-ver stays without name (PR #64)`);
  ok(data.display !== 'none', `${label}: leftover cabaz-ver stays visible at this width (PR #18)`);

  const opened = await page.evaluate(() => {
    const btn = document.querySelector('.cabaz-ver');
    if (btn) btn.click();
    const modal = document.getElementById('cabaz-modal');
    const title = document.getElementById('cabaz-modal-title');
    return {
      open: modal ? modal.classList.contains('open') : false,
      title: title ? (title.textContent || '').trim() : '',
    };
  });
  ok(opened.open && opened.title.length > 0,
    `${label}: leftover cabaz-ver still opens the cabaz modal (title="${opened.title}")`);
  await page.evaluate(() => {
    if (window.fecharCabaz) window.fecharCabaz();
  });
}

try {
  const desktop = await browser.newPage();
  desktop.on('pageerror', err => errors.push('1280 pageerror: ' + err.message));
  await openReady(desktop, 1280, 800);
  await leftoverMarks(desktop, '1280');
  await leftoverCabaz(desktop, '1280');
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

  const mobile = await browser.newPage();
  mobile.on('pageerror', err => errors.push('390 pageerror: ' + err.message));
  await openReady(mobile, 390, 844);

  const bar = await mobile.evaluate(() => {
    return [...document.querySelectorAll('.mb-item')].map(el => (el.textContent || '').replace(/\s+/g, ' ').trim());
  });
  ok(bar.some(t => /Carrinho/i.test(t)), '390: 4-item bar still lists Carrinho');
  ok(bar.some(t => /Promoções/i.test(t)), '390: 4-item bar still lists Promoções');
  ok(bar.some(t => /WhatsApp/i.test(t)), '390: 4-item bar still lists WhatsApp');
  ok(bar.some(t => /Como Chegar/i.test(t)), '390: 4-item bar still lists Como Chegar');
  ok(bar.length === 4, `390: leftover 4-item bar stays (got ${bar.length})`);

  await leftoverMarks(mobile, '390');
  await leftoverCabaz(mobile, '390');
  await addMelancia(mobile, '390');

  await browser.close();
  server.close();
  if (errors.length) {
    console.error('check-ticker-cabaz-social-howto-hidden-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
    process.exit(1);
  }
  console.log('check-ticker-cabaz-social-howto-hidden-browser: ok');
} catch (err) {
  try { await browser.close(); } catch {}
  try { server.close(); } catch {}
  console.error(err);
  process.exit(1);
}
