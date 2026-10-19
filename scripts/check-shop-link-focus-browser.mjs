#!/usr/bin/env node
/** Chrome: leftover shop-link keyboard ring; leftover catalog clicks. */
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
    let foundShopLink = false;
    let foundCatalogAdd = false;
    let foundHomeQuick = false;
    let foundBackdrop = false;
    let foundFeatureAdd = false;
    let foundFeaturePhoto = false;
    let foundFloat = false;
    let foundScroll = false;
    let foundNavOrder = false;
    let foundBar = false;
    let foundCabazVer = false;
    let foundWa = false;
    let foundLogo = false;
    let foundConsentLink = false;
    for (const sheet of [...document.styleSheets]) {
      let sheetRules;
      try { sheetRules = [...sheet.cssRules]; } catch { continue; }
      for (const rule of sheetRules) {
        const text = rule.cssText || '';
        if (/\.shop-link:focus-visible/.test(text) && /outline/.test(text)) foundShopLink = true;
        if (/\.add-btn:focus-visible/.test(text) && /outline/.test(text)) foundCatalogAdd = true;
        if (/body\.homepage \.homepage-category \.cat-quick-btn:focus-visible/.test(text)) foundHomeQuick = true;
        if (/\.shop-backdrop:focus-visible/.test(text) && /outline/.test(text)) foundBackdrop = true;
        if (/\.feature-add:focus-visible/.test(text) && /outline/.test(text)) foundFeatureAdd = true;
        if (/\.feature-photo:focus-visible/.test(text) && /outline/.test(text)) foundFeaturePhoto = true;
        if (/\.float-cart:focus-visible/.test(text) && /outline/.test(text)) foundFloat = true;
        if (/\.scroll-top:focus-visible/.test(text) && /outline/.test(text)) foundScroll = true;
        if (/\.nav-order:focus-visible/.test(text) && /outline/.test(text)) foundNavOrder = true;
        if (/\.mb-item:focus-visible/.test(text) && /outline/.test(text)) foundBar = true;
        if (/\.cabaz-ver:focus-visible/.test(text) && /outline/.test(text)) foundCabazVer = true;
        if (/\.btn-wa:focus-visible/.test(text) && /outline/.test(text)) foundWa = true;
        if (/\.logo:focus-visible/.test(text) && /outline/.test(text)) foundLogo = true;
        if (/\.consent-link:focus-visible/.test(text) && /outline/.test(text)) foundConsentLink = true;
      }
    }
    return {
      foundShopLink, foundCatalogAdd, foundHomeQuick, foundBackdrop, foundFeatureAdd,
      foundFeaturePhoto, foundFloat, foundScroll, foundNavOrder, foundBar, foundCabazVer,
      foundWa, foundLogo, foundConsentLink,
    };
  });
  ok(rules.foundShopLink, `${label}: leftover shop-link :focus-visible rule is in the live stylesheet`);
  ok(rules.foundCatalogAdd, `${label}: leftover catalog Adicionar forest ring stays`);
  ok(rules.foundHomeQuick, `${label}: leftover homepage category tiles keep leftover #194 focus-visible`);
  ok(!rules.foundBackdrop, `${label}: leftover shop-backdrop must not get a ring in this run`);
  ok(!rules.foundFeatureAdd, `${label}: leftover feature-add must not get a ring in this run`);
  ok(!rules.foundFeaturePhoto, `${label}: leftover feature-photo must not get a ring in this run`);
  ok(!rules.foundFloat, `${label}: leftover float-cart must not get a ring in this run`);
  ok(!rules.foundScroll, `${label}: leftover Voltar ao topo must not get a ring in this run`);
  ok(!rules.foundNavOrder, `${label}: leftover header Encomendar must not get a ring in this run`);
  ok(!rules.foundBar, `${label}: leftover 4-item bar must not get a ring in this run`);
  ok(!rules.foundCabazVer, `${label}: leftover cabaz-ver must not get a ring in this run`);
  ok(!rules.foundWa, `${label}: leftover WhatsApp CTA must not get a ring in this run`);
  ok(!rules.foundLogo, `${label}: leftover wordmark must not get a ring in this run`);
  ok(!rules.foundConsentLink, `${label}: leftover Saber mais must not get a ring in this run`);
}

