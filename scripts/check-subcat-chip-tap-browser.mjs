#!/usr/bin/env node
/** Chrome: leftover catalog subcat-chip is a 44px tap target on phones. */
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
  const url = req.url || '/';
  const parsed = new URL(url, 'http://127.0.0.1');
  let file = decodeURIComponent(parsed.pathname);
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

async function openReady(page, vw, vh) {
  page.on('dialog', async dialog => { await dialog.dismiss(); });
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
    const line = [...document.querySelectorAll('.order-item')]
      .find(li => /Melancia 1\/4/i.test(li.textContent || ''));
    return {
      ok: true,
      count: document.getElementById('cart-count')?.textContent || '',
      line: (line?.textContent || '').replace(/\s+/g, ' ').trim(),
    };
  });
  ok(added.ok && added.count === '1' && /Melancia 1\/4/i.test(added.line),
    `${label}: add Melancia 1/4 (count=${added.count}, line="${added.line}")`);
}

async function measureSubcatChip(page, vw) {
  return page.evaluate((viewport) => {
    if (viewport <= 900 && window.toggleFiltros) {
      const sb = document.getElementById('shop-sidebar');
      if (sb && !sb.classList.contains('open')) window.toggleFiltros();
    }
    const chips = [...document.querySelectorAll('.subcat-chip')];
    const todas = chips.find(c => /^\s*Todas\s*$/i.test(c.textContent || ''));
    const melao = chips.find(c => /Melão e melancia/i.test(c.textContent || ''));
    const todasRect = todas ? todas.getBoundingClientRect() : { width: 0, height: 0 };
    const melaoRect = melao ? melao.getBoundingClientRect() : { width: 0, height: 0 };
    const todasStyle = todas ? getComputedStyle(todas) : null;
    const melaoStyle = melao ? getComputedStyle(melao) : null;
    const hamburger = document.querySelector('.hamburger');
    const navOrder = document.querySelector('.nav-order');
    const mobileClose = document.querySelector('.mobile-close');
    const mbCart = document.querySelector('.mobile-bar .mb-item');
    const floatCart = document.getElementById('float-cart');
    const floatLegumes = document.getElementById('float-legumes');
    const scrollTop = document.getElementById('scroll-top');
    const cabazClose = document.querySelector('.cabaz-modal-close');
    const cabazAdd = document.getElementById('cabaz-modal-add');
    const cabazVer = document.querySelector('.cabaz-ver');
    const shopLink = document.querySelector('.shop-link');
    const catQuick = document.querySelector('.cat-quick-btn');
    const orderWa = document.querySelector('#order-form .btn-wa');
    const btnContinuar = document.querySelector('.btn-continuar');
    const toggle = document.getElementById('order-optional-toggle');
    const btnEm = document.querySelector('.btn-em');
    const searchClear = document.querySelector('.shop-main .search-clear');
    const sort = document.getElementById('price-sort');
    const linkBtn = document.querySelector('.no-results .link-btn');
    const pageBtn = document.querySelector('.catalog-pagination button');
    const tag = document.querySelector('.filter-tag:not(.clear-all)');
    const clearAll = document.querySelector('.filter-tag.clear-all');
    const filterChip = document.querySelector('.filter-chip');
    const privacyWa = document.querySelector('.privacy-box a[href^="https://wa.me"]');
    const barWa = document.querySelector('.mobile-bar a[href^="https://wa.me"]');
    const bar = [...document.querySelectorAll('.mb-item')].map(el =>
      (el.textContent || '').replace(/\s+/g, ' ').trim()
    );
    return {
      found: !!todas && !!melao,
      count: chips.length,
      tag: todas?.tagName || '',
      type: todas?.getAttribute('type') || '',
      melaoType: melao?.getAttribute('type') || '',
      onclick: todas?.getAttribute('onclick') || '',
      melaoOnclick: melao?.getAttribute('onclick') || '',
      pressed: todas?.getAttribute('aria-pressed') || '',
      melaoPressed: melao?.getAttribute('aria-pressed') || '',
      group: todas?.closest('.subcat-row')?.getAttribute('aria-label') || '',
      todasText: (todas?.textContent || '').replace(/\s+/g, ' ').trim(),
      melaoText: (melao?.textContent || '').replace(/\s+/g, ' ').trim(),
      labels: chips.map(c => (c.textContent || '').replace(/\s+/g, ' ').trim()),
      width: todasRect.width,
      height: todasRect.height,
      melaoHeight: melaoRect.height,
      minHeight: todasStyle?.minHeight || '',
      melaoMinHeight: melaoStyle?.minHeight || '',
      boxSizing: todasStyle?.boxSizing || '',
      hamburgerType: hamburger?.getAttribute('type') || '',
      hamburgerLabel: hamburger?.getAttribute('aria-label') || '',
      hamburgerExpanded: hamburger?.getAttribute('aria-expanded'),
      navOrderType: navOrder?.getAttribute('type') || '',
      mobileCloseType: mobileClose?.getAttribute('type') || '',
      mobileCloseLabel: mobileClose?.getAttribute('aria-label') || '',
      mobileCloseText: (mobileClose?.textContent || '').trim(),
      mbCartType: mbCart?.getAttribute('type') || '',
      floatCartType: floatCart?.getAttribute('type') || '',
      floatLegumesType: floatLegumes?.getAttribute('type') || '',
      scrollTopType: scrollTop?.getAttribute('type') || '',
      cabazCloseType: cabazClose?.getAttribute('type') || '',
      cabazAddType: cabazAdd?.getAttribute('type') || '',
      cabazVerType: cabazVer?.getAttribute('type') || '',
      shopLinkType: shopLink?.getAttribute('type') || '',
      catQuickType: catQuick?.getAttribute('type') || '',
      orderWaType: orderWa?.getAttribute('type') || '',
      orderWaText: (orderWa?.textContent || '').replace(/\s+/g, ' ').trim(),
      btnContinuarText: (btnContinuar?.textContent || '').replace(/\s+/g, ' ').trim(),
      btnContinuarMinHeight: btnContinuar ? getComputedStyle(btnContinuar).minHeight : '',
      toggleText: (toggle?.textContent || '').replace(/\s+/g, ' ').trim(),
      toggleMinHeight: toggle ? getComputedStyle(toggle).minHeight : '',
      btnEmText: (btnEm?.textContent || '').replace(/\s+/g, ' ').trim(),
      btnEmMinHeight: btnEm ? getComputedStyle(btnEm).minHeight : '',
      searchClearType: searchClear?.getAttribute('type') || '',
      searchClearMinHeight: searchClear ? getComputedStyle(searchClear).minHeight : '',
      sortMinHeight: sort ? getComputedStyle(sort).minHeight : '',
      linkBtnMinHeight: linkBtn ? getComputedStyle(linkBtn).minHeight : '',
      pageBtnMinHeight: pageBtn ? getComputedStyle(pageBtn).minHeight : '',
      tagMinHeight: tag ? getComputedStyle(tag).minHeight : '',
      clearAllMinHeight: clearAll ? getComputedStyle(clearAll).minHeight : '',
      filterChipMinHeight: filterChip ? getComputedStyle(filterChip).minHeight : '',
      filterChipHeight: filterChip ? filterChip.getBoundingClientRect().height : 0,
      privacyWa: privacyWa?.getAttribute('href') || '',
      barWa: barWa?.getAttribute('href') || '',
      bar,
      menuOpen: document.getElementById('mobile-menu')?.classList.contains('open') === true,
    };
  }, vw);
}

