#!/usr/bin/env node
/** Chrome: leftover catalog price filter is a 44px tap target on phones. */
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

async function measureFilterSelect(page, vw) {
  return page.evaluate((viewport) => {
    if (viewport <= 900 && window.toggleFiltros) {
      const sb = document.getElementById('shop-sidebar');
      if (sb && !sb.classList.contains('open')) window.toggleFiltros();
    }
    const select = document.getElementById('filter-preco');
    const rect = select ? select.getBoundingClientRect() : { width: 0, height: 0 };
    const style = select ? getComputedStyle(select) : null;
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
    const subcatChip = document.querySelector('.subcat-chip');
    const catTab = document.querySelector('.shop-sidebar .cat-tab');
    const privacyWa = document.querySelector('.privacy-box a[href^="https://wa.me"]');
    const barWa = document.querySelector('.mobile-bar a[href^="https://wa.me"]');
    const bar = [...document.querySelectorAll('.mb-item')].map(el =>
      (el.textContent || '').replace(/\s+/g, ' ').trim()
    );
    const options = select ? [...select.options].map(o => ({
      value: o.value,
      text: (o.textContent || '').replace(/\s+/g, ' ').trim(),
    })) : [];
    return {
      found: !!select,
      tag: select?.tagName || '',
      id: select?.id || '',
      className: select?.className || '',
      onchange: select?.getAttribute('onchange') || '',
      label: select?.getAttribute('aria-label') || '',
      fieldText: (select?.closest('.sb-field')?.childNodes[0]?.textContent || '').replace(/\s+/g, ' ').trim(),
      value: select?.value || '',
      options,
      width: rect.width,
      height: rect.height,
      minHeight: style?.minHeight || '',
      boxSizing: style?.boxSizing || '',
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
      subcatChipMinHeight: subcatChip ? getComputedStyle(subcatChip).minHeight : '',
      subcatChipHeight: subcatChip ? subcatChip.getBoundingClientRect().height : 0,
      catTabMinHeight: catTab ? getComputedStyle(catTab).minHeight : '',
      catTabHeight: catTab ? catTab.getBoundingClientRect().height : 0,
      privacyWa: privacyWa?.getAttribute('href') || '',
      barWa: barWa?.getAttribute('href') || '',
      bar,
      menuOpen: document.getElementById('mobile-menu')?.classList.contains('open') === true,
    };
  }, vw);
}

