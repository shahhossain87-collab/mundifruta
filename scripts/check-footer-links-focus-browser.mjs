#!/usr/bin/env node
/**
 * Chrome: leftover footer shop-link keyboard ring;
 * leftover 4-item bar; leftover search morango/tomate; add Melancia 1/4.
 */
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

function isForest(color) {
  const c = String(color || '').replace(/\s+/g, '');
  return c === 'rgb(27,67,50)' || c === '#1B4332' || c === 'var(--forest)';
}

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
    document.querySelectorAll('.fi').forEach(el => {
      el.style.transition = 'none';
      el.classList.add('on');
    });
  });
}

async function leftoverChrome(page, label) {
  const chromeUi = await page.evaluate(() => {
    const hamburger = document.querySelector('.hamburger');
    const bar = [...document.querySelectorAll('.mb-item')].map(el =>
      (el.textContent || '').replace(/\s+/g, ' ').trim()
    );
    const burgerCs = hamburger ? getComputedStyle(hamburger) : null;
    return {
      burgerDisplay: burgerCs ? burgerCs.display : '',
      burgerExpanded: hamburger ? hamburger.getAttribute('aria-expanded') : 'missing',
      burgerLabel: hamburger ? (hamburger.getAttribute('aria-label') || '').trim() : '',
      barDisplay: getComputedStyle(document.getElementById('mobile-bar') || document.body).display,
      bar,
    };
  });
  if (label === '390') {
    ok(chromeUi.burgerDisplay === 'flex', `${label}: leftover hamburger stays visible`);
    ok(chromeUi.burgerExpanded === null, `${label}: leftover hamburger stays without expanded`);
    ok(chromeUi.burgerLabel === 'Menu', `${label}: leftover hamburger stays named Menu`);
    ok(chromeUi.barDisplay !== 'none', `${label}: leftover 4-item bar stays visible`);
    ok(chromeUi.bar.some(t => /Carrinho/i.test(t)), `${label}: leftover 4-item bar still lists Carrinho`);
    ok(chromeUi.bar.some(t => /Promoções/i.test(t)), `${label}: leftover 4-item bar still lists Promoções`);
    ok(chromeUi.bar.some(t => /WhatsApp/i.test(t)), `${label}: leftover 4-item bar still lists WhatsApp`);
    ok(chromeUi.bar.some(t => /Como Chegar/i.test(t)), `${label}: leftover 4-item bar still lists Como Chegar`);
    ok(chromeUi.bar.length === 4, `${label}: leftover 4-item bar stays (got ${chromeUi.bar.length})`);
  }
}

async function leftoverSearch(page, label) {
  const found = await page.evaluate(() => {
    const search = document.getElementById('search-input');
    if (search) {
      search.value = 'morango';
      search.dispatchEvent(new Event('input', { bubbles: true }));
    }
    const morango = [...document.querySelectorAll('.shop-main .product-card')]
      .some(c => /Morango/i.test(c.textContent || ''));
    if (search) {
      search.value = 'tomate';
      search.dispatchEvent(new Event('input', { bubbles: true }));
    }
    const tomate = [...document.querySelectorAll('.shop-main .product-card')]
      .some(c => /Tomate/i.test(c.textContent || ''));
    if (window.limparTudo) window.limparTudo();
    if (window.mostrarCategoria) window.mostrarCategoria('frutas', document.getElementById('tab-frutas'));
    return { morango, tomate };
  });
  ok(found.morango, `${label}: leftover search morango still finds a card`);
  ok(found.tomate, `${label}: leftover search tomate still finds a card`);
}