function leftoverCopy(chip, label) {
  ok(chip.found, `${label}: leftover Todas / leftover Melão e melancia should be leftover present`);
  ok(chip.tag === 'BUTTON', `${label}: leftover subcat-chip stays leftover button`);
  ok(chip.type === 'button' && chip.melaoType === 'button',
    `${label}: leftover subcat-chip stays leftover type=button`);
  ok(chip.onclick === "selecionarSubcat('')",
    `${label}: leftover Todas stays leftover selecionarSubcat('') (got "${chip.onclick}")`);
  ok(chip.melaoOnclick === "selecionarSubcat('melao-melancia')",
    `${label}: leftover Melão e melancia stays leftover selecionarSubcat('melao-melancia') (got "${chip.melaoOnclick}")`);
  ok(chip.pressed === 'true' && chip.melaoPressed === 'false',
    `${label}: leftover Todas starts leftover aria-pressed=true leftover Melão e melancia leftover false`);
  ok(chip.group === 'Subcategorias', `${label}: leftover subcat-row group stays leftover Subcategorias`);
  ok(/^Todas$/i.test(chip.todasText),
    `${label}: leftover Todas copy stays (got "${chip.todasText}")`);
  ok(/Melão e melancia/i.test(chip.melaoText),
    `${label}: leftover Melão e melancia copy stays (got "${chip.melaoText}")`);
  ok(chip.labels.some(t => /Banana, maçã e pera/i.test(t)),
    `${label}: leftover Banana, maçã e pera chip stays`);
  ok(chip.hamburgerType === null || chip.hamburgerType === '',
    `${label}: leftover hamburger stays without invented type=button`);
  ok(chip.hamburgerLabel === 'Menu', `${label}: leftover hamburger Menu stays`);
  ok(chip.hamburgerExpanded === null, `${label}: leftover hamburger has leftover no aria-expanded`);
  ok(chip.navOrderType === null || chip.navOrderType === '',
    `${label}: leftover Encomendar stays without invented type=button`);
  ok(chip.mobileCloseType === null || chip.mobileCloseType === '',
    `${label}: leftover mobile-close stays without invented type=button`);
  ok(!chip.mobileCloseLabel, `${label}: leftover mobile-close stays leftover unnamed`);
  ok(chip.mobileCloseText === '✕', `${label}: leftover mobile-close stays leftover ✕`);
  ok(chip.mbCartType === null || chip.mbCartType === '',
    `${label}: leftover 4-item bar Carrinho stays without invented type=button`);
  ok(chip.floatCartType === null || chip.floatCartType === '',
    `${label}: leftover float-cart stays without invented type=button`);
  ok(chip.floatLegumesType === null || chip.floatLegumesType === '',
    `${label}: leftover float-legumes stays without invented type=button`);
  ok(chip.scrollTopType === null || chip.scrollTopType === '',
    `${label}: leftover scroll-top stays without invented type=button`);
  ok(chip.cabazCloseType === null || chip.cabazCloseType === '',
    `${label}: leftover cabaz-modal-close stays without invented type=button`);
  ok(chip.shopLinkType === null || chip.shopLinkType === '',
    `${label}: leftover shop-link stays without invented type=button`);
  ok(chip.catQuickType === null || chip.catQuickType === '',
    `${label}: leftover cat-quick-btn stays without invented type=button`);
  ok(chip.orderWaType === 'submit', `${label}: leftover order WhatsApp stays leftover type=submit`);
  ok(/Encomendar por WhatsApp/i.test(chip.orderWaText),
    `${label}: leftover Encomendar por WhatsApp copy stays`);
  ok(/Continuar a comprar/i.test(chip.btnContinuarText),
    `${label}: leftover Continuar a comprar copy stays`);
  ok(/Hora de levantamento/i.test(chip.toggleText),
    `${label}: leftover Hora de levantamento copy stays`);
  ok(/ou encomende por email/i.test(chip.btnEmText),
    `${label}: leftover ou encomende por email copy stays`);
  ok(chip.privacyWa === 'https://wa.me/351932699850',
    `${label}: leftover privacy WhatsApp stays (got "${chip.privacyWa}")`);
  ok(chip.barWa === 'https://wa.me/351932699850',
    `${label}: leftover bar WhatsApp stays (got "${chip.barWa}")`);
  ok(chip.bar.some(t => /Carrinho/i.test(t) || /€/.test(t)),
    `${label}: 4-item bar still lists leftover Carrinho or leftover running total (got ${chip.bar.join(' | ')})`);
  ok(chip.bar.some(t => /Promoções/i.test(t)), `${label}: 4-item bar still lists Promoções`);
  ok(chip.bar.some(t => /WhatsApp/i.test(t)), `${label}: 4-item bar still lists WhatsApp`);
  ok(chip.bar.some(t => /Como Chegar/i.test(t)), `${label}: 4-item bar still lists Como Chegar`);
  ok(chip.bar.length === 4, `${label}: leftover 4-item bar stays (got ${chip.bar.length})`);
  ok(chip.menuOpen === false, `${label}: leftover mobile-menu stays leftover closed`);
}

