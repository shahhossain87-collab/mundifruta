#!/usr/bin/env node
/** Chrome: leftover catalog category tabs are 44px tap targets on phones. */
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

async function measureCatTab(page, vw) {
  return page.evaluate((viewport) => {
    if (viewport <= 900 && window.toggleFiltros) {
      const sb = document.getElementById('shop-sidebar');
      if (sb && !sb.classList.contains('open')) window.toggleFiltros();
    }
    const tabs = [...document.querySelectorAll('.shop-sidebar .cat-tab')];
    const frutas = document.getElementById('tab-frutas');
    const legumes = document.getElementById('tab-legumes');
    const ervas = document.getElementById('tab-ervas');
    const epoca = document.getElementById('tab-epoca');
    const promocoes = document.getElementById('tab-promocoes');
    const cabazes = document.getElementById('tab-cabazes');
    const frutasRect = frutas ? frutas.getBoundingClientRect() : { width: 0, height: 0 };
    const legumesRect = legumes ? legumes.getBoundingClientRect() : { width: 0, height: 0 };
    const frutasStyle = frutas ? getComputedStyle(frutas) : null;
    const legumesStyle = legumes ? getComputedStyle(legumes) : null;
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
    const privacyWa = document.querySelector('.privacy-box a[href^="https://wa.me"]');
    const barWa = document.querySelector('.mobile-bar a[href^="https://wa.me"]');
    const bar = [...document.querySelectorAll('.mb-item')].map(el =>
      (el.textContent || '').replace(/\s+/g, ' ').trim()
    );
    return {
      found: !!frutas && !!legumes && !!ervas && !!epoca && !!promocoes && !!cabazes,
      count: tabs.length,
      tag: frutas?.tagName || '',
      type: frutas?.getAttribute('type') || '',
      legumesType: legumes?.getAttribute('type') || '',
      onclick: frutas?.getAttribute('onclick') || '',
      legumesOnclick: legumes?.getAttribute('onclick') || '',
      cabazesOnclick: cabazes?.getAttribute('onclick') || '',
      selected: frutas?.getAttribute('aria-selected') || '',
      legumesSelected: legumes?.getAttribute('aria-selected') || '',
      role: frutas?.getAttribute('role') || '',
      group: frutas?.closest('.cat-tabs')?.getAttribute('aria-label') || '',
      groupRole: frutas?.closest('.cat-tabs')?.getAttribute('role') || '',
      frutasText: (frutas?.textContent || '').replace(/\s+/g, ' ').trim(),
      legumesText: (legumes?.textContent || '').replace(/\s+/g, ' ').trim(),
      ervasText: (ervas?.textContent || '').replace(/\s+/g, ' ').trim(),
      epocaText: (epoca?.textContent || '').replace(/\s+/g, ' ').trim(),
      promoText: (promocoes?.textContent || '').replace(/\s+/g, ' ').trim(),
      cabazesText: (cabazes?.textContent || '').replace(/\s+/g, ' ').trim(),
      width: frutasRect.width,
      height: frutasRect.height,
      legumesHeight: legumesRect.height,
      minHeight: frutasStyle?.minHeight || '',
      legumesMinHeight: legumesStyle?.minHeight || '',
      boxSizing: frutasStyle?.boxSizing || '',
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
      privacyWa: privacyWa?.getAttribute('href') || '',
      barWa: barWa?.getAttribute('href') || '',
      bar,
      menuOpen: document.getElementById('mobile-menu')?.classList.contains('open') === true,
    };
  }, vw);
}