function leftoverCopy(sel, label) {
  ok(sel.found, `${label}: leftover Filtrar por preço should be leftover present`);
  ok(sel.tag === 'SELECT', `${label}: leftover filter-preco stays leftover select`);
  ok(sel.id === 'filter-preco', `${label}: leftover id stays leftover filter-preco`);
  ok(/\bfilter-select\b/.test(sel.className), `${label}: leftover class stays leftover filter-select`);
  ok(sel.onchange === 'aplicarCatalogo()',
    `${label}: leftover onchange stays leftover aplicarCatalogo() (got "${sel.onchange}")`);
  ok(sel.label === 'Filtrar por preço',
    `${label}: leftover aria-label stays leftover Filtrar por preço (got "${sel.label}")`);
  ok(/^Preço/i.test(sel.fieldText),
    `${label}: leftover Preço label stays (got "${sel.fieldText}")`);
  ok(sel.value === '', `${label}: leftover price filter starts leftover Todos`);
  const optionText = sel.options.map(o => o.text).join('|');
  const optionValue = sel.options.map(o => o.value).join('|');
  ok(optionValue === '|0-2|2-5|5-999',
    `${label}: leftover price values stay leftover Todos / leftover 0-2 / leftover 2-5 / leftover 5-999 (got ${optionValue})`);
  ok(sel.options.some(o => o.value === '' && /Todos/i.test(o.text)),
    `${label}: leftover Todos stays (got ${optionText})`);
  ok(sel.options.some(o => o.value === '0-2' && /Até 2/.test(o.text)),
    `${label}: leftover Até 2 € stays (got ${optionText})`);
  ok(sel.options.some(o => o.value === '2-5' && /2 €/.test(o.text)),
    `${label}: leftover 2 € – 5 € stays (got ${optionText})`);
  ok(sel.options.some(o => o.value === '5-999' && /Mais de 5/.test(o.text)),
    `${label}: leftover Mais de 5 € stays (got ${optionText})`);
  ok(sel.hamburgerType === null || sel.hamburgerType === '',
    `${label}: leftover hamburger stays without invented type=button`);
  ok(sel.hamburgerLabel === 'Menu', `${label}: leftover hamburger Menu stays`);
  ok(sel.hamburgerExpanded === null, `${label}: leftover hamburger has leftover no aria-expanded`);
  ok(sel.navOrderType === null || sel.navOrderType === '',
    `${label}: leftover Encomendar stays without invented type=button`);
  ok(sel.mobileCloseType === null || sel.mobileCloseType === '',
    `${label}: leftover mobile-close stays without invented type=button`);
  ok(!sel.mobileCloseLabel, `${label}: leftover mobile-close stays leftover unnamed`);
  ok(sel.mobileCloseText === '✕', `${label}: leftover mobile-close stays leftover ✕`);
  ok(sel.mbCartType === null || sel.mbCartType === '',
    `${label}: leftover 4-item bar Carrinho stays without invented type=button`);
  ok(sel.floatCartType === null || sel.floatCartType === '',
    `${label}: leftover float-cart stays without invented type=button`);
  ok(sel.floatLegumesType === null || sel.floatLegumesType === '',
    `${label}: leftover float-legumes stays without invented type=button`);
  ok(sel.scrollTopType === null || sel.scrollTopType === '',
    `${label}: leftover scroll-top stays without invented type=button`);
  ok(sel.cabazCloseType === null || sel.cabazCloseType === '',
    `${label}: leftover cabaz-modal-close stays without invented type=button`);
  ok(sel.shopLinkType === null || sel.shopLinkType === '',
    `${label}: leftover shop-link stays without invented type=button`);
  ok(sel.catQuickType === null || sel.catQuickType === '',
    `${label}: leftover cat-quick-btn stays without invented type=button`);
  ok(sel.orderWaType === 'submit', `${label}: leftover order WhatsApp stays leftover type=submit`);
  ok(/Encomendar por WhatsApp/i.test(sel.orderWaText),
    `${label}: leftover Encomendar por WhatsApp copy stays`);
  ok(/Continuar a comprar/i.test(sel.btnContinuarText),
    `${label}: leftover Continuar a comprar copy stays`);
  ok(/Hora de levantamento/i.test(sel.toggleText),
    `${label}: leftover Hora de levantamento copy stays`);
  ok(/ou encomende por email/i.test(sel.btnEmText),
    `${label}: leftover ou encomende por email copy stays`);
  ok(sel.privacyWa === 'https://wa.me/351932699850',
    `${label}: leftover privacy WhatsApp stays (got "${sel.privacyWa}")`);
  ok(sel.barWa === 'https://wa.me/351932699850',
    `${label}: leftover bar WhatsApp stays (got "${sel.barWa}")`);
  ok(sel.bar.some(t => /Carrinho/i.test(t) || /€/.test(t)),
    `${label}: 4-item bar still lists leftover Carrinho or leftover running total (got ${sel.bar.join(' | ')})`);
  ok(sel.bar.some(t => /Promoções/i.test(t)), `${label}: 4-item bar still lists Promoções`);
  ok(sel.bar.some(t => /WhatsApp/i.test(t)), `${label}: 4-item bar still lists WhatsApp`);
  ok(sel.bar.some(t => /Como Chegar/i.test(t)), `${label}: 4-item bar still lists Como Chegar`);
  ok(sel.bar.length === 4, `${label}: leftover 4-item bar stays (got ${sel.bar.length})`);
  ok(sel.menuOpen === false, `${label}: leftover mobile-menu stays leftover closed`);
}

