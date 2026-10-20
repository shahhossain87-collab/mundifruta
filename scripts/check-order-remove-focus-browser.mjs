#!/usr/bin/env node
/** Chrome: leftover checkout × Remover keyboard ring; leftover catalog clicks. */
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
    let foundRemove = false;
    let foundStepper = false;
    let foundCatalogAdd = false;
    let foundHomeQuick = false;
    let foundFilt = false;
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
    let foundSidebarClose = false;
    let foundProductQty = false;
    for (const sheet of [...document.styleSheets]) {
      let sheetRules;
      try { sheetRules = [...sheet.cssRules]; } catch { continue; }
      for (const rule of sheetRules) {
        const text = rule.cssText || '';
        if (/\.order-remove:focus-visible/.test(text) && /outline/.test(text)) foundRemove = true;
        if (/\.oi-stepper button:focus-visible/.test(text) && /outline/.test(text)) foundStepper = true;
        if (/\.add-btn:focus-visible/.test(text) && /outline/.test(text)) foundCatalogAdd = true;
        if (/body\.homepage \.homepage-category \.cat-quick-btn:focus-visible/.test(text)) foundHomeQuick = true;
        if (/\.filtbtn:focus-visible/.test(text) && /outline/.test(text)) foundFilt = true;
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
        if (/\.sidebar-close:focus-visible/.test(text) && /outline/.test(text)) foundSidebarClose = true;
        if (/\.product-modal-qty button:focus-visible/.test(text) && /outline/.test(text)) foundProductQty = true;
      }
    }
    return {
      foundRemove, foundStepper, foundCatalogAdd, foundHomeQuick, foundFilt, foundFloat, foundLegumes,
      foundScroll, foundShopLink, foundNavOrder, foundBar, foundCabazVer, foundWa, foundLogo,
      foundConsentNo, foundConsentYes, foundSidebarClose, foundProductQty,
    };
  });
  ok(rules.foundRemove, `${label}: leftover checkout × Remover :focus-visible rule is in the live stylesheet`);
  ok(rules.foundCatalogAdd, `${label}: leftover catalog Adicionar forest ring stays`);
  ok(rules.foundHomeQuick, `${label}: leftover homepage category tiles keep leftover #194 focus-visible`);
  ok(!rules.foundStepper, `${label}: leftover checkout qty must not get a ring in this run`);
  ok(!rules.foundFilt, `${label}: leftover Filtros must not get a ring in this run`);
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
  ok(!rules.foundSidebarClose, `${label}: leftover sidebar-close must not get a ring in this run`);
  ok(!rules.foundProductQty, `${label}: leftover product-modal qty must not get a ring in this run`);
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
    return {
      ok: true,
      count: document.getElementById('cart-count')?.textContent || '',
      line: (document.querySelector('.order-item')?.textContent || '').replace(/\s+/g, ' ').trim(),
    };
  });
  ok(added.ok && added.count === '1' && /Melancia 1\/4/i.test(added.line),
    `${label}: leftover Adicionar still adds leftover Melancia 1/4 (count=${added.count}, line="${added.line}")`);
  return added;
}

