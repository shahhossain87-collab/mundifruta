#!/usr/bin/env node
/** Chrome: leftover catalog Filtros keyboard ring; leftover catalog clicks. */
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

async function leftoverHomeRules(page, label) {
  const rules = await page.evaluate(() => {
    let foundFilt = false;
    let foundClose = false;
    let foundCatalogAdd = false;
    let foundHomeQuick = false;
    let foundFloat = false;
    let foundLegumes = false;
    let foundScroll = false;
    let foundShopLink = false;
    let foundNavOrder = false;
    let foundBar = false;
    let foundCabazVer = false;
    let foundWa = false;
    let foundLogo = false;
    let foundConsentNo = false;
    let foundConsentYes = false;
    for (const sheet of [...document.styleSheets]) {
      let sheetRules;
      try { sheetRules = [...sheet.cssRules]; } catch { continue; }
      for (const rule of sheetRules) {
        const text = rule.cssText || '';
        if (/\.filtbtn:focus-visible/.test(text) && /outline/.test(text)) foundFilt = true;
        if (/\.sidebar-close:focus-visible/.test(text) && /outline/.test(text)) foundClose = true;
        if (/\.add-btn:focus-visible/.test(text) && /outline/.test(text)) foundCatalogAdd = true;
        if (/body\.homepage \.homepage-category \.cat-quick-btn:focus-visible/.test(text)) foundHomeQuick = true;
        if (/\.float-cart:focus-visible/.test(text) && /outline/.test(text)) foundFloat = true;
        if (/\.float-legumes:focus-visible/.test(text) && /outline/.test(text)) foundLegumes = true;
        if (/\.scroll-top:focus-visible/.test(text) && /outline/.test(text)) foundScroll = true;
        if (/\.shop-link:focus-visible/.test(text) && /outline/.test(text)) foundShopLink = true;
        if (/\.nav-order:focus-visible/.test(text) && /outline/.test(text)) foundNavOrder = true;
        if (/\.mb-item:focus-visible/.test(text) && /outline/.test(text)) foundBar = true;
        if (/\.cabaz-ver:focus-visible/.test(text) && /outline/.test(text)) foundCabazVer = true;
        if (/\.btn-wa:focus-visible/.test(text) && /outline/.test(text)) foundWa = true;
        if (/\.logo:focus-visible/.test(text) && /outline/.test(text)) foundLogo = true;
        if (/\.consent-no:focus-visible/.test(text) && /outline/.test(text)) foundConsentNo = true;
        if (/\.consent-yes:focus-visible/.test(text) && /outline/.test(text)) foundConsentYes = true;
      }
    }
    return {
      foundFilt, foundClose, foundCatalogAdd, foundHomeQuick, foundFloat, foundLegumes,
      foundScroll, foundShopLink, foundNavOrder, foundBar, foundCabazVer, foundWa, foundLogo,
      foundConsentNo, foundConsentYes,
    };
  });
  ok(rules.foundFilt, `${label}: leftover Filtros :focus-visible rule is in the live stylesheet`);
  ok(rules.foundCatalogAdd, `${label}: leftover catalog Adicionar forest ring stays`);
  ok(rules.foundHomeQuick, `${label}: leftover homepage category tiles keep leftover #194 focus-visible`);
  ok(!rules.foundClose, `${label}: leftover sidebar-close must not get a ring in this run`);
  ok(!rules.foundFloat, `${label}: leftover float-cart must not get a ring in this run`);
  ok(!rules.foundLegumes, `${label}: leftover float-legumes must not get a ring in this run`);
  ok(!rules.foundScroll, `${label}: leftover Voltar ao topo must not get a ring in this run`);
  ok(!rules.foundShopLink, `${label}: leftover shop-link must not get a ring in this run`);
  ok(!rules.foundNavOrder, `${label}: leftover header Encomendar must not get a ring in this run`);
  ok(!rules.foundBar, `${label}: leftover 4-item bar must not get a ring in this run`);
  ok(!rules.foundCabazVer, `${label}: leftover cabaz-ver must not get a ring in this run`);
  ok(!rules.foundWa, `${label}: leftover WhatsApp CTA must not get a ring in this run`);
  ok(!rules.foundLogo, `${label}: leftover wordmark must not get a ring in this run`);
  ok(!rules.foundConsentNo, `${label}: leftover Só essenciais must not get a ring in this run`);
  ok(!rules.foundConsentYes, `${label}: leftover Aceitar tudo must not get a ring in this run`);
}

