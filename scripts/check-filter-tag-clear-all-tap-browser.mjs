#!/usr/bin/env node
/** Chrome: leftover filter-tag Limpar tudo is a 44px tap target on phones. */
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
const QUERY = 'melancia';

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

async function revealClearAll(page) {
  return page.evaluate((query) => {
    if (window.mostrarCategoria) window.mostrarCategoria('frutas', document.getElementById('tab-frutas'));
    const input = document.getElementById('search-input');
    const box = document.getElementById('active-filters');
    if (!input || !box) return { ok: false, reason: 'missing' };
    input.value = query;
    if (typeof window.pesquisar === 'function') window.pesquisar();
    const btn = box.querySelector('.filter-tag.clear-all');
    return {
      ok: !!btn,
      value: input.value,
      hidden: box.hidden,
      text: (btn?.textContent || '').replace(/\s+/g, ' ').trim(),
    };
  }, QUERY);
}

async function measureClearAll(page) {
  await revealClearAll(page);
  return page.evaluate(() => {
    const box = document.getElementById('active-filters');
    const btn = box ? box.querySelector('.filter-tag.clear-all') : null;
    const tag = box ? box.querySelector('.filter-tag:not(.clear-all)') : null;
    const boxRect = btn ? btn.getBoundingClientRect() : { width: 0, height: 0 };
    const style = btn ? getComputedStyle(btn) : null;
    const tagRect = tag ? tag.getBoundingClientRect() : { width: 0, height: 0 };
    const tagStyle = tag ? getComputedStyle(tag) : null;
    const input = document.getElementById('search-input');
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
    const orderRemove = document.querySelector('.order-remove');
    const oiMinus = document.querySelector('.oi-stepper button');
    const qty = document.querySelector('.shop-main .qty-btn');
    const add = document.querySelector('.shop-main .add-btn');
    const productQty = document.querySelector('.product-modal-qty button');
    const searchClear = document.querySelector('.shop-main .search-clear');
    const sort = document.getElementById('price-sort');
    const linkBtn = document.querySelector('.no-results .link-btn');
    const pageBtn = document.querySelector('.catalog-pagination button');
    const chip = document.querySelector('.filter-chip');
    const subcat = document.querySelector('.subcat-chip');
    const privacyWa = document.querySelector('.privacy-box a[href^="https://wa.me"]');
    const privacyMail = document.querySelector('.privacy-box a[href^="mailto:"]');
    const barWa = document.querySelector('.mobile-bar a[href^="https://wa.me"]');
    const bar = [...document.querySelectorAll('.mb-item')].map(el =>
      (el.textContent || '').replace(/\s+/g, ' ').trim()
    );
    return {
      found: !!btn,
      tag: btn?.tagName || '',
      type: btn?.getAttribute('type') || '',
      onclick: btn?.getAttribute('onclick') || '',
      text: (btn?.textContent || '').replace(/\s+/g, ' ').trim(),
      boxHidden: box ? box.hidden : true,
      boxLabel: box?.getAttribute('aria-label') || '',
      tagText: (tag?.textContent || '').replace(/\s+/g, ' ').trim(),
      tagHeight: tagRect.height,
      tagMinHeight: tagStyle?.minHeight || '',
      display: style?.display || '',
      align: style?.alignItems || '',
      width: boxRect.width,
      height: boxRect.height,
      minHeight: style?.minHeight || '',
      minWidth: style?.minWidth || '',
      boxSizing: style?.boxSizing || '',
      query: input?.value || '',
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
      btnContinuarHeight: btnContinuar ? btnContinuar.getBoundingClientRect().height : 0,
      btnContinuarMinHeight: btnContinuar ? getComputedStyle(btnContinuar).minHeight : '',
      toggleText: (toggle?.textContent || '').replace(/\s+/g, ' ').trim(),
      toggleHeight: toggle ? toggle.getBoundingClientRect().height : 0,
      toggleMinHeight: toggle ? getComputedStyle(toggle).minHeight : '',
      btnEmText: (btnEm?.textContent || '').replace(/\s+/g, ' ').trim(),
      btnEmHeight: btnEm ? btnEm.getBoundingClientRect().height : 0,
      btnEmMinHeight: btnEm ? getComputedStyle(btnEm).minHeight : '',
      removeHeight: orderRemove ? orderRemove.getBoundingClientRect().height : 0,
      oiHeight: oiMinus ? oiMinus.getBoundingClientRect().height : 0,
      qtyHeight: qty ? qty.getBoundingClientRect().height : 0,
      addHeight: add ? add.getBoundingClientRect().height : 0,
      productQtyHeight: productQty ? productQty.getBoundingClientRect().height : 0,
      searchClearHeight: searchClear ? searchClear.getBoundingClientRect().height : 0,
      searchClearMinHeight: searchClear ? getComputedStyle(searchClear).minHeight : '',
      searchClearType: searchClear?.getAttribute('type') || '',
      sortHeight: sort ? sort.getBoundingClientRect().height : 0,
      sortMinHeight: sort ? getComputedStyle(sort).minHeight : '',
      linkBtnHeight: linkBtn ? linkBtn.getBoundingClientRect().height : 0,
      linkBtnMinHeight: linkBtn ? getComputedStyle(linkBtn).minHeight : '',
      pageBtnHeight: pageBtn ? pageBtn.getBoundingClientRect().height : 0,
      pageBtnMinHeight: pageBtn ? getComputedStyle(pageBtn).minHeight : '',
      chipHeight: chip ? chip.getBoundingClientRect().height : 0,
      chipMinHeight: chip ? getComputedStyle(chip).minHeight : '',
      subcatHeight: subcat ? subcat.getBoundingClientRect().height : 0,
      subcatMinHeight: subcat ? getComputedStyle(subcat).minHeight : '',
      menuOpen: document.getElementById('mobile-menu')?.classList.contains('open') === true,
      waHref: privacyWa?.getAttribute('href') || '',
      privacyMailHref: privacyMail?.getAttribute('href') || '',
      barWaHref: barWa?.getAttribute('href') || '',
      bar,
    };
  });
}

