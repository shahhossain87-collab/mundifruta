#!/usr/bin/env node
/** Chrome: leftover Combina bem / checkout cs-card keyboard ring; add Melancia 1/4. */
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
      foundCsCard, foundCabazVer, foundCreditsWrap, foundCreditsBack, foundFooterCredit,
      foundPrivacyLinks, foundPrivacyClose, foundPrivacyReset, foundConsentLink, foundGhost,
      foundPrim, foundWa, foundEm, foundShopLink, foundFeatureAdd, foundFeaturePhoto,
      foundCarousel, foundFloat, foundOptional, foundScroll, foundBar, foundFooterLinks,
      foundHomeQuick, foundCatalogAdd, foundCabazModalAdd, foundCabazModalClose,
      foundCsSkip, foundCsClose,
    };
  });
  ok(rules.foundCsCard, `${label}: leftover cs-card :focus-visible rule is in the live stylesheet`);
  ok(rules.foundCatalogAdd, `${label}: leftover catalog Adicionar forest ring stays`);
  ok(rules.foundHomeQuick, `${label}: leftover homepage category tiles keep leftover #194 focus-visible`);
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

async function leftoverCsCardRing(page, label) {
  const ring = await page.evaluate(async () => {
    if (window.limparTudo) window.limparTudo();
    if (window.mostrarCategoria) window.mostrarCategoria('frutas', document.getElementById('tab-frutas'));
    const card = [...document.querySelectorAll('.shop-main .product-card')]
      .find(c => /Melancia 1\/4/i.test(c.textContent || ''));
    const add = card ? card.querySelector('.add-btn') : null;
    if (add) add.click();
    const pop = document.getElementById('cs-pop');
    const title = document.getElementById('cs-pop-title');
    const skip = document.querySelector('.cs-pop-skip');
    const close = document.querySelector('.cs-pop-close');
    const btn = document.querySelector('#cs-pop-row .cs-card');
    if (!btn) {
      return {
        missing: true,
        count: document.getElementById('cart-count')?.textContent || '',
        title: (title?.textContent || '').replace(/\s+/g, ' ').trim(),
        popHidden: pop ? pop.hidden : true,
      };
    }
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
    const names = [...document.querySelectorAll('#cs-pop-row .cs-nome')]
      .map(el => (el.textContent || '').replace(/\s+/g, ' ').trim());
    const plus = [...document.querySelectorAll('#cs-pop-row .cs-add')]
      .map(el => (el.textContent || '').trim());
    return {
      missing: false,
      active: document.activeElement === btn,
      type: btn.getAttribute('type'),
      onclick: btn.getAttribute('onclick') || '',
      outlineStyle: cs.outlineStyle,
      outlineWidth: cs.outlineWidth,
      outlineColor: cs.outlineColor,
      names,
      plus,
      title: (title?.textContent || '').replace(/\s+/g, ' ').trim(),
      skip: (skip?.textContent || '').replace(/\s+/g, ' ').trim(),
      close: (close?.textContent || '').trim(),
      popHidden: pop ? pop.hidden : true,
      count: document.getElementById('cart-count')?.textContent || '',
    };
  });
  ok(ring && !ring.missing, `${label}: leftover cs-card is in leftover Combina bem sheet (count=${ring?.count})`);
  ok(ring && ring.count === '1', `${label}: leftover Melancia 1/4 still adds to cart (count=${ring?.count})`);
  ok(ring && ring.active, `${label}: leftover cs-card can take keyboard focus`);
  const hasOutline = ring && ring.outlineStyle && ring.outlineStyle !== 'none' && parseFloat(ring.outlineWidth || '0') > 0;
  ok(hasOutline, `${label}: leftover cs-card forest ring (outline=${ring?.outlineStyle}/${ring?.outlineWidth}/${ring?.outlineColor})`);
  ok(ring && /rgb\(27,\s*67,\s*50\)/.test(ring.outlineColor || ''), `${label}: leftover cs-card ring uses leftover forest`);
  ok(ring && ring.type === 'button', `${label}: leftover cs-card stays type=button`);
  ok(ring && /csAdd\(/.test(ring.onclick || ''), `${label}: leftover cs-card still calls leftover csAdd`);
  ok(ring && /Combina bem/i.test(ring.title || ''), `${label}: leftover Combina bem title stays (got "${ring?.title}")`);
  ok(ring && ring.skip === 'Continuar sem adicionar', `${label}: leftover Continuar sem adicionar stays`);
  ok(ring && ring.close === '✕', `${label}: leftover Combina bem close stays a visible ✕`);
  ok(ring && ring.plus.every(t => t === '＋'), `${label}: leftover cs-card ＋ stays`);
  ok(ring && ring.names.some(n => /Morango/i.test(n)), `${label}: leftover Combina bem still suggests Morango`);
  ok(ring && ring.popHidden === false, `${label}: leftover Combina bem sheet stays open for leftover keyboard focus`);

  const cartRow = await page.evaluate(async () => {
    const enc = document.getElementById('encomenda');
    if (enc) enc.scrollIntoView({ block: 'center' });
    const box = document.getElementById('crosssell-cart');
    const title = box ? box.querySelector('.cs-title') : null;
    const btn = document.querySelector('#crosssell-cart-row .cs-card');
    if (!btn) {
      return {
        missing: true,
        hidden: box ? box.hidden : true,
        title: (title?.textContent || '').replace(/\s+/g, ' ').trim(),
      };
    }
    btn.scrollIntoView({ block: 'center', inline: 'nearest' });
    try { btn.focus({ preventScroll: true, focusVisible: true }); }
    catch { btn.focus({ preventScroll: true }); }
    await new Promise(r => setTimeout(r, 200));
    const cs = getComputedStyle(btn);
    return {
      missing: false,
      hidden: box ? box.hidden : true,
      title: (title?.textContent || '').replace(/\s+/g, ' ').trim(),
      active: document.activeElement === btn,
      outlineStyle: cs.outlineStyle,
      outlineWidth: cs.outlineWidth,
      outlineColor: cs.outlineColor,
      type: btn.getAttribute('type'),
    };
  });
  ok(cartRow && !cartRow.missing && cartRow.hidden === false,
    `${label}: leftover checkout Complete o seu pedido still shows leftover cs-card`);
  ok(cartRow && /Complete o seu pedido/i.test(cartRow.title || ''),
    `${label}: leftover checkout cross-sell title stays (got "${cartRow?.title}")`);
  const cartOutline = cartRow && cartRow.outlineStyle && cartRow.outlineStyle !== 'none' && parseFloat(cartRow.outlineWidth || '0') > 0;
  ok(cartOutline, `${label}: leftover checkout cs-card forest ring (outline=${cartRow?.outlineStyle}/${cartRow?.outlineWidth}/${cartRow?.outlineColor})`);
  ok(cartRow && /rgb\(27,\s*67,\s*50\)/.test(cartRow.outlineColor || ''),
    `${label}: leftover checkout cs-card ring uses leftover forest`);
  ok(cartRow && cartRow.type === 'button', `${label}: leftover checkout cs-card stays type=button`);

  await page.evaluate(() => {
    if (window.fecharCrossSell) window.fecharCrossSell();
  });
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
  await leftoverCsCardRing(desktop, '1280');
  await leftoverStorefront(desktop, '1280');

  const tablet = await browser.newPage();
  tablet.on('pageerror', err => errors.push('768 pageerror: ' + err.message));
  await openReady(tablet, 768, 1024);
  await leftoverHomeRules(tablet, '768');
  await leftoverCsCardRing(tablet, '768');

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
  await leftoverCsCardRing(mobile, '390');

  await browser.close();
  server.close();
  if (errors.length) {
    console.error('check-cs-card-focus-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
    process.exit(1);
  }
  console.log('check-cs-card-focus-browser: ok');
} catch (err) {
  try { await browser.close(); } catch {}
  try { server.close(); } catch {}
  console.error(err);
  process.exit(1);
}