function leftoverPhoneTap(chip, label) {
  leftoverCopy(chip, label);
  ok(chip.height >= 44,
    `${label}: leftover Todas should be leftover ≥44px (got ${chip.height})`);
  ok(chip.melaoHeight >= 44,
    `${label}: leftover Melão e melancia should be leftover ≥44px (got ${chip.melaoHeight})`);
  ok(parseFloat(chip.minHeight) >= 44,
    `${label}: leftover Todas min-height should be leftover 44px (got ${chip.minHeight})`);
  ok(parseFloat(chip.melaoMinHeight) >= 44,
    `${label}: leftover Melão e melancia min-height should be leftover 44px (got ${chip.melaoMinHeight})`);
  ok(chip.boxSizing === 'border-box', `${label}: leftover subcat-chip box-sizing is leftover border-box`);
  ok(!chip.btnContinuarMinHeight || chip.btnContinuarMinHeight === '0px' || chip.btnContinuarMinHeight === 'auto' || parseFloat(chip.btnContinuarMinHeight) < 44,
    `${label}: should not redo leftover Continuar a comprar 44px tap (min-height=${chip.btnContinuarMinHeight})`);
  ok(!chip.btnEmMinHeight || chip.btnEmMinHeight === '0px' || chip.btnEmMinHeight === 'auto' || parseFloat(chip.btnEmMinHeight) < 44,
    `${label}: should not redo leftover checkout email 44px tap (min-height=${chip.btnEmMinHeight})`);
  ok(!chip.toggleMinHeight || chip.toggleMinHeight === '0px' || chip.toggleMinHeight === 'auto' || parseFloat(chip.toggleMinHeight) < 44,
    `${label}: should not redo leftover Hora de levantamento 44px tap (min-height=${chip.toggleMinHeight})`);
  ok(!chip.searchClearMinHeight || chip.searchClearMinHeight === '0px' || chip.searchClearMinHeight === 'auto' || parseFloat(chip.searchClearMinHeight) < 44,
    `${label}: should not redo leftover catalog search-clear 44px tap (min-height=${chip.searchClearMinHeight})`);
  ok(!chip.sortMinHeight || chip.sortMinHeight === '0px' || chip.sortMinHeight === 'auto' || parseFloat(chip.sortMinHeight) < 44,
    `${label}: should not redo leftover catalog sort 44px tap (min-height=${chip.sortMinHeight})`);
  ok(!chip.linkBtnMinHeight || chip.linkBtnMinHeight === '0px' || chip.linkBtnMinHeight === 'auto' || parseFloat(chip.linkBtnMinHeight) < 44,
    `${label}: should not redo leftover no-results Limpar filtros 44px tap (min-height=${chip.linkBtnMinHeight})`);
  ok(!chip.pageBtnMinHeight || chip.pageBtnMinHeight === '0px' || chip.pageBtnMinHeight === 'auto' || parseFloat(chip.pageBtnMinHeight) < 44,
    `${label}: should not redo leftover catalog pagination 44px tap (min-height=${chip.pageBtnMinHeight})`);
  ok(!chip.tagMinHeight || chip.tagMinHeight === '0px' || chip.tagMinHeight === 'auto' || parseFloat(chip.tagMinHeight) < 44,
    `${label}: should not redo leftover individual filter-tag 44px tap (min-height=${chip.tagMinHeight})`);
  ok(!chip.clearAllMinHeight || chip.clearAllMinHeight === '0px' || chip.clearAllMinHeight === 'auto' || parseFloat(chip.clearAllMinHeight) < 44,
    `${label}: should not redo leftover filter-tag Limpar tudo 44px tap (min-height=${chip.clearAllMinHeight})`);
  ok(!chip.filterChipMinHeight || chip.filterChipMinHeight === '0px' || chip.filterChipMinHeight === 'auto' || parseFloat(chip.filterChipMinHeight) < 44,
    `${label}: should not redo leftover filter-chip 44px tap (min-height=${chip.filterChipMinHeight}, height=${chip.filterChipHeight})`);
}

