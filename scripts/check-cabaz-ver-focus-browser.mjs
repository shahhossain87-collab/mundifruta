#!/usr/bin/env node
/** Chrome: leftover cabaz-ver Ver o que leva keyboard ring; add Melancia 1/4. */
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
    for (const sheet of [...document.styleSheets]) {
      let sheetRules;
      try { sheetRules = [...sheet.cssRules]; } catch { continue; }
      for (const rule of sheetRules) {
        const text = rule.cssText || '';
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
      }
    }
    return {
      foundCabazVer, foundCreditsWrap, foundCreditsBack, foundFooterCredit, foundPrivacyLinks,
      foundPrivacyClose, foundPrivacyReset, foundConsentLink, foundGhost, foundPrim,
      foundWa, foundEm, foundShopLink, foundFeatureAdd, foundFeaturePhoto,
      foundCarousel, foundFloat, foundOptional, foundScroll, foundBar,
      foundFooterLinks, foundHomeQuick, foundCatalogAdd, foundCabazModalAdd, foundCabazModalClose,
    };
  });
  ok(rules.foundCabazVer, `${label}: leftover cabaz-ver :focus-visible rule is in the live stylesheet`);
  ok(rules.foundCatalogAdd, `${label}: leftover catalog Adicionar forest ring stays`);
  ok(rules.foundHomeQuick, `${label}: leftover homepage category tiles keep leftover #194 focus-visible`);
  ok(!rules.foundCreditsWrap, `${label}: leftover credits-wrap must not get a ring in this run`);
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
  ok(!rules.foundCabazModalAdd, `${label}: leftover cabaz-modal-add must not get a ring in this run`);
  ok(!rules.foundCabazModalClose, `${label}: leftover cabaz-modal-close must not get a ring in this run`);
}

async function leftoverCabazVerRing(page, label) {
  const ring = await page.evaluate(async () => {
    const cabazes = document.getElementById('cabazes');
    if (cabazes) cabazes.scrollIntoView({ block: 'center' });
    const card = [...document.querySelectorAll('#grid-cabazes .product-card')]
      .find(c => /Cabaz Detox/i.test(c.textContent || ''));
    const btn = card ? card.querySelector('.cabaz-ver') : null;
    if (!btn) return { missing: true };
    btn.scrollIntoView({ block: 'center', inline: 'nearest' });
    try { btn.focus({ preventScroll: true, focusVisible: true }); }
    catch { btn.focus({ preventScroll: true }); }
    await new Promise(r => setTimeout(r, 200));
    if (document.activeElement !== btn) {
      try { btn.focus({ preventScroll: true, focusVisible: true }); }
      catch { btn.focus({ preventScroll: true }); }
    }
    await new Promise(r => setTimeout(r, 200));
    const cs = getComputedStyle(btn);
    const names = [...document.querySelectorAll('#grid-cabazes .product-name')]
      .map(el => (el.textContent || '').replace(/\s+/g, ' ').trim());
    return {
      missing: false,
      active: document.activeElement === btn,
      text: (btn.textContent || '').replace(/\s+/g, ' ').trim(),
      type: btn.getAttribute('type'),
      outlineStyle: cs.outlineStyle,
      outlineWidth: cs.outlineWidth,
      outlineColor: cs.outlineColor,
      names,
    };
  });
  ok(ring && !ring.missing, `${label}: leftover cabaz-ver is on leftover Cabaz Detox`);
  ok(ring && ring.active, `${label}: leftover cabaz-ver can take keyboard focus`);
  const hasOutline = ring && ring.outlineStyle && ring.outlineStyle !== 'none' && parseFloat(ring.outlineWidth || '0') > 0;
  ok(hasOutline, `${label}: leftover cabaz-ver forest ring (outline=${ring?.outlineStyle}/${ring?.outlineWidth}/${ring?.outlineColor})`);
  ok(ring && /rgb\(27,\s*67,\s*50\)/.test(ring.outlineColor || ''), `${label}: leftover cabaz-ver ring uses leftover forest`);
  ok(ring && ring.text.includes('Ver o que leva'), `${label}: leftover cabaz-ver copy stays Ver o que leva (got "${ring?.text}")`);
  ok(ring && ring.type === null, `${label}: leftover cabaz-ver stays without a type attribute`);
  ok(ring && ring.names.includes('Cabaz Detox'), `${label}: leftover Cabaz Detox name stays`);
  ok(ring && ring.names.includes('Cabaz Familiar'), `${label}: leftover Cabaz Familiar name stays`);
  ok(ring && ring.names.includes('Cabaz de Verão'), `${label}: leftover Cabaz de Verão name stays`);
  ok(ring && ring.names.includes('Cabaz de Legumes'), `${label}: leftover Cabaz de Legumes name stays`);

  const opened = await page.evaluate(() => {
    const card = [...document.querySelectorAll('#grid-cabazes .product-card')]
      .find(c => /Cabaz Detox/i.test(c.textContent || ''));
    const btn = card ? card.querySelector('.cabaz-ver') : null;
    if (btn) btn.click();
    const modal = document.getElementById('cabaz-modal');
    const title = document.getElementById('cabaz-modal-title');
    const add = document.getElementById('cabaz-modal-add');
    const close = document.querySelector('.cabaz-modal-close');
    const result = {
      open: modal ? modal.classList.contains('open') : false,
      title: (title?.textContent || '').replace(/\s+/g, ' ').trim(),
      addText: (add?.textContent || '').trim(),
      closeText: (close?.textContent || '').trim(),
    };
    if (window.fecharCabaz) window.fecharCabaz();
    return result;
  });
  ok(opened.open, `${label}: leftover cabaz-ver still opens leftover cabaz modal`);
  ok(opened.title === 'Cabaz Detox', `${label}: leftover cabaz modal still names Cabaz Detox`);
  ok(opened.addText === '＋', `${label}: leftover cabaz-modal add stays a visible plus`);
  ok(opened.closeText === '✕', `${label}: leftover cabaz-modal close stays a visible ✕`);
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
  await openReady(desktop, 1280, 800);
  await leftoverHomeRules(desktop, '1280');
  await leftoverCabazVerRing(desktop, '1280');
  await leftoverStorefront(desktop, '1280');

  const tablet = await browser.newPage();
  tablet.on('pageerror', err => errors.push('768 pageerror: ' + err.message));
  await openReady(tablet, 768, 1024);
  await leftoverHomeRules(tablet, '768');
  await leftoverCabazVerRing(tablet, '768');
  await addMelancia(tablet, '768');

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
  await leftoverCabazVerRing(mobile, '390');
  await addMelancia(mobile, '390');

  await browser.close();
  server.close();
  if (errors.length) {
    console.error('check-cabaz-ver-focus-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
    process.exit(1);
  }
  console.log('check-cabaz-ver-focus-browser: ok');
} catch (err) {
  try { await browser.close(); } catch {}
  try { server.close(); } catch {}
  console.error(err);
  process.exit(1);
}