async function leftoverOrderRemoveRing(page, label) {
  const ring = await page.evaluate(async () => {
    const btn = document.querySelector('.order-remove');
    if (!btn) return { missing: true };
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
    const qtyBtns = [...document.querySelectorAll('.oi-stepper button')];
    const minus = qtyBtns[0] || null;
    const plus = qtyBtns[1] || null;
    const measured = {
      missing: false,
      active: document.activeElement === btn,
      type: btn.getAttribute('type') || '',
      tag: btn.tagName,
      text: (btn.textContent || '').replace(/\s+/g, ' ').trim(),
      label: btn.getAttribute('aria-label') || '',
      onclick: btn.getAttribute('onclick') || '',
      height: box.height,
      width: box.width,
      minHeight: cs.minHeight,
      minWidth: cs.minWidth,
      outlineStyle: cs.outlineStyle,
      outlineWidth: cs.outlineWidth,
      outlineColor: cs.outlineColor,
      outlineOffset: cs.outlineOffset,
      minusText: (minus?.textContent || '').replace(/\s+/g, ' ').trim(),
      plusText: (plus?.textContent || '').replace(/\s+/g, ' ').trim(),
      minusType: minus?.getAttribute('type') || '',
      plusType: plus?.getAttribute('type') || '',
      minusLabel: minus?.getAttribute('aria-label') || '',
      plusLabel: plus?.getAttribute('aria-label') || '',
      minusHeight: minus ? minus.getBoundingClientRect().height : 0,
      line: (document.querySelector('.order-item')?.textContent || '').replace(/\s+/g, ' ').trim(),
      qtyText: (document.querySelector('.oi-stepper b')?.textContent || '').trim(),
    };
    btn.blur();
    return measured;
  });
  ok(!ring.missing, `${label}: leftover checkout × Remover is on leftover homepage`);
  ok(ring.active, `${label}: leftover checkout × Remover can take leftover keyboard focus`);
  ok(ring.tag === 'BUTTON', `${label}: leftover checkout × Remover stays leftover button`);
  ok(ring.type === 'button', `${label}: leftover checkout × Remover keeps leftover type=button`);
  ok(ring.text === '×', `${label}: leftover checkout × Remover stays leftover × (got "${ring.text}")`);
  ok(/Remover Melancia 1\/4/i.test(ring.label),
    `${label}: leftover checkout × Remover stays leftover named Remover Melancia 1/4 (got "${ring.label}")`);
  ok(ring.onclick.includes("removerProduto("),
    `${label}: leftover checkout × Remover keeps leftover removerProduto()`);
  const hasOutline = ring.outlineStyle && ring.outlineStyle !== 'none' && parseFloat(ring.outlineWidth || '0') > 0;
  ok(hasOutline, `${label}: leftover checkout × Remover forest ring (outline=${ring.outlineStyle}/${ring.outlineWidth}/${ring.outlineColor})`);
  ok(/rgb\(27,\s*67,\s*50\)/.test(ring.outlineColor || ''),
    `${label}: leftover checkout × Remover ring uses leftover forest`);
  ok(parseFloat(ring.outlineWidth || '0') >= 3,
    `${label}: leftover checkout × Remover ring stays leftover 3px (got ${ring.outlineWidth})`);
  ok(ring.height < 44 && (ring.minHeight === 'auto' || ring.minHeight === '0px' || parseFloat(ring.minHeight || '0') < 44),
    `${label}: leftover checkout × Remover should hug leftover × leftover 26px, not invent leftover 44px tap (got ${ring.height}/${ring.minHeight})`);
  ok(ring.minWidth !== '44px',
    `${label}: leftover checkout × Remover min-width should stay leftover auto, not 44px (got ${ring.minWidth})`);
  ok(ring.minusType === 'button' && ring.plusType === 'button',
    `${label}: leftover checkout qty − / + should keep leftover type=button`);
  ok(ring.minusText === '−' && ring.plusText === '+',
    `${label}: leftover checkout qty copy stays leftover − / + (got "${ring.minusText}" / "${ring.plusText}")`);
  ok(ring.minusLabel === 'Menos' && ring.plusLabel === 'Mais',
    `${label}: leftover checkout qty labels stay leftover Menos / Mais`);
  ok(ring.minusHeight < 44,
    `${label}: leftover checkout qty should stay leftover 28px, not invent leftover 44px tap (got ${ring.minusHeight})`);
  ok(/Melancia 1\/4/i.test(ring.line),
    `${label}: leftover checkout line stays leftover Melancia 1/4 (got "${ring.line}")`);
  return ring;
}