function leftoverDesktopHug(chip, label) {
  leftoverCopy(chip, label);
  ok(chip.height < 44,
    `${label}: leftover Todas should hug leftover labels, not force 44px (got ${chip.height})`);
  ok(chip.melaoHeight < 44,
    `${label}: leftover Melão e melancia should hug leftover labels, not force 44px (got ${chip.melaoHeight})`);
  ok(chip.minHeight === '0px' || chip.minHeight === 'auto' || parseFloat(chip.minHeight) < 44,
    `${label}: leftover desktop min-height should stay leftover unforced (got ${chip.minHeight})`);
}

async function clickSubcatChip(page, label) {
  const after = await page.evaluate(() => {
    const chips = [...document.querySelectorAll('.subcat-chip')];
    const melao = chips.find(c => /Melão e melancia/i.test(c.textContent || ''));
    if (!melao) return { ok: false, reason: 'missing' };
    const src = typeof window.selecionarSubcat === 'function' ? window.selecionarSubcat.toString() : '';
    melao.click();
    const chipsAfter = [...document.querySelectorAll('.subcat-chip')];
    const melaoAfter = chipsAfter.find(c => /Melão e melancia/i.test(c.textContent || ''));
    const todasAfter = chipsAfter.find(c => /^\s*Todas\s*$/i.test(c.textContent || ''));
    const privacyWa = document.querySelector('.privacy-box a[href^="https://wa.me"]');
    const barWa = document.querySelector('.mobile-bar a[href^="https://wa.me"]');
    const line = [...document.querySelectorAll('.order-item')]
      .find(li => /Melancia 1\/4/i.test(li.textContent || ''));
    const card = [...document.querySelectorAll('.shop-main .product-card')]
      .find(c => /Melancia 1\/4/i.test(c.textContent || ''));
    const banana = [...document.querySelectorAll('.shop-main .product-card')]
      .find(c => /Banana Del Monte/i.test(c.textContent || ''));
    const melon = [...document.querySelectorAll('.shop-main .product-card')]
      .find(c => /Melão/i.test(c.textContent || '') && !/Melancia/i.test(c.textContent || ''));
    return {
      ok: true,
      src,
      pressed: melaoAfter?.getAttribute('aria-pressed') || '',
      active: melaoAfter?.classList.contains('active') === true,
      todasPressed: todasAfter?.getAttribute('aria-pressed') || '',
      todasActive: todasAfter?.classList.contains('active') === true,
      text: (melaoAfter?.textContent || '').replace(/\s+/g, ' ').trim(),
      type: melaoAfter?.getAttribute('type') || '',
      onclick: melaoAfter?.getAttribute('onclick') || '',
      menuOpen: document.getElementById('mobile-menu')?.classList.contains('open') === true,
      waHref: privacyWa?.getAttribute('href') || '',
      barWaHref: barWa?.getAttribute('href') || '',
      pageUrl: window.location.pathname,
      cartCount: document.getElementById('cart-count')?.textContent || '',
      line: (line?.textContent || '').replace(/\s+/g, ' ').trim(),
      card: !!card,
      banana: !!banana,
      melon: !!melon,
    };
  });
  ok(after.ok, `${label}: leftover subcat-chip click should work`);
  ok(after.pressed === 'true', `${label}: leftover Melão e melancia leftover aria-pressed=true after leftover click`);
  ok(after.active === true, `${label}: leftover Melão e melancia leftover active after leftover click`);
  ok(after.todasPressed === 'false' && after.todasActive === false,
    `${label}: leftover Todas leftover clears after leftover Melão e melancia`);
  ok(/Melão e melancia/i.test(after.text), `${label}: leftover Melão e melancia copy stays after leftover click (got "${after.text}")`);
  ok(after.type === 'button', `${label}: leftover subcat-chip stays leftover type=button after leftover click`);
  ok(after.onclick === "selecionarSubcat('melao-melancia')",
    `${label}: leftover selecionarSubcat('melao-melancia') stays after leftover click`);
  ok(after.menuOpen === false, `${label}: leftover mobile-menu stays leftover closed after leftover click`);
  ok(after.waHref === 'https://wa.me/351932699850',
    `${label}: leftover privacy WhatsApp stays after leftover click (got "${after.waHref}")`);
  ok(after.barWaHref === 'https://wa.me/351932699850',
    `${label}: leftover bar WhatsApp stays after leftover click (got "${after.barWaHref}")`);
  ok(typeof after.src === 'string' && after.src.includes('aplicarCatalogo'),
    `${label}: leftover subcat-chip still leftover applies leftover catalog`);
  ok(after.cartCount === '1' && /Melancia 1\/4/i.test(after.line),
    `${label}: leftover Melancia 1/4 stays after leftover subcat-chip (got "${after.cartCount}" / "${after.line}")`);
  ok(after.card === true, `${label}: leftover Melão e melancia leftover lists leftover Melancia 1/4`);
  ok(after.melon, `${label}: leftover Melão e melancia leftover lists leftover Melão`);
  ok(after.banana === false, `${label}: leftover Melão e melancia leftover hides leftover Banana Del Monte`);
  ok(after.pageUrl === '/' || after.pageUrl === '/index.html' || after.pageUrl === '',
    `${label}: leftover subcat-chip click should not leave leftover homepage (got "${after.pageUrl}")`);

  const restored = await page.evaluate(() => {
    const chips = [...document.querySelectorAll('.subcat-chip')];
    const todas = chips.find(c => /^\s*Todas\s*$/i.test(c.textContent || ''));
    if (todas) todas.click();
    const chipsAfter = [...document.querySelectorAll('.subcat-chip')];
    const todasAfter = chipsAfter.find(c => /^\s*Todas\s*$/i.test(c.textContent || ''));
    const melaoAfter = chipsAfter.find(c => /Melão e melancia/i.test(c.textContent || ''));
    const card = [...document.querySelectorAll('.shop-main .product-card')]
      .find(c => /Melancia 1\/4/i.test(c.textContent || ''));
    const banana = [...document.querySelectorAll('.shop-main .product-card')]
      .find(c => /Banana Del Monte/i.test(c.textContent || ''));
    const line = [...document.querySelectorAll('.order-item')]
      .find(li => /Melancia 1\/4/i.test(li.textContent || ''));
    return {
      pressed: todasAfter?.getAttribute('aria-pressed') || '',
      active: todasAfter?.classList.contains('active') === true,
      melaoPressed: melaoAfter?.getAttribute('aria-pressed') || '',
      card: !!card,
      banana: !!banana,
      cartCount: document.getElementById('cart-count')?.textContent || '',
      line: (line?.textContent || '').replace(/\s+/g, ' ').trim(),
    };
  });
  ok(restored.pressed === 'true' && restored.active === true,
    `${label}: leftover Todas leftover restores after leftover second click`);
  ok(restored.melaoPressed === 'false',
    `${label}: leftover Melão e melancia leftover clears after leftover Todas`);
  ok(restored.card, `${label}: leftover Melancia 1/4 leftover listed after leftover Todas`);
  ok(restored.banana, `${label}: leftover Banana Del Monte leftover listed after leftover Todas`);
  ok(restored.cartCount === '1' && /Melancia 1\/4/i.test(restored.line),
    `${label}: leftover Melancia 1/4 leftover cart stays after leftover Todas`);
}

