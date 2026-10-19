#!/usr/bin/env node
/** Chrome: leftover float-legumes keyboard ring; leftover catalog clicks. */
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
    let foundLegumes = false;
    let foundCatalogAdd = false;
    let foundHomeQuick = false;
    let foundFloat = false;
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
        if (/\.float-legumes:focus-visible/.test(text) && /outline/.test(text)) foundLegumes = true;
        if (/\.add-btn:focus-visible/.test(text) && /outline/.test(text)) foundCatalogAdd = true;
        if (/body\.homepage \.homepage-category \.cat-quick-btn:focus-visible/.test(text)) foundHomeQuick = true;
        if (/\.float-cart:focus-visible/.test(text) && /outline/.test(text)) foundFloat = true;
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
      foundLegumes, foundCatalogAdd, foundHomeQuick, foundFloat, foundScroll,
      foundShopLink, foundNavOrder, foundBar, foundCabazVer, foundWa, foundLogo,
      foundConsentNo, foundConsentYes,
    };
  });
  ok(rules.foundLegumes, `${label}: leftover float-legumes :focus-visible rule is in the live stylesheet`);
  ok(rules.foundCatalogAdd, `${label}: leftover catalog Adicionar forest ring stays`);
  ok(rules.foundHomeQuick, `${label}: leftover homepage category tiles keep leftover #194 focus-visible`);
  ok(!rules.foundFloat, `${label}: leftover float-cart must not get a ring in this run`);
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

async function leftoverFloatLegumesRing(page, label) {
  const ring = await page.evaluate(async () => {
    const btn = document.getElementById('float-legumes');
    if (!btn) return { missing: true };
    const wasHidden = btn.hidden === true;
    btn.hidden = false;
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
      title: btn.getAttribute('title') || '',
      onclick: btn.getAttribute('onclick') || '',
      wasHidden,
      height: box.height,
      width: box.width,
      minHeight: cs.minHeight,
      outlineStyle: cs.outlineStyle,
      outlineWidth: cs.outlineWidth,
      outlineColor: cs.outlineColor,
      outlineOffset: cs.outlineOffset,
    };
    btn.blur();
    btn.hidden = wasHidden;
    return measured;
  });
  ok(!ring.missing, `${label}: leftover float-legumes is on leftover homepage`);
  ok(ring.active, `${label}: leftover float-legumes can take leftover keyboard focus`);
  ok(ring.tag === 'BUTTON', `${label}: leftover float-legumes stays leftover button`);
  ok(ring.type === '', `${label}: leftover float-legumes stays without leftover type=button`);
  ok(ring.text === 'Legumes', `${label}: leftover float-legumes stays leftover Legumes (got "${ring.text}")`);
  ok(ring.title === 'Ver legumes frescos',
    `${label}: leftover float-legumes title stays leftover Ver legumes frescos (got "${ring.title}")`);
  ok(ring.wasHidden === true, `${label}: leftover float-legumes stays leftover hidden before leftover ring measure`);
  ok(ring.onclick.includes("abrirCatalogo('legumes')"),
    `${label}: leftover float-legumes keeps leftover abrirCatalogo('legumes')`);
  const hasOutline = ring.outlineStyle && ring.outlineStyle !== 'none' && parseFloat(ring.outlineWidth || '0') > 0;
  ok(hasOutline, `${label}: leftover float-legumes forest ring (outline=${ring.outlineStyle}/${ring.outlineWidth}/${ring.outlineColor})`);
  ok(/rgb\(27,\s*67,\s*50\)/.test(ring.outlineColor || ''),
    `${label}: leftover float-legumes ring uses leftover forest`);
  ok(parseFloat(ring.outlineWidth || '0') >= 3,
    `${label}: leftover float-legumes ring stays leftover 3px (got ${ring.outlineWidth})`);
  ok(ring.height < 44 && (ring.minHeight === 'auto' || ring.minHeight === '0px' || parseFloat(ring.minHeight || '0') < 44),
    `${label}: leftover float-legumes should hug leftover labels, not invent leftover 44px tap (got ${ring.height}/${ring.minHeight})`);
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