function leftoverCopy(tab, label) {
  ok(tab.found, `${label}: leftover Frutas / leftover Legumes should be leftover present`);
  ok(tab.count === 6, `${label}: leftover cat-tab count stays leftover 6 (got ${tab.count})`);
  ok(tab.tag === 'BUTTON', `${label}: leftover cat-tab stays leftover button`);
  ok(tab.type === 'button' && tab.legumesType === 'button',
    `${label}: leftover cat-tab stays leftover type=button`);
  ok(tab.onclick === "mostrarCategoria('frutas',this)",
    `${label}: leftover Frutas stays leftover mostrarCategoria('frutas',this) (got "${tab.onclick}")`);
  ok(tab.legumesOnclick === "mostrarCategoria('legumes',this)",
    `${label}: leftover Legumes stays leftover mostrarCategoria('legumes',this) (got "${tab.legumesOnclick}")`);
  ok(tab.cabazesOnclick === 'abrirCabazes()',
    `${label}: leftover Cabazes stays leftover abrirCabazes() (got "${tab.cabazesOnclick}")`);
  ok(tab.selected === 'true' && tab.legumesSelected === 'false',
    `${label}: leftover Frutas starts leftover aria-selected=true leftover Legumes leftover false`);
  ok(tab.role === 'tab', `${label}: leftover cat-tab stays leftover role=tab`);
  ok(tab.group === 'Categorias de produtos', `${label}: leftover cat-tabs group stays leftover Categorias de produtos`);
  ok(tab.groupRole === 'tablist', `${label}: leftover cat-tabs stays leftover tablist`);
  ok(/^Frutas/i.test(tab.frutasText),
    `${label}: leftover Frutas copy stays (got "${tab.frutasText}")`);
  ok(/^Legumes/i.test(tab.legumesText),
    `${label}: leftover Legumes copy stays (got "${tab.legumesText}")`);
  ok(/Ervas frescas/i.test(tab.ervasText),
    `${label}: leftover Ervas frescas copy stays (got "${tab.ervasText}")`);
  ok(/Frutas da Época/i.test(tab.epocaText),
    `${label}: leftover Frutas da Época copy stays (got "${tab.epocaText}")`);
  ok(/^Promoções/i.test(tab.promoText),
    `${label}: leftover Promoções copy stays (got "${tab.promoText}")`);
  ok(/^Cabazes/i.test(tab.cabazesText),
    `${label}: leftover Cabazes copy stays (got "${tab.cabazesText}")`);
  ok(tab.hamburgerType === null || tab.hamburgerType === '',
    `${label}: leftover hamburger stays without invented type=button`);
  ok(tab.hamburgerLabel === 'Menu', `${label}: leftover hamburger Menu stays`);
  ok(tab.hamburgerExpanded === null, `${label}: leftover hamburger has leftover no aria-expanded`);
  ok(tab.navOrderType === null || tab.navOrderType === '',
    `${label}: leftover Encomendar stays without invented type=button`);
  ok(tab.mobileCloseType === null || tab.mobileCloseType === '',
    `${label}: leftover mobile-close stays without invented type=button`);
  ok(!tab.mobileCloseLabel, `${label}: leftover mobile-close stays leftover unnamed`);
  ok(tab.mobileCloseText === '✕', `${label}: leftover mobile-close stays leftover ✕`);
  ok(tab.mbCartType === null || tab.mbCartType === '',
    `${label}: leftover 4-item bar Carrinho stays without invented type=button`);
  ok(tab.floatCartType === null || tab.floatCartType === '',
    `${label}: leftover float-cart stays without invented type=button`);
  ok(tab.floatLegumesType === null || tab.floatLegumesType === '',
    `${label}: leftover float-legumes stays without invented type=button`);
  ok(tab.scrollTopType === null || tab.scrollTopType === '',
    `${label}: leftover scroll-top stays without invented type=button`);
  ok(tab.cabazCloseType === null || tab.cabazCloseType === '',
    `${label}: leftover cabaz-modal-close stays without invented type=button`);
  ok(tab.shopLinkType === null || tab.shopLinkType === '',
    `${label}: leftover shop-link stays without invented type=button`);
  ok(tab.catQuickType === null || tab.catQuickType === '',
    `${label}: leftover cat-quick-btn stays without invented type=button`);
  ok(tab.orderWaType === 'submit', `${label}: leftover order WhatsApp stays leftover type=submit`);
  ok(/Encomendar por WhatsApp/i.test(tab.orderWaText),
    `${label}: leftover Encomendar por WhatsApp copy stays`);
  ok(/Continuar a comprar/i.test(tab.btnContinuarText),
    `${label}: leftover Continuar a comprar copy stays`);
  ok(/Hora de levantamento/i.test(tab.toggleText),
    `${label}: leftover Hora de levantamento copy stays`);
  ok(/ou encomende por email/i.test(tab.btnEmText),
    `${label}: leftover ou encomende por email copy stays`);
  ok(tab.privacyWa === 'https://wa.me/351932699850',
    `${label}: leftover privacy WhatsApp stays (got "${tab.privacyWa}")`);
  ok(tab.barWa === 'https://wa.me/351932699850',
    `${label}: leftover bar WhatsApp stays (got "${tab.barWa}")`);
  ok(tab.bar.some(t => /Carrinho/i.test(t) || /€/.test(t)),
    `${label}: 4-item bar still lists leftover Carrinho or leftover running total (got ${tab.bar.join(' | ')})`);
  ok(tab.bar.some(t => /Promoções/i.test(t)), `${label}: 4-item bar still lists Promoções`);
  ok(tab.bar.some(t => /WhatsApp/i.test(t)), `${label}: 4-item bar still lists WhatsApp`);
  ok(tab.bar.some(t => /Como Chegar/i.test(t)), `${label}: 4-item bar still lists Como Chegar`);
  ok(tab.bar.length === 4, `${label}: leftover 4-item bar stays (got ${tab.bar.length})`);
  ok(tab.menuOpen === false, `${label}: leftover mobile-menu stays leftover closed`);
}