async function leftoverShopLinkRing(page, label) {
  const ring = await page.evaluate(async () => {
    const wanted = [
      'Ver catálogo completo →',
      'Ver todas as frutas →',
      'Explorar fruta →',
      'Ver todos os legumes →',
    ];
    const buttons = [...document.querySelectorAll('.shop-link')];
    const measured = [];
    for (const text of wanted) {
      const btn = buttons.find(el => (el.textContent || '').replace(/\s+/g, ' ').trim() === text);
      if (!btn) {
        measured.push({ text, missing: true });
        continue;
      }
      btn.scrollIntoView({ block: 'center', inline: 'nearest' });
      try { btn.focus({ preventScroll: true, focusVisible: true }); }
      catch { btn.focus({ preventScroll: true }); }
      await new Promise(r => setTimeout(r, 80));
      const cs = getComputedStyle(btn);
      const box = btn.getBoundingClientRect();
      measured.push({
        text,
        missing: false,
        active: document.activeElement === btn,
        type: btn.getAttribute('type') || '',
        tag: btn.tagName,
        onclick: btn.getAttribute('onclick') || '',
        height: box.height,
        width: box.width,
        minHeight: cs.minHeight,
        outlineStyle: cs.outlineStyle,
        outlineWidth: cs.outlineWidth,
        outlineColor: cs.outlineColor,
        outlineOffset: cs.outlineOffset,
      });
    }
    return measured;
  });
  ok(ring.length === 4, `${label}: leftover shop-link count stays 4 (got ${ring.length})`);
  for (const item of ring) {
    ok(!item.missing, `${label}: leftover ${item.text} is on leftover homepage`);
    ok(item.active, `${label}: leftover ${item.text} can take leftover keyboard focus`);
    ok(item.tag === 'BUTTON', `${label}: leftover ${item.text} stays leftover button`);
    ok(item.type === '', `${label}: leftover ${item.text} stays without leftover type=button`);
    const hasOutline = item.outlineStyle && item.outlineStyle !== 'none' && parseFloat(item.outlineWidth || '0') > 0;
    ok(hasOutline, `${label}: leftover ${item.text} forest ring (outline=${item.outlineStyle}/${item.outlineWidth}/${item.outlineColor})`);
    ok(/rgb\(27,\s*67,\s*50\)/.test(item.outlineColor || ''),
      `${label}: leftover ${item.text} ring uses leftover forest`);
    ok(parseFloat(item.outlineWidth || '0') >= 3,
      `${label}: leftover ${item.text} ring stays leftover 3px (got ${item.outlineWidth})`);
    ok(item.height < 44 && (item.minHeight === 'auto' || item.minHeight === '0px' || parseFloat(item.minHeight || '0') < 44),
      `${label}: leftover ${item.text} should hug leftover labels, not redo leftover 44px tap (got ${item.height}/${item.minHeight})`);
  }
  ok(ring[0] && ring[0].onclick.includes("getElementById('produtos').scrollIntoView({behavior:'smooth'})"),
    `${label}: leftover Ver catálogo completo keeps leftover produtos scroll`);
  ok(ring[1] && ring[1].onclick.includes("abrirCatalogo('frutas')"),
    `${label}: leftover Ver todas as frutas keeps leftover abrirCatalogo('frutas')`);
  ok(ring[2] && ring[2].onclick.includes("abrirCatalogo('frutas')"),
    `${label}: leftover Explorar fruta keeps leftover abrirCatalogo('frutas')`);
  ok(ring[3] && ring[3].onclick.includes("abrirCatalogo('legumes')"),
    `${label}: leftover Ver todos os legumes keeps leftover abrirCatalogo('legumes')`);
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

async function clickShopLink(page, wanted) {
  return page.evaluate((label) => {
    const btn = [...document.querySelectorAll('.shop-link')]
      .find(el => (el.textContent || '').replace(/\s+/g, ' ').trim() === label);
    if (!btn) return { ok: false, reason: 'missing', type: '' };
    btn.click();
    return {
      ok: true,
      type: btn.getAttribute('type') || '',
      text: (btn.textContent || '').replace(/\s+/g, ' ').trim(),
    };
  }, wanted);
}

async function waitInView(page, id) {
  await page.waitForFunction((elId) => {
    const el = document.getElementById(elId);
    if (!el) return false;
    const box = el.getBoundingClientRect();
    return box.top < window.innerHeight && box.bottom > 80;
  }, { timeout: 4000 }, id);
}

async function leftoverChrome(page, label) {
  const chromeUi = await page.evaluate(() => {
    const hamburger = document.querySelector('.hamburger');
    const menu = document.getElementById('mobile-menu');
    const privacyWa = document.querySelector('.privacy-box a[href^="https://wa.me/"]');
    const barWa = document.querySelector('.mb-item[href^="https://wa.me/"]');
    const orderWa = document.querySelector('#order-form button.btn-wa');
    const scrollTop = document.getElementById('scroll-top');
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
      scrollTopBottom: scrollTop ? getComputedStyle(scrollTop).bottom : '',
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
  ok(chromeUi.tabFrutasActive === true || chromeUi.tabLegumesActive === true,
    `${label}: leftover catalog tab should stay leftover Frutas or leftover Legumes`);
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
  ok(bar.scrollTopBottom === '28px',
    `390 homepage: leftover scroll-top computed bottom stays leftover 28px (got "${bar.scrollTopBottom}")`);
  await leftoverHomeRules(mobile, '390 homepage');
  await leftoverShopLinkRing(mobile, '390 homepage');

  const clickCatalogo = await clickShopLink(mobile, 'Ver catálogo completo →');
  ok(clickCatalogo.ok && clickCatalogo.type === '',
    `390 homepage: leftover Ver catálogo completo click stays without leftover type=button`);
  await waitInView(mobile, 'produtos');
  const afterCatalogo = await leftoverChrome(mobile, '390 after Ver catálogo completo');
  ok(afterCatalogo.tabFrutasActive === true,
    '390 homepage: leftover Ver catálogo completo click should keep leftover Frutas tab leftover active');
  await leftoverShopLinkRing(mobile, '390 after Ver catálogo completo');

  const clickLegumes = await clickShopLink(mobile, 'Ver todos os legumes →');
  ok(clickLegumes.ok && clickLegumes.type === '',
    '390 homepage: leftover Ver todos os legumes click stays without leftover type=button');
  await waitInView(mobile, 'produtos');
  const afterLegumes = await leftoverChrome(mobile, '390 after Ver todos os legumes');
  ok(afterLegumes.tabLegumesActive === true,
    '390 homepage: leftover Ver todos os legumes click should open leftover Legumes catálogo');

  await addMelancia(mobile, '390 after shop-link');
  const afterAddClick = await clickShopLink(mobile, 'Ver catálogo completo →');
  ok(afterAddClick.ok && afterAddClick.type === '',
    '390 homepage: leftover Ver catálogo completo click after leftover add stays without leftover type=button');
  await waitInView(mobile, 'produtos');
  const afterAdd = await leftoverChrome(mobile, '390 after add click');
  ok(afterAdd.cartCount === '1',
    `390 homepage: leftover Ver catálogo completo should keep leftover Melancia 1/4 in leftover cart (got "${afterAdd.cartCount}")`);

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
      hasBar: !!document.querySelector('.hamburger, #mobile-menu, [aria-label="Menu"], .mobile-close, .mb-item, #mobile-bar, #float-legumes, .float-legumes, #scroll-top, .scroll-top, .cat-quick-btn, .shop-link'),
    };
  });
  ok(cat.nav.join('|') === 'Início|Frutas|Legumes|Promoções',
    `390 Frutas: wrapping nav stays leftover Início / Frutas / Legumes / Promoções (got ${cat.nav.join(' / ')})`);
  ok(/MUNDIFRUTA/i.test(cat.footerText), `390 Frutas: leftover catalog footer stays (got "${cat.footerText}")`);
  ok(cat.verText === 'Ver produto', `390 Frutas: leftover Ver produto copy (got "${cat.verText}")`);
  ok(!cat.hasBar, '390 Frutas: should not add a leftover SEO-page hamburger / leftover shop-link');

  const desktop = await browser.newPage();
  desktop.on('pageerror', err => errors.push('1280 pageerror: ' + err.message));
  await openReady(desktop, 1280, 800);
  await leftoverChrome(desktop, '1280 homepage');
  await leftoverHomeRules(desktop, '1280 homepage');
  await leftoverShopLinkRing(desktop, '1280 homepage');

  const deskClick = await clickShopLink(desktop, 'Ver catálogo completo →');
  ok(deskClick.ok && deskClick.type === '',
    '1280 homepage: leftover Ver catálogo completo click stays without leftover type=button');
  await waitInView(desktop, 'produtos');
  const deskAfter = await leftoverChrome(desktop, '1280 after Ver catálogo completo');
  ok(deskAfter.tabFrutasActive === true,
    '1280 homepage: leftover Ver catálogo completo click should keep leftover Frutas tab leftover active');

  const deskLegumes = await clickShopLink(desktop, 'Ver todos os legumes →');
  ok(deskLegumes.ok && deskLegumes.type === '',
    '1280 homepage: leftover Ver todos os legumes click stays without leftover type=button');
  await waitInView(desktop, 'produtos');
  const deskAfterLegumes = await leftoverChrome(desktop, '1280 after Ver todos os legumes');
  ok(deskAfterLegumes.tabLegumesActive === true,
    '1280 homepage: leftover Ver todos os legumes click should open leftover Legumes catálogo');

  await addMelancia(desktop, '1280 after shop-link');
  const deskAddClick = await clickShopLink(desktop, 'Ver catálogo completo →');
  ok(deskAddClick.ok && deskAddClick.type === '',
    '1280 homepage: leftover Ver catálogo completo click after leftover add stays without leftover type=button');
  await waitInView(desktop, 'produtos');
  const deskAfterAdd = await leftoverChrome(desktop, '1280 after add click');
  ok(deskAfterAdd.cartCount === '1',
    `1280 homepage: leftover Ver catálogo completo should keep leftover Melancia 1/4 in leftover cart (got "${deskAfterAdd.cartCount}")`);

  await browser.close();
  server.close();
  if (errors.length) {
    console.error('check-shop-link-focus-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
    process.exit(1);
  }
  console.log('check-shop-link-focus-browser: ok');
} catch (err) {
  try { await browser.close(); } catch {}
  try { server.close(); } catch {}
  console.error(err);
  process.exit(1);
}
