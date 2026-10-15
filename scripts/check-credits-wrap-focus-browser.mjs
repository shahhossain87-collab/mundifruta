#!/usr/bin/env node
/** Chrome: leftover credits-wrap license / fonte keyboard ring; add Melancia 1/4. */
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

async function openCredits(page, vw, vh) {
  await page.setViewport({ width: vw, height: vh, deviceScaleFactor: 1, isMobile: vw <= 430 });
  await page.goto(`${base}creditos.html`, { waitUntil: 'networkidle0', timeout: 60000 });
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

async function leftoverHomeRules(page, label) {
  const rules = await page.evaluate(() => {
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
    for (const sheet of [...document.styleSheets]) {
      let sheetRules;
      try { sheetRules = [...sheet.cssRules]; } catch { continue; }
      for (const rule of sheetRules) {
        const text = rule.cssText || '';
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
      }
    }
    return {
      foundCreditsWrap, foundCreditsBack, foundFooterCredit, foundPrivacyLinks,
      foundPrivacyClose, foundPrivacyReset, foundConsentLink, foundGhost, foundPrim,
      foundWa, foundEm, foundShopLink, foundFeatureAdd, foundFeaturePhoto,
      foundCarousel, foundFloat, foundOptional, foundScroll, foundBar,
      foundFooterLinks, foundHomeQuick, foundCatalogAdd,
    };
  });
  ok(rules.foundCreditsWrap, `${label}: leftover credits-wrap :focus-visible rule is in the live stylesheet`);
  ok(rules.foundCatalogAdd, `${label}: leftover catalog Adicionar forest ring stays`);
  ok(rules.foundHomeQuick, `${label}: leftover homepage category tiles keep leftover #194 focus-visible`);
  ok(!rules.foundCreditsBack, `${label}: leftover credits-back must not get a ring in this run`);
  ok(!rules.foundFooterCredit, `${label}: leftover footer-credit must not get a ring in this run`);
  ok(!rules.foundPrivacyLinks, `${label}: leftover privacy-dialog links must not get a ring in this run`);
  ok(!rules.foundPrivacyClose, `${label}: leftover privacy-dialog close must not get a ring in this run`);
  ok(!rules.foundPrivacyReset, `${label}: leftover privacy reset must not get a ring in this run`);
  ok(!rules.foundConsentLink, `${label}: leftover consent Saber mais must not get a ring in this run`);
  ok(!rules.foundGhost, `${label}: leftover hero ghost CTA must not get a ring in this run`);
  ok(!rules.foundPrim, `${label}: leftover primary CTA must not get a ring in this run`);
  ok(!rules.foundWa, `${label}: leftover checkout WhatsApp CTA must not get a ring in this run`);
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
}

async function leftoverCreditsWrapRing(page, label) {
  const rules = await page.evaluate(() => {
    let foundCreditsWrap = false;
    let foundCreditsBack = false;
    let foundFooterCredit = false;
    for (const sheet of [...document.styleSheets]) {
      let sheetRules;
      try { sheetRules = [...sheet.cssRules]; } catch { continue; }
      for (const rule of sheetRules) {
        const text = rule.cssText || '';
        if (/\.credits-wrap a:focus-visible/.test(text) && /outline/.test(text)) foundCreditsWrap = true;
        if (/\.credits-back:focus-visible/.test(text) && /outline/.test(text)) foundCreditsBack = true;
        if (/\.footer-credit a:focus-visible/.test(text) && /outline/.test(text)) foundFooterCredit = true;
      }
    }
    return { foundCreditsWrap, foundCreditsBack, foundFooterCredit };
  });
  ok(rules.foundCreditsWrap, `${label}: leftover credits-wrap :focus-visible rule is on leftover credits page`);
  ok(!rules.foundCreditsBack, `${label}: leftover credits-back must not get a dedicated ring in this run`);
  ok(!rules.foundFooterCredit, `${label}: leftover footer-credit must not get a ring in this run`);

  const ring = await page.evaluate(async () => {
    const license = document.querySelector('.credits-wrap li a');
    const fonte = [...document.querySelectorAll('.credits-wrap li a')]
      .find(a => (a.textContent || '').trim() === 'fonte');
    const back = document.querySelector('.credits-back');
    const heading = document.querySelector('h1');
    if (!license) return { missing: true };
    license.scrollIntoView({ block: 'center', inline: 'nearest' });
    try { license.focus({ preventScroll: true, focusVisible: true }); }
    catch { license.focus({ preventScroll: true }); }
    await new Promise(r => setTimeout(r, 200));
    if (document.activeElement !== license) {
      try { license.focus({ preventScroll: true, focusVisible: true }); }
      catch { license.focus({ preventScroll: true }); }
    }
    await new Promise(r => setTimeout(r, 200));
    const cs = getComputedStyle(license);
    const icon = document.querySelector('link[rel="icon"]');
    return {
      missing: false,
      active: document.activeElement === license,
      href: license.getAttribute('href') || '',
      text: (license.textContent || '').replace(/\s+/g, ' ').trim(),
      fonteHref: fonte ? fonte.getAttribute('href') || '' : '',
      fonteText: fonte ? (fonte.textContent || '').replace(/\s+/g, ' ').trim() : '',
      outlineStyle: cs.outlineStyle,
      outlineWidth: cs.outlineWidth,
      outlineColor: cs.outlineColor,
      heading: (heading?.textContent || '').replace(/\s+/g, ' ').trim(),
      backHref: back ? back.getAttribute('href') || '' : '',
      backText: back ? (back.textContent || '').replace(/\s+/g, ' ').trim() : '',
      hasIcon: !!icon,
    };
  });
  ok(ring && !ring.missing, `${label}: leftover credits-wrap license link is in leftover .credits-wrap li a`);
  ok(ring && ring.active, `${label}: leftover credits-wrap license link can take keyboard focus`);
  const hasOutline = ring && ring.outlineStyle && ring.outlineStyle !== 'none' && parseFloat(ring.outlineWidth || '0') > 0;
  ok(hasOutline, `${label}: leftover credits-wrap forest ring (outline=${ring?.outlineStyle}/${ring?.outlineWidth}/${ring?.outlineColor})`);
  ok(ring && /rgb\(27,\s*67,\s*50\)/.test(ring.outlineColor || ''), `${label}: leftover credits-wrap ring uses leftover forest`);
  ok(ring && /creativecommons\.org\/licenses\//.test(ring.href || ''), `${label}: leftover first license still points at leftover Creative Commons`);
  ok(ring && ring.text === 'CC BY-SA 4.0', `${label}: leftover first license copy stays CC BY-SA 4.0`);
  ok(ring && /commons\.wikimedia\.org/.test(ring.fonteHref || ''), `${label}: leftover fonte still points at leftover Wikimedia Commons`);
  ok(ring && ring.fonteText === 'fonte', `${label}: leftover fonte copy stays fonte`);
  ok(ring && ring.backHref === 'index.html', `${label}: leftover credits-back still points at leftover index.html`);
  ok(ring && ring.backText === '← Voltar à loja', `${label}: leftover credits-back copy stays ← Voltar à loja`);
  ok(ring && ring.heading === 'Créditos das fotos', `${label}: leftover credits heading stays Créditos das fotos`);
  ok(ring && ring.hasIcon === false, `${label}: leftover credits page still has no leftover favicon`);
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

  await addMelancia(page, label);
  const qty = await page.evaluate(() => {
    const card = [...document.querySelectorAll('.shop-main .product-card')]
      .find(c => /Melancia 1\/4/i.test(c.textContent || ''));
    const plus = card ? [...card.querySelectorAll('.qty-btn')].find(b => /\+|Mais|Aumentar/i.test(b.textContent + (b.getAttribute('aria-label') || ''))) : null;
    if (plus) plus.click();
    return document.getElementById('cart-count')?.textContent || '';
  });
  ok(qty === '2', `${label}: leftover + increments 1→2 (count=${qty})`);

  const dest = await page.evaluate(() => {
    const enc = document.getElementById('encomenda');
    if (window.irParaEncomenda) window.irParaEncomenda();
    return {
      hasEnc: !!enc,
      priv: typeof window.abrirPrivacidade === 'function',
    };
  });
  ok(dest.hasEnc && dest.priv, `${label}: leftover irParaEncomenda still targets leftover #encomenda and leftover Privacidade still opens`);
}

try {
  const desktop = await browser.newPage();
  desktop.on('pageerror', err => errors.push('1280 pageerror: ' + err.message));
  await openCredits(desktop, 1280, 800);
  await leftoverCreditsWrapRing(desktop, '1280 credits');
  await openReady(desktop, 1280, 800);
  await leftoverHomeRules(desktop, '1280');
  await leftoverStorefront(desktop, '1280');

  const tablet = await browser.newPage();
  tablet.on('pageerror', err => errors.push('768 pageerror: ' + err.message));
  await openCredits(tablet, 768, 1024);
  await leftoverCreditsWrapRing(tablet, '768 credits');
  await openReady(tablet, 768, 1024);
  await leftoverHomeRules(tablet, '768');
  await addMelancia(tablet, '768');

  const mobile = await browser.newPage();
  mobile.on('pageerror', err => errors.push('390 pageerror: ' + err.message));
  await openCredits(mobile, 390, 844);
  await leftoverCreditsWrapRing(mobile, '390 credits');
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
  await addMelancia(mobile, '390');

  await browser.close();
  server.close();
  if (errors.length) {
    console.error('check-credits-wrap-focus-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
    process.exit(1);
  }
  console.log('check-credits-wrap-focus-browser: ok');
} catch (err) {
  try { await browser.close(); } catch {}
  try { server.close(); } catch {}
  console.error(err);
  process.exit(1);
}