function leftoverPhoneTap(sel, label) {
  leftoverCopy(sel, label);
  ok(sel.height >= 44,
    `${label}: leftover Filtrar por preço should be leftover ≥44px (got ${sel.height})`);
  ok(parseFloat(sel.minHeight) >= 44,
    `${label}: leftover Filtrar por preço min-height should be leftover 44px (got ${sel.minHeight})`);
  ok(sel.boxSizing === 'border-box', `${label}: leftover filter-select box-sizing is leftover border-box`);
  ok(!sel.btnContinuarMinHeight || sel.btnContinuarMinHeight === '0px' || sel.btnContinuarMinHeight === 'auto' || parseFloat(sel.btnContinuarMinHeight) < 44,
    `${label}: should not redo leftover Continuar a comprar 44px tap (min-height=${sel.btnContinuarMinHeight})`);
  ok(!sel.btnEmMinHeight || sel.btnEmMinHeight === '0px' || sel.btnEmMinHeight === 'auto' || parseFloat(sel.btnEmMinHeight) < 44,
    `${label}: should not redo leftover checkout email 44px tap (min-height=${sel.btnEmMinHeight})`);
  ok(!sel.toggleMinHeight || sel.toggleMinHeight === '0px' || sel.toggleMinHeight === 'auto' || parseFloat(sel.toggleMinHeight) < 44,
    `${label}: should not redo leftover Hora de levantamento 44px tap (min-height=${sel.toggleMinHeight})`);
  ok(!sel.searchClearMinHeight || sel.searchClearMinHeight === '0px' || sel.searchClearMinHeight === 'auto' || parseFloat(sel.searchClearMinHeight) < 44,
    `${label}: should not redo leftover catalog search-clear 44px tap (min-height=${sel.searchClearMinHeight})`);
  ok(!sel.sortMinHeight || sel.sortMinHeight === '0px' || sel.sortMinHeight === 'auto' || parseFloat(sel.sortMinHeight) < 44,
    `${label}: should not redo leftover catalog sort 44px tap (min-height=${sel.sortMinHeight})`);
  ok(!sel.linkBtnMinHeight || sel.linkBtnMinHeight === '0px' || sel.linkBtnMinHeight === 'auto' || parseFloat(sel.linkBtnMinHeight) < 44,
    `${label}: should not redo leftover no-results Limpar filtros 44px tap (min-height=${sel.linkBtnMinHeight})`);
  ok(!sel.pageBtnMinHeight || sel.pageBtnMinHeight === '0px' || sel.pageBtnMinHeight === 'auto' || parseFloat(sel.pageBtnMinHeight) < 44,
    `${label}: should not redo leftover catalog pagination 44px tap (min-height=${sel.pageBtnMinHeight})`);
  ok(!sel.tagMinHeight || sel.tagMinHeight === '0px' || sel.tagMinHeight === 'auto' || parseFloat(sel.tagMinHeight) < 44,
    `${label}: should not redo leftover individual filter-tag 44px tap (min-height=${sel.tagMinHeight})`);
  ok(!sel.clearAllMinHeight || sel.clearAllMinHeight === '0px' || sel.clearAllMinHeight === 'auto' || parseFloat(sel.clearAllMinHeight) < 44,
    `${label}: should not redo leftover filter-tag Limpar tudo 44px tap (min-height=${sel.clearAllMinHeight})`);
  ok(!sel.filterChipMinHeight || sel.filterChipMinHeight === '0px' || sel.filterChipMinHeight === 'auto' || parseFloat(sel.filterChipMinHeight) < 44,
    `${label}: should not redo leftover filter-chip 44px tap (min-height=${sel.filterChipMinHeight}, height=${sel.filterChipHeight})`);
  ok(!sel.subcatChipMinHeight || sel.subcatChipMinHeight === '0px' || sel.subcatChipMinHeight === 'auto' || parseFloat(sel.subcatChipMinHeight) < 44,
    `${label}: should not redo leftover subcat-chip 44px tap (min-height=${sel.subcatChipMinHeight}, height=${sel.subcatChipHeight})`);
  ok(!sel.catTabMinHeight || sel.catTabMinHeight === '0px' || sel.catTabMinHeight === 'auto' || parseFloat(sel.catTabMinHeight) < 44,
    `${label}: should not redo leftover cat-tab 44px tap (min-height=${sel.catTabMinHeight}, height=${sel.catTabHeight})`);
}

function leftoverDesktopHug(sel, label) {
  leftoverCopy(sel, label);
  ok(sel.height < 44,
    `${label}: leftover Filtrar por preço should hug leftover labels, not force 44px (got ${sel.height})`);
  ok(sel.minHeight === '0px' || sel.minHeight === 'auto' || parseFloat(sel.minHeight) < 44,
    `${label}: leftover desktop min-height should stay leftover unforced (got ${sel.minHeight})`);
}

