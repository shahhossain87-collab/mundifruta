#!/usr/bin/env node
/** Chrome: leftover Avalie-nos / Como Chegar .social-link slide-out only on hover-capable pointers. */
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
const txFrom = value => {
  if (!value || value === 'none') return 0;
  const m2 = value.match(/^matrix\(([^)]+)\)$/);
  if (m2) {
    const parts = m2[1].split(',').map(s => parseFloat(s.trim()));
    return parts.length === 6 && Number.isFinite(parts[4]) ? parts[4] : 0;
  }
  const m3 = value.match(/^matrix3d\(([^)]+)\)$/);
  if (m3) {
    const parts = m3[1].split(',').map(s => parseFloat(s.trim()));
    return parts.length === 16 && Number.isFinite(parts[12]) ? parts[12] : 0;
  }
  const t = value.match(/translateX\((-?[\d.]+)px\)/);
  return t ? parseFloat(t[1]) : 0;
};
const isSlidOut = value => Math.abs(txFrom(value)) < 8;
const isTucked = value => txFrom(value) > 20;

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

async function inspectSlide(page) {
  const rest = await page.evaluate(() => {
    const links = [...document.querySelectorAll('.social-link')];
    const chip = document.querySelector('.social-goog') || links.find(a => !(a.classList.contains('social-wa'))) || null;
    if (chip) {
      chip.style.transition = 'none';
      chip.scrollIntoView({ block: 'center', inline: 'nearest' });
      void chip.offsetHeight;
    }
    const hero = [...document.querySelectorAll('.hero-ctas a')]
      .map(a => (a.textContent || '').replace(/\s+/g, ' ').trim());
    const stepTitles = [...document.querySelectorAll('#como-funciona .step-title')]
      .map(el => (el.textContent || '').replace(/\s+/g, ' ').trim());
    const hoverRules = [];
    const hoverNoneSlide = [];
    const unscopedSocialLink = [];
    const unscopedSocialWa = [];
    const unscopedCarousel = [];
    const unscopedSc = [];
    const unscopedZoom = [];
    const unscopedShop = [];
    const unscopedShopZoom = [];
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
    for (const sheet of document.styleSheets) {
      let list;
      try { list = [...sheet.cssRules]; } catch { continue; }
      for (const rule of list) {
        if (rule instanceof CSSMediaRule && /\(hover:\s*hover\)/.test(rule.conditionText || '')) {
          for (const inner of rule.cssRules) {
            if ((inner.selectorText || '') === '.social-link:hover') {
              hoverRules.push({
                media: rule.conditionText,
                selector: inner.selectorText,
                transform: inner.style.transform,
              });
            }
          }
        }
        if (rule instanceof CSSMediaRule && /\(hover:\s*none\)/.test(rule.conditionText || '')) {
          for (const inner of rule.cssRules) {
            const sel = inner.selectorText || '';
            if (sel === '.social-link:hover' && /translateX\(0/.test(inner.style.transform || '')) {
              hoverNoneSlide.push(sel);
            }
          }
        }
        if (rule instanceof CSSStyleRule) {
          const sel = rule.selectorText || '';
          if (sel === '.social-link:hover' && /translateX/.test(rule.style.transform || '')) {
            unscopedSocialLink.push(sel + ' ' + rule.style.transform);
          }
          if (sel === '.social-wa:hover' && /scale\(/.test(rule.style.transform || '')) {
            unscopedSocialWa.push(sel + ' ' + rule.style.transform);
          }
          if (sel === '.carousel-nav:hover' && /scale\(/.test(rule.style.transform || '')) {
            unscopedCarousel.push(sel + ' ' + rule.style.transform);
          }
          if (sel === '.sc:hover' && /translateY/.test(rule.style.transform || '')) {
            unscopedSc.push(sel + ' ' + rule.style.transform);
          }
          if (sel === '.sc:hover img') unscopedZoom.push(sel);
          if (sel === '.product-card:hover' && /translateY/.test(rule.style.transform || '')) {
            unscopedShop.push(sel + ' ' + rule.style.transform);
          }
          if (/\.product-card:hover/.test(sel) && /\.photo-wrap img/.test(sel)) unscopedShopZoom.push(sel);
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
        }
      }
    }
    const panel = document.querySelector('.social-panel');
    const chipCs = chip ? getComputedStyle(chip) : null;
    const panelCs = panel ? getComputedStyle(panel) : null;
    const wa = document.querySelector('.social-wa');
    const waCs = wa ? getComputedStyle(wa) : null;
    return {
      count: links.length,
      titles: links.map(a => a.getAttribute('title') || ''),
      labels: links.map(a => (a.querySelector('.social-label')?.textContent || '').trim()),
      hrefs: links.map(a => a.getAttribute('href') || ''),
      targets: links.map(a => a.getAttribute('target') || ''),
      classes: links.map(a => a.className),
      restDisplay: chipCs ? chipCs.display : '',
      restTransform: chipCs ? chipCs.transform : '',
      waRestTransform: waCs ? waCs.transform : '',
      panelDisplay: panelCs ? panelCs.display : '',
      chipFound: Boolean(chip),
      chipClass: chip ? chip.className : '',
      hero,
      stepTitles,
      hoverRules,
      hoverNoneSlide,
      unscopedSocialLink,
      unscopedSocialWa,
      unscopedCarousel,
      unscopedSc,
      unscopedZoom,
      unscopedShop,
      unscopedShopZoom,
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
    };
  });

  let hovered = {
    transform: rest.restTransform,
    canHover: false,
    display: rest.restDisplay,
    href: '',
    hovered: false,
  };
  if (rest.chipFound && rest.panelDisplay !== 'none') {
    const handle = await page.evaluateHandle(() => document.querySelector('.social-goog'));
    const el = handle.asElement();
    if (el) {
      try { await el.hover(); } catch {}
      await new Promise(r => setTimeout(r, 400));
    }
    hovered = await page.evaluate(() => {
      const chip = document.querySelector('.social-goog');
      const canHover = window.matchMedia('(hover: hover)').matches;
      const cs = chip ? getComputedStyle(chip) : null;
      return {
        transform: cs ? cs.transform : '',
        canHover,
        display: cs ? cs.display : '',
        href: chip ? (chip.getAttribute('href') || '') : '',
        hovered: chip ? chip.matches(':hover') : false,
      };
    });
  } else {
    hovered = await page.evaluate(() => {
      const chip = document.querySelector('.social-goog');
      const canHover = window.matchMedia('(hover: hover)').matches;
      const cs = chip ? getComputedStyle(chip) : null;
      return {
        transform: cs ? cs.transform : '',
        canHover,
        display: cs ? cs.display : '',
        href: chip ? (chip.getAttribute('href') || '') : '',
        hovered: chip ? chip.matches(':hover') : false,
      };
    });
  }
  return { ...rest, hovered };
}

function leftoverCssOk(sample, label) {
  ok(
    sample.hoverRules.length === 1 &&
    /^translateX\(0(?:px)?\)$/.test(sample.hoverRules[0].transform || ''),
    `${label}: leftover Avalie-nos / Como Chegar .social-link slide-out lives in (hover: hover) (got ${JSON.stringify(sample.hoverRules)})`
  );
  ok(sample.unscopedSocialLink.length === 0,
    `${label}: no unscoped leftover Avalie-nos / Como Chegar .social-link slide-out (got ${sample.unscopedSocialLink.join(', ')})`);
  ok(sample.hoverNoneSlide.length === 0,
    `${label}: leftover Avalie-nos / Como Chegar .social-link hover:none slide reset stays out (got ${sample.hoverNoneSlide.join(', ')})`);
  ok(sample.unscopedSocialWa.length === 1,
    `${label}: leftover Fale Connosco / Encomendar .social-wa scale stays unscoped (PR #366) (got ${sample.unscopedSocialWa.join(', ')})`);
  ok(sample.unscopedCarousel.length === 1,
    `${label}: leftover featured-row .carousel-nav scale stays unscoped (PR #365) (got ${sample.unscopedCarousel.join(', ')})`);
  ok(sample.unscopedSc.length === 1,
    `${label}: leftover unused .sc lift stays unscoped (PR #364) (got ${sample.unscopedSc.join(', ')})`);
  ok(sample.unscopedZoom.length === 1,
    `${label}: leftover unused .sc photo zoom stays unscoped (PR #276) (got ${sample.unscopedZoom.join(', ')})`);
  ok(sample.unscopedShop.length === 3,
    `${label}: leftover shop-card lift stays unscoped (PR #363) (got ${sample.unscopedShop.join(', ')})`);
  ok(sample.unscopedShopZoom.length === 1,
    `${label}: leftover shop-card photo zoom stays unscoped (PR #272) (got ${sample.unscopedShopZoom.join(', ')})`);
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
    `${label}: leftover catalog card zoom stays unscoped (PR #271) (got ${sample.catalogUnscoped.join(', ')})`);
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
  coarse.on('pageerror', err => errors.push('390 pageerror: ' + err.message));
  await openReady(coarse, 390, 844);
  await coarse.waitForSelector('.social-link', { timeout: 15000 });
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
  const phone = await inspectSlide(coarse);
  leftoverCssOk(phone, '390');
  ok(phone.count === 4, `390: leftover social-link chips stay (got ${phone.count})`);
  ok(phone.labels.includes('Avalie-nos') && phone.labels.includes('Como Chegar') &&
    phone.labels.includes('Fale Connosco') && phone.labels.includes('Encomendar'),
    `390: leftover social-link labels stay (got ${phone.labels.join(', ')})`);
  ok(phone.titles.includes('Google Reviews') && phone.titles.includes('Como chegar à loja'),
    `390: leftover Avalie-nos / Como Chegar titles stay (got ${phone.titles.join(', ')})`);
  ok(phone.targets.every(t => t === '_blank'),
    `390: leftover social-link stays target=_blank (got ${phone.targets.join(', ')})`);
  ok(phone.panelDisplay === 'none',
    `390: leftover .social-panel stays hidden on leftover phones (display=${phone.panelDisplay})`);
  ok(!phone.hovered.canHover,
    `390: hover:none pointer (canHover=${phone.hovered.canHover})`);
  ok(!isSlidOut(phone.hovered.transform) || phone.panelDisplay === 'none',
    `390 hover:none should not sticky-slide leftover Avalie-nos / Como Chegar (transform=${phone.hovered.transform})`);
  ok(phone.hero.some(t => /Ver Produtos/i.test(t)) && phone.hero.some(t => /Encomendar por WhatsApp/i.test(t)),
    `390: leftover hero CTAs stay (got ${phone.hero.join(' / ')})`);
  ok(
    phone.stepTitles.includes('Escolha os Produtos') &&
    phone.stepTitles.includes('Levante na Loja') &&
    phone.stepTitles.length === 5,
    `390: leftover Como Encomendar 5 passos stay (got ${phone.stepTitles.join(' / ')})`
  );
  await addMelancia(coarse, '390');
  const afterAdd = await coarse.evaluate(() => ({
    count: document.getElementById('cart-count')?.textContent || '',
    wa: document.querySelector('.mb-item[href*="wa.me/351932699850"]')?.getAttribute('href') || '',
    social: document.querySelectorAll('.social-link').length,
  }));
  ok(afterAdd.count === '1', `390 after leftover Melancia 1/4 add: leftover cart stays (count=${afterAdd.count})`);
  ok(/wa\.me\/351932699850/.test(afterAdd.wa),
    `390 leftover 4-item bar WhatsApp stays wa.me/351932699850 (got ${afterAdd.wa})`);
  ok(afterAdd.social === 4, `390 after leftover Melancia 1/4 add: leftover social-link stays (got ${afterAdd.social})`);

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
    social: document.querySelectorAll('.social-link, .social-panel').length,
  }));
  ok(productHero.cards === 0, `390 product: leftover product-card stays homepage-only (got ${productHero.cards})`);
  ok(productHero.tiles === 0, `390 product: leftover cat-quick-btn stays homepage-only (got ${productHero.tiles})`);
  ok(productHero.ctas === 0, `390 product: leftover hero-ctas stay homepage-only (got ${productHero.ctas})`);
  ok(productHero.wa === 0, `390 product: leftover .btn-wa stays homepage-only (got ${productHero.wa})`);
  ok(productHero.scroll === 0, `390 product: leftover scroll-top stays homepage-only (got ${productHero.scroll})`);
  ok(productHero.nav === 0, `390 product: leftover carousel-nav stays homepage-only (got ${productHero.nav})`);
  ok(productHero.sc === 0, `390 product: leftover unused .sc stays homepage-CSS-only (got ${productHero.sc})`);
  ok(productHero.social === 0, `390 product: leftover .social-link stays homepage-only (got ${productHero.social})`);
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
  await fine.waitForSelector('.social-goog', { timeout: 15000 });
  const wide = await inspectSlide(fine);
  leftoverCssOk(wide, '1280');
  ok(wide.count === 4, `1280: leftover social-link chips stay (got ${wide.count})`);
  ok(wide.labels.includes('Avalie-nos') && wide.labels.includes('Como Chegar'),
    `1280: leftover Avalie-nos / Como Chegar labels stay (got ${wide.labels.join(', ')})`);
  ok(wide.panelDisplay !== 'none',
    `1280: leftover .social-panel stays visible on leftover desktop (display=${wide.panelDisplay})`);
  ok(isTucked(wide.restTransform),
    `1280 rest leftover Avalie-nos stays tucked (got ${wide.restTransform})`);
  ok(isSlidOut(wide.waRestTransform),
    `1280 rest leftover Fale Connosco stays expanded (got ${wide.waRestTransform})`);
  ok(!wide.hovered.canHover || isTucked(wide.hovered.transform) || isSlidOut(wide.hovered.transform),
    `1280: if the pointer can hover, leftover slide-out or tuck stays (canHover=${wide.hovered.canHover}, transform=${wide.hovered.transform})`);
  ok(!isSlidOut(wide.hovered.transform) || wide.hovered.canHover,
    `1280: leftover slide-out stays inside leftover hover-capable pointers (canHover=${wide.hovered.canHover}, transform=${wide.hovered.transform})`);
  ok(/maps\.app\.goo\.gl\/1gHGqMac4ahTtfxf8/.test(wide.hovered.href) || /maps\.app\.goo\.gl\/1gHGqMac4ahTtfxf8/.test(wide.hrefs.join(' ')),
    `1280: leftover Avalie-nos href stays maps.app (got ${wide.hovered.href || wide.hrefs.join(', ')})`);
  ok(wide.hero.some(t => /Ver Produtos/i.test(t)) && wide.hero.some(t => /Encomendar por WhatsApp/i.test(t)),
    `1280: leftover hero CTAs stay (got ${wide.hero.join(' / ')})`);
  ok(
    wide.stepTitles.includes('Escolha os Produtos') &&
    wide.stepTitles.includes('Levante na Loja') &&
    wide.stepTitles.length === 5,
    `1280: leftover Como Encomendar 5 passos stay (got ${wide.stepTitles.join(' / ')})`
  );
  const beforeClick = await fine.evaluate(() => document.getElementById('cart-count')?.textContent || '');
  await fine.evaluate(() => {
    const chip = document.querySelector('.social-goog');
    if (chip) chip.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  });
  const afterClick = await fine.evaluate(() => document.getElementById('cart-count')?.textContent || '');
  ok(beforeClick === afterClick,
    `1280 leftover Avalie-nos click does not change leftover cart (before=${beforeClick}, after=${afterClick})`);
  await addMelancia(fine, '1280');

  await browser.close();
  server.close();
  if (errors.length) {
    console.error('check-homepage-social-link-hover-slide-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
    process.exit(1);
  }
  console.log('check-homepage-social-link-hover-slide-browser: ok');
} catch (err) {
  try { await browser.close(); } catch {}
  try { server.close(); } catch {}
  console.error(err);
  process.exit(1);
}
