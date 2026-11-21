#!/usr/bin/env node
/** Chrome: leftover catalog category-card photos zoom only on hover-capable pointers. */
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
const isIdentity = value => !value || value === 'none' || value === 'matrix(1, 0, 0, 1, 0, 0)';
const isScale104 = value => {
  if (!value) return false;
  if (/scale\(1\.04\)/.test(value)) return true;
  const m = value.match(/^matrix\(([^)]+)\)$/);
  if (!m) return false;
  const parts = m[1].split(',').map(s => parseFloat(s.trim()));
  return parts.length === 6 && Math.abs(parts[0] - 1.04) < 0.01 && Math.abs(parts[3] - 1.04) < 0.01;
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

async function measureCard(page) {
  await page.evaluate(() => {
    const card = [...document.querySelectorAll('.seo-product-card')]
      .find(el => /Melancia 1\/4/i.test(el.textContent || ''));
    if (card) card.scrollIntoView({ block: 'center', inline: 'nearest' });
  });
  await new Promise(r => setTimeout(r, 600));
  const rest = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('.seo-product-card')];
    const card = cards.find(el => /Melancia 1\/4/i.test(el.textContent || '')) || null;
    const link = card ? card.querySelector('a.seo-product-image') : null;
    const img = link ? link.querySelector('img') : null;
    const title = card ? (card.querySelector('h2 a')?.textContent || '').trim() : '';
    const ver = card ? (card.querySelector('.seo-text-link')?.textContent || '').replace(/\s+/g, ' ').trim() : '';
    const wrapping = [...document.querySelectorAll('.seo-nav a')].map(a => (a.textContent || '').trim());
    const hoverRules = [];
    const hoverNoneZoom = [];
    const unscopedZoom = [];
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
    for (const sheet of document.styleSheets) {
      let list;
      try { list = [...sheet.cssRules]; } catch { continue; }
      for (const rule of list) {
        if (rule instanceof CSSMediaRule && /\(hover:\s*hover\)/.test(rule.conditionText || '')) {
          for (const inner of rule.cssRules) {
            const sel = inner.selectorText || '';
            if (sel === '.seo-product-card:hover .seo-product-image img') {
              hoverRules.push({
                media: rule.conditionText,
                selector: sel,
                transform: inner.style.transform,
              });
            }
          }
        }
        if (rule instanceof CSSMediaRule && /\(hover:\s*none\)/.test(rule.conditionText || '')) {
          for (const inner of rule.cssRules) {
            const sel = inner.selectorText || '';
            if (sel === '.seo-product-card:hover .seo-product-image img' && /scale\(/.test(inner.style.transform || '')) {
              hoverNoneZoom.push(sel);
            }
          }
        }
        if (rule instanceof CSSStyleRule) {
          const sel = rule.selectorText || '';
          if (sel === '.product-card:hover .photo-wrap img') unscopedZoom.push(sel);
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
        }
      }
    }
    return {
      found: Boolean(card && link && img),
      count: cards.length,
      tag: card ? card.tagName : '',
      linkTag: link ? link.tagName : '',
      type: link ? (link.getAttribute('type') || '') : '',
      href: link ? link.getAttribute('href') || '' : '',
      alt: img ? img.getAttribute('alt') || '' : '',
      title,
      ver,
      wrapping,
      restTransform: img ? getComputedStyle(img).transform : '',
      hoverRules,
      hoverNoneZoom,
      unscopedZoom,
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
    };
  });
  const handle = await page.evaluateHandle(() => {
    const card = [...document.querySelectorAll('.seo-product-card')]
      .find(el => /Melancia 1\/4/i.test(el.textContent || ''));
    return card || null;
  });
  const cardEl = handle.asElement();
  if (cardEl) {
    try { await cardEl.hover(); } catch {}
    await new Promise(r => setTimeout(r, 450));
  }
  const hovered = await page.evaluate(() => {
    const card = [...document.querySelectorAll('.seo-product-card')]
      .find(el => /Melancia 1\/4/i.test(el.textContent || ''));
    const img = card ? card.querySelector('.seo-product-image img') : null;
    return {
      transform: img ? getComputedStyle(img).transform : '',
      canHover: window.matchMedia('(hover: hover)').matches,
      cardHovered: card ? card.matches(':hover') : false,
      type: card ? (card.getAttribute('type') || '') : '',
      tag: card ? card.tagName : '',
    };
  });
  return { ...rest, hovered };
}

