#!/usr/bin/env node
/** Chrome: leftover homepage Ver a sua encomenda chip brightens only on hover-capable pointers. */
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
const isIdentityFilter = value => !value || value === 'none' || value === 'brightness(1)';
const isBrightness108 = value => {
  if (!value) return false;
  if (/brightness\(1\.08\)/.test(value)) return true;
  const m = value.match(/brightness\(([^)]+)\)/);
  if (!m) return false;
  return Math.abs(parseFloat(m[1]) - 1.08) < 0.01;
};

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

async function measureChip(page) {
  const rest = await page.evaluate(() => {
    const chip = document.getElementById('float-cart');
    const titles = [...document.querySelectorAll('#quem-somos .section-title, .shop-feature .section-title, #como-funciona .section-title')]
      .map(el => (el.textContent || '').replace(/\s+/g, ' ').trim());
    const hero = [...document.querySelectorAll('.hero-ctas a')]
      .map(a => (a.textContent || '').replace(/\s+/g, ' ').trim());
    const stepTitles = [...document.querySelectorAll('#como-funciona .step-title')]
      .map(el => (el.textContent || '').replace(/\s+/g, ' ').trim());
    const hoverRules = [];
    const hoverNoneBrightness = [];
    const unscopedBrightness = [];
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
    const revealUnscoped = [];
    for (const sheet of document.styleSheets) {
      let list;
      try { list = [...sheet.cssRules]; } catch { continue; }
      for (const rule of list) {
        if (rule instanceof CSSMediaRule && /\(hover:\s*hover\)/.test(rule.conditionText || '')) {
          for (const inner of rule.cssRules) {
            if ((inner.selectorText || '') === '.float-cart:hover') {
              hoverRules.push({
                media: rule.conditionText,
                selector: inner.selectorText,
                filter: inner.style.filter,
              });
            }
          }
        }
        if (rule instanceof CSSMediaRule && /\(hover:\s*none\)/.test(rule.conditionText || '')) {
          for (const inner of rule.cssRules) {
            const sel = inner.selectorText || '';
            if (sel === '.float-cart:hover' && /brightness\(1\.08\)/.test(inner.style.filter || '')) {
              hoverNoneBrightness.push(sel);
            }
          }
        }
        if (rule instanceof CSSStyleRule) {
          const sel = rule.selectorText || '';
          if (sel === '.float-cart:hover') unscopedBrightness.push(sel);
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
          if (sel === '.reveal-cta:hover' && /brightness\(/.test(rule.style.filter || '')) revealUnscoped.push(sel);
        }
      }
    }
    return {
      found: Boolean(chip),
      tag: chip ? chip.tagName : '',
      type: chip ? (chip.getAttribute('type') || '') : '',
      title: chip ? (chip.getAttribute('title') || '') : '',
      visible: chip ? chip.classList.contains('visible') : false,
      restFilter: chip ? getComputedStyle(chip).filter : '',
      restOpacity: chip ? getComputedStyle(chip).opacity : '',
      restPointer: chip ? getComputedStyle(chip).pointerEvents : '',
      text: chip ? (chip.textContent || '').replace(/\s+/g, ' ').trim() : '',
      titles,
      hero,
      stepTitles,
      hoverRules,
      hoverNoneBrightness,
      unscopedBrightness,
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
      revealUnscoped,
    };
  });
  return rest;
}

function leftoverCssOk(sample, label) {
  ok(
    sample.hoverRules.length === 1 && sample.hoverRules[0].filter === 'brightness(1.08)',
    `${label}: leftover float-cart brightness lives in (hover: hover) (got ${JSON.stringify(sample.hoverRules)})`
  );
  ok(sample.unscopedBrightness.length === 0,
    `${label}: no unscoped leftover float-cart brightness (got ${sample.unscopedBrightness.join(', ')})`);
  ok(sample.hoverNoneBrightness.length === 0,
    `${label}: leftover float-cart brightness hover:none reset stays out (got ${sample.hoverNoneBrightness.join(', ')})`);
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
  ok(sample.revealUnscoped.length === 1,
    `${label}: leftover Receber Oferta .reveal-cta brightness stays unscoped (PR #128) (got ${sample.revealUnscoped.join(', ')})`);
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
    const chip = document.getElementById('float-cart');
    return {
      ok: true,
      count: document.getElementById('cart-count')?.textContent || '',
      visible: chip ? chip.classList.contains('visible') : false,
      title: chip ? (chip.getAttribute('title') || '') : '',
      type: chip ? (chip.getAttribute('type') || '') : '',
    };
  });
  ok(added.ok && added.count === '1', `${label}: add Melancia 1/4 (count=${added.count})`);
  ok(added.visible, `${label}: leftover Ver a sua encomenda chip becomes leftover visible after leftover Melancia 1/4`);
  ok(/Ver a sua encomenda/i.test(added.title), `${label}: leftover float-cart title stays (got "${added.title}")`);
  ok(added.type === '', `${label}: leftover float-cart stays without leftover type=button (got ${added.type})`);
  return added;
}