function leftoverPhoneTap(tab, label) {
  leftoverCopy(tab, label);
  ok(tab.height >= 44,
    `${label}: leftover Frutas should be leftover ≥44px (got ${tab.height})`);
  ok(tab.legumesHeight >= 44,
    `${label}: leftover Legumes should be leftover ≥44px (got ${tab.legumesHeight})`);
  ok(parseFloat(tab.minHeight) >= 44,
    `${label}: leftover Frutas min-height should be leftover 44px (got ${tab.minHeight})`);
  ok(parseFloat(tab.legumesMinHeight) >= 44,
    `${label}: leftover Legumes min-height should be leftover 44px (got ${tab.legumesMinHeight})`);
  ok(tab.boxSizing === 'border-box', `${label}: leftover cat-tab box-sizing is leftover border-box`);
  ok(!tab.btnContinuarMinHeight || tab.btnContinuarMinHeight === '0px' || tab.btnContinuarMinHeight === 'auto' || parseFloat(tab.btnContinuarMinHeight) < 44,
    `${label}: should not redo leftover Continuar a comprar 44px tap (min-height=${tab.btnContinuarMinHeight})`);
  ok(!tab.btnEmMinHeight || tab.btnEmMinHeight === '0px' || tab.btnEmMinHeight === 'auto' || parseFloat(tab.btnEmMinHeight) < 44,
    `${label}: should not redo leftover checkout email 44px tap (min-height=${tab.btnEmMinHeight})`);
  ok(!tab.toggleMinHeight || tab.toggleMinHeight === '0px' || tab.toggleMinHeight === 'auto' || parseFloat(tab.toggleMinHeight) < 44,
    `${label}: should not redo leftover Hora de levantamento 44px tap (min-height=${tab.toggleMinHeight})`);
  ok(!tab.searchClearMinHeight || tab.searchClearMinHeight === '0px' || tab.searchClearMinHeight === 'auto' || parseFloat(tab.searchClearMinHeight) < 44,
    `${label}: should not redo leftover catalog search-clear 44px tap (min-height=${tab.searchClearMinHeight})`);
  ok(!tab.sortMinHeight || tab.sortMinHeight === '0px' || tab.sortMinHeight === 'auto' || parseFloat(tab.sortMinHeight) < 44,
    `${label}: should not redo leftover catalog sort 44px tap (min-height=${tab.sortMinHeight})`);
  ok(!tab.linkBtnMinHeight || tab.linkBtnMinHeight === '0px' || tab.linkBtnMinHeight === 'auto' || parseFloat(tab.linkBtnMinHeight) < 44,
    `${label}: should not redo leftover no-results Limpar filtros 44px tap (min-height=${tab.linkBtnMinHeight})`);
  ok(!tab.pageBtnMinHeight || tab.pageBtnMinHeight === '0px' || tab.pageBtnMinHeight === 'auto' || parseFloat(tab.pageBtnMinHeight) < 44,
    `${label}: should not redo leftover catalog pagination 44px tap (min-height=${tab.pageBtnMinHeight})`);
  ok(!tab.tagMinHeight || tab.tagMinHeight === '0px' || tab.tagMinHeight === 'auto' || parseFloat(tab.tagMinHeight) < 44,
    `${label}: should not redo leftover individual filter-tag 44px tap (min-height=${tab.tagMinHeight})`);
  ok(!tab.clearAllMinHeight || tab.clearAllMinHeight === '0px' || tab.clearAllMinHeight === 'auto' || parseFloat(tab.clearAllMinHeight) < 44,
    `${label}: should not redo leftover filter-tag Limpar tudo 44px tap (min-height=${tab.clearAllMinHeight})`);
  ok(!tab.filterChipMinHeight || tab.filterChipMinHeight === '0px' || tab.filterChipMinHeight === 'auto' || parseFloat(tab.filterChipMinHeight) < 44,
    `${label}: should not redo leftover filter-chip 44px tap (min-height=${tab.filterChipMinHeight}, height=${tab.filterChipHeight})`);
  ok(!tab.subcatChipMinHeight || tab.subcatChipMinHeight === '0px' || tab.subcatChipMinHeight === 'auto' || parseFloat(tab.subcatChipMinHeight) < 44,
    `${label}: should not redo leftover subcat-chip 44px tap (min-height=${tab.subcatChipMinHeight}, height=${tab.subcatChipHeight})`);
}