async function changePriceFilter(page, label) {
  const after = await page.evaluate(() => {
    if (window.toggleFiltros) {
      const sb = document.getElementById('shop-sidebar');
      if (sb && !sb.classList.contains('open') && window.matchMedia('(max-width:900px)').matches) {
        window.toggleFiltros();
      }
    }
    const select = document.getElementById('filter-preco');
    if (!select) return { ok: false, reason: 'missing' };
    const src = typeof window.aplicarCatalogo === 'function' ? window.aplicarCatalogo.toString() : '';
    select.value = '5-999';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    const privacyWa = document.querySelector('.privacy-box a[href^="https://wa.me"]');
    const barWa = document.querySelector('.mobile-bar a[href^="https://wa.me"]');
    const line = [...document.querySelectorAll('.order-item')]
      .find(li => /Melancia 1\/4/i.test(li.textContent || ''));
    const card = [...document.querySelectorAll('.shop-main .product-card')]
      .find(c => /Melancia 1\/4/i.test(c.textContent || ''));
    const banana = [...document.querySelectorAll('.shop-main .product-card')]
      .find(c => /Banana Del Monte/i.test(c.textContent || ''));
    const expensive = [...document.querySelectorAll('.shop-main .product-card')]
      .find(c => /Uva Vale de Rosa|Kiwi Green|Manga Avião|Manga Premium/i.test(c.textContent || ''));
    return {
      ok: true,
      src,
      value: select.value,
      label: select.getAttribute('aria-label') || '',
      onchange: select.getAttribute('onchange') || '',
      menuOpen: document.getElementById('mobile-menu')?.classList.contains('open') === true,
      waHref: privacyWa?.getAttribute('href') || '',
      barWaHref: barWa?.getAttribute('href') || '',
      pageUrl: window.location.pathname,
      cartCount: document.getElementById('cart-count')?.textContent || '',
      line: (line?.textContent || '').replace(/\s+/g, ' ').trim(),
      card: !!card,
      banana: !!banana,
      expensive: !!expensive,
    };
  });
  ok(after.ok, `${label}: leftover filter-select change should work`);
  ok(after.value === '5-999', `${label}: leftover Mais de 5 € leftover selected after leftover change`);
  ok(after.label === 'Filtrar por preço', `${label}: leftover Filtrar por preço stays after leftover change`);
  ok(after.onchange === 'aplicarCatalogo()', `${label}: leftover aplicarCatalogo() stays after leftover change`);
  ok(after.menuOpen === false, `${label}: leftover mobile-menu stays leftover closed after leftover change`);
  ok(after.waHref === 'https://wa.me/351932699850',
    `${label}: leftover privacy WhatsApp stays after leftover change (got "${after.waHref}")`);
  ok(after.barWaHref === 'https://wa.me/351932699850',
    `${label}: leftover bar WhatsApp stays after leftover change (got "${after.barWaHref}")`);
  ok(typeof after.src === 'string' && after.src.includes("getElementById('filter-preco')"),
    `${label}: leftover price filter still leftover applies leftover catalog`);
  ok(after.cartCount === '1' && /Melancia 1\/4/i.test(after.line),
    `${label}: leftover Melancia 1/4 stays after leftover price filter (got "${after.cartCount}" / "${after.line}")`);
  ok(after.card === false, `${label}: leftover Mais de 5 € leftover hides leftover Melancia 1/4`);
  ok(after.banana === false, `${label}: leftover Mais de 5 € leftover hides leftover Banana Del Monte`);
  ok(after.expensive, `${label}: leftover Mais de 5 € leftover lists leftover Uva / leftover Kiwi / leftover Manga`);
  ok(after.pageUrl === '/' || after.pageUrl === '/index.html' || after.pageUrl === '',
    `${label}: leftover filter-select change should not leave leftover homepage (got "${after.pageUrl}")`);

  const restored = await page.evaluate(() => {
    if (window.toggleFiltros) {
      const sb = document.getElementById('shop-sidebar');
      if (sb && !sb.classList.contains('open') && window.matchMedia('(max-width:900px)').matches) {
        window.toggleFiltros();
      }
    }
    const select = document.getElementById('filter-preco');
    if (select) {
      select.value = '';
      select.dispatchEvent(new Event('change', { bubbles: true }));
    }
    const card = [...document.querySelectorAll('.shop-main .product-card')]
      .find(c => /Melancia 1\/4/i.test(c.textContent || ''));
    const banana = [...document.querySelectorAll('.shop-main .product-card')]
      .find(c => /Banana Del Monte/i.test(c.textContent || ''));
    const line = [...document.querySelectorAll('.order-item')]
      .find(li => /Melancia 1\/4/i.test(li.textContent || ''));
    return {
      value: select?.value || '',
      card: !!card,
      banana: !!banana,
      cartCount: document.getElementById('cart-count')?.textContent || '',
      line: (line?.textContent || '').replace(/\s+/g, ' ').trim(),
    };
  });
  ok(restored.value === '', `${label}: leftover Todos leftover restores after leftover second change`);
  ok(restored.card, `${label}: leftover Melancia 1/4 leftover listed after leftover Todos`);
  ok(restored.banana, `${label}: leftover Banana Del Monte leftover listed after leftover Todos`);
  ok(restored.cartCount === '1' && /Melancia 1\/4/i.test(restored.line),
    `${label}: leftover Melancia 1/4 leftover cart stays after leftover Todos`);
}

