#!/usr/bin/env node
/** Chrome: leftover ＋ Adicionar wash applies only on hover-capable pointers. */
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
const isRgb = (value, r, g, b) => {
  const m = (value || '').match(/rgba?\(\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)/);
  if (!m) return false;
  return Math.abs(+m[1] - r) < 2 && Math.abs(+m[2] - g) < 2 && Math.abs(+m[3] - b) < 2;
};
const isRestWash = value => isRgb(value, 27, 67, 50);
const isHoverWash = value => isRgb(value, 45, 106, 79);

async function openReady(page, vw, vh, path = '/') {
  await page.setViewport({ width: vw, height: vh, deviceScaleFactor: 1, isMobile: vw <= 430 });
  await page.goto(new URL(path, base).href, { waitUntil: 'networkidle0', timeout: 60000 });
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

async function findAddBtn(page) {
  return page.evaluate(() => {
    if (window.limparTudo) window.limparTudo();
    if (window.mostrarCategoria) {
      window.mostrarCategoria('frutas', document.getElementById('tab-frutas'));
    }
    const card = [...document.querySelectorAll('.shop-main .product-card')]
      .find(c => /Melancia 1\/4/i.test(c.textContent || ''));
    const btn = card ? card.querySelector('.add-btn') : null;
    const cs = btn ? getComputedStyle(btn) : null;
    return {
      ok: Boolean(card && btn),
      text: btn ? (btn.textContent || '').replace(/\s+/g, ' ').trim() : '',
      type: btn ? (btn.getAttribute('type') || '') : '',
      tag: btn ? btn.tagName : '',
      restBg: cs ? cs.backgroundColor : '',
      display: cs ? cs.display : '',
      selected: card ? card.classList.contains('selected') : false,
    };
  });
}

async function measureCss(page) {
  return page.evaluate(() => {
    const titles = [...document.querySelectorAll('#quem-somos .section-title, .shop-feature .section-title, #como-funciona .section-title')]
      .map(el => (el.textContent || '').replace(/\s+/g, ' ').trim());
    const hero = [...document.querySelectorAll('.hero-ctas a')]
      .map(a => (a.textContent || '').replace(/\s+/g, ' ').trim());
    const stepTitles = [...document.querySelectorAll('#como-funciona .step-title')]
      .map(el => (el.textContent || '').replace(/\s+/g, ' ').trim());
    const hoverRules = [];
    const hoverNoneWash = [];
    const unscopedClose = [];
    const unscopedReveal = [];
    const unscopedFloat = [];
    const unscopedShop = [];
    const unscopedScZoom = [];
    const unscopedSc = [];
    const unscopedSocialLink = [];
    const unscopedSocialWa = [];
    const unscopedCarousel = [];
    const unscopedCat = [];
    const unscopedScroll = [];
    const unscopedWa = [];
    const unscopedBadge = [];
    const unscopedRating = [];
    const arrowUnscoped = [];
    const ghostUnscoped = [];
    const primUnscoped = [];
    const navOrderUnscoped = [];
    const ooUnscoped = [];
    const stepUnscoped = [];
    const csUnscoped = [];
    const contactUnscoped = [];
    const catalogUnscoped = [];
    const qsUnscoped = [];
    const featuredUnscoped = [];
    const tileUnscoped = [];
    const cabazCloseUnscoped = [];
    const cabazVerUnscoped = [];
    const addBtnUnscoped = [];
    const qtyUnscoped = [];
    for (const sheet of document.styleSheets) {
      let list;
      try { list = [...sheet.cssRules]; } catch { continue; }
      for (const rule of list) {
        if (rule instanceof CSSMediaRule && /\(hover:\s*hover\)/.test(rule.conditionText || '')) {
          for (const inner of rule.cssRules) {
            if ((inner.selectorText || '') === '.add-btn:hover') {
              hoverRules.push({
                media: rule.conditionText,
                selector: inner.selectorText,
                background: inner.style.background || inner.style.backgroundColor,
              });
            }
          }
        }
        if (rule instanceof CSSMediaRule && /\(hover:\s*none\)/.test(rule.conditionText || '')) {
          for (const inner of rule.cssRules) {
            const sel = inner.selectorText || '';
            if (sel === '.add-btn:hover' && /forest-2/.test(inner.style.background || inner.style.backgroundColor || '')) {
              hoverNoneWash.push(sel);
            }
          }
        }
        if (rule instanceof CSSStyleRule) {
          const sel = rule.selectorText || '';
          if (sel === '.reveal-close:hover') unscopedClose.push(sel);
          if (sel === '.reveal-cta:hover' && /brightness\(/.test(rule.style.filter || '')) unscopedReveal.push(sel);
          if (sel === '.float-cart:hover' && /brightness\(/.test(rule.style.filter || '')) unscopedFloat.push(sel);
          if (sel === '.product-card:hover' && /translateY/.test(rule.style.transform || '')) {
            unscopedShop.push(sel + ' ' + rule.style.transform);
          }
          if (sel === '.sc:hover img') unscopedScZoom.push(sel);
          if (sel === '.sc:hover' && /translateY/.test(rule.style.transform || '')) {
            unscopedSc.push(sel + ' ' + rule.style.transform);
          }
          if (sel === '.social-link:hover' && /translateX/.test(rule.style.transform || '')) {
            unscopedSocialLink.push(sel + ' ' + rule.style.transform);
          }
          if (sel === '.social-wa:hover' && /scale\(/.test(rule.style.transform || '')) {
            unscopedSocialWa.push(sel + ' ' + rule.style.transform);
          }
          if (sel === '.carousel-nav:hover' && /scale\(/.test(rule.style.transform || '')) {
            unscopedCarousel.push(sel + ' ' + rule.style.transform);
          }
          if (/\.cat-quick-btn:hover/.test(sel) && !/img/.test(sel) && /translateY/.test(rule.style.transform || '')) {
            unscopedCat.push(sel);
          }
          if (sel === '.scroll-top:hover' && /translateY/.test(rule.style.transform || '')) unscopedScroll.push(sel);
          if (sel === '.btn-wa:hover' && /translateY/.test(rule.style.transform || '')) unscopedWa.push(sel);
          if (sel === '.google-badge:hover' && /translateY/.test(rule.style.transform || '')) unscopedBadge.push(sel);
          if (sel === '.hero-rating:hover' && /translateY/.test(rule.style.transform || '')) unscopedRating.push(sel);
          if (sel === 'body.homepage .hero-ctas a:hover span' && /translate\(/.test(rule.style.transform || '')) arrowUnscoped.push(sel);
          if (sel === '.btn-ghost:hover' && /translateY/.test(rule.style.transform || '')) ghostUnscoped.push(sel);
          if (sel === '.btn-prim:hover' && /translateY/.test(rule.style.transform || '')) primUnscoped.push(sel);
          if (sel === '.nav-order:hover' && /translateY/.test(rule.style.transform || '')) navOrderUnscoped.push(sel);
          if (sel === '.oo-step:hover' && /translateY/.test(rule.style.transform || '')) ooUnscoped.push(sel);
          if (sel === '.step-card:hover' && /translateY/.test(rule.style.transform || '')) stepUnscoped.push(sel);
          if (sel === '.cs-card:hover' && /translateY/.test(rule.style.transform || '')) csUnscoped.push(sel);
          if (sel === '.contact-card:hover' && /translateY/.test(rule.style.transform || '')) contactUnscoped.push(sel);
          if (/\.seo-product-card:hover/.test(sel) && /\.seo-product-image img/.test(sel)) catalogUnscoped.push(sel);
          if (/\.qs-photo:hover/.test(sel) && /img/.test(sel)) qsUnscoped.push(sel);
          if (/\.feature-photo:hover/.test(sel) && /img/.test(sel)) featuredUnscoped.push(sel);
          if (/\.cat-quick-btn:hover/.test(sel) && /img/.test(sel)) tileUnscoped.push(sel);
          if (sel === '.cabaz-modal-close:hover') cabazCloseUnscoped.push(sel);
          if (sel === '.cabaz-ver:hover') cabazVerUnscoped.push(sel);
          if (sel === '.add-btn:hover') addBtnUnscoped.push(sel);
          if (sel === '.qty-btn:hover') qtyUnscoped.push(sel);
        }
      }
    }
    return {
      titles,
      hero,
      stepTitles,
      hoverRules,
      hoverNoneWash,
      unscopedClose,
      unscopedReveal,
      unscopedFloat,
      unscopedShop,
      unscopedScZoom,
      unscopedSc,
      unscopedSocialLink,
      unscopedSocialWa,
      unscopedCarousel,
      unscopedCat,
      unscopedScroll,
      unscopedWa,
      unscopedBadge,
      unscopedRating,
      arrowUnscoped,
      ghostUnscoped,
      primUnscoped,
      navOrderUnscoped,
      ooUnscoped,
      stepUnscoped,
      csUnscoped,
      contactUnscoped,
      catalogUnscoped,
      qsUnscoped,
      featuredUnscoped,
      tileUnscoped,
      cabazCloseUnscoped,
      cabazVerUnscoped,
      addBtnUnscoped,
      qtyUnscoped,
    };
  });
}

function leftoverCssOk(sample, label) {
  ok(
    sample.hoverRules.length === 2 &&
    sample.hoverRules.every(rule => /var\(--forest-2\)/.test(rule.background || '')),
    `${label}: leftover ＋ Adicionar wash lives in (hover: hover) twice (got ${JSON.stringify(sample.hoverRules)})`
  );
  ok(sample.addBtnUnscoped.length === 0,
    `${label}: no unscoped leftover ＋ Adicionar wash (got ${sample.addBtnUnscoped.join(', ')})`);
  ok(sample.hoverNoneWash.length === 0,
    `${label}: leftover ＋ Adicionar wash hover:none reset stays out (got ${sample.hoverNoneWash.join(', ')})`);
  ok(sample.qtyUnscoped.length === 1,
    `${label}: leftover qty-btn wash stays unscoped (got ${sample.qtyUnscoped.join(', ')})`);
  ok(sample.cabazVerUnscoped.length === 1,
    `${label}: leftover 👁 Ver o que leva wash stays unscoped (PR #378) (got ${sample.cabazVerUnscoped.join(', ')})`);
  ok(sample.cabazCloseUnscoped.length === 1,
    `${label}: leftover cabaz-composition Fechar wash stays unscoped (PR #377) (got ${sample.cabazCloseUnscoped.join(', ')})`);
  ok(sample.unscopedClose.length === 1,
    `${label}: leftover Fechar oferta wash stays unscoped (PR #376) (got ${sample.unscopedClose.join(', ')})`);
  ok(sample.unscopedReveal.length === 1,
    `${label}: leftover Receber Oferta brightness stays unscoped (PR #375) (got ${sample.unscopedReveal.join(', ')})`);
  ok(sample.unscopedFloat.length === 1,
    `${label}: leftover float-cart brightness stays unscoped (PR #374) (got ${sample.unscopedFloat.join(', ')})`);
  ok(sample.unscopedShop.length === 3,
    `${label}: leftover shop-card lift stays unscoped (PR #363) (got ${sample.unscopedShop.join(', ')})`);
  ok(sample.unscopedScZoom.length === 1,
    `${label}: leftover unused .sc photo zoom stays unscoped (PR #368) (got ${sample.unscopedScZoom.join(', ')})`);
  ok(sample.unscopedSc.length === 1,
    `${label}: leftover unused .sc lift stays unscoped (PR #364) (got ${sample.unscopedSc.join(', ')})`);
  ok(sample.unscopedSocialLink.length === 1,
    `${label}: leftover Avalie-nos / Como Chegar .social-link slide-out stays unscoped (PR #367) (got ${sample.unscopedSocialLink.join(', ')})`);
  ok(sample.unscopedSocialWa.length === 1,
    `${label}: leftover Fale Connosco / Encomendar .social-wa scale stays unscoped (PR #366) (got ${sample.unscopedSocialWa.join(', ')})`);
  ok(sample.unscopedCarousel.length === 1,
    `${label}: leftover featured-row .carousel-nav scale stays unscoped (PR #365) (got ${sample.unscopedCarousel.join(', ')})`);
  ok(sample.unscopedCat.length >= 1,
    `${label}: leftover category-tile lift stays unscoped (PR #362) (got ${sample.unscopedCat.join(', ')})`);
  ok(sample.unscopedScroll.length === 1,
    `${label}: leftover .scroll-top lift stays unscoped (PR #361) (got ${sample.unscopedScroll.join(', ')})`);
  ok(sample.unscopedWa.length === 1,
    `${label}: leftover .btn-wa lift stays unscoped (PR #360) (got ${sample.unscopedWa.join(', ')})`);
  ok(sample.unscopedBadge.length === 1,
    `${label}: leftover .google-badge lift stays unscoped (PR #359) (got ${sample.unscopedBadge.join(', ')})`);
  ok(sample.unscopedRating.length === 1,
    `${label}: leftover .hero-rating lift stays unscoped (PR #358) (got ${sample.unscopedRating.join(', ')})`);
  ok(sample.arrowUnscoped.length === 1,
    `${label}: leftover hero CTA arrow hover stays unscoped (PR #357) (got ${sample.arrowUnscoped.join(', ')})`);
  ok(sample.ghostUnscoped.length === 1,
    `${label}: leftover .btn-ghost lift stays unscoped (PR #355) (got ${sample.ghostUnscoped.join(', ')})`);
  ok(sample.primUnscoped.length === 1,
    `${label}: leftover .btn-prim lift stays unscoped (PR #354) (got ${sample.primUnscoped.join(', ')})`);
  ok(sample.navOrderUnscoped.length === 1,
    `${label}: leftover .nav-order lift stays unscoped (PR #356) (got ${sample.navOrderUnscoped.join(', ')})`);
  ok(sample.ooUnscoped.length === 1,
    `${label}: leftover unused Encomenda online oo-step lift stays unscoped (PR #353) (got ${sample.ooUnscoped.join(', ')})`);
  ok(sample.stepUnscoped.length === 1,
    `${label}: leftover Como Encomendar step-card lift stays unscoped (PR #352) (got ${sample.stepUnscoped.join(', ')})`);
  ok(sample.csUnscoped.length === 1,
    `${label}: leftover Combina bem cs-card lift stays unscoped (PR #351) (got ${sample.csUnscoped.join(', ')})`);
  ok(sample.contactUnscoped.length === 1,
    `${label}: leftover Encontre-nos contact-card lift stays unscoped (PR #280) (got ${sample.contactUnscoped.join(', ')})`);
  ok(sample.catalogUnscoped.length === 1,
    `${label}: leftover catalog card zoom stays unscoped (PR #373) (got ${sample.catalogUnscoped.join(', ')})`);
  ok(sample.qsUnscoped.length === 1,
    `${label}: leftover Quem Somos zoom stays unscoped (PR #372) (got ${sample.qsUnscoped.join(', ')})`);
  ok(sample.featuredUnscoped.length === 1,
    `${label}: leftover featured-photo zoom stays unscoped (PR #371) (got ${sample.featuredUnscoped.join(', ')})`);
  ok(sample.tileUnscoped.length >= 1,
    `${label}: leftover category-tile zoom stays unscoped (PR #370) (got ${sample.tileUnscoped.join(', ')})`);
}

async function hoverAdd(page) {
  const handle = await page.evaluateHandle(() => {
    const card = [...document.querySelectorAll('.shop-main .product-card')]
      .find(c => /Melancia 1\/4/i.test(c.textContent || ''));
    return card ? card.querySelector('.add-btn') : null;
  });
  const btn = handle.asElement();
  if (btn) {
    try { await btn.hover(); } catch {}
    await new Promise(r => setTimeout(r, 450));
  }
  return page.evaluate(() => {
    const card = [...document.querySelectorAll('.shop-main .product-card')]
      .find(c => /Melancia 1\/4/i.test(c.textContent || ''));
    const btn = card ? card.querySelector('.add-btn') : null;
    return {
      background: btn ? getComputedStyle(btn).backgroundColor : '',
      display: btn ? getComputedStyle(btn).display : '',
      canHover: window.matchMedia('(hover: hover)').matches,
      hovered: btn ? btn.matches(':hover') : false,
      type: btn ? (btn.getAttribute('type') || '') : '',
      selected: card ? card.classList.contains('selected') : false,
      menuOpen: document.getElementById('mobile-menu')?.classList.contains('open') || false,
    };
  });
}

async function addMelancia(page, label) {
  const added = await page.evaluate(() => {
    const card = [...document.querySelectorAll('.shop-main .product-card')]
      .find(c => /Melancia 1\/4/i.test(c.textContent || ''));
    if (!card) return { ok: false, reason: 'card missing' };
    const btn = card.querySelector('.add-btn');
    if (btn) btn.click();
    const cs = document.getElementById('cs-pop');
    if (cs) cs.hidden = true;
    const addCs = btn ? getComputedStyle(btn) : null;
    return {
      ok: true,
      count: document.getElementById('cart-count')?.textContent || '',
      selected: card.classList.contains('selected'),
      addDisplay: addCs ? addCs.display : '',
      addBg: addCs ? addCs.backgroundColor : '',
      qtyDisplay: getComputedStyle(card.querySelector('.qty-controls')).display,
      type: btn ? (btn.getAttribute('type') || '') : '',
    };
  });
  ok(added.ok && added.count === '1', `${label}: add Melancia 1/4 (count=${added.count})`);
  return added;
}

try {
  const coarse = await browser.newPage();
  coarse.on('pageerror', err => errors.push('390 pageerror: ' + err.message));
  await openReady(coarse, 390, 844);
  const bar = await coarse.evaluate(() =>
    [...document.querySelectorAll('.mb-item')].map(el =>
      (el.textContent || '').replace(/\s+/g, ' ').trim()
    )
  );
  ok(bar.some(t => /Carrinho/i.test(t)), '390: 4-item bar still lists Carrinho');
  ok(bar.some(t => /Promoções/i.test(t)), '390: 4-item bar still lists Promoções');
  ok(bar.some(t => /WhatsApp/i.test(t)), '390: 4-item bar still lists WhatsApp');
  ok(bar.some(t => /Como Chegar/i.test(t)), '390: 4-item bar still lists Como Chegar');
  ok(bar.length === 4, `390: leftover 4-item bar stays (got ${bar.length})`);
  const phoneCss = await measureCss(coarse);
  leftoverCssOk(phoneCss, '390');
  ok(
    phoneCss.titles.some(t => /Quem Somos/i.test(t)) &&
    phoneCss.titles.some(t => /Promoções da Semana/i.test(t)) &&
    phoneCss.titles.some(t => /Frutas Populares/i.test(t)) &&
    phoneCss.titles.some(t => /Fruta da Época/i.test(t)) &&
    phoneCss.titles.some(t => /Legumes Frescos/i.test(t)),
    `390: leftover Quem Somos + featured sections stay (got ${phoneCss.titles.join(' / ')})`
  );
  ok(phoneCss.hero.some(t => /Ver Produtos/i.test(t)) && phoneCss.hero.some(t => /Encomendar por WhatsApp/i.test(t)),
    `390: leftover hero CTAs stay (got ${phoneCss.hero.join(' / ')})`);
  ok(
    phoneCss.stepTitles.includes('Escolha os Produtos') &&
    phoneCss.stepTitles.includes('Levante na Loja') &&
    phoneCss.stepTitles.length === 5,
    `390: leftover Como Encomendar 5 passos stay (got ${phoneCss.stepTitles.join(' / ')})`
  );
  const probe = await findAddBtn(coarse);
  ok(probe.ok, `390: leftover Melancia 1/4 ＋ Adicionar is present (got ${JSON.stringify(probe)})`);
  ok(/Adicionar/i.test(probe.text || ''), `390: leftover ＋ Adicionar stays (got "${probe.text}")`);
  ok(probe.tag === 'BUTTON', `390: leftover ＋ Adicionar is a button (got ${probe.tag})`);
  ok(probe.type === 'button', `390: leftover ＋ Adicionar keeps leftover type=button (got ${probe.type})`);
  ok(isRestWash(probe.restBg), `390 rest wash forest (got ${probe.restBg})`);
  ok(!probe.selected && probe.display !== 'none',
    `390 leftover ＋ Adicionar stays visible before add (selected=${probe.selected}, display=${probe.display})`);
  const hovered = await hoverAdd(coarse);
  ok(!hovered.canHover && isRestWash(hovered.background),
    `390 hover:none should not sticky-wash leftover ＋ Adicionar (canHover=${hovered.canHover}, background=${hovered.background})`);
  ok(hovered.type === 'button' && !hovered.menuOpen && !hovered.selected,
    '390 after leftover hover: leftover ＋ Adicionar keeps leftover type=button, leftover mobile-menu stays closed, leftover card stays unselected');
  const afterAdd = await addMelancia(coarse, '390');
  ok(afterAdd.selected && afterAdd.addDisplay === 'none',
    `390 leftover tap hides leftover ＋ Adicionar behind leftover qty stepper (selected=${afterAdd.selected}, display=${afterAdd.addDisplay})`);
  ok(/flex/.test(afterAdd.qtyDisplay || ''),
    `390 leftover qty stepper shows after leftover Melancia 1/4 add (qty=${afterAdd.qtyDisplay})`);
  ok(afterAdd.type === 'button', '390 leftover ＋ Adicionar keeps leftover type=button after leftover tap');
  const afterCart = await coarse.evaluate(() => ({
    count: document.getElementById('cart-count')?.textContent || '',
    wa: document.querySelector('.mb-item[href*="wa.me/351932699850"]')?.getAttribute('href') || '',
    menuOpen: document.getElementById('mobile-menu')?.classList.contains('open') || false,
    cabazVer: [...document.querySelectorAll('.cabaz-ver')].length,
  }));
  ok(afterCart.count === '1', `390 after leftover Melancia 1/4 add: leftover cart stays (count=${afterCart.count})`);
  ok(/wa\.me\/351932699850/.test(afterCart.wa),
    `390 leftover 4-item bar WhatsApp stays wa.me/351932699850 (got ${afterCart.wa})`);
  ok(!afterCart.menuOpen, '390 leftover mobile-menu stays closed after leftover Melancia 1/4 add');

  const productPhone = await browser.newPage();
  productPhone.on('pageerror', err => errors.push('390 product pageerror: ' + err.message));
  await openReady(productPhone, 390, 844, '/produtos/banana-madeira/');
  const productHero = await productPhone.evaluate(() => ({
    cards: document.querySelectorAll('.product-card').length,
    tiles: document.querySelectorAll('.cat-quick-btn').length,
    ctas: document.querySelectorAll('.hero-ctas a').length,
    wa: document.querySelectorAll('.btn-wa').length,
    scroll: document.querySelectorAll('.scroll-top, #scroll-top').length,
    nav: document.querySelectorAll('.carousel-nav').length,
    sc: document.querySelectorAll('.sc, .summer-scroll').length,
    floatCart: document.querySelectorAll('.float-cart, #float-cart').length,
    reveal: document.querySelectorAll('.reveal-cta, .reveal-close, #offer-pop').length,
    cabaz: document.querySelectorAll('.cabaz-modal-close, #cabaz-modal, .cabaz-ver').length,
    add: document.querySelectorAll('.add-btn').length,
    wrapping: [...document.querySelectorAll('.seo-nav a')].map(a => (a.textContent || '').trim()),
  }));
  ok(productHero.cards === 0, `390 product: leftover product-card stays homepage-only (got ${productHero.cards})`);
  ok(productHero.tiles === 0, `390 product: leftover cat-quick-btn stays homepage-only (got ${productHero.tiles})`);
  ok(productHero.ctas === 0, `390 product: leftover hero-ctas stay homepage-only (got ${productHero.ctas})`);
  ok(productHero.wa === 0, `390 product: leftover .btn-wa stays homepage-only (got ${productHero.wa})`);
  ok(productHero.scroll === 0, `390 product: leftover scroll-top stays homepage-only (got ${productHero.scroll})`);
  ok(productHero.nav === 0, `390 product: leftover carousel-nav stays homepage-only (got ${productHero.nav})`);
  ok(productHero.sc === 0, `390 product: leftover unused .sc stays homepage-CSS-only (got ${productHero.sc})`);
  ok(productHero.floatCart === 0, `390 product: leftover float-cart stays homepage-only (got ${productHero.floatCart})`);
  ok(productHero.reveal === 0, `390 product: leftover reveal-close stays homepage-CSS-only (got ${productHero.reveal})`);
  ok(productHero.cabaz === 0, `390 product: leftover cabaz-ver stays homepage-only (got ${productHero.cabaz})`);
  ok(productHero.add === 0, `390 product: leftover add-btn stays homepage-only (got ${productHero.add})`);
  ok(
    productHero.wrapping.includes('Início') &&
    productHero.wrapping.includes('Frutas') &&
    productHero.wrapping.includes('Legumes') &&
    productHero.wrapping.includes('Promoções') &&
    !productHero.wrapping.some(t => /Ervas/i.test(t)) &&
    !productHero.wrapping.some(t => /Época/i.test(t)) &&
    !productHero.wrapping.some(t => /Cabazes/i.test(t)),
    `390 product: leftover wrapping nav stays Início / Frutas / Legumes / Promoções (got ${productHero.wrapping.join(' / ')})`
  );
  const orderLink = await productPhone.evaluate(() => {
    const btn = document.querySelector('.seo-order-link');
    return {
      found: Boolean(btn),
      label: btn ? (btn.textContent || '').replace(/\s+/g, ' ').trim() : '',
      href: btn ? btn.getAttribute('href') || '' : '',
    };
  });
  ok(orderLink.found, '390 product: leftover Ver no catálogo e encomendar is present');
  ok(/Ver no catálogo e encomendar/i.test(orderLink.label) && /produto=banana-madeira#produtos/.test(orderLink.href),
    `390 product: leftover order CTA stays (got "${orderLink.label}" ${orderLink.href})`);

  const fine = await browser.newPage();
  fine.on('pageerror', err => errors.push('1280 pageerror: ' + err.message));
  await openReady(fine, 1280, 800);
  const wideCss = await measureCss(fine);
  leftoverCssOk(wideCss, '1280');
  ok(wideCss.hero.some(t => /Ver Produtos/i.test(t)) && wideCss.hero.some(t => /Encomendar por WhatsApp/i.test(t)),
    `1280: leftover hero CTAs stay (got ${wideCss.hero.join(' / ')})`);
  ok(
    wideCss.stepTitles.includes('Escolha os Produtos') &&
    wideCss.stepTitles.includes('Levante na Loja') &&
    wideCss.stepTitles.length === 5,
    `1280: leftover Como Encomendar 5 passos stay (got ${wideCss.stepTitles.join(' / ')})`
  );
  const wideProbe = await findAddBtn(fine);
  ok(wideProbe.ok && /Adicionar/i.test(wideProbe.text || ''),
    `1280: leftover Melancia 1/4 ＋ Adicionar is present (got "${wideProbe.text}")`);
  ok(wideProbe.tag === 'BUTTON', `1280: leftover ＋ Adicionar is a button (got ${wideProbe.tag})`);
  ok(wideProbe.type === 'button', `1280: leftover ＋ Adicionar keeps leftover type=button (got ${wideProbe.type})`);
  ok(isRestWash(wideProbe.restBg), `1280 rest wash forest (got ${wideProbe.restBg})`);
  const wideHover = await hoverAdd(fine);
  ok(!wideHover.canHover || isHoverWash(wideHover.background),
    `1280: if the pointer can hover, leftover forest-2 wash stays (canHover=${wideHover.canHover}, background=${wideHover.background})`);
  ok(isRestWash(wideHover.background) || wideHover.canHover,
    `1280: leftover forest-2 wash stays inside leftover hover-capable pointers (canHover=${wideHover.canHover}, background=${wideHover.background})`);
  await addMelancia(fine, '1280');

  await browser.close();
  server.close();
  if (errors.length) {
    console.error('check-homepage-add-btn-hover-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
    process.exit(1);
  }
  console.log('check-homepage-add-btn-hover-browser: ok');
} catch (err) {
  try { await browser.close(); } catch {}
  try { server.close(); } catch {}
  console.error(err);
  process.exit(1);
}