async function leftoverFooterLinksRing(page, label) {
  const rules = await page.evaluate(() => {
    let foundFooter = false;
    let foundNavOrder = false;
    let foundContinuar = false;
    let foundEm = false;
    let foundWa = false;
    let foundPrim = false;
    let foundLogo = false;
    let foundMobileClose = false;
    let foundHamburger = false;
    let foundClear = false;
    let foundNo = false;
    let foundYes = false;
    let foundLink = false;
    let foundReset = false;
    let foundClose = false;
    let foundCredit = false;
    for (const sheet of [...document.styleSheets]) {
      let sheetRules;
      try { sheetRules = [...sheet.cssRules]; } catch { continue; }
      for (const rule of sheetRules) {
        const text = rule.cssText || '';
        if (/\.footer-links a:focus-visible/.test(text) && /outline/.test(text)) foundFooter = true;
        if (/\.nav-order:focus-visible/.test(text) && /outline/.test(text)) foundNavOrder = true;
        if (/\.btn-continuar:focus-visible/.test(text) && /outline/.test(text)) foundContinuar = true;
        if (/\.btn-em:focus-visible/.test(text) && /outline/.test(text)) foundEm = true;
        if (/\.btn-wa:focus-visible/.test(text) && /outline/.test(text)) foundWa = true;
        if (/\.btn-prim:focus-visible/.test(text) && /outline/.test(text)) foundPrim = true;
        if (/\.logo:focus-visible/.test(text) && /outline/.test(text)) foundLogo = true;
        if (/\.mobile-close:focus-visible/.test(text) && /outline/.test(text)) foundMobileClose = true;
        if (/\.hamburger:focus-visible/.test(text) && /outline/.test(text)) foundHamburger = true;
        if (/\.search-clear:focus-visible/.test(text) && /outline/.test(text)) foundClear = true;
        if (/\.consent-no:focus-visible/.test(text) && /outline/.test(text)) foundNo = true;
        if (/\.consent-yes:focus-visible/.test(text) && /outline/.test(text)) foundYes = true;
        if (/\.consent-link:focus-visible/.test(text) && /outline/.test(text)) foundLink = true;
        if (/\.privacy-reset:focus-visible/.test(text) && /outline/.test(text)) foundReset = true;
        if (/\.privacy-close:focus-visible/.test(text) && /outline/.test(text)) foundClose = true;
        if (/\.footer-credit a:focus-visible/.test(text) && /outline/.test(text)) foundCredit = true;
      }
    }
    return {
      foundFooter, foundNavOrder, foundContinuar, foundEm, foundWa, foundPrim, foundLogo, foundMobileClose, foundHamburger, foundClear, foundNo, foundYes,
      foundLink, foundReset, foundClose, foundCredit,
    };
  });
  ok(rules.foundFooter, `${label}: leftover footer shop links :focus-visible rule is in the live stylesheet`);
  ok(!rules.foundNavOrder, `${label}: leftover header Encomendar must not get a ring in this run`);
  ok(!rules.foundContinuar, `${label}: leftover Continuar a comprar must not get a ring in this run`);
  ok(!rules.foundEm, `${label}: leftover email CTA must not get a ring in this run`);
  ok(!rules.foundWa, `${label}: leftover WhatsApp CTA must not get a ring in this run`);
  ok(!rules.foundPrim, `${label}: leftover primary CTA must not get a ring in this run`);
  ok(!rules.foundLogo, `${label}: leftover header wordmark must not get a ring in this run`);
  ok(!rules.foundMobileClose, `${label}: leftover mobile-menu close must not get a ring in this run`);
  ok(!rules.foundHamburger, `${label}: leftover hamburger must not get a ring in this run`);
  ok(!rules.foundClear, `${label}: leftover catalog search-clear must not get a ring in this run`);
  ok(!rules.foundReset, `${label}: leftover privacy Repor consentimento must not get a ring in this run`);
  ok(!rules.foundLink, `${label}: leftover consent Saber mais must not get a ring in this run`);
  ok(!rules.foundNo, `${label}: leftover consent Só essenciais must not get a ring in this run`);
  ok(!rules.foundYes, `${label}: leftover consent Aceitar tudo must not get a ring in this run`);
  ok(!rules.foundClose, `${label}: leftover privacy-dialog close must not get a ring in this run`);
  ok(!rules.foundCredit, `${label}: leftover footer-credit must not get a ring in this run`);

  const ring = await page.evaluate(async () => {
    document.documentElement.style.scrollBehavior = 'auto';
    const consent = document.getElementById('consent'); if (consent) consent.hidden = true;
    const offer = document.getElementById('offer-pop'); if (offer) offer.hidden = true;
    const links = [...document.querySelectorAll('.footer-links a')];
    const produtos = links.find(a => (a.textContent || '').trim() === 'Produtos');
    const privacidade = links.find(a => (a.textContent || '').trim() === 'Privacidade');
    const creditos = links.find(a => /Créditos/i.test(a.textContent || ''));
    const em = document.querySelector('.order-btns .btn-em');
    const wa = document.querySelector('.order-btns .btn-wa');
    const prim = document.querySelector('.btn-prim');
    const ctas = document.querySelector('.hero-ctas');
    const continuar = document.querySelector('.btn-continuar');
    const navOrder = document.querySelector('.nav-order');
    if (!produtos) return null;
    produtos.focus({ preventScroll: true });
    await new Promise(r => setTimeout(r, 200));
    if (document.activeElement !== produtos) produtos.focus({ preventScroll: true });
    await new Promise(r => setTimeout(r, 200));
    const cs = getComputedStyle(produtos);
    const wrapCs = getComputedStyle(document.querySelector('.footer-links') || produtos);
    return {
      wrapDisplay: wrapCs.display,
      hidden: cs.display === 'none' || cs.visibility === 'hidden',
      hiddenHero: !ctas || getComputedStyle(ctas).display === 'none',
      hiddenNavOrder: !navOrder || getComputedStyle(navOrder).display === 'none',
      primText: prim ? (prim.textContent || '').replace(/\s+/g, ' ').trim() : '',
      primHref: prim ? (prim.getAttribute('href') || '') : '',
      waText: wa ? (wa.textContent || '').replace(/\s+/g, ' ').trim() : '',
      waType: wa ? (wa.getAttribute('type') || '') : '',
      emText: em ? (em.textContent || '').replace(/\s+/g, ' ').trim() : '',
      emType: em ? (em.getAttribute('type') || '') : '',
      emOnclick: em ? (em.getAttribute('onclick') || '') : '',
      continuarText: continuar ? (continuar.textContent || '').replace(/\s+/g, ' ').trim() : '',
      continuarType: continuar ? (continuar.getAttribute('type') || '') : '',
      continuarOnclick: continuar ? (continuar.getAttribute('onclick') || '') : '',
      active: document.activeElement === produtos,
      display: cs.display,
      texts: links.map(a => (a.textContent || '').replace(/\s+/g, ' ').trim()),
      hrefs: links.map(a => a.getAttribute('href') || ''),
      privacidadeOnclick: privacidade ? (privacidade.getAttribute('onclick') || '') : '',
      creditosHref: creditos ? (creditos.getAttribute('href') || '') : '',
      outlineStyle: cs.outlineStyle,
      outlineWidth: cs.outlineWidth,
      outlineColor: cs.outlineColor,
      menuLinks: [...document.querySelectorAll('#mobile-menu a')].map(a => (a.textContent || '').trim()),
    };
  });
  ok(!!ring, `${label}: leftover footer shop links exist`);
  if (ring) {
    ok(ring.texts.includes('Produtos'), `${label}: leftover footer still lists Produtos`);
    ok(ring.texts.includes('Quem Somos'), `${label}: leftover footer still lists Quem Somos`);
    ok(ring.texts.includes('Encomendar'), `${label}: leftover footer still lists Encomendar`);
    ok(ring.texts.includes('Contacto'), `${label}: leftover footer still lists Contacto`);
    ok(ring.texts.includes('Privacidade'), `${label}: leftover footer still lists Privacidade`);
    ok(ring.texts.some(t => /Créditos das fotos/i.test(t)), `${label}: leftover footer still lists Créditos das fotos`);
    ok(ring.hrefs.includes('#produtos'), `${label}: leftover footer Produtos still points at leftover #produtos`);
    ok(ring.hrefs.includes('#quem-somos'), `${label}: leftover footer Quem Somos still points at leftover #quem-somos`);
    ok(ring.hrefs.includes('#encomenda'), `${label}: leftover footer Encomendar still points at leftover #encomenda`);
    ok(ring.hrefs.includes('#contacto'), `${label}: leftover footer Contacto still points at leftover #contacto`);
    ok(ring.privacidadeOnclick.includes('abrirPrivacidade()'), `${label}: leftover footer Privacidade still calls leftover abrirPrivacidade`);
    ok(ring.creditosHref === 'creditos.html', `${label}: leftover footer Créditos still points at leftover creditos.html`);
    ok(ring.continuarText === '← Continuar a comprar', `${label}: leftover Continuar a comprar stays ← Continuar a comprar`);
    ok(ring.continuarType === 'button', `${label}: leftover Continuar a comprar stays type=button`);
    ok(ring.continuarOnclick === 'continuarAComprar()', `${label}: leftover Continuar a comprar still calls leftover continuarAComprar`);
    ok(ring.emText === 'ou encomende por email', `${label}: leftover email CTA stays ou encomende por email`);
    ok(ring.emType === 'button', `${label}: leftover email CTA stays type=button`);
    ok(ring.emOnclick === 'enviarEmail()', `${label}: leftover email CTA still calls leftover enviarEmail`);
    ok(ring.waText === '📱 Encomendar por WhatsApp', `${label}: leftover WhatsApp CTA stays Encomendar por WhatsApp`);
    ok(ring.waType === 'submit', `${label}: leftover WhatsApp CTA stays type=submit`);
    ok(ring.primText === 'Comprar Agora', `${label}: leftover primary CTA stays Comprar Agora`);
    ok(ring.primHref === '#produtos', `${label}: leftover primary CTA still points at leftover #produtos`);
    ok(ring.menuLinks.includes('Promoções'), `${label}: leftover mobile-menu still lists Promoções`);
    ok(ring.menuLinks.includes('Cabazes'), `${label}: leftover mobile-menu still lists Cabazes`);
    ok(ring.menuLinks.includes('Como Funciona'), `${label}: leftover mobile-menu still lists Como Funciona`);
    ok(ring.menuLinks.includes('Produtos'), `${label}: leftover mobile-menu still lists Produtos`);
    ok(ring.menuLinks.includes('Quem Somos'), `${label}: leftover mobile-menu still lists Quem Somos`);
    ok(ring.menuLinks.includes('Avaliações'), `${label}: leftover mobile-menu still lists Avaliações`);
    ok(ring.menuLinks.includes('Encomendar'), `${label}: leftover mobile-menu still lists Encomendar`);
    ok(ring.menuLinks.includes('Contacto'), `${label}: leftover mobile-menu still lists Contacto`);
    if (label === '390') {
      ok(ring.hiddenHero, `${label}: leftover hero Comprar Agora stays hidden on leftover mobile`);
      ok(ring.hiddenNavOrder, `${label}: leftover header Encomendar stays hidden on leftover mobile`);
    } else if (label === '768') {
      ok(ring.hiddenNavOrder, `${label}: leftover header Encomendar stays hidden on leftover tablet`);
    }
    ok(!ring.hidden && ring.display !== 'none' && ring.wrapDisplay !== 'none', `${label}: leftover footer shop links stay visible`);
    ok(ring.active, `${label}: leftover footer Produtos can take keyboard focus`);
    ok(
      ring.outlineStyle && ring.outlineStyle !== 'none' && parseFloat(ring.outlineWidth || '0') > 0,
      `${label}: leftover footer shop-link keyboard ring (outline=${ring.outlineStyle}/${ring.outlineWidth})`
    );
    ok(isForest(ring.outlineColor), `${label}: leftover footer shop-link ring stays forest`);
  }

  if (label === '1280') {
    const scrolled = await page.evaluate(() => {
      document.documentElement.style.scrollBehavior = 'auto';
      const prod = document.getElementById('produtos');
      if (prod) prod.scrollIntoView({ behavior: 'auto', block: 'start' });
      const orig = window.scrollTo;
      const origView = Element.prototype.scrollIntoView;
      let called = null;
      Element.prototype.scrollIntoView = function (opts) {
        called = { id: this.id, opts };
        origView.call(this, Object.assign({}, opts, { behavior: 'auto' }));
      };
      window.scrollTo = (opts) => {
        orig.call(window, Object.assign({}, opts, { behavior: 'auto' }));
      };
      if (window.irParaEncomenda) window.irParaEncomenda();
      Element.prototype.scrollIntoView = origView;
      window.scrollTo = orig;
      return {
        calledId: called && called.id,
        hasFn: typeof window.irParaEncomenda === 'function',
      };
    });
    ok(scrolled.hasFn, `${label}: leftover irParaEncomenda stays a function`);
    ok(
      scrolled.calledId === 'encomenda',
      `${label}: leftover header Encomendar still scrolls leftover #encomenda`
    );
  }

  const privacy = await page.evaluate(() => {
    if (window.fecharPrivacidade) window.fecharPrivacidade();
    const footerPriv = [...document.querySelectorAll('.footer-links a')]
      .find(a => (a.textContent || '').trim() === 'Privacidade');
    if (footerPriv) footerPriv.click();
    const link = document.querySelector('.consent-link');
    return {
      consentHidden: document.getElementById('consent')?.hidden ?? true,
      privacyHidden: document.getElementById('privacy-modal')?.hidden ?? true,
      link: (link?.textContent || '').trim(),
      reset: (document.querySelector('.privacy-reset')?.textContent || '').trim(),
    };
  });
  ok(privacy.link === 'Saber mais', `${label}: leftover consent Saber mais stays`);
  ok(privacy.reset === 'Repor consentimento', `${label}: leftover privacy Repor consentimento stays`);
  ok(!privacy.privacyHidden, `${label}: leftover footer Privacidade still opens leftover privacy`);

  const closed = await page.evaluate(() => {
    if (window.fecharPrivacidade) window.fecharPrivacidade();
    return {
      privacyHidden: document.getElementById('privacy-modal')?.hidden ?? true,
    };
  });
  ok(closed.privacyHidden, `${label}: leftover ✕ / fecharPrivacidade still closes leftover privacy`);

  const essential = await page.evaluate(() => {
    if (window.reporConsentimento) window.reporConsentimento();
    const no = document.querySelector('.consent-no');
    if (no) no.click();
    return {
      hidden: document.getElementById('consent')?.hidden ?? true,
      stored: (() => { try { return localStorage.getItem('mf_consent'); } catch { return null; } })(),
      no: (document.querySelector('.consent-no')?.textContent || '').trim(),
      yes: (document.querySelector('.consent-yes')?.textContent || '').trim(),
    };
  });
  ok(essential.no === 'Só essenciais', `${label}: leftover consent Só essenciais stays`);
  ok(essential.yes === 'Aceitar tudo', `${label}: leftover consent Aceitar tudo stays`);
  ok(essential.hidden, `${label}: leftover Só essenciais still hides leftover consent`);
  ok(essential.stored === 'essential', `${label}: leftover Só essenciais still stores essential`);

  const acceptAll = await page.evaluate(() => {
    if (window.reporConsentimento) window.reporConsentimento();
    const shownAgain = !(document.getElementById('consent')?.hidden);
    const yes = document.querySelector('.consent-yes');
    if (yes) yes.click();
    return {
      shownAgain,
      hidden: document.getElementById('consent')?.hidden ?? true,
      stored: (() => { try { return localStorage.getItem('mf_consent'); } catch { return null; } })(),
    };
  });
  ok(acceptAll.shownAgain, `${label}: leftover consent can reopen after leftover Só essenciais`);
  ok(acceptAll.hidden, `${label}: leftover Aceitar tudo still hides leftover consent`);
  ok(acceptAll.stored === 'all', `${label}: leftover Aceitar tudo still stores all`);
}