function leftoverCopy(phone, label) {
  ok(phone.found, `${label}: leftover Limpar tudo should be leftover present`);
  ok(phone.tag === 'BUTTON', `${label}: leftover Limpar tudo stays leftover button`);
  ok(phone.type === 'button', `${label}: leftover Limpar tudo stays leftover type=button`);
  ok(phone.onclick === 'limparTudo()',
    `${label}: leftover Limpar tudo keeps leftover limparTudo() (got "${phone.onclick}")`);
  ok(phone.text === 'Limpar tudo',
    `${label}: leftover Limpar tudo stays (got "${phone.text}")`);
  ok(phone.boxHidden === false,
    `${label}: leftover active-filters should be leftover visible after leftover query`);
  ok(phone.boxLabel === 'Filtros ativos',
    `${label}: leftover Filtros ativos stays (got "${phone.boxLabel}")`);
  ok(/melancia/i.test(phone.tagText),
    `${label}: leftover busca filter-tag stays leftover “melancia” (got "${phone.tagText}")`);
  ok(phone.query === QUERY, `${label}: leftover query stays leftover ${QUERY} (got "${phone.query}")`);
  ok(phone.display === 'flex' || phone.display === 'inline-flex',
    `${label}: leftover Limpar tudo should stay leftover flex / inline-flex (got ${phone.display})`);
  ok(phone.hamburgerType === '' || phone.hamburgerType === null,
    `${label}: leftover hamburger should stay without invented type=button`);
  ok(phone.hamburgerLabel === 'Menu', `${label}: leftover hamburger Menu stays`);
  ok(phone.hamburgerExpanded === null,
    `${label}: leftover hamburger should stay without invented aria-expanded`);
  ok(phone.navOrderType === '' || phone.navOrderType === null,
    `${label}: leftover header Encomendar should stay without invented type=button`);
  ok(phone.mobileCloseType === '' || phone.mobileCloseType === null,
    `${label}: leftover mobile-close should stay without invented type=button`);
  ok(phone.mobileCloseText === '✕', `${label}: leftover mobile-close ✕ stays`);
  ok(!phone.mobileCloseLabel, `${label}: leftover mobile-close should stay without invented accessible name`);
  ok(phone.mbCartType === '' || phone.mbCartType === null,
    `${label}: leftover 4-item bar Carrinho should stay without invented type=button`);
  ok(phone.floatCartType === '' || phone.floatCartType === null,
    `${label}: leftover float-cart should stay without invented type=button`);
  ok(phone.floatLegumesType === '' || phone.floatLegumesType === null,
    `${label}: leftover float-legumes should stay without invented type=button`);
  ok(phone.scrollTopType === '' || phone.scrollTopType === null,
    `${label}: leftover scroll-top should stay without invented type=button`);
  ok(phone.cabazCloseType === '' || phone.cabazCloseType === null,
    `${label}: leftover cabaz-modal-close should stay without invented type=button`);
  ok(phone.cabazAddType === '' || phone.cabazAddType === null,
    `${label}: leftover cabaz-modal-add should stay without invented type=button`);
  ok(phone.cabazVerType === '' || phone.cabazVerType === null,
    `${label}: leftover cabaz-ver should stay without invented type=button`);
  ok(phone.shopLinkType === '' || phone.shopLinkType === null,
    `${label}: leftover shop-link should stay without invented type=button`);
  ok(phone.catQuickType === '' || phone.catQuickType === null,
    `${label}: leftover cat-quick-btn should stay without invented type=button`);
  ok(phone.searchClearType === '' || phone.searchClearType === null,
    `${label}: leftover catalog search-clear should stay without invented type=button`);
  ok(phone.orderWaType === 'submit', `${label}: leftover order WhatsApp stays leftover type=submit`);
  ok(/Encomendar por WhatsApp/i.test(phone.orderWaText),
    `${label}: leftover Encomendar por WhatsApp stays (got "${phone.orderWaText}")`);
  ok(phone.btnContinuarText.includes('Continuar a comprar'),
    `${label}: leftover Continuar a comprar stays (got "${phone.btnContinuarText}")`);
  ok(/Hora de levantamento/i.test(phone.toggleText),
    `${label}: leftover Hora de levantamento stays (got "${phone.toggleText}")`);
  ok(/encomende por email/i.test(phone.btnEmText),
    `${label}: leftover ou encomende por email stays (got "${phone.btnEmText}")`);
  ok(phone.bar.some(t => /Carrinho/i.test(t) || /€/.test(t)),
    `${label}: leftover 4-item bar still lists Carrinho`);
  ok(phone.bar.some(t => /Promoções/i.test(t)), `${label}: leftover 4-item bar still lists Promoções`);
  ok(phone.bar.some(t => /WhatsApp/i.test(t)), `${label}: leftover 4-item bar still lists WhatsApp`);
  ok(phone.bar.some(t => /Como Chegar/i.test(t)), `${label}: leftover 4-item bar still lists Como Chegar`);
  ok(phone.bar.length === 4, `${label}: leftover 4-item bar stays (got ${phone.bar.length})`);
  ok(phone.waHref === 'https://wa.me/351932699850',
    `${label}: leftover privacy WhatsApp stays wa.me/351932699850 (got "${phone.waHref}")`);
  ok(phone.privacyMailHref === 'mailto:shahhossain87@gmail.com',
    `${label}: leftover privacy email stays mailto:shahhossain87@gmail.com (got "${phone.privacyMailHref}")`);
  ok(phone.barWaHref === 'https://wa.me/351932699850',
    `${label}: leftover bar WhatsApp stays wa.me/351932699850 (got "${phone.barWaHref}")`);
  ok(phone.menuOpen === false, `${label}: leftover mobile-menu stays leftover closed`);
}

