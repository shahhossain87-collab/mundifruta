#!/usr/bin/env node
/** Chrome: leftover shop-backdrop keyboard ring; add Melancia 1/4. */
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
    const r = document.querySelector('.offer-reveal'); if (r) r.hidden = true;
  });
}

async function leftoverHomeRules(page, label) {
  const rules = await page.evaluate(() => {
    let foundBackdrop = false;
    let foundFiltbtn = false;
    let foundSidebarClose = false;
    let foundCsCard = false;
    let foundCabazVer = false;
    let foundCreditsWrap = false;
    let foundCreditsBack = false;
    let foundFooterCredit = false;
    let foundPrivacyLinks = false;
    let foundPrivacyClose = false;
    let foundPrivacyReset = false;
    let foundConsentLink = false;
    let foundGhost = false;
    let foundPrim = false;
    let foundWa = false;
    let foundEm = false;
    let foundShopLink = false;
    let foundFeatureAdd = false;
    let foundFeaturePhoto = false;
    let foundCarousel = false;
    let foundFloat = false;
    let foundOptional = false;
    let foundScroll = false;
    let foundBar = false;
    let foundFooterLinks = false;
    let foundHomeQuick = false;
    let foundCatalogAdd = false;
    let foundCabazModalAdd = false;
    let foundCabazModalClose = false;
    let foundCsSkip = false;
    let foundCsClose = false;
    for (const sheet of [...document.styleSheets]) {
      let sheetRules;
      try { sheetRules = [...sheet.cssRules]; } catch { continue; }
      for (const rule of sheetRules) {
        const text = rule.cssText || '';
        if (/\.shop-backdrop:focus-visible/.test(text) && /outline/.test(text)) foundBackdrop = true;
        if (/\.filtbtn:focus-visible/.test(text) && /outline/.test(text)) foundFiltbtn = true;
        if (/\.sidebar-close:focus-visible/.test(text) && /outline/.test(text)) foundSidebarClose = true;
        if (/\.cs-card:focus-visible/.test(text) && /outline/.test(text)) foundCsCard = true;
        if (/\.cabaz-ver:focus-visible/.test(text) && /outline/.test(text)) foundCabazVer = true;
        if (/\.credits-wrap a:focus-visible/.test(text) && /outline/.test(text)) foundCreditsWrap = true;
        if (/\.credits-back:focus-visible/.test(text) && /outline/.test(text)) foundCreditsBack = true;
        if (/\.footer-credit a:focus-visible/.test(text) && /outline/.test(text)) foundFooterCredit = true;
        if (/\.privacy-box a:focus-visible/.test(text) && /outline/.test(text)) foundPrivacyLinks = true;
        if (/\.privacy-close:focus-visible/.test(text) && /outline/.test(text)) foundPrivacyClose = true;
        if (/\.privacy-reset:focus-visible/.test(text) && /outline/.test(text)) foundPrivacyReset = true;
        if (/\.consent-link:focus-visible/.test(text) && /outline/.test(text)) foundConsentLink = true;
        if (/\.btn-ghost:focus-visible/.test(text) && /outline/.test(text)) foundGhost = true;
        if (/\.btn-prim:focus-visible/.test(text) && /outline/.test(text)) foundPrim = true;
        if (/\.btn-wa:focus-visible/.test(text) && /outline/.test(text)) foundWa = true;
        if (/\.btn-em:focus-visible/.test(text) && /outline/.test(text)) foundEm = true;
        if (/\.shop-link:focus-visible/.test(text) && /outline/.test(text)) foundShopLink = true;
        if (/\.feature-add:focus-visible/.test(text) && /outline/.test(text)) foundFeatureAdd = true;
        if (/\.feature-photo:focus-visible/.test(text) && /outline/.test(text)) foundFeaturePhoto = true;
        if (/\.carousel-nav:focus-visible/.test(text) && /outline/.test(text)) foundCarousel = true;
        if (/\.float-cart:focus-visible/.test(text) && /outline/.test(text)) foundFloat = true;
        if (/\.order-optional-toggle:focus-visible/.test(text) && /outline/.test(text)) foundOptional = true;
        if (/\.scroll-top:focus-visible/.test(text) && /outline/.test(text)) foundScroll = true;
        if (/\.mb-item:focus-visible/.test(text) && /outline/.test(text)) foundBar = true;
        if (/\.footer-links a:focus-visible/.test(text) && /outline/.test(text)) foundFooterLinks = true;
        if (/body\.homepage \.homepage-category \.cat-quick-btn:focus-visible/.test(text)) foundHomeQuick = true;
        if (/\.add-btn:focus-visible/.test(text) && /outline/.test(text)) foundCatalogAdd = true;
        if (/\.cabaz-modal-add:focus-visible/.test(text) && /outline/.test(text)) foundCabazModalAdd = true;
        if (/\.cabaz-modal-close:focus-visible/.test(text) && /outline/.test(text)) foundCabazModalClose = true;
        if (/\.cs-pop-skip:focus-visible/.test(text) && /outline/.test(text)) foundCsSkip = true;
        if (/\.cs-pop-close:focus-visible/.test(text) && /outline/.test(text)) foundCsClose = true;
      }
    }
    return {
      foundBackdrop, foundFiltbtn, foundSidebarClose, foundCsCard, foundCabazVer,
      foundCreditsWrap, foundCreditsBack, foundFooterCredit, foundPrivacyLinks,
      foundPrivacyClose, foundPrivacyReset, foundConsentLink, foundGhost, foundPrim,
      foundWa, foundEm, foundShopLink, foundFeatureAdd, foundFeaturePhoto,
      foundCarousel, foundFloat, foundOptional, foundScroll, foundBar, foundFooterLinks,
      foundHomeQuick, foundCatalogAdd, foundCabazModalAdd, foundCabazModalClose,
      foundCsSkip, foundCsClose,
    };
  });
  ok(rules.foundBackdrop, `${label}: leftover shop-backdrop :focus-visible rule is in the live stylesheet`);
  ok(rules.foundCatalogAdd, `${label}: leftover catalog Adicionar forest ring stays`);
  ok(rules.foundHomeQuick, `${label}: leftover homepage category tiles keep leftover #194 focus-visible`);
  ok(!rules.foundFiltbtn, `${label}: leftover Filtros must not get a ring in this run`);
  ok(!rules.foundSidebarClose, `${label}: leftover drawer-close must not get a ring in this run`);
  ok(!rules.foundCsCard, `${label}: leftover cs-card must not get a ring in this run`);
  ok(!rules.foundCabazVer, `${label}: leftover cabaz-ver must not get a ring in this run`);
  ok(!rules.foundCreditsWrap, `${label}: leftover credits-wrap must not get a ring in this run`);
  ok(!rules.foundCreditsBack, `${label}: leftover credits-back must not get a ring in this run`);
  ok(!rules.foundFooterCredit, `${label}: leftover footer-credit must not get a ring in this run`);
  ok(!rules.foundPrivacyLinks, `${label}: leftover privacy-dialog links must not get a ring in this run`);
  ok(!rules.foundPrivacyClose, `${label}: leftover privacy-dialog close must not get a ring in this run`);
  ok(!rules.foundPrivacyReset, `${label}: leftover privacy reset must not get a ring in this run`);
  ok(!rules.foundConsentLink, `${label}: leftover consent Saber mais must not get a ring in this run`);
  ok(!rules.foundGhost, `${label}: leftover hero ghost CTA must not get a ring in this run`);
  ok(!rules.foundPrim, `${label}: leftover primary CTA must not get a ring in this run`);
  ok(!rules.foundWa, `${label}: leftover WhatsApp CTA must not get a ring in this run`);
  ok(!rules.foundEm, `${label}: leftover email CTA must not get a ring in this run`);
  ok(!rules.foundShopLink, `${label}: leftover shop-link must not get a ring in this run`);
  ok(!rules.foundFeatureAdd, `${label}: leftover feature-add must not get a ring in this run`);
  ok(!rules.foundFeaturePhoto, `${label}: leftover feature-photo must not get a ring in this run`);
  ok(!rules.foundCarousel, `${label}: leftover carousel-nav must not get a ring in this run`);
  ok(!rules.foundFloat, `${label}: leftover float-cart must not get a ring in this run`);
  ok(!rules.foundOptional, `${label}: leftover Hora de levantamento toggle must not get a ring in this run`);
  ok(!rules.foundScroll, `${label}: leftover Voltar ao topo must not get a ring in this run`);
  ok(!rules.foundBar, `${label}: leftover 4-item bar must not get a ring in this run`);
  ok(!rules.foundFooterLinks, `${label}: leftover footer shop-links must not get a ring in this run`);
  ok(!rules.foundCabazModalAdd, `${label}: leftover cabaz-modal-add must not get a ring in this run`);
  ok(!rules.foundCabazModalClose, `${label}: leftover cabaz-modal-close must not get a ring in this run`);
  ok(!rules.foundCsSkip, `${label}: leftover Combina bem skip must not get a ring in this run`);
  ok(!rules.foundCsClose, `${label}: leftover Combina bem close must not get a ring in this run`);
}