try {
  const mobile = await browser.newPage();
  mobile.on('pageerror', err => errors.push('390 pageerror: ' + err.message));
  await openReady(mobile, 390, 844);
  leftoverPhoneTap(await measureFilterSelect(mobile, 390), '390 homepage');
  await addMelancia(mobile, '390 before leftover filter-select');
  leftoverPhoneTap(await measureFilterSelect(mobile, 390), '390 homepage after leftover add');
  await changePriceFilter(mobile, '390 homepage');

  const midPhone = await browser.newPage();
  midPhone.on('pageerror', err => errors.push('640 pageerror: ' + err.message));
  await openReady(midPhone, 640, 900);
  leftoverPhoneTap(await measureFilterSelect(midPhone, 640), '640 homepage');
  await addMelancia(midPhone, '640 before leftover filter-select');
  leftoverPhoneTap(await measureFilterSelect(midPhone, 640), '640 homepage after leftover add');
  await changePriceFilter(midPhone, '640 homepage');

  const tablet = await browser.newPage();
  tablet.on('pageerror', err => errors.push('900 pageerror: ' + err.message));
  await openReady(tablet, 900, 800);
  leftoverDesktopHug(await measureFilterSelect(tablet, 900), '900 homepage');

  const wide = await browser.newPage();
  wide.on('pageerror', err => errors.push('1280 pageerror: ' + err.message));
  await openReady(wide, 1280, 800);
  leftoverDesktopHug(await measureFilterSelect(wide, 1280), '1280 homepage');
  await addMelancia(wide, '1280 before leftover filter-select');
  leftoverDesktopHug(await measureFilterSelect(wide, 1280), '1280 homepage after leftover add');
  await changePriceFilter(wide, '1280 homepage');

  const catPage = await browser.newPage();
  catPage.on('pageerror', err => errors.push('390 Frutas pageerror: ' + err.message));
  await catPage.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true });
  await catPage.goto(`${base}categorias/frutas/`, { waitUntil: 'networkidle0', timeout: 60000 });
  const cat = await catPage.evaluate(() => {
    const nav = [...document.querySelectorAll('.seo-nav a')].map(a => (a.textContent || '').trim());
    return {
      nav,
      hasSelect: !!document.getElementById('filter-preco'),
      hasClass: !!document.querySelector('.filter-select'),
      verText: (document.querySelector('.seo-text-link')?.textContent || '').trim(),
    };
  });
  ok(cat.nav.join('|') === 'Início|Frutas|Legumes|Promoções',
    `390 Frutas: wrapping nav stays leftover Início / Frutas / Legumes / Promoções (got ${cat.nav.join(' / ')})`);
  ok(!cat.hasSelect, '390 Frutas: catalog pages still have leftover no filter-preco');
  ok(!cat.hasClass, '390 Frutas: catalog pages still have leftover no filter-select');
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
      hasSelect: !!document.getElementById('filter-preco'),
      hasClass: !!document.querySelector('.filter-select'),
    };
  });
  ok(prod.orderText === 'Ver no catálogo e encomendar',
    `390 Melancia: leftover Ver no catálogo e encomendar stays (got "${prod.orderText}")`);
  ok(prod.orderHref === '/?produto=melancia-1-4#produtos',
    `390 Melancia: leftover catalog href stays (got "${prod.orderHref}")`);
  ok(!prod.hasSelect, '390 Melancia: catalog pages still have leftover no filter-preco');
  ok(!prod.hasClass, '390 Melancia: catalog pages still have leftover no filter-select');

  await browser.close();
  server.close();
  if (errors.length) {
    console.error('check-filter-select-tap-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
    process.exit(1);
  }
  console.log('check-filter-select-tap-browser: ok');
} catch (err) {
  try { await browser.close(); } catch {}
  try { server.close(); } catch {}
  console.error(err);
  process.exit(1);
}