async function leftoverPreviewQty(page, label) {
  const plusThenClose = await page.evaluate(() => {
    if (window.limparTudo) window.limparTudo();
    if (window.mostrarCategoria) window.mostrarCategoria('frutas', document.getElementById('tab-frutas'));
    const card = [...document.querySelectorAll('.shop-main .product-card')]
      .find(c => /Melancia 1\/4/i.test(c.textContent || ''));
    const id = card ? card.dataset.productId : '';
    if (id && window.abrirProduto) window.abrirProduto(id);
    const plus = [...document.querySelectorAll('.product-modal-qty button')]
      .find(b => (b.getAttribute('aria-label') || '') === 'Aumentar quantidade');
    const before = (document.getElementById('product-modal-qty')?.textContent || '').trim();
    if (plus) plus.click();
    const after = (document.getElementById('product-modal-qty')?.textContent || '').trim();
    const add = document.getElementById('product-modal-add');
    if (window.fecharProduto) window.fecharProduto();
    return {
      opened: Boolean(id),
      before,
      after,
      add: add ? (add.textContent || '').trim() : '',
      closed: !document.getElementById('product-modal')?.classList.contains('open'),
    };
  });
  ok(plusThenClose.opened, `${label}: leftover Melancia 1/4 product preview opens`);
  ok(plusThenClose.add === '＋', `${label}: leftover product-modal add stays a visible plus`);
  ok(plusThenClose.before === '1' && plusThenClose.after === '2',
    `${label}: leftover + increments 1→2 (${plusThenClose.before}→${plusThenClose.after})`);
  ok(plusThenClose.closed, `${label}: leftover ✕ / fecharProduto still closes leftover preview`);
}