async function clickFloatLegumes(page) {
  return page.evaluate(() => {
    const btn = document.getElementById('float-legumes');
    if (!btn) return { ok: false, reason: 'missing', type: '', hidden: null };
    btn.click();
    return {
      ok: true,
      type: btn.getAttribute('type') || '',
      text: (btn.textContent || '').replace(/\s+/g, ' ').trim(),
      hidden: btn.hidden === true,
    };
  });
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
    const floatLegumes = document.getElementById('float-legumes');
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
      floatLegumesType: floatLegumes?.getAttribute('type') || '',
      floatLegumesHidden: floatLegumes?.hidden === true,
      floatLegumesDisplay: floatLegumes ? getComputedStyle(floatLegumes).display : '',
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
  ok(chromeUi.floatLegumesType === '', `${label}: leftover float-legumes stays without leftover type=button`);
  ok(chromeUi.floatLegumesHidden === true && chromeUi.floatLegumesDisplay === 'none',
    `${label}: leftover float-legumes stays leftover hidden`);
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
  ok(bar.tabFrutasActive === true, '390 homepage: leftover Frutas tab should start leftover active');
  await leftoverHomeRules(mobile, '390 homepage');
  await leftoverFloatLegumesRing(mobile, '390 homepage');

  const clickLegumes = await clickFloatLegumes(mobile);
  ok(clickLegumes.ok && clickLegumes.type === '' && clickLegumes.hidden === true,
    '390 homepage: leftover float-legumes click stays without leftover type=button leftover hidden');
  await waitInView(mobile, 'produtos');
  const afterLegumes = await leftoverChrome(mobile, '390 after float-legumes');
  ok(afterLegumes.tabLegumesActive === true,
    '390 homepage: leftover float-legumes click should open leftover Legumes catálogo');
  ok(afterLegumes.cartCount === '0' || afterLegumes.cartCount === '',
    `390 homepage: leftover float-legumes should not add leftover cabaz (got "${afterLegumes.cartCount}")`);
  await leftoverFloatLegumesRing(mobile, '390 after float-legumes');

  await addMelancia(mobile, '390 after float-legumes');
  const afterAddClick = await clickFloatLegumes(mobile);
  ok(afterAddClick.ok && afterAddClick.type === '' && afterAddClick.hidden === true,
    '390 homepage: leftover float-legumes click after leftover add stays without leftover type=button leftover hidden');
  await waitInView(mobile, 'produtos');
  const afterAdd = await leftoverChrome(mobile, '390 after add click');
  ok(afterAdd.tabLegumesActive === true,
    '390 homepage: leftover float-legumes click after leftover add still opens leftover Legumes');
  ok(afterAdd.cartCount === '1',
    `390 homepage: leftover float-legumes should keep leftover Melancia 1/4 in leftover cart (got "${afterAdd.cartCount}")`);

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
  ok(!cat.hasBar, '390 Frutas: should not add a leftover SEO-page hamburger / leftover float-legumes');

  const desktop = await browser.newPage();
  desktop.on('pageerror', err => errors.push('1280 pageerror: ' + err.message));
  await openReady(desktop, 1280, 800);
  await leftoverChrome(desktop, '1280 homepage');
  await leftoverHomeRules(desktop, '1280 homepage');
  await leftoverFloatLegumesRing(desktop, '1280 homepage');

  const deskClick = await clickFloatLegumes(desktop);
  ok(deskClick.ok && deskClick.type === '' && deskClick.hidden === true,
    '1280 homepage: leftover float-legumes click stays without leftover type=button leftover hidden');
  await waitInView(desktop, 'produtos');
  const deskAfter = await leftoverChrome(desktop, '1280 after float-legumes');
  ok(deskAfter.tabLegumesActive === true,
    '1280 homepage: leftover float-legumes click should open leftover Legumes catálogo');

  await addMelancia(desktop, '1280 after float-legumes');
  const deskAddClick = await clickFloatLegumes(desktop);
  ok(deskAddClick.ok && deskAddClick.type === '',
    '1280 homepage: leftover float-legumes click after leftover add stays without leftover type=button');
  await waitInView(desktop, 'produtos');
  const deskAfterAdd = await leftoverChrome(desktop, '1280 after add click');
  ok(deskAfterAdd.tabLegumesActive === true,
    '1280 homepage: leftover float-legumes click after leftover add still opens leftover Legumes');
  ok(deskAfterAdd.cartCount === '1',
    `1280 homepage: leftover float-legumes should keep leftover Melancia 1/4 in leftover cart (got "${deskAfterAdd.cartCount}")`);

  await browser.close();
  server.close();
  if (errors.length) {
    console.error('check-float-legumes-focus-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
    process.exit(1);
  }
  console.log('check-float-legumes-focus-browser: ok');
} catch (err) {
  try { await browser.close(); } catch {}
  try { server.close(); } catch {}
  console.error(err);
  process.exit(1);
}