async function leftoverFiltbtnRing(page, label, { unhide = false } = {}) {
  const ring = await page.evaluate(async (shouldUnhide) => {
    const btn = document.querySelector('.filtbtn');
    if (!btn) return { missing: true };
    const prevDisplay = btn.style.display;
    const wasHiddenDisplay = getComputedStyle(btn).display === 'none';
    if (shouldUnhide && wasHiddenDisplay) btn.style.display = 'inline-flex';
    try { btn.focus({ preventScroll: true, focusVisible: true }); }
    catch { btn.focus({ preventScroll: true }); }
    await new Promise(r => setTimeout(r, 80));
    if (document.activeElement !== btn) {
      try { btn.focus({ preventScroll: true, focusVisible: true }); }
      catch { btn.focus({ preventScroll: true }); }
    }
    await new Promise(r => setTimeout(r, 80));
    const cs = getComputedStyle(btn);
    const box = btn.getBoundingClientRect();
    const measured = {
      missing: false,
      active: document.activeElement === btn,
      type: btn.getAttribute('type') || '',
      tag: btn.tagName,
      text: (btn.textContent || '').replace(/\s+/g, ' ').trim(),
      label: btn.getAttribute('aria-label') || '',
      onclick: btn.getAttribute('onclick') || '',
      wasHiddenDisplay,
      height: box.height,
      width: box.width,
      minHeight: cs.minHeight,
      minWidth: cs.minWidth,
      display: cs.display,
      fontSize: cs.fontSize,
      paddingTop: cs.paddingTop,
      paddingBottom: cs.paddingBottom,
      outlineStyle: cs.outlineStyle,
      outlineWidth: cs.outlineWidth,
      outlineColor: cs.outlineColor,
      outlineOffset: cs.outlineOffset,
    };
    btn.blur();
    if (shouldUnhide) btn.style.display = prevDisplay;
    return measured;
  }, unhide);
  ok(!ring.missing, `${label}: leftover Filtros is on leftover homepage`);
  ok(ring.active, `${label}: leftover Filtros can take leftover keyboard focus`);
  ok(ring.tag === 'BUTTON', `${label}: leftover Filtros stays leftover button`);
  ok(ring.type === 'button', `${label}: leftover Filtros keeps leftover type=button`);
  ok(/Filtros/i.test(ring.text || ''), `${label}: leftover Filtros stays leftover ⚙️ Filtros (got "${ring.text}")`);
  ok(ring.label === 'Abrir filtros e categorias',
    `${label}: leftover Filtros stays leftover Abrir filtros e categorias (got "${ring.label}")`);
  ok(ring.onclick.includes('toggleFiltros()'),
    `${label}: leftover Filtros keeps leftover toggleFiltros()`);
  const hasOutline = ring.outlineStyle && ring.outlineStyle !== 'none' && parseFloat(ring.outlineWidth || '0') > 0;
  ok(hasOutline, `${label}: leftover Filtros forest ring (outline=${ring.outlineStyle}/${ring.outlineWidth}/${ring.outlineColor})`);
  ok(/rgb\(27,\s*67,\s*50\)/.test(ring.outlineColor || ''),
    `${label}: leftover Filtros ring uses leftover forest`);
  ok(parseFloat(ring.outlineWidth || '0') >= 3,
    `${label}: leftover Filtros ring stays leftover 3px (got ${ring.outlineWidth})`);
  ok(ring.height < 44 && (ring.minHeight === 'auto' || ring.minHeight === '0px' || parseFloat(ring.minHeight || '0') < 44),
    `${label}: leftover Filtros should hug leftover ⚙️ Filtros, not invent leftover 44px tap (got ${ring.height}/${ring.minHeight})`);
  ok(ring.minWidth !== '44px',
    `${label}: leftover Filtros min-width should stay leftover auto, not 44px (got ${ring.minWidth})`);
  return ring;
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

async function leftoverChrome(page, label) {
  const chromeUi = await page.evaluate(() => {
    const hamburger = document.querySelector('.hamburger');
    const menu = document.getElementById('mobile-menu');
    const privacyWa = document.querySelector('.privacy-box a[href^="https://wa.me/"]');
    const barWa = document.querySelector('.mb-item[href^="https://wa.me/"]');
    const orderWa = document.querySelector('#order-form button.btn-wa');
    const close = document.querySelector('.sidebar-close');
    const filt = document.querySelector('.filtbtn');
    const backdrop = document.getElementById('shop-backdrop');
    const bar = [...document.querySelectorAll('.mb-item')].map(el =>
      (el.textContent || '').replace(/\s+/g, ' ').trim()
    );
    const hero = [...document.querySelectorAll('.hero-ctas a')].map(a =>
      (a.textContent || '').replace(/\s+/g, ' ').trim()
    );
    return {
      hamburgerType: hamburger?.getAttribute('type') || '',
      hamburgerLabel: hamburger?.getAttribute('aria-label') || '',
      hamburgerExpanded: hamburger?.getAttribute('aria-expanded'),
      menuOpen: menu?.classList.contains('open') === true,
      bar,
      hero,
      waHref: privacyWa?.getAttribute('href') || '',
      barWaHref: barWa?.getAttribute('href') || '',
      orderWaType: orderWa?.getAttribute('type') || '',
      closeType: close?.getAttribute('type') || '',
      closeText: (close?.textContent || '').trim(),
      closeLabel: close?.getAttribute('aria-label') || '',
      closeDisplay: close ? getComputedStyle(close).display : '',
      filtType: filt?.getAttribute('type') || '',
      filtText: (filt?.textContent || '').replace(/\s+/g, ' ').trim(),
      filtLabel: filt?.getAttribute('aria-label') || '',
      filtDisplay: filt ? getComputedStyle(filt).display : '',
      drawerOpen: document.getElementById('shop-sidebar')?.classList.contains('open') === true,
      backdropHidden: backdrop ? backdrop.hidden : null,
      bodyOpen: document.body.classList.contains('filtros-open'),
      cartCount: document.getElementById('cart-count')?.textContent || '',
      tabFrutasActive: document.getElementById('tab-frutas')?.classList.contains('active') === true,
      tabLegumesActive: document.getElementById('tab-legumes')?.classList.contains('active') === true,
    };
  });
  ok(chromeUi.hamburgerType === '',
    `${label}: should not invent leftover type=button on leftover hamburger`);
  ok(chromeUi.hamburgerLabel === 'Menu', `${label}: leftover hamburger stays leftover Menu`);
  ok(chromeUi.hamburgerExpanded == null,
    `${label}: should not redo leftover hamburger aria-expanded (PR #70)`);
  ok(chromeUi.menuOpen === false, `${label}: leftover mobile-menu should stay closed`);
  ok(chromeUi.hero.some(t => /Ver Produtos/i.test(t)), `${label}: leftover Ver Produtos stays`);
  ok(chromeUi.hero.some(t => /Encomendar por WhatsApp/i.test(t)),
    `${label}: leftover Encomendar por WhatsApp stays`);
  ok(chromeUi.waHref === 'https://wa.me/351932699850',
    `${label}: leftover privacy WhatsApp stays wa.me/351932699850`);
  ok(chromeUi.barWaHref === 'https://wa.me/351932699850',
    `${label}: leftover bar WhatsApp stays wa.me/351932699850`);
  ok(chromeUi.orderWaType === 'submit', `${label}: leftover order WhatsApp stays leftover type=submit`);
  ok(chromeUi.filtType === 'button', `${label}: leftover Filtros keeps leftover type=button`);
  ok(/Filtros/i.test(chromeUi.filtText), `${label}: leftover Filtros stays leftover ⚙️ Filtros`);
  ok(chromeUi.filtLabel === 'Abrir filtros e categorias',
    `${label}: leftover Filtros stays leftover Abrir filtros e categorias`);
  ok(chromeUi.closeType === 'button', `${label}: leftover sidebar-close keeps leftover type=button`);
  ok(chromeUi.closeText === '✕', `${label}: leftover sidebar-close stays leftover ✕`);
  ok(chromeUi.closeLabel === 'Fechar filtros', `${label}: leftover Fechar filtros stays`);
  return chromeUi;
}

try {
  const mobile = await browser.newPage();
  mobile.on('pageerror', err => errors.push('390 pageerror: ' + err.message));
  await openReady(mobile, 390, 844);
  const bar = await leftoverChrome(mobile, '390 homepage');
  ok(bar.bar.some(t => /Carrinho/i.test(t)), '390 homepage: leftover 4-item bar still lists Carrinho');
  ok(bar.bar.some(t => /Promoções/i.test(t)), '390 homepage: leftover 4-item bar still lists Promoções');
  ok(bar.bar.some(t => /WhatsApp/i.test(t)), '390 homepage: leftover 4-item bar still lists WhatsApp');
  ok(bar.bar.some(t => /Como Chegar/i.test(t)), '390 homepage: leftover 4-item bar still lists Como Chegar');
  ok(bar.bar.length === 4, `390 homepage: leftover 4-item bar stays (got ${bar.bar.length})`);
  ok(bar.tabFrutasActive === true, '390 homepage: leftover Frutas tab should start leftover active');
  ok(bar.filtDisplay === 'inline-flex' || bar.filtDisplay === 'flex',
    `390 homepage: leftover Filtros stays leftover visible on leftover phones (got "${bar.filtDisplay}")`);
  await leftoverHomeRules(mobile, '390 homepage');
  await leftoverFiltbtnRing(mobile, '390 homepage');

  await mobile.evaluate(() => document.querySelector('.filtbtn')?.click());
  const afterOpen = await leftoverChrome(mobile, '390 after open');
  ok(afterOpen.drawerOpen === true, '390 homepage: leftover Filtros click should open leftover filter drawer');
  ok(afterOpen.backdropHidden === false, '390 homepage: leftover Filtros click should show leftover shop-backdrop');
  ok(afterOpen.bodyOpen === true, '390 homepage: leftover Filtros click should set leftover filtros-open');
  ok(afterOpen.cartCount === '0' || afterOpen.cartCount === '',
    `390 homepage: leftover Filtros should not change leftover cart (got "${afterOpen.cartCount}")`);
  ok(afterOpen.menuOpen === false, '390 homepage: leftover Filtros should keep leftover mobile-menu closed');

  await mobile.evaluate(() => document.querySelector('.sidebar-close')?.click());
  const afterClose = await leftoverChrome(mobile, '390 after close');
  ok(afterClose.drawerOpen === false, '390 homepage: leftover sidebar-close click should hide leftover filter drawer');
  ok(afterClose.backdropHidden === true, '390 homepage: leftover sidebar-close click should hide leftover shop-backdrop');
  ok(afterClose.bodyOpen === false, '390 homepage: leftover sidebar-close click should clear leftover filtros-open');

  await leftoverHomeRules(mobile, '390 after close');
  await leftoverFiltbtnRing(mobile, '390 after close');
  await mobile.evaluate(() => document.querySelector('.filtbtn')?.click());
  const reopened = await leftoverChrome(mobile, '390 after reopen');
  ok(reopened.drawerOpen === true, '390 homepage: leftover Filtros should reopen leftover filter drawer');
  await leftoverFiltbtnRing(mobile, '390 after reopen');
  await mobile.evaluate(() => document.querySelector('.sidebar-close')?.click());

  await addMelancia(mobile, '390 homepage');
  await leftoverFiltbtnRing(mobile, '390 after add');
  await mobile.evaluate(() => document.querySelector('.filtbtn')?.click());
  const afterAdd = await leftoverChrome(mobile, '390 after add open');
  ok(afterAdd.drawerOpen === true, '390 homepage: leftover Filtros still opens leftover filter drawer after leftover Melancia 1/4 add');
  ok(afterAdd.cartCount === '1',
    `390 homepage: leftover Filtros should keep leftover Melancia 1/4 cart (got "${afterAdd.cartCount}")`);
  ok(afterAdd.tabFrutasActive === true, '390 homepage: leftover Frutas tab stays leftover active after leftover Filtros');
  ok(afterAdd.menuOpen === false, '390 homepage: leftover mobile-menu stays leftover closed after leftover Filtros');
  await mobile.evaluate(() => document.querySelector('.sidebar-close')?.click());

  const catPage = await browser.newPage();
  catPage.on('pageerror', err => errors.push('390 Frutas pageerror: ' + err.message));
  await catPage.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true });
  await catPage.goto(`${base}categorias/frutas/`, { waitUntil: 'networkidle0', timeout: 60000 });
  const cat = await catPage.evaluate(() => {
    const nav = [...document.querySelectorAll('.seo-nav a')].map(a => (a.textContent || '').trim());
    const footer = document.querySelector('.seo-footer a');
    const ver = document.querySelector('.seo-text-link');
    return {
      nav,
      footerText: (footer?.textContent || '').replace(/\s+/g, ' ').trim(),
      verText: (ver?.textContent || '').trim(),
      hasBar: !!document.querySelector('.hamburger, #mobile-menu, [aria-label="Menu"], .mobile-close, .mb-item, #mobile-bar, .sidebar-close, .filtbtn'),
    };
  });
  ok(cat.nav.join('|') === 'Início|Frutas|Legumes|Promoções',
    `390 Frutas: wrapping nav stays leftover Início / Frutas / Legumes / Promoções (got ${cat.nav.join(' / ')})`);
  ok(/MUNDIFRUTA/i.test(cat.footerText), `390 Frutas: leftover catalog footer stays (got "${cat.footerText}")`);
  ok(cat.verText === 'Ver produto', `390 Frutas: leftover Ver produto copy (got "${cat.verText}")`);
  ok(!cat.hasBar, '390 Frutas: should not add a leftover SEO-page hamburger / leftover filter-drawer');

  const tablet = await browser.newPage();
  tablet.on('pageerror', err => errors.push('900 pageerror: ' + err.message));
  await openReady(tablet, 900, 800);
  await leftoverChrome(tablet, '900 homepage');
  await leftoverHomeRules(tablet, '900 homepage');
  const tabRing = await leftoverFiltbtnRing(tablet, '900 homepage');
  ok(tabRing.display === 'inline-flex' || tabRing.display === 'flex',
    `900 homepage: leftover Filtros stays leftover visible (got "${tabRing.display}")`);
  await tablet.evaluate(() => document.querySelector('.filtbtn')?.click());
  const tabOpened = await leftoverChrome(tablet, '900 after open');
  ok(tabOpened.drawerOpen === true, '900 homepage: leftover Filtros click should open leftover filter drawer');
  await tablet.evaluate(() => document.querySelector('.sidebar-close')?.click());
  const tabClosed = await leftoverChrome(tablet, '900 after close');
  ok(tabClosed.drawerOpen === false, '900 homepage: leftover sidebar-close click should hide leftover filter drawer');

  const desktop = await browser.newPage();
  desktop.on('pageerror', err => errors.push('1280 pageerror: ' + err.message));
  await openReady(desktop, 1280, 800);
  const wide = await leftoverChrome(desktop, '1280 homepage');
  ok(wide.filtDisplay === 'none',
    `1280 homepage: leftover Filtros should stay leftover hidden on leftover desktop (got "${wide.filtDisplay}")`);
  ok(wide.closeDisplay === 'none',
    `1280 homepage: leftover sidebar-close should stay leftover hidden on leftover desktop (got "${wide.closeDisplay}")`);
  await leftoverHomeRules(desktop, '1280 homepage');
  await leftoverFiltbtnRing(desktop, '1280 homepage', { unhide: true });
  const stillHidden = await desktop.evaluate(() => {
    const filt = document.querySelector('.filtbtn');
    return filt ? getComputedStyle(filt).display : '';
  });
  ok(stillHidden === 'none',
    `1280 homepage: leftover Filtros stays leftover hidden after leftover ring measure (got "${stillHidden}")`);

  await browser.close();
  server.close();
  if (errors.length) {
    console.error('check-filtbtn-focus-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
    process.exit(1);
  }
  console.log('check-filtbtn-focus-browser: ok');
} catch (err) {
  try { await browser.close(); } catch {}
  try { server.close(); } catch {}
  console.error(err);
  process.exit(1);
}