try {
  const mobile = await browser.newPage();
  mobile.on('pageerror', err => errors.push('390 pageerror: ' + err.message));
  await openReady(mobile, 390, 844);
  leftoverPhoneTap(await measureSubcatChip(mobile, 390), '390 homepage');
  await addMelancia(mobile, '390 before leftover subcat-chip');
  leftoverPhoneTap(await measureSubcatChip(mobile, 390), '390 homepage after leftover add');
  await clickSubcatChip(mobile, '390 homepage');

  const midPhone = await browser.newPage();
  midPhone.on('pageerror', err => errors.push('640 pageerror: ' + err.message));
  await openReady(midPhone, 640, 900);
  leftoverPhoneTap(await measureSubcatChip(midPhone, 640), '640 homepage');
  await addMelancia(midPhone, '640 before leftover subcat-chip');
  leftoverPhoneTap(await measureSubcatChip(midPhone, 640), '640 homepage after leftover add');
  await clickSubcatChip(midPhone, '640 homepage');

  const tablet = await browser.newPage();
  tablet.on('pageerror', err => errors.push('900 pageerror: ' + err.message));
  await openReady(tablet, 900, 800);
  leftoverDesktopHug(await measureSubcatChip(tablet, 900), '900 homepage');

  const wide = await browser.newPage();
  wide.on('pageerror', err => errors.push('1280 pageerror: ' + err.message));
  await openReady(wide, 1280, 800);
  leftoverDesktopHug(await measureSubcatChip(wide, 1280), '1280 homepage');
  await addMelancia(wide, '1280 before leftover subcat-chip');
  leftoverDesktopHug(await measureSubcatChip(wide, 1280), '1280 homepage after leftover add');
  await clickSubcatChip(wide, '1280 homepage');

  const catPage = await browser.newPage();
  catPage.on('pageerror', err => errors.push('390 Frutas pageerror: ' + err.message));
  await catPage.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true });
  await catPage.goto(`${base}categorias/frutas/`, { waitUntil: 'networkidle0', timeout: 60000 });
  const cat = await catPage.evaluate(() => {
    const nav = [...document.querySelectorAll('.seo-nav a')].map(a => (a.textContent || '').trim());
    return {
      nav,
      hasSubcat: !!document.querySelector('.subcat-chip'),
      hasRow: !!document.getElementById('subcat-row'),
      verText: (document.querySelector('.seo-text-link')?.textContent || '').trim(),
    };
  });
  ok(cat.nav.join('|') === 'Início|Frutas|Legumes|Promoções',
    `390 Frutas: wrapping nav stays leftover Início / Frutas / Legumes / Promoções (got ${cat.nav.join(' / ')})`);
  ok(!cat.hasSubcat, '390 Frutas: catalog pages still have leftover no subcat-chip');
  ok(!cat.hasRow, '390 Frutas: catalog pages still have leftover no subcat-row');
  ok(cat.verText === 'Ver produto', `390 Frutas: leftover Ver produto copy (got "${cat.verText}")`);

  const prodPage = await browser.newPage();
  prodPage.on('pageerror', err => errors.push('390 Melancia pageerror: ' + err.message));
  await prodPage.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true });
  await prodPage.goto(`${base}produtos/melancia-1-4/`, { waitUntil: 'networkidle0', timeout: 60000 });
  const prod = await prodPage.evaluate(() => {
    const order = document.querySelector('.seo-order-link');
    return {
      orderText: (order?.textContent || '').replace(/\s+/g, ' ').trim(),
      orderHref: order?.getAttribute('href') || '',
      hasSubcat: !!document.querySelector('.subcat-chip'),
      hasRow: !!document.getElementById('subcat-row'),
    };
  });
  ok(prod.orderText === 'Ver no catálogo e encomendar',
    `390 Melancia: leftover Ver no catálogo e encomendar stays (got "${prod.orderText}")`);
  ok(prod.orderHref === '/?produto=melancia-1-4#produtos',
    `390 Melancia: leftover catalog href stays (got "${prod.orderHref}")`);
  ok(!prod.hasSubcat, '390 Melancia: catalog pages still have leftover no subcat-chip');
  ok(!prod.hasRow, '390 Melancia: catalog pages still have leftover no subcat-row');

  await browser.close();
  server.close();
  if (errors.length) {
    console.error('check-subcat-chip-tap-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
    process.exit(1);
  }
  console.log('check-subcat-chip-tap-browser: ok');
} catch (err) {
  try { await browser.close(); } catch {}
  try { server.close(); } catch {}
  console.error(err);
  process.exit(1);
}