function leftoverDesktopHug(tab, label) {
  leftoverCopy(tab, label);
  ok(tab.height < 44,
    `${label}: leftover Frutas should hug leftover labels, not force 44px (got ${tab.height})`);
  ok(tab.legumesHeight < 44,
    `${label}: leftover Legumes should hug leftover labels, not force 44px (got ${tab.legumesHeight})`);
  ok(tab.minHeight === '0px' || tab.minHeight === 'auto' || parseFloat(tab.minHeight) < 44,
    `${label}: leftover desktop min-height should stay leftover unforced (got ${tab.minHeight})`);
}

async function clickCatTab(page, label) {
  const after = await page.evaluate(() => {
    if (window.toggleFiltros) {
      const sb = document.getElementById('shop-sidebar');
      if (sb && !sb.classList.contains('open') && window.matchMedia('(max-width:900px)').matches) {
        window.toggleFiltros();
      }
    }
    const legumes = document.getElementById('tab-legumes');
    if (!legumes) return { ok: false, reason: 'missing' };
    const src = typeof window.mostrarCategoria === 'function' ? window.mostrarCategoria.toString() : '';
    legumes.click();
    const frutasAfter = document.getElementById('tab-frutas');
    const legumesAfter = document.getElementById('tab-legumes');
    const privacyWa = document.querySelector('.privacy-box a[href^="https://wa.me"]');
    const barWa = document.querySelector('.mobile-bar a[href^="https://wa.me"]');
    const line = [...document.querySelectorAll('.order-item')]
      .find(li => /Melancia 1\/4/i.test(li.textContent || ''));
    const card = [...document.querySelectorAll('.shop-main .product-card')]
      .find(c => /Melancia 1\/4/i.test(c.textContent || ''));
    const banana = [...document.querySelectorAll('.shop-main .product-card')]
      .find(c => /Banana Del Monte/i.test(c.textContent || ''));
    const carrot = [...document.querySelectorAll('.shop-main .product-card')]
      .find(c => /Cenoura/i.test(c.textContent || ''));
    const potato = [...document.querySelectorAll('.shop-main .product-card')]
      .find(c => /Batata Agria/i.test(c.textContent || ''));
    return {
      ok: true,
      src,
      selected: legumesAfter?.getAttribute('aria-selected') || '',
      active: legumesAfter?.classList.contains('active') === true,
      frutasSelected: frutasAfter?.getAttribute('aria-selected') || '',
      frutasActive: frutasAfter?.classList.contains('active') === true,
      text: (legumesAfter?.textContent || '').replace(/\s+/g, ' ').trim(),
      type: legumesAfter?.getAttribute('type') || '',
      onclick: legumesAfter?.getAttribute('onclick') || '',
      menuOpen: document.getElementById('mobile-menu')?.classList.contains('open') === true,
      waHref: privacyWa?.getAttribute('href') || '',
      barWaHref: barWa?.getAttribute('href') || '',
      pageUrl: window.location.pathname,
      cartCount: document.getElementById('cart-count')?.textContent || '',
      line: (line?.textContent || '').replace(/\s+/g, ' ').trim(),
      card: !!card,
      banana: !!banana,
      carrot: !!carrot,
      potato: !!potato,
    };
  });
  ok(after.ok, `${label}: leftover cat-tab click should work`);
  ok(after.selected === 'true', `${label}: leftover Legumes leftover aria-selected=true after leftover click`);
  ok(after.active === true, `${label}: leftover Legumes leftover active after leftover click`);
  ok(after.frutasSelected === 'false' && after.frutasActive === false,
    `${label}: leftover Frutas leftover clears after leftover Legumes`);
  ok(/^Legumes/i.test(after.text), `${label}: leftover Legumes copy stays after leftover click (got "${after.text}")`);
  ok(after.type === 'button', `${label}: leftover cat-tab stays leftover type=button after leftover click`);
  ok(after.onclick === "mostrarCategoria('legumes',this)",
    `${label}: leftover mostrarCategoria('legumes',this) stays after leftover click`);
  ok(after.menuOpen === false, `${label}: leftover mobile-menu stays leftover closed after leftover click`);
  ok(after.waHref === 'https://wa.me/351932699850',
    `${label}: leftover privacy WhatsApp stays after leftover click (got "${after.waHref}")`);
  ok(after.barWaHref === 'https://wa.me/351932699850',
    `${label}: leftover bar WhatsApp stays after leftover click (got "${after.barWaHref}")`);
  ok(typeof after.src === 'string' && after.src.includes('aplicarCatalogo'),
    `${label}: leftover cat-tab still leftover applies leftover catalog`);
  ok(after.cartCount === '1' && /Melancia 1\/4/i.test(after.line),
    `${label}: leftover Melancia 1/4 stays after leftover cat-tab (got "${after.cartCount}" / "${after.line}")`);
  ok(after.card === false, `${label}: leftover Legumes leftover hides leftover Melancia 1/4`);
  ok(after.banana === false, `${label}: leftover Legumes leftover hides leftover Banana Del Monte`);
  ok(after.carrot || after.potato, `${label}: leftover Legumes leftover lists leftover Cenoura or leftover Batata Agria`);
  ok(after.pageUrl === '/' || after.pageUrl === '/index.html' || after.pageUrl === '',
    `${label}: leftover cat-tab click should not leave leftover homepage (got "${after.pageUrl}")`);

  const restored = await page.evaluate(() => {
    if (window.toggleFiltros) {
      const sb = document.getElementById('shop-sidebar');
      if (sb && !sb.classList.contains('open') && window.matchMedia('(max-width:900px)').matches) {
        window.toggleFiltros();
      }
    }
    const frutas = document.getElementById('tab-frutas');
    if (frutas) frutas.click();
    const frutasAfter = document.getElementById('tab-frutas');
    const legumesAfter = document.getElementById('tab-legumes');
    const card = [...document.querySelectorAll('.shop-main .product-card')]
      .find(c => /Melancia 1\/4/i.test(c.textContent || ''));
    const banana = [...document.querySelectorAll('.shop-main .product-card')]
      .find(c => /Banana Del Monte/i.test(c.textContent || ''));
    const line = [...document.querySelectorAll('.order-item')]
      .find(li => /Melancia 1\/4/i.test(li.textContent || ''));
    return {
      selected: frutasAfter?.getAttribute('aria-selected') || '',
      active: frutasAfter?.classList.contains('active') === true,
      legumesSelected: legumesAfter?.getAttribute('aria-selected') || '',
      card: !!card,
      banana: !!banana,
      cartCount: document.getElementById('cart-count')?.textContent || '',
      line: (line?.textContent || '').replace(/\s+/g, ' ').trim(),
    };
  });
  ok(restored.selected === 'true' && restored.active === true,
    `${label}: leftover Frutas leftover restores after leftover second click`);
  ok(restored.legumesSelected === 'false',
    `${label}: leftover Legumes leftover clears after leftover Frutas`);
  ok(restored.card, `${label}: leftover Melancia 1/4 leftover listed after leftover Frutas`);
  ok(restored.banana, `${label}: leftover Banana Del Monte leftover listed after leftover Frutas`);
  ok(restored.cartCount === '1' && /Melancia 1\/4/i.test(restored.line),
    `${label}: leftover Melancia 1/4 leftover cart stays after leftover Frutas`);
}