function leftoverPhoneTap(phone, label) {
  leftoverCopy(phone, label);
  ok(phone.height >= 44,
    `${label}: leftover Limpar tudo tap height >= 44px (got ${phone.width}×${phone.height})`);
  ok(parseFloat(phone.minHeight) >= 44,
    `${label}: leftover Limpar tudo min-height >= 44px (got ${phone.minHeight})`);
  ok(phone.boxSizing === 'border-box',
    `${label}: leftover Limpar tudo should keep leftover border-box (got "${phone.boxSizing}")`);
  ok(phone.width > 40 && phone.width < 280,
    `${label}: leftover Limpar tudo should hug leftover labels (got width ${phone.width})`);
  ok(!phone.btnEmMinHeight || phone.btnEmMinHeight === '0px' || phone.btnEmMinHeight === 'auto' || parseFloat(phone.btnEmMinHeight) < 44,
    `${label}: should not redo leftover checkout email 44px tap (min-height=${phone.btnEmMinHeight}, height=${phone.btnEmHeight})`);
  ok(!phone.btnContinuarMinHeight || phone.btnContinuarMinHeight === '0px' || phone.btnContinuarMinHeight === 'auto' || parseFloat(phone.btnContinuarMinHeight) < 44,
    `${label}: should not redo leftover checkout Continuar a comprar 44px tap (min-height=${phone.btnContinuarMinHeight}, height=${phone.btnContinuarHeight})`);
  ok(!phone.removeHeight || phone.removeHeight < 40,
    `${label}: should not redo leftover checkout × Remover 44px tap (got ${phone.removeHeight})`);
  ok(!phone.oiHeight || phone.oiHeight < 40,
    `${label}: should not redo leftover checkout qty 44px tap (got ${phone.oiHeight})`);
  ok(!phone.qtyHeight || phone.qtyHeight < 40,
    `${label}: should not redo leftover catalog qty 44px tap (got ${phone.qtyHeight})`);
  ok(!phone.addHeight || phone.addHeight < 50,
    `${label}: should not redo leftover catalog Adicionar 44px tap (got ${phone.addHeight})`);
  ok(!phone.productQtyHeight || phone.productQtyHeight < 40,
    `${label}: should not redo leftover product-modal qty 44px tap (got ${phone.productQtyHeight})`);
  ok(!phone.toggleMinHeight || phone.toggleMinHeight === '0px' || phone.toggleMinHeight === 'auto' || parseFloat(phone.toggleMinHeight) < 44,
    `${label}: should not redo leftover checkout Hora de levantamento 44px tap (min-height=${phone.toggleMinHeight}, height=${phone.toggleHeight})`);
  ok(!phone.searchClearMinHeight || phone.searchClearMinHeight === '0px' || phone.searchClearMinHeight === 'auto' || parseFloat(phone.searchClearMinHeight) < 44,
    `${label}: should not redo leftover catalog search-clear 44px tap (min-height=${phone.searchClearMinHeight}, height=${phone.searchClearHeight})`);
  ok(!phone.sortMinHeight || phone.sortMinHeight === '0px' || phone.sortMinHeight === 'auto' || parseFloat(phone.sortMinHeight) < 44,
    `${label}: should not redo leftover catalog sort 44px tap (min-height=${phone.sortMinHeight}, height=${phone.sortHeight})`);
  ok(!phone.linkBtnMinHeight || phone.linkBtnMinHeight === '0px' || phone.linkBtnMinHeight === 'auto' || parseFloat(phone.linkBtnMinHeight) < 44,
    `${label}: should not redo leftover no-results Limpar filtros 44px tap (min-height=${phone.linkBtnMinHeight}, height=${phone.linkBtnHeight})`);
  ok(!phone.pageBtnMinHeight || phone.pageBtnMinHeight === '0px' || phone.pageBtnMinHeight === 'auto' || parseFloat(phone.pageBtnMinHeight) < 44,
    `${label}: should not redo leftover catalog pagination 44px tap (min-height=${phone.pageBtnMinHeight}, height=${phone.pageBtnHeight})`);
  ok(!phone.chipMinHeight || phone.chipMinHeight === '0px' || phone.chipMinHeight === 'auto' || parseFloat(phone.chipMinHeight) < 44,
    `${label}: should not invent leftover filter-chip 44px tap (min-height=${phone.chipMinHeight}, height=${phone.chipHeight})`);
  ok(!phone.subcatMinHeight || phone.subcatMinHeight === '0px' || phone.subcatMinHeight === 'auto' || parseFloat(phone.subcatMinHeight) < 44,
    `${label}: should not invent leftover subcat-chip 44px tap (min-height=${phone.subcatMinHeight}, height=${phone.subcatHeight})`);
  ok(!phone.tagMinHeight || phone.tagMinHeight === '0px' || phone.tagMinHeight === 'auto' || parseFloat(phone.tagMinHeight) < 44,
    `${label}: should not invent leftover individual filter-tag 44px tap (min-height=${phone.tagMinHeight}, height=${phone.tagHeight})`);
}