async function leftoverChrome(page, label) {
  const chromeUi = await page.evaluate(() => {
    const hamburger = document.querySelector('.hamburger');
    const menu = document.getElementById('mobile-menu');
    const privacyWa = document.querySelector('.privacy-box a[href^="https://wa.me/"]');
    const barWa = document.querySelector('.mb-item[href^="https://wa.me/"]');
    const orderWa = document.querySelector('#order-form button.btn-wa');
    const remove = document.querySelector('.order-remove');
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
      removeType: remove?.getAttribute('type') || '',
      removeText: (remove?.textContent || '').trim(),
      removeLabel: remove?.getAttribute('aria-label') || '',
      cartCount: document.getElementById('cart-count')?.textContent || '',
      tabFrutasActive: document.getElementById('tab-frutas')?.classList.contains('active') === true,
      tabLegumesActive: document.getElementById('tab-legumes')?.classList.contains('active') === true,
      skipText: (document.querySelector('.cs-pop-skip')?.textContent || '').trim(),
      mbLabel: (document.getElementById('mb-cart-label')?.textContent || '').replace(/\s+/g, ' ').trim(),
      navOrderType: document.querySelector('.nav-order')?.getAttribute('type') || '',
      mobileCloseType: document.querySelector('.mobile-close')?.getAttribute('type') || '',
      mobileCloseLabel: document.querySelector('.mobile-close')?.getAttribute('aria-label'),
      searchClearType: document.querySelector('.search-clear')?.getAttribute('type') || '',
      floatCartType: document.getElementById('float-cart')?.getAttribute('type') || '',
      floatLegumesType: document.getElementById('float-legumes')?.getAttribute('type') || '',
      scrollTopType: document.getElementById('scroll-top')?.getAttribute('type') || '',
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
  ok(chromeUi.navOrderType === '', `${label}: leftover Encomendar should stay without invented type=button`);
  ok(chromeUi.mobileCloseType === '', `${label}: leftover mobile-close should stay without invented type=button`);
  ok(!chromeUi.mobileCloseLabel, `${label}: leftover mobile-close should stay without leftover aria-label`);
  ok(chromeUi.searchClearType === '', `${label}: leftover search-clear should stay without invented type=button`);
  ok(chromeUi.floatCartType === '', `${label}: leftover float-cart should stay without invented type=button`);
  ok(chromeUi.floatLegumesType === '', `${label}: leftover float-legumes should stay without invented type=button`);
  ok(chromeUi.scrollTopType === '', `${label}: leftover scroll-top should stay without invented type=button`);
  ok(chromeUi.skipText === 'Continuar sem adicionar', `${label}: leftover Continuar sem adicionar stays`);
  return chromeUi;
}

async function clickCheckoutRemove(page, label) {
  const after = await page.evaluate(() => {
    const remove = document.querySelector('.order-remove');
    if (remove) remove.click();
    return {
      count: document.getElementById('cart-count')?.textContent || '',
      items: document.querySelectorAll('.order-item').length,
      empty: (document.querySelector('.empty-msg')?.textContent || '').replace(/\s+/g, ' ').trim(),
      menuOpen: document.getElementById('mobile-menu')?.classList.contains('open') === true,
      frutasActive: document.getElementById('tab-frutas')?.classList.contains('active') === true,
      barWaHref: document.querySelector('.mb-item[href^="https://wa.me/"]')?.getAttribute('href') || '',
      waHref: document.querySelector('.privacy-box a[href^="https://wa.me/"]')?.getAttribute('href') || '',
      mbLabel: (document.getElementById('mb-cart-label')?.textContent || '').replace(/\s+/g, ' ').trim(),
    };
  });
  ok(after.items === 0,
    `${label}: leftover checkout × Remover still removes leftover Melancia 1/4 (items=${after.items})`);
  ok(after.count === '0',
    `${label}: leftover checkout × Remover still updates leftover cart to leftover 0 (got "${after.count}")`);
  ok(/Sem artigos ainda/i.test(after.empty),
    `${label}: leftover empty cart copy stays leftover Sem artigos ainda (got "${after.empty}")`);
  ok(after.menuOpen === false, `${label}: leftover mobile-menu stays leftover closed after leftover checkout × Remover`);
  ok(after.frutasActive === true, `${label}: leftover Frutas tab stays leftover active after leftover checkout × Remover`);
  ok(after.barWaHref === 'https://wa.me/351932699850',
    `${label}: leftover bar WhatsApp stays wa.me/351932699850 after leftover checkout × Remover`);
  ok(after.waHref === 'https://wa.me/351932699850',
    `${label}: leftover privacy WhatsApp stays wa.me/351932699850 after leftover checkout × Remover`);
  return after;
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
  await leftoverHomeRules(mobile, '390 homepage');

  await addMelancia(mobile, '390 homepage');
  const phoneRing = await leftoverOrderRemoveRing(mobile, '390 homepage');
  ok(phoneRing.height < 32,
    `390 homepage: leftover checkout × Remover hugs leftover × leftover 26px on leftover phones (got ${phoneRing.height})`);
  await leftoverChrome(mobile, '390 after add');
  await clickCheckoutRemove(mobile, '390 homepage');
  const afterRemove = await leftoverChrome(mobile, '390 after remove');
  ok(afterRemove.cartCount === '0' || afterRemove.cartCount === '',
    `390 homepage: leftover checkout × Remover keeps leftover empty cart (got "${afterRemove.cartCount}")`);
  ok(afterRemove.menuOpen === false, '390 homepage: leftover mobile-menu stays leftover closed after leftover checkout × Remover');

  const phone640 = await browser.newPage();
  phone640.on('pageerror', err => errors.push('640 pageerror: ' + err.message));
  await openReady(phone640, 640, 800);
  await leftoverHomeRules(phone640, '640 homepage');
  await addMelancia(phone640, '640 homepage');
  const ring640 = await leftoverOrderRemoveRing(phone640, '640 homepage');
  ok(ring640.height < 32,
    `640 homepage: leftover checkout × Remover hugs leftover × leftover 26px (got ${ring640.height})`);
  await clickCheckoutRemove(phone640, '640 homepage');

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
      hasBar: !!document.querySelector('.hamburger, #mobile-menu, [aria-label="Menu"], .mobile-close, .mb-item, #mobile-bar, .order-remove, .oi-stepper'),
    };
  });
  ok(cat.nav.join('|') === 'Início|Frutas|Legumes|Promoções',
    `390 Frutas: wrapping nav stays leftover Início / Frutas / Legumes / Promoções (got ${cat.nav.join(' / ')})`);
  ok(/MUNDIFRUTA/i.test(cat.footerText), `390 Frutas: leftover catalog footer stays (got "${cat.footerText}")`);
  ok(cat.verText === 'Ver produto', `390 Frutas: leftover Ver produto copy (got "${cat.verText}")`);
  ok(!cat.hasBar, '390 Frutas: should not add a leftover SEO-page hamburger / leftover checkout × Remover');

  const tablet = await browser.newPage();
  tablet.on('pageerror', err => errors.push('900 pageerror: ' + err.message));
  await openReady(tablet, 900, 800);
  await leftoverChrome(tablet, '900 homepage');
  await leftoverHomeRules(tablet, '900 homepage');
  await addMelancia(tablet, '900 homepage');
  const tabRing = await leftoverOrderRemoveRing(tablet, '900 homepage');
  ok(tabRing.height < 32,
    `900 homepage: leftover checkout × Remover hugs leftover × leftover 26px (got ${tabRing.height})`);
  await clickCheckoutRemove(tablet, '900 homepage');

  const desktop = await browser.newPage();
  desktop.on('pageerror', err => errors.push('1280 pageerror: ' + err.message));
  await openReady(desktop, 1280, 800);
  await leftoverChrome(desktop, '1280 homepage');
  await leftoverHomeRules(desktop, '1280 homepage');
  await addMelancia(desktop, '1280 homepage');
  const deskRing = await leftoverOrderRemoveRing(desktop, '1280 homepage');
  ok(deskRing.height < 32,
    `1280 homepage: leftover checkout × Remover hugs leftover × leftover 26px (got ${deskRing.height})`);
  await clickCheckoutRemove(desktop, '1280 homepage');
  const deskAfter = await leftoverChrome(desktop, '1280 after remove');
  ok(deskAfter.cartCount === '0' || deskAfter.cartCount === '',
    `1280 homepage: leftover checkout × Remover keeps leftover empty cart (got "${deskAfter.cartCount}")`);

  await browser.close();
  server.close();
  if (errors.length) {
    console.error('check-order-remove-focus-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
    process.exit(1);
  }
  console.log('check-order-remove-focus-browser: ok');
} catch (err) {
  try { await browser.close(); } catch {}
  try { server.close(); } catch {}
  console.error(err);
  process.exit(1);
}
