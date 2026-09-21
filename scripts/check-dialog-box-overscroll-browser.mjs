#!/usr/bin/env node
/** Chrome: leftover dialog-box overscroll; search + add Melancia 1/4. */
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

async function searchCatalog(page, label) {
  const hits = await page.evaluate(() => {
    const input = document.getElementById('search-input');
    if (!input || !window.pesquisar) return { morango: 0, tomate: 0 };
    input.value = 'morango';
    window.pesquisar();
    const morango = document.querySelectorAll('#grid-catalog .product-card').length;
    input.value = 'tomate';
    window.pesquisar();
    const tomate = document.querySelectorAll('#grid-catalog .product-card').length;
    input.value = '';
    if (window.limparPesquisa) window.limparPesquisa();
    else if (window.limparTudo) window.limparTudo();
    return { morango, tomate };
  });
  ok(hits.morango >= 1, `${label}: leftover search morango (${hits.morango})`);
  ok(hits.tomate >= 1, `${label}: leftover search tomate (${hits.tomate})`);
}

async function leftoverDialogBoxOverscroll(page, label) {
  const info = await page.evaluate(() => {
    if (window.limparTudo) window.limparTudo();
    if (window.mostrarCategoria) window.mostrarCategoria('frutas', document.getElementById('tab-frutas'));

    const styleOf = (el) => el ? getComputedStyle(el).overscrollBehavior : '';
    const overflowOf = (el) => el ? getComputedStyle(el).overflow : '';
    const overflowYOf = (el) => el ? getComputedStyle(el).overflowY : '';

    if (window.abrirPrivacidade) window.abrirPrivacidade();
    const privacy = document.getElementById('privacy-modal');
    const privacyBox = document.querySelector('.privacy-box');
    const privacyTitle = document.getElementById('privacy-title')?.textContent || '';
    const privacyHidden = privacy ? privacy.hidden : true;
    const privacyBoxOverscroll = styleOf(privacyBox);
    const privacyBoxOverflowY = overflowYOf(privacyBox);
    const privacyBackdrop = styleOf(privacy);
    if (window.fecharPrivacidade) window.fecharPrivacidade();

    const card = [...document.querySelectorAll('.shop-main .product-card')]
      .find(c => /Melancia 1\/4/i.test(c.textContent || ''));
    if (!card) return { ok: false, reason: 'card missing' };
    const photo = card.querySelector('.photo-wrap');
    if (photo) photo.click();
    const product = document.getElementById('product-modal');
    const productBox = document.querySelector('.product-modal-box');
    const productName = document.getElementById('product-modal-name')?.textContent || '';
    const productOpen = product ? product.classList.contains('open') : false;
    const productBoxOverscroll = styleOf(productBox);
    const productBoxOverflow = overflowOf(productBox);
    const productBackdrop = styleOf(product);
    if (window.fecharProduto) window.fecharProduto();

    const cabazCard = [...document.querySelectorAll('#grid-cabazes .product-card')]
      .find(c => /Cabaz Detox/i.test(c.textContent || ''));
    if (window.abrirCabaz && cabazCard) window.abrirCabaz(cabazCard.dataset.productId);
    const cabaz = document.getElementById('cabaz-modal');
    const cabazBox = document.querySelector('.cabaz-modal-box');
    const cabazTitle = document.getElementById('cabaz-modal-title')?.textContent || '';
    const cabazSub = document.querySelector('.cabaz-modal-sub')?.textContent || '';
    const cabazOpen = cabaz ? cabaz.classList.contains('open') : false;
    const cabazBoxOverscroll = styleOf(cabazBox);
    const cabazBoxOverflowY = overflowYOf(cabazBox);
    const cabazBackdrop = styleOf(cabaz);
    if (window.fecharCabaz) window.fecharCabaz();

    const btn = card.querySelector('.add-btn');
    if (btn) btn.click();
    const cs = document.getElementById('cs-pop');
    if (cs) cs.hidden = true;

    const ham = document.querySelector('.hamburger');
    const carousel = document.querySelector('.feature-grid.carousel');
    const sb = document.getElementById('shop-sidebar');
    const menu = document.getElementById('mobile-menu');
    const popRow = document.getElementById('cs-pop-row');
    return {
      ok: true,
      count: document.getElementById('cart-count')?.textContent || '',
      privacyHidden,
      privacyTitle,
      privacyBoxOverscroll,
      privacyBoxOverflowY,
      privacyBackdrop,
      productOpen,
      productName,
      productBoxOverscroll,
      productBoxOverflow,
      productBackdrop,
      cabazOpen,
      cabazTitle,
      cabazSub,
      cabazBoxOverscroll,
      cabazBoxOverflowY,
      cabazBackdrop,
      hamburgerExpanded: ham ? ham.getAttribute('aria-expanded') : null,
      carousel: carousel ? getComputedStyle(carousel).overscrollBehavior : '',
      sidebar: sb ? getComputedStyle(sb).overscrollBehavior : '',
      menu: menu ? getComputedStyle(menu).overscrollBehavior : '',
      csRow: popRow ? getComputedStyle(popRow).overscrollBehavior : '',
      offer: (() => {
        const o = document.getElementById('offer-pop');
        return o ? getComputedStyle(o).overscrollBehavior : '';
      })(),
    };
  });

  ok(info.ok, `${label}: leftover dialogs still open (${info.reason || ''})`);
  ok(!info.privacyHidden, `${label}: leftover privacy dialog still opens`);
  ok(/política de privacidade/i.test(info.privacyTitle || ''), `${label}: leftover privacy title stays (${info.privacyTitle})`);
  ok(/contain/i.test(info.privacyBoxOverscroll), `${label}: leftover .privacy-box overscroll is contain (got "${info.privacyBoxOverscroll}")`);
  ok(
    info.privacyBoxOverflowY === 'auto' || info.privacyBoxOverflowY === 'scroll',
    `${label}: leftover .privacy-box stays a vertical scroller (got "${info.privacyBoxOverflowY}")`
  );
  ok(info.productOpen, `${label}: leftover product modal still opens`);
  ok(/melancia/i.test(info.productName || ''), `${label}: leftover product name stays (${info.productName})`);
  ok(/contain/i.test(info.productBoxOverscroll), `${label}: leftover .product-modal-box overscroll is contain (got "${info.productBoxOverscroll}")`);
  ok(
    /auto|scroll/.test(info.productBoxOverflow || ''),
    `${label}: leftover .product-modal-box stays a scroller (got "${info.productBoxOverflow}")`
  );
  ok(info.cabazOpen, `${label}: leftover cabaz modal still opens`);
  ok(/detox/i.test(info.cabazTitle || ''), `${label}: leftover cabaz title stays (${info.cabazTitle})`);
  ok(/composto pelos seguintes itens/i.test(info.cabazSub || ''), `${label}: leftover cabaz sub stays`);
  ok(/contain/i.test(info.cabazBoxOverscroll), `${label}: leftover .cabaz-modal-box overscroll is contain (got "${info.cabazBoxOverscroll}")`);
  ok(
    info.cabazBoxOverflowY === 'auto' || info.cabazBoxOverflowY === 'scroll',
    `${label}: leftover .cabaz-modal-box stays a vertical scroller (got "${info.cabazBoxOverflowY}")`
  );
  ok(info.count === '1', `${label}: add Melancia 1/4 (count=${info.count})`);
  ok(info.hamburgerExpanded == null, `${label}: leftover hamburger stays without aria-expanded`);
  ok(!/contain/i.test(info.privacyBackdrop), `${label}: leftover privacy-modal overscroll stays for PR #27 (got "${info.privacyBackdrop}")`);
  ok(!/contain/i.test(info.productBackdrop), `${label}: leftover product-modal overscroll stays for PR #27 (got "${info.productBackdrop}")`);
  ok(!/contain/i.test(info.cabazBackdrop), `${label}: leftover cabaz-modal overscroll stays for PR #27 (got "${info.cabazBackdrop}")`);
  ok(!/contain/i.test(info.offer), `${label}: leftover offer-reveal overscroll stays for PR #27 (got "${info.offer}")`);
  ok(!/contain/i.test(info.carousel), `${label}: leftover featured-carousel overscroll stays for PR #99 (got "${info.carousel}")`);
  ok(!/contain/i.test(info.sidebar), `${label}: leftover shop-sidebar overscroll stays for PR #98 (got "${info.sidebar}")`);
  ok(!/contain/i.test(info.menu), `${label}: leftover mobile-menu overscroll stays for PR #98 (got "${info.menu}")`);
  ok(!/contain/i.test(info.csRow), `${label}: leftover cs-row overscroll stays for PR #100 (got "${info.csRow}")`);
}

try {
  const desktop = await browser.newPage();
  desktop.on('pageerror', err => errors.push('1280 pageerror: ' + err.message));
  await openReady(desktop, 1280, 800);
  await leftoverDialogBoxOverscroll(desktop, '1280');
  await searchCatalog(desktop, '1280');

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

  await leftoverDialogBoxOverscroll(mobile, '390');
  await searchCatalog(mobile, '390');

  await browser.close();
  server.close();
  if (errors.length) {
    console.error('check-dialog-box-overscroll-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
    process.exit(1);
  }
  console.log('check-dialog-box-overscroll-browser: ok');
} catch (err) {
  try { await browser.close(); } catch {}
  try { server.close(); } catch {}
  console.error(err);
  process.exit(1);
}