function leftoverDesktopHug(phone, label) {
  leftoverCopy(phone, label);
  ok(phone.height < 44,
    `${label}: leftover Limpar tudo should hug leftover labels, not force 44px (got ${phone.height})`);
  ok(phone.minHeight === '0px' || phone.minHeight === 'auto' || parseFloat(phone.minHeight) < 44,
    `${label}: leftover desktop min-height should stay leftover unforced (got ${phone.minHeight})`);
}

async function clickClearAll(page, label) {
  const after = await page.evaluate(() => {
    const box = document.getElementById('active-filters');
    const btn = box ? box.querySelector('.filter-tag.clear-all') : null;
    if (!btn) return { ok: false, reason: 'missing' };
    const src = typeof window.limparTudo === 'function' ? window.limparTudo.toString() : '';
    btn.click();
    const privacyWa = document.querySelector('.privacy-box a[href^="https://wa.me"]');
    const barWa = document.querySelector('.mobile-bar a[href^="https://wa.me"]');
    const line = [...document.querySelectorAll('.order-item')]
      .find(li => /Melancia 1\/4/i.test(li.textContent || ''));
    const card = [...document.querySelectorAll('.shop-main .product-card')]
      .find(c => /Melancia 1\/4/i.test(c.textContent || ''));
    const input = document.getElementById('search-input');
    const clear = document.getElementById('search-clear');
    const still = box.querySelector('.filter-tag.clear-all');
    return {
      ok: true,
      src,
      query: input?.value || '',
      boxHidden: box.hidden,
      stillPresent: !!still,
      text: (btn.textContent || '').replace(/\s+/g, ' ').trim(),
      type: btn.getAttribute('type') || '',
      onclick: btn.getAttribute('onclick') || '',
      clearVisible: clear?.classList.contains('visible') === true,
      menuOpen: document.getElementById('mobile-menu')?.classList.contains('open') === true,
      waHref: privacyWa?.getAttribute('href') || '',
      barWaHref: barWa?.getAttribute('href') || '',
      pageUrl: window.location.pathname,
      cartCount: document.getElementById('cart-count')?.textContent || '',
      line: (line?.textContent || '').replace(/\s+/g, ' ').trim(),
      card: !!card,
    };
  });
  ok(after.ok, `${label}: leftover Limpar tudo click should work`);
  ok(after.query === '', `${label}: leftover Limpar tudo still leftover clears leftover search (got "${after.query}")`);
  ok(after.boxHidden === true,
    `${label}: leftover active-filters hides after leftover click`);
  ok(after.stillPresent === false, `${label}: leftover Limpar tudo hides after leftover click`);
  ok(after.text === 'Limpar tudo', `${label}: leftover Limpar tudo stays after leftover click (got "${after.text}")`);
  ok(after.type === 'button', `${label}: leftover Limpar tudo stays leftover type=button after leftover click`);
  ok(after.onclick === 'limparTudo()', `${label}: leftover limparTudo() stays after leftover click`);
  ok(after.clearVisible === false, `${label}: leftover catalog search-clear hides after leftover Limpar tudo`);
  ok(after.menuOpen === false, `${label}: leftover mobile-menu stays leftover closed after leftover click`);
  ok(after.waHref === 'https://wa.me/351932699850',
    `${label}: leftover privacy WhatsApp stays after leftover click (got "${after.waHref}")`);
  ok(after.barWaHref === 'https://wa.me/351932699850',
    `${label}: leftover bar WhatsApp stays after leftover click (got "${after.barWaHref}")`);
  ok(typeof after.src === 'string' && after.src.includes('aplicarCatalogo'),
    `${label}: leftover Limpar tudo still leftover applies leftover catalog`);
  ok(after.cartCount === '1' && /Melancia 1\/4/i.test(after.line),
    `${label}: leftover Melancia 1/4 stays after leftover Limpar tudo (got "${after.cartCount}" / "${after.line}")`);
  ok(after.card, `${label}: leftover Melancia 1/4 still leftover listed after leftover Limpar tudo`);
  ok(after.pageUrl === '/' || after.pageUrl === '/index.html' || after.pageUrl === '',
    `${label}: leftover Limpar tudo click should not leave leftover homepage (got "${after.pageUrl}")`);
}

