#!/usr/bin/env node
/** Chrome: leftover cabaz-composition Fechar wash applies only on hover-capable pointers. */
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
const isRestWash = value => isRgb(value, 245, 237, 224);
const isHoverWash = value => isRgb(value, 232, 213, 192);

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

async function openCabazDetox(page) {
  return page.evaluate(() => {
    const card = [...document.querySelectorAll('#grid-cabazes .product-card')]
      .find(c => /Cabaz Detox/i.test(c.textContent || ''));
    if (!card) return { ok: false, reason: 'card missing' };
    const ver = card.querySelector('.cabaz-ver');
    if (ver) ver.click();
    const modal = document.getElementById('cabaz-modal');
    const close = document.querySelector('.cabaz-modal-close');
    const cs = close ? getComputedStyle(close) : null;
    return {
      ok: Boolean(modal && modal.classList.contains('open') && close),
      title: (document.getElementById('cabaz-modal-title')?.textContent || '').trim(),
      label: close ? (close.getAttribute('aria-label') || '') : '',
      text: close ? (close.textContent || '').replace(/\s+/g, ' ').trim() : '',
      type: close ? (close.getAttribute('type') || '') : '',
      tag: close ? close.tagName : '',
      restBg: cs ? cs.backgroundColor : '',
      overflow: document.body.style.overflow || '',
      verText: ver ? (ver.textContent || '').replace(/\s+/g, ' ').trim() : '',
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
    for (const sheet of document.styleSheets) {
      let list;
      try { list = [...sheet.cssRules]; } catch { continue; }
      for (const rule of list) {
        if (rule instanceof CSSMediaRule && /\(hover:\s*hover\)/.test(rule.conditionText || '')) {
          for (const inner of rule.cssRules) {
            if ((inner.selectorText || '') === '.cabaz-modal-close:hover') {
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
            if (sel === '.cabaz-modal-close:hover' && /cream-3/.test(inner.style.background || inner.style.backgroundColor || '')) {
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
    };
  });
}

function leftoverCssOk(sample, label) {
  ok(
    sample.hoverRules.length === 1 && /var\(--cream-3\)/.test(sample.hoverRules[0].background || ''),
    `${label}: leftover cabaz-composition Fechar wash lives in (hover: hover) (got ${JSON.stringify(sample.hoverRules)})`
  );
  ok(sample.cabazCloseUnscoped.length === 0,
    `${label}: no unscoped leftover cabaz-composition Fechar wash (got ${sample.cabazCloseUnscoped.join(', ')})`);
  ok(sample.hoverNoneWash.length === 0,
    `${label}: leftover cabaz-composition Fechar wash hover:none reset stays out (got ${sample.hoverNoneWash.join(', ')})`);
  ok(sample.cabazVerUnscoped.length === 1,
    `${label}: leftover 👁 Ver o que leva hover stays unscoped (got ${sample.cabazVerUnscoped.join(', ')})`);
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
  return added;
}

async function hoverClose(page) {
  const handle = await page.evaluateHandle(() => document.querySelector('.cabaz-modal-close'));
  const close = handle.asElement();
  if (close) {
    try { await close.hover(); } catch {}
    await new Promise(r => setTimeout(r, 450));
  }
  return page.evaluate(() => {
    const close = document.querySelector('.cabaz-modal-close');
    const modal = document.getElementById('cabaz-modal');
    return {
      background: close ? getComputedStyle(close).backgroundColor : '',
      canHover: window.matchMedia('(hover: hover)').matches,
      hovered: close ? close.matches(':hover') : false,
      type: close ? (close.getAttribute('type') || '') : '',
      menuOpen: document.getElementById('mobile-menu')?.classList.contains('open') || false,
      modalOpen: modal ? modal.classList.contains('open') : false,
    };
  });
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
  const probe = await openCabazDetox(coarse);
  ok(probe.ok, `390: leftover Cabaz Detox 👁 Ver o que leva opens leftover cabaz-modal (got ${JSON.stringify(probe)})`);
  ok(/Cabaz Detox/i.test(probe.title || ''), `390: leftover Cabaz Detox title stays (got "${probe.title}")`);
  ok(probe.tag === 'BUTTON', `390: leftover cabaz-composition Fechar is a button (got ${probe.tag})`);
  ok(probe.text === '✕', `390: leftover cabaz-composition ✕ stays (got "${probe.text}")`);
  ok(/^Fechar$/i.test(probe.label || ''), `390: leftover cabaz-composition Fechar name stays (got "${probe.label}")`);
  ok(probe.type === '', `390: leftover cabaz-composition Fechar stays without leftover type=button (got ${probe.type})`);
  ok(/Ver o que leva/i.test(probe.verText || ''), `390: leftover 👁 Ver o que leva stays (got "${probe.verText}")`);
  ok(isRestWash(probe.restBg), `390 rest wash cream-2 (got ${probe.restBg})`);
  ok(probe.overflow === 'hidden', `390 leftover cabaz-modal open locks leftover body overflow (got ${probe.overflow})`);
  const hovered = await hoverClose(coarse);
  ok(!hovered.canHover && isRestWash(hovered.background),
    `390 hover:none should not sticky-wash leftover cabaz-composition Fechar (canHover=${hovered.canHover}, background=${hovered.background})`);
  ok(hovered.type === '' && !hovered.menuOpen && hovered.modalOpen,
    '390 after leftover hover: leftover cabaz-composition Fechar stays without leftover type=button, leftover mobile-menu stays closed, leftover cabaz-modal stays open');
  await coarse.evaluate(() => {
    const close = document.querySelector('.cabaz-modal-close');
    if (close) close.click();
  });
  const afterTap = await coarse.evaluate(() => {
    const close = document.querySelector('.cabaz-modal-close');
    const modal = document.getElementById('cabaz-modal');
    return {
      background: close ? getComputedStyle(close).backgroundColor : '',
      type: close ? (close.getAttribute('type') || '') : '',
      count: document.getElementById('cart-count')?.textContent || '',
      menuOpen: document.getElementById('mobile-menu')?.classList.contains('open') || false,
      modalOpen: modal ? modal.classList.contains('open') : false,
      overflow: document.body.style.overflow || '',
    };
  });
  ok(isRestWash(afterTap.background),
    `390 leftover tap does not leftover sticky-wash leftover cabaz-composition Fechar (background=${afterTap.background})`);
  ok(afterTap.count === '0' && afterTap.type === '' && !afterTap.menuOpen && !afterTap.modalOpen && afterTap.overflow === '',
    '390 leftover tap hides leftover cabaz-modal, restores leftover body overflow, leftover empty cart, leftover no type=button, leftover mobile-menu closed');
  await addMelancia(coarse, '390');
  const afterAdd = await coarse.evaluate(() => ({
    count: document.getElementById('cart-count')?.textContent || '',
    wa: document.querySelector('.mb-item[href*="wa.me/351932699850"]')?.getAttribute('href') || '',
    background: document.querySelector('.cabaz-modal-close') ? getComputedStyle(document.querySelector('.cabaz-modal-close')).backgroundColor : '',
    menuOpen: document.getElementById('mobile-menu')?.classList.contains('open') || false,
    modalOpen: document.getElementById('cabaz-modal')?.classList.contains('open') || false,
  }));
  ok(afterAdd.count === '1', `390 after leftover Melancia 1/4 add: leftover cart stays (count=${afterAdd.count})`);
  ok(/wa\.me\/351932699850/.test(afterAdd.wa),
    `390 leftover 4-item bar WhatsApp stays wa.me/351932699850 (got ${afterAdd.wa})`);
  ok(isRestWash(afterAdd.background) && !afterAdd.modalOpen && !afterAdd.menuOpen,
    `390 after leftover Melancia 1/4 add: leftover cabaz-composition Fechar does not leftover sticky-wash (background=${afterAdd.background})`);

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
  ok(productHero.cabaz === 0, `390 product: leftover cabaz-modal-close stays homepage-only (got ${productHero.cabaz})`);
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
  const wideProbe = await openCabazDetox(fine);
  ok(wideProbe.ok && /Cabaz Detox/i.test(wideProbe.title || ''),
    `1280: leftover Cabaz Detox 👁 Ver o que leva opens leftover cabaz-modal (got "${wideProbe.title}")`);
  ok(wideProbe.tag === 'BUTTON', `1280: leftover cabaz-composition Fechar is a button (got ${wideProbe.tag})`);
  ok(isRestWash(wideProbe.restBg), `1280 rest wash cream-2 (got ${wideProbe.restBg})`);
  const wideHover = await hoverClose(fine);
  ok(!wideHover.canHover || isHoverWash(wideHover.background),
    `1280: if the pointer can hover, leftover cream-3 wash stays (canHover=${wideHover.canHover}, background=${wideHover.background})`);
  ok(isRestWash(wideHover.background) || wideHover.canHover,
    `1280: leftover cream-3 wash stays inside leftover hover-capable pointers (canHover=${wideHover.canHover}, background=${wideHover.background})`);
  await addMelancia(fine, '1280');

  await browser.close();
  server.close();
  if (errors.length) {
    console.error('check-homepage-cabaz-modal-close-hover-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
    process.exit(1);
  }
  console.log('check-homepage-cabaz-modal-close-hover-browser: ok');
} catch (err) {
  try { await browser.close(); } catch {}
  try { server.close(); } catch {}
  console.error(err);
  process.exit(1);
}