async function leftoverBackdropRing(page, label, expectVisible) {
  const ring = await page.evaluate(async (expectVisible) => {
    const bd = document.getElementById('shop-backdrop');
    const filt = document.querySelector('.filtbtn');
    const close = document.querySelector('.sidebar-close');
    const sb = document.getElementById('shop-sidebar');
    if (!bd) return { missing: true };
    const closedHidden = bd.hidden;
    if (window.toggleFiltros) window.toggleFiltros();
    const opened = sb ? sb.classList.contains('open') : false;
    const openedHidden = bd.hidden;
    bd.scrollIntoView({ block: 'center', inline: 'nearest' });
    try { bd.focus({ preventScroll: true, focusVisible: true }); }
    catch { bd.focus({ preventScroll: true }); }
    await new Promise(r => setTimeout(r, 200));
    if (document.activeElement !== bd) {
      try { bd.focus({ preventScroll: true, focusVisible: true }); }
      catch { bd.focus({ preventScroll: true }); }
    }
    await new Promise(r => setTimeout(r, 200));
    const cs = getComputedStyle(bd);
    const display = cs.display;
    const outline = {
      outlineStyle: cs.outlineStyle,
      outlineWidth: cs.outlineWidth,
      outlineColor: cs.outlineColor,
    };
    bd.click();
    const afterHidden = bd.hidden;
    const afterOpen = sb ? sb.classList.contains('open') : false;
    return {
      missing: false,
      closedHidden,
      opened,
      openedHidden,
      afterHidden,
      afterOpen,
      display,
      active: true,
      type: bd.getAttribute('type'),
      label: bd.getAttribute('aria-label') || '',
      onclick: bd.getAttribute('onclick') || '',
      filtLabel: filt ? filt.getAttribute('aria-label') : '',
      filtText: (filt?.textContent || '').replace(/\s+/g, ' ').trim(),
      closeText: (close?.textContent || '').trim(),
      closeLabel: close ? close.getAttribute('aria-label') : '',
      ...outline,
      expectVisible,
    };
  }, expectVisible);

  ok(ring && !ring.missing, `${label}: leftover shop-backdrop is in leftover catalog`);
  ok(ring && ring.closedHidden === true, `${label}: leftover shop-backdrop starts leftover hidden`);
  if (expectVisible) {
    ok(ring && ring.opened && ring.openedHidden === false,
      `${label}: leftover Filtros still opens leftover drawer and leftover shop-backdrop`);
    const hasOutline = ring && ring.outlineStyle && ring.outlineStyle !== 'none' && parseFloat(ring.outlineWidth || '0') > 0;
    ok(hasOutline, `${label}: leftover shop-backdrop forest ring (outline=${ring?.outlineStyle}/${ring?.outlineWidth}/${ring?.outlineColor})`);
    ok(ring && /rgb\(27,\s*67,\s*50\)/.test(ring.outlineColor || ''),
      `${label}: leftover shop-backdrop ring uses leftover forest`);
    ok(ring && ring.display !== 'none', `${label}: leftover shop-backdrop is leftover visible on leftover mobile/tablet`);
  } else {
    ok(ring && ring.display === 'none', `${label}: leftover shop-backdrop stays leftover hidden on leftover desktop`);
  }
  ok(ring && ring.afterHidden === true && ring.afterOpen === false,
    `${label}: leftover shop-backdrop still closes leftover drawer`);
  ok(ring && ring.type === 'button', `${label}: leftover shop-backdrop stays type=button`);
  ok(ring && ring.label === 'Fechar filtros', `${label}: leftover shop-backdrop stays named Fechar filtros`);
  ok(ring && /toggleFiltros\(/.test(ring.onclick || ''), `${label}: leftover shop-backdrop still calls leftover toggleFiltros`);
  ok(ring && /Abrir filtros e categorias/i.test(ring.filtLabel || ''),
    `${label}: leftover Filtros stays named Abrir filtros e categorias`);
  ok(ring && /Filtros/i.test(ring.filtText || ''), `${label}: leftover Filtros label stays`);
  ok(ring && ring.closeText === '✕', `${label}: leftover drawer-close stays a visible ✕`);
  ok(ring && ring.closeLabel === 'Fechar filtros', `${label}: leftover drawer-close stays named Fechar filtros`);
}

async function leftoverStorefront(page, label) {
  const search = await page.evaluate(() => {
    const input = document.getElementById('search-input');
    if (!input || !window.pesquisar) return { ok: false };
    input.value = 'morango';
    window.pesquisar();
    const morango = [...document.querySelectorAll('.shop-main .product-card')].length;
    input.value = 'tomate';
    window.pesquisar();
    const tomate = [...document.querySelectorAll('.shop-main .product-card')].length;
    if (window.limparTudo) window.limparTudo();
    return { ok: true, morango, tomate };
  });
  ok(search.ok && search.morango > 0, `${label}: leftover search morango (${search.morango})`);
  ok(search.ok && search.tomate > 0, `${label}: leftover search tomate (${search.tomate})`);

  const added = await page.evaluate(() => {
    if (window.limparTudo) window.limparTudo();
    if (window.mostrarCategoria) window.mostrarCategoria('frutas', document.getElementById('tab-frutas'));
    const card = [...document.querySelectorAll('.shop-main .product-card')]
      .find(c => /Melancia 1\/4/i.test(c.textContent || ''));
    const btn = card ? card.querySelector('.add-btn') : null;
    if (btn) btn.click();
    const cs = document.getElementById('cs-pop');
    if (cs) cs.hidden = true;
    return { ok: !!btn, count: document.getElementById('cart-count')?.textContent || '' };
  });
  ok(added.ok && added.count === '1', `${label}: leftover Melancia 1/4 still adds (count=${added.count})`);
}

try {
  const desktop = await browser.newPage();
  desktop.on('pageerror', err => errors.push('1280 pageerror: ' + err.message));
  await openReady(desktop, 1280, 800);
  await leftoverHomeRules(desktop, '1280');
  await leftoverBackdropRing(desktop, '1280', false);
  await leftoverStorefront(desktop, '1280');

  const tablet = await browser.newPage();
  tablet.on('pageerror', err => errors.push('768 pageerror: ' + err.message));
  await openReady(tablet, 768, 1024);
  await leftoverHomeRules(tablet, '768');
  await leftoverBackdropRing(tablet, '768', true);
  await leftoverStorefront(tablet, '768');

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

  const menu = await mobile.evaluate(() => {
    const burger = document.querySelector('.hamburger');
    const close = document.querySelector('.mobile-close');
    const panel = document.getElementById('mobile-menu');
    if (window.toggleMenu) window.toggleMenu();
    const opened = panel ? getComputedStyle(panel).display !== 'none' && (panel.classList.contains('open') || getComputedStyle(panel).visibility !== 'hidden') : false;
    if (close) close.click();
    else if (window.toggleMenu) window.toggleMenu();
    const closed = panel ? !panel.classList.contains('open') : false;
    return {
      opened,
      closed,
      burgerLabel: burger ? burger.getAttribute('aria-label') : '',
      closeText: (close?.textContent || '').trim(),
    };
  });
  ok(menu.opened, '390: leftover hamburger still opens leftover menu');
  ok(menu.closed, '390: leftover ✕ still closes leftover menu');
  ok(menu.burgerLabel === 'Menu', '390: leftover hamburger stays named Menu');
  ok(menu.closeText === '✕', '390: leftover mobile-close stays a visible ✕');

  await leftoverHomeRules(mobile, '390');
  await leftoverBackdropRing(mobile, '390', true);
  await leftoverStorefront(mobile, '390');

  await browser.close();
  server.close();
  if (errors.length) {
    console.error('check-shop-backdrop-focus-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
    process.exit(1);
  }
  console.log('check-shop-backdrop-focus-browser: ok');
} catch (err) {
  try { await browser.close(); } catch {}
  try { server.close(); } catch {}
  console.error(err);
  process.exit(1);
}