try {
  const mobile = await browser.newPage();
  mobile.on('pageerror', err => errors.push('390 pageerror: ' + err.message));
  await openReady(mobile, 390, 844);
  leftoverPhoneTap(await measureCatTab(mobile, 390), '390 homepage');
  await addMelancia(mobile, '390 before leftover cat-tab');
  leftoverPhoneTap(await measureCatTab(mobile, 390), '390 homepage after leftover add');
  await clickCatTab(mobile, '390 homepage');

  const midPhone = await browser.newPage();
  midPhone.on('pageerror', err => errors.push('640 pageerror: ' + err.message));
  await openReady(midPhone, 640, 900);
  leftoverPhoneTap(await measureCatTab(midPhone, 640), '640 homepage');
  await addMelancia(midPhone, '640 before leftover cat-tab');
  leftoverPhoneTap(await measureCatTab(midPhone, 640), '640 homepage after leftover add');
  await clickCatTab(midPhone, '640 homepage');

  const tablet = await browser.newPage();
  tablet.on('pageerror', err => errors.push('900 pageerror: ' + err.message));
  await openReady(tablet, 900, 800);
  leftoverDesktopHug(await measureCatTab(tablet, 900), '900 homepage');

  const wide = await browser.newPage();
  wide.on('pageerror', err => errors.push('1280 pageerror: ' + err.message));
  await openReady(wide, 1280, 800);
  leftoverDesktopHug(await measureCatTab(wide, 1280), '1280 homepage');
  await addMelancia(wide, '1280 before leftover cat-tab');
  leftoverDesktopHug(await measureCatTab(wide, 1280), '1280 homepage after leftover add');
  await clickCatTab(wide, '1280 homepage');

  const catPage = await browser.newPage();
  catPage.on('pageerror', err => errors.push('390 Frutas pageerror: ' + err.message));
  await catPage.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true });
  await catPage.goto(`${base}categorias/frutas/`, { waitUntil: 'networkidle0', timeout: 60000 });
  const cat = await catPage.evaluate(() => {
    const nav = [...document.querySelectorAll('.seo-nav a')].map(a => (a.textContent || '').trim());
    return {
      nav,
      hasTab: !!document.querySelector('.cat-tab'),
      hasTabs: !!document.getElementById('cat-tabs'),
      verText: (document.querySelector('.seo-text-link')?.textContent || '').trim(),
    };
  });
  ok(cat.nav.join('|') === 'Início|Frutas|Legumes|Promoções',
    `390 Frutas: wrapping nav stays leftover Início / Frutas / Legumes / Promoções (got ${cat.nav.join(' / ')})`);
  ok(!cat.hasTab, '390 Frutas: catalog pages still have leftover no cat-tab');
  ok(!cat.hasTabs, '390 Frutas: catalog pages still have leftover no cat-tabs');
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
      hasTab: !!document.querySelector('.cat-tab'),
      hasTabs: !!document.getElementById('cat-tabs'),
    };
  });
  ok(prod.orderText === 'Ver no catálogo e encomendar',
    `390 Melancia: leftover Ver no catálogo e encomendar stays (got "${prod.orderText}")`);
  ok(prod.orderHref === '/?produto=melancia-1-4#produtos',
    `390 Melancia: leftover catalog href stays (got "${prod.orderHref}")`);
  ok(!prod.hasTab, '390 Melancia: catalog pages still have leftover no cat-tab');
  ok(!prod.hasTabs, '390 Melancia: catalog pages still have leftover no cat-tabs');

  await browser.close();
  server.close();
  if (errors.length) {
    console.error('check-cat-tab-tap-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
    process.exit(1);
  }
  console.log('check-cat-tab-tap-browser: ok');
} catch (err) {
  try { await browser.close(); } catch {}
  try { server.close(); } catch {}
  console.error(err);
  process.exit(1);
}