function leftoverCssOk(sample, label) {
  ok(
    sample.hoverRules.length === 1 &&
    sample.hoverRules[0].transform === 'scale(1.04)',
    `${label}: leftover catalog category-card zoom lives in (hover: hover) (got ${JSON.stringify(sample.hoverRules)})`
  );
  ok(sample.catalogUnscoped.length === 0,
    `${label}: no unscoped leftover catalog category-card zoom (got ${sample.catalogUnscoped.join(', ')})`);
  ok(sample.hoverNoneZoom.length === 0,
    `${label}: leftover catalog category-card zoom hover:none scale reset stays out (got ${sample.hoverNoneZoom.join(', ')})`);
  ok(sample.qsUnscoped.length === 1,
    `${label}: leftover Quem Somos gallery zoom stays unscoped (PR #372) (got ${sample.qsUnscoped.join(', ')})`);
  ok(sample.featuredUnscoped.length === 1,
    `${label}: leftover featured-photo zoom stays unscoped (PR #371) (got ${sample.featuredUnscoped.join(', ')})`);
  ok(sample.tileUnscoped.length >= 1,
    `${label}: leftover category-tile photo zoom stays unscoped (PR #370) (got ${sample.tileUnscoped.join(', ')})`);
  ok(sample.unscopedZoom.length === 1,
    `${label}: leftover shop-card photo zoom stays unscoped (PR #369) (got ${sample.unscopedZoom.join(', ')})`);
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

try {
  const coarse = await browser.newPage();
  coarse.on('pageerror', err => errors.push('390 frutas pageerror: ' + err.message));
  await openReady(coarse, 390, 844, '/categorias/frutas/');
  const phone = await measureCard(coarse);
  leftoverCssOk(phone, '390 frutas');
  ok(phone.found, '390 frutas: leftover Melancia 1/4 catalog card is present');
  ok(phone.count > 1, `390 frutas: leftover seo-product-card grid stays (got ${phone.count})`);
  ok(phone.tag === 'ARTICLE', `390 frutas: leftover seo-product-card stays an article (got ${phone.tag})`);
  ok(phone.linkTag === 'A', `390 frutas: leftover seo-product-image stays an a (got ${phone.linkTag})`);
  ok(phone.type === '', `390 frutas: leftover seo-product-image stays without leftover type=button (got ${phone.type})`);
  ok(/melancia-1-4/.test(phone.href), `390 frutas: leftover photo href stays Melancia 1/4 (got ${phone.href})`);
  ok(/Melancia 1\/4/i.test(phone.title), `390 frutas: leftover title stays Melancia 1/4 (got "${phone.title}")`);
  ok(/Ver produto/i.test(phone.ver), `390 frutas: leftover Ver produto stays (got "${phone.ver}")`);
  ok(isIdentity(phone.restTransform), `390 frutas rest transform identity (got ${phone.restTransform})`);
  ok(!phone.hovered.canHover && isIdentity(phone.hovered.transform),
    `390 frutas hover:none should not sticky-zoom leftover catalog photos (canHover=${phone.hovered.canHover}, transform=${phone.hovered.transform})`);
  ok(
    phone.wrapping.includes('Início') &&
    phone.wrapping.includes('Frutas') &&
    phone.wrapping.includes('Legumes') &&
    phone.wrapping.includes('Promoções') &&
    !phone.wrapping.some(t => /Ervas/i.test(t)) &&
    !phone.wrapping.some(t => /Época/i.test(t)) &&
    !phone.wrapping.some(t => /Cabazes/i.test(t)),
    `390 frutas: leftover wrapping nav stays Início / Frutas / Legumes / Promoções (got ${phone.wrapping.join(' / ')})`
  );

  const tapped = await coarse.evaluate(() => {
    const card = [...document.querySelectorAll('.seo-product-card')]
      .find(el => /Melancia 1\/4/i.test(el.textContent || ''));
    if (!card) return { ok: false, reason: 'card missing' };
    const link = card.querySelector('a.seo-product-image');
    const img = link ? link.querySelector('img') : null;
    if (link) link.addEventListener('click', e => e.preventDefault(), { once: true });
    if (link) link.click();
    return {
      ok: true,
      transform: img ? getComputedStyle(img).transform : '',
      type: link ? (link.getAttribute('type') || '') : '',
      tag: link ? link.tagName : '',
      href: link ? link.getAttribute('href') || '' : '',
    };
  });
  ok(tapped.ok, '390 frutas leftover Melancia 1/4 photo tap is present');
  ok(tapped.tag === 'A', `390 frutas leftover seo-product-image tap stays an a (got ${tapped.tag})`);
  ok(tapped.type === '', `390 frutas leftover seo-product-image tap stays without leftover type=button (got ${tapped.type})`);
  ok(/melancia-1-4/.test(tapped.href), `390 frutas leftover photo tap keeps leftover Melancia 1/4 href (got ${tapped.href})`);
  ok(isIdentity(tapped.transform),
    `390 frutas leftover Melancia 1/4 tap does not sticky-zoom leftover catalog photo (transform=${tapped.transform})`);

  const productPhone = await browser.newPage();
  productPhone.on('pageerror', err => errors.push('390 product pageerror: ' + err.message));
  await openReady(productPhone, 390, 844, '/produtos/banana-madeira/');
  const productHero = await productPhone.evaluate(() => ({
    cards: document.querySelectorAll('.seo-product-card').length,
    images: document.querySelectorAll('.seo-product-image').length,
    shop: document.querySelectorAll('.product-card').length,
    tiles: document.querySelectorAll('.cat-quick-btn').length,
    photos: document.querySelectorAll('.feature-photo').length,
    gallery: document.querySelectorAll('.qs-photo').length,
    wrapping: [...document.querySelectorAll('.seo-nav a')].map(a => (a.textContent || '').trim()),
    order: (() => {
      const btn = document.querySelector('.seo-order-link');
      return {
        found: Boolean(btn),
        label: btn ? (btn.textContent || '').replace(/\s+/g, ' ').trim() : '',
        href: btn ? btn.getAttribute('href') || '' : '',
      };
    })(),
  }));
  ok(productHero.cards === 0, `390 product: leftover seo-product-card stays category-only (got ${productHero.cards})`);
  ok(productHero.images === 0, `390 product: leftover seo-product-image stays category-only (got ${productHero.images})`);
  ok(productHero.shop === 0, `390 product: leftover product-card stays homepage-only (got ${productHero.shop})`);
  ok(productHero.tiles === 0, `390 product: leftover cat-quick-btn stays homepage-only (got ${productHero.tiles})`);
  ok(productHero.photos === 0, `390 product: leftover feature-photo stays homepage-only (got ${productHero.photos})`);
  ok(productHero.gallery === 0, `390 product: leftover qs-photo stays homepage-only (got ${productHero.gallery})`);
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
  ok(productHero.order.found, '390 product: leftover Ver no catálogo e encomendar is present');
  ok(/Ver no catálogo e encomendar/i.test(productHero.order.label) && /produto=banana-madeira#produtos/.test(productHero.order.href),
    `390 product: leftover order CTA stays (got "${productHero.order.label}" ${productHero.order.href})`);

  const home = await browser.newPage();
  home.on('pageerror', err => errors.push('390 homepage pageerror: ' + err.message));
  await openReady(home, 390, 844);
  const bar = await home.evaluate(() =>
    [...document.querySelectorAll('.mb-item')].map(el =>
      (el.textContent || '').replace(/\s+/g, ' ').trim()
    )
  );
  ok(bar.some(t => /Carrinho/i.test(t)), '390 homepage: 4-item bar still lists Carrinho');
  ok(bar.some(t => /Promoções/i.test(t)), '390 homepage: 4-item bar still lists Promoções');
  ok(bar.some(t => /WhatsApp/i.test(t)), '390 homepage: 4-item bar still lists WhatsApp');
  ok(bar.some(t => /Como Chegar/i.test(t)), '390 homepage: 4-item bar still lists Como Chegar');
  ok(bar.length === 4, `390 homepage: leftover 4-item bar stays (got ${bar.length})`);
  const steps = await home.evaluate(() =>
    [...document.querySelectorAll('#como-funciona .step-title')]
      .map(el => (el.textContent || '').replace(/\s+/g, ' ').trim())
  );
  ok(
    steps.includes('Escolha os Produtos') &&
    steps.includes('Levante na Loja') &&
    steps.length === 5,
    `390 homepage: leftover Como Encomendar 5 passos stay (got ${steps.join(' / ')})`
  );
  await addMelancia(home, '390 homepage');
  const afterAdd = await home.evaluate(() => ({
    count: document.getElementById('cart-count')?.textContent || '',
    wa: document.querySelector('.mb-item[href*="wa.me/351932699850"]')?.getAttribute('href') || '',
    catalogCards: document.querySelectorAll('.seo-product-card').length,
  }));
  ok(afterAdd.count === '1', `390 homepage after leftover Melancia 1/4 add: leftover cart stays (count=${afterAdd.count})`);
  ok(/wa\.me\/351932699850/.test(afterAdd.wa),
    `390 homepage leftover 4-item bar WhatsApp stays wa.me/351932699850 (got ${afterAdd.wa})`);
  ok(afterAdd.catalogCards === 0,
    `390 homepage leftover seo-product-card stays catalog-only (got ${afterAdd.catalogCards})`);

  const fine = await browser.newPage();
  fine.on('pageerror', err => errors.push('1280 frutas pageerror: ' + err.message));
  await openReady(fine, 1280, 800, '/categorias/frutas/');
  const wide = await measureCard(fine);
  leftoverCssOk(wide, '1280 frutas');
  ok(wide.found, '1280 frutas: leftover Melancia 1/4 catalog card is present');
  ok(wide.tag === 'ARTICLE', `1280 frutas: leftover seo-product-card stays an article (got ${wide.tag})`);
  ok(wide.type === '', `1280 frutas: leftover seo-product-image stays without leftover type=button (got ${wide.type})`);
  ok(/Ver produto/i.test(wide.ver), `1280 frutas: leftover Ver produto stays (got "${wide.ver}")`);
  ok(isIdentity(wide.restTransform), `1280 frutas rest transform identity (got ${wide.restTransform})`);
  ok(!wide.hovered.canHover || isScale104(wide.hovered.transform),
    `1280 frutas: if the pointer can hover, leftover 1.04 zoom stays (canHover=${wide.hovered.canHover}, transform=${wide.hovered.transform})`);
  ok(isIdentity(wide.hovered.transform) || wide.hovered.canHover,
    `1280 frutas: leftover 1.04 zoom stays inside leftover hover-capable pointers (canHover=${wide.hovered.canHover}, transform=${wide.hovered.transform})`);
  ok(
    wide.wrapping.includes('Início') &&
    wide.wrapping.includes('Frutas') &&
    wide.wrapping.includes('Legumes') &&
    wide.wrapping.includes('Promoções'),
    `1280 frutas: leftover wrapping nav stays (got ${wide.wrapping.join(' / ')})`
  );

  const homeWide = await browser.newPage();
  homeWide.on('pageerror', err => errors.push('1280 homepage pageerror: ' + err.message));
  await openReady(homeWide, 1280, 800);
  await addMelancia(homeWide, '1280 homepage');

  await browser.close();
  server.close();
  if (errors.length) {
    console.error('check-seo-card-hover-zoom-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
    process.exit(1);
  }
  console.log('check-seo-card-hover-zoom-browser: ok');
} catch (err) {
  try { await browser.close(); } catch {}
  try { server.close(); } catch {}
  console.error(err);
  process.exit(1);
}