async function hoverChip(page) {
  const handle = await page.evaluateHandle(() => document.getElementById('float-cart'));
  const chip = handle.asElement();
  if (chip) {
    try { await chip.hover(); } catch {}
    await new Promise(r => setTimeout(r, 450));
  }
  return page.evaluate(() => {
    const chip = document.getElementById('float-cart');
    return {
      filter: chip ? getComputedStyle(chip).filter : '',
      canHover: window.matchMedia('(hover: hover)').matches,
      hovered: chip ? chip.matches(':hover') : false,
      type: chip ? (chip.getAttribute('type') || '') : '',
      visible: chip ? chip.classList.contains('visible') : false,
      menuOpen: document.getElementById('mobile-menu')?.classList.contains('open') || false,
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
  const phone = await measureChip(coarse);
  leftoverCssOk(phone, '390');
  ok(phone.found, '390: leftover Ver a sua encomenda chip is present');
  ok(phone.tag === 'BUTTON', `390: leftover float-cart stays a button (got ${phone.tag})`);
  ok(phone.type === '', `390: leftover float-cart stays without type=button (got ${phone.type})`);
  ok(/Ver a sua encomenda/i.test(phone.title), `390: leftover title stays (got "${phone.title}")`);
  ok(/🛒/.test(phone.text), `390: leftover 🛒 stays (got "${phone.text}")`);
  ok(!phone.visible && parseFloat(phone.restOpacity || '0') === 0,
    `390 rest leftover empty chip stays leftover not visible (visible=${phone.visible}, opacity=${phone.restOpacity})`);
  ok(isIdentityFilter(phone.restFilter), `390 rest filter identity (got ${phone.restFilter})`);
  ok(
    phone.titles.some(t => /Quem Somos/i.test(t)) &&
    phone.titles.some(t => /Promoções da Semana/i.test(t)) &&
    phone.titles.some(t => /Frutas Populares/i.test(t)) &&
    phone.titles.some(t => /Fruta da Época/i.test(t)) &&
    phone.titles.some(t => /Legumes Frescos/i.test(t)),
    `390: leftover Quem Somos + featured sections stay (got ${phone.titles.join(' / ')})`
  );
  ok(phone.hero.some(t => /Ver Produtos/i.test(t)) && phone.hero.some(t => /Encomendar por WhatsApp/i.test(t)),
    `390: leftover hero CTAs stay (got ${phone.hero.join(' / ')})`);
  ok(
    phone.stepTitles.includes('Escolha os Produtos') &&
    phone.stepTitles.includes('Levante na Loja') &&
    phone.stepTitles.length === 5,
    `390: leftover Como Encomendar 5 passos stay (got ${phone.stepTitles.join(' / ')})`
  );
  await addMelancia(coarse, '390');
  const afterAdd = await coarse.evaluate(() => {
    const chip = document.getElementById('float-cart');
    return {
      count: document.getElementById('cart-count')?.textContent || '',
      wa: document.querySelector('.mb-item[href*="wa.me/351932699850"]')?.getAttribute('href') || '',
      filter: chip ? getComputedStyle(chip).filter : '',
      visible: chip ? chip.classList.contains('visible') : false,
      type: chip ? (chip.getAttribute('type') || '') : '',
    };
  });
  ok(afterAdd.count === '1', `390 after leftover Melancia 1/4 add: leftover cart stays (count=${afterAdd.count})`);
  ok(/wa\.me\/351932699850/.test(afterAdd.wa),
    `390 leftover 4-item bar WhatsApp stays wa.me/351932699850 (got ${afterAdd.wa})`);
  ok(afterAdd.visible, '390 after leftover Melancia 1/4 add: leftover Ver a sua encomenda chip is leftover visible');
  ok(isIdentityFilter(afterAdd.filter),
    `390 after leftover Melancia 1/4 add: leftover float-cart does not leftover sticky-brighten (filter=${afterAdd.filter})`);
  const hovered = await hoverChip(coarse);
  ok(!hovered.canHover && isIdentityFilter(hovered.filter),
    `390 hover:none should not sticky-brighten leftover Ver a sua encomenda (canHover=${hovered.canHover}, filter=${hovered.filter})`);
  ok(hovered.visible && hovered.type === '' && !hovered.menuOpen,
    `390 after leftover hover: leftover chip stays leftover visible without leftover type=button and leftover mobile-menu stays closed`);
  await coarse.evaluate(() => {
    const chip = document.getElementById('float-cart');
    if (chip) chip.click();
  });
  const afterTap = await coarse.evaluate(() => {
    const chip = document.getElementById('float-cart');
    const order = document.getElementById('encomenda');
    return {
      filter: chip ? getComputedStyle(chip).filter : '',
      type: chip ? (chip.getAttribute('type') || '') : '',
      count: document.getElementById('cart-count')?.textContent || '',
      menuOpen: document.getElementById('mobile-menu')?.classList.contains('open') || false,
      orderTop: order ? order.getBoundingClientRect().top : null,
    };
  });
  ok(isIdentityFilter(afterTap.filter),
    `390 leftover tap does not leftover sticky-brighten leftover Ver a sua encomenda (filter=${afterTap.filter})`);
  ok(afterTap.count === '1' && afterTap.type === '' && !afterTap.menuOpen,
    `390 leftover tap keeps leftover Melancia 1/4 cart, leftover no type=button, leftover mobile-menu closed`);

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
  const wide = await measureChip(fine);
  leftoverCssOk(wide, '1280');
  ok(wide.found, '1280: leftover Ver a sua encomenda chip is present');
  ok(wide.tag === 'BUTTON', `1280: leftover float-cart stays a button (got ${wide.tag})`);
  ok(wide.type === '', `1280: leftover float-cart stays without type=button (got ${wide.type})`);
  ok(isIdentityFilter(wide.restFilter), `1280 rest filter identity (got ${wide.restFilter})`);
  ok(wide.hero.some(t => /Ver Produtos/i.test(t)) && wide.hero.some(t => /Encomendar por WhatsApp/i.test(t)),
    `1280: leftover hero CTAs stay (got ${wide.hero.join(' / ')})`);
  ok(
    wide.stepTitles.includes('Escolha os Produtos') &&
    wide.stepTitles.includes('Levante na Loja') &&
    wide.stepTitles.length === 5,
    `1280: leftover Como Encomendar 5 passos stay (got ${wide.stepTitles.join(' / ')})`
  );
  await addMelancia(fine, '1280');
  const wideHover = await hoverChip(fine);
  ok(!wideHover.canHover || isBrightness108(wideHover.filter),
    `1280: if the pointer can hover, leftover 1.08 brightness stays (canHover=${wideHover.canHover}, filter=${wideHover.filter})`);
  ok(isIdentityFilter(wideHover.filter) || wideHover.canHover,
    `1280: leftover 1.08 brightness stays inside leftover hover-capable pointers (canHover=${wideHover.canHover}, filter=${wideHover.filter})`);

  await browser.close();
  server.close();
  if (errors.length) {
    console.error('check-homepage-float-cart-hover-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
    process.exit(1);
  }
  console.log('check-homepage-float-cart-hover-browser: ok');
} catch (err) {
  try { await browser.close(); } catch {}
  try { server.close(); } catch {}
  console.error(err);
  process.exit(1);
}