async function addMelancia(page, label) {
  const added = await page.evaluate(() => {
    if (window.limparTudo) window.limparTudo();
    if (typeof carrinho === 'object' && carrinho) {
      Object.keys(carrinho).forEach(id => {
        if (typeof removerProduto === 'function') removerProduto(id);
      });
    }
    if (window.mostrarCategoria) window.mostrarCategoria('frutas', document.getElementById('tab-frutas'));
    const card = [...document.querySelectorAll('.shop-main .product-card')]
      .find(c => /Melancia 1\/4/i.test(c.textContent || ''));
    if (!card) return { ok: false, reason: 'card missing' };
    const btn = card.querySelector('.add-btn');
    if (btn) btn.click();
    const cs = document.getElementById('cs-pop');
    if (cs) cs.hidden = true;
    const plus = card.querySelectorAll('.qty-btn')[1];
    if (plus) plus.click();
    return {
      ok: true,
      count: document.getElementById('cart-count')?.textContent || '',
      qty: card.querySelector('.qty-num')?.textContent || '',
    };
  });
  ok(added.ok && added.count === '2', `${label}: add Melancia 1/4 then leftover + increments 1→2 (count=${added.count})`);
}

try {
  const desktop = await browser.newPage();
  desktop.on('pageerror', err => errors.push('1280 pageerror: ' + err.message));
  await openReady(desktop, 1280, 800);
  await leftoverFooterLinksRing(desktop, '1280');
  await leftoverPreviewQty(desktop, '1280');
  await leftoverSearch(desktop, '1280');
  await addMelancia(desktop, '1280');

  const tablet = await browser.newPage();
  tablet.on('pageerror', err => errors.push('768 pageerror: ' + err.message));
  await openReady(tablet, 768, 1024);
  await leftoverFooterLinksRing(tablet, '768');
  await leftoverPreviewQty(tablet, '768');

  const mobile = await browser.newPage();
  mobile.on('pageerror', err => errors.push('390 pageerror: ' + err.message));
  await openReady(mobile, 390, 844);
  await leftoverChrome(mobile, '390');
  await leftoverFooterLinksRing(mobile, '390');
  await leftoverPreviewQty(mobile, '390');
  await leftoverSearch(mobile, '390');
  await addMelancia(mobile, '390');

  await browser.close();
  server.close();
  if (errors.length) {
    console.error('check-footer-links-focus-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
    process.exit(1);
  }
  console.log('check-footer-links-focus-browser: ok');
} catch (err) {
  try { await browser.close(); } catch {}
  try { server.close(); } catch {}
  console.error(err);
  process.exit(1);
}