try {
  const mobile = await browser.newPage();
  mobile.on('pageerror', err => errors.push('390 pageerror: ' + err.message));
  await openReady(mobile, 390, 844);
  leftoverPhoneTap(await measureClearAll(mobile), '390 homepage');
  await addMelancia(mobile, '390 before leftover Limpar tudo');
  leftoverPhoneTap(await measureClearAll(mobile), '390 homepage after leftover add');
  await clickClearAll(mobile, '390 homepage');

  const midPhone = await browser.newPage();
  midPhone.on('pageerror', err => errors.push('640 pageerror: ' + err.message));
  await openReady(midPhone, 640, 900);
  leftoverPhoneTap(await measureClearAll(midPhone), '640 homepage');
  await addMelancia(midPhone, '640 before leftover Limpar tudo');
  leftoverPhoneTap(await measureClearAll(midPhone), '640 homepage after leftover add');
  await clickClearAll(midPhone, '640 homepage');

  const tablet = await browser.newPage();
  tablet.on('pageerror', err => errors.push('900 pageerror: ' + err.message));
  await openReady(tablet, 900, 800);
  leftoverDesktopHug(await measureClearAll(tablet), '900 homepage');

  const wide = await browser.newPage();
  wide.on('pageerror', err => errors.push('1280 pageerror: ' + err.message));
  await openReady(wide, 1280, 800);
  leftoverDesktopHug(await measureClearAll(wide), '1280 homepage');
  await addMelancia(wide, '1280 before leftover Limpar tudo');
  leftoverDesktopHug(await measureClearAll(wide), '1280 homepage after leftover add');
  await clickClearAll(wide, '1280 homepage');

  const catPage = await browser.newPage();
  catPage.on('pageerror', err => errors.push('390 Frutas pageerror: ' + err.message));
  await catPage.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true });
  await catPage.goto(`${base}categorias/frutas/`, { waitUntil: 'networkidle0', timeout: 60000 });
  const cat = await catPage.evaluate(() => {
    const nav = [...document.querySelectorAll('.seo-nav a')].map(a => (a.textContent || '').trim());
    return {
      nav,
      hasClearAll: !!document.querySelector('.filter-tag.clear-all'),
      hasActive: !!document.getElementById('active-filters'),
      verText: (document.querySelector('.seo-text-link')?.textContent || '').trim(),
    };
  });
  ok(cat.nav.join('|') === 'Início|Frutas|Legumes|Promoções',
    `390 Frutas: wrapping nav stays leftover Início / Frutas / Legumes / Promoções (got ${cat.nav.join(' / ')})`);
  ok(!cat.hasClearAll, '390 Frutas: catalog pages still have leftover no Limpar tudo');
  ok(!cat.hasActive, '390 Frutas: catalog pages still have leftover no active-filters');
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
      hasClearAll: !!document.querySelector('.filter-tag.clear-all'),
      hasActive: !!document.getElementById('active-filters'),
    };
  });
  ok(prod.orderText === 'Ver no catálogo e encomendar',
    `390 Melancia: leftover Ver no catálogo e encomendar stays (got "${prod.orderText}")`);
  ok(prod.orderHref === '/?produto=melancia-1-4#produtos',
    `390 Melancia: leftover catalog href stays (got "${prod.orderHref}")`);
  ok(!prod.hasClearAll, '390 Melancia: catalog pages still have leftover no Limpar tudo');
  ok(!prod.hasActive, '390 Melancia: catalog pages still have leftover no active-filters');

  await browser.close();
  server.close();
  if (errors.length) {
    console.error('check-filter-tag-clear-all-tap-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
    process.exit(1);
  }
  console.log('check-filter-tag-clear-all-tap-browser: ok');
} catch (err) {
  try { await browser.close(); } catch {}
  try { server.close(); } catch {}
  console.error(err);
  process.exit(1);
}
