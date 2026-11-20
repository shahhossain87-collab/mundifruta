#!/usr/bin/env node
/** Chrome: leftover Fale Connosco / Encomendar .social-wa scale only on hover-capable pointers. */
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
const isIdentityScale = value => {
  if (!value || value === 'none') return true;
  if (/scale\(1\.03\)/.test(value)) return false;
  const m2 = value.match(/^matrix\(([^)]+)\)$/);
  if (m2) {
    const parts = m2[1].split(',').map(s => parseFloat(s.trim()));
    return parts.length === 6 &&
      Math.abs(parts[0] - 1) < 0.02 &&
      Math.abs(parts[3] - 1) < 0.02;
  }
  const m3 = value.match(/^matrix3d\(([^)]+)\)$/);
  if (!m3) return true;
  const parts = m3[1].split(',').map(s => parseFloat(s.trim()));
  return parts.length === 16 &&
    Math.abs(parts[0] - 1) < 0.02 &&
    Math.abs(parts[5] - 1) < 0.02;
};
const isScale103 = value => {
  if (!value) return false;
  if (/scale\(1\.03\)/.test(value)) return true;
  const m2 = value.match(/^matrix\(([^)]+)\)$/);
  if (m2) {
    const parts = m2[1].split(',').map(s => parseFloat(s.trim()));
    return parts.length === 6 &&
      Math.abs(parts[0] - 1.03) < 0.02 &&
      Math.abs(parts[3] - 1.03) < 0.02;
  }
  const m3 = value.match(/^matrix3d\(([^)]+)\)$/);
  if (!m3) return false;
  const parts = m3[1].split(',').map(s => parseFloat(s.trim()));
  return parts.length === 16 &&
    Math.abs(parts[0] - 1.03) < 0.02 &&
    Math.abs(parts[5] - 1.03) < 0.02;
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

async function inspectWa(page) {
  const rest = await page.evaluate(() => {
    const links = [...document.querySelectorAll('.social-wa')];
    const first = links[0] || null;
    if (first) {
      first.style.transition = 'none';
      first.scrollIntoView({ block: 'center', inline: 'nearest' });
      void first.offsetHeight;
    }
    const hero = [...document.querySelectorAll('.hero-ctas a')]
      .map(a => (a.textContent || '').replace(/\s+/g, ' ').trim());
    const stepTitles = [...document.querySelectorAll('#como-funciona .step-title')]
      .map(el => (el.textContent || '').replace(/\s+/g, ' ').trim());
    const hoverRules = [];
    const hoverNoneScale = [];
    const unscopedSocialWa = [];
    const unscopedSocialLink = [];
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
            if ((inner.selectorText || '') === '.social-wa:hover') {
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
            if (sel === '.social-wa:hover' && /scale\(/.test(inner.style.transform || '')) {
              hoverNoneScale.push(sel);
            }
          }
        }
        if (rule instanceof CSSStyleRule) {
          const sel = rule.selectorText || '';
          if (sel === '.social-wa:hover' && /scale\(/.test(rule.style.transform || '')) {
            unscopedSocialWa.push(sel + ' ' + rule.style.transform);
          }
          if (sel === '.social-link:hover' && /translateX/.test(rule.style.transform || '')) {
            unscopedSocialLink.push(sel);
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
    const firstCs = first ? getComputedStyle(first) : null;
    const panelCs = panel ? getComputedStyle(panel) : null;
    return {
      count: links.length,
      titles: links.map(a => a.getAttribute('title') || ''),
      labels: links.map(a => (a.querySelector('.social-label')?.textContent || '').trim()),
      hrefs: links.map(a => a.getAttribute('href') || ''),
      targets: links.map(a => a.getAttribute('target') || ''),
      restDisplay: firstCs ? firstCs.display : '',
      restTransform: firstCs ? firstCs.transform : '',
      panelDisplay: panelCs ? panelCs.display : '',
      firstFound: Boolean(first),
      hero,
      stepTitles,
      hoverRules,
      hoverNoneScale,
      unscopedSocialWa,
      unscopedSocialLink,
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
  if (rest.firstFound && rest.panelDisplay !== 'none') {
    const handle = await page.evaluateHandle(() => document.querySelector('.social-wa'));
    const el = handle.asElement();
    if (el) {
      try { await el.hover(); } catch {}
      await new Promise(r => setTimeout(r, 400));
    }
    hovered = await page.evaluate(() => {
      const first = document.querySelector('.social-wa');
      const canHover = window.matchMedia('(hover: hover)').matches;
      const cs = first ? getComputedStyle(first) : null;
      return {
        transform: cs ? cs.transform : '',
        canHover,
        display: cs ? cs.display : '',
        href: first ? (first.getAttribute('href') || '') : '',
        hovered: first ? first.matches(':hover') : false,
      };
    });
  } else {
    hovered = await page.evaluate(() => {
      const first = document.querySelector('.social-wa');
      const canHover = window.matchMedia('(hover: hover)').matches;
      const cs = first ? getComputedStyle(first) : null;
      return {
        transform: cs ? cs.transform : '',
        canHover,
        display: cs ? cs.display : '',
        href: first ? (first.getAttribute('href') || '') : '',
        hovered: first ? first.matches(':hover') : false,
      };
    });
  }
  return { ...rest, hovered };
}

function leftoverCssOk(sample, label) {
  ok(
    sample.hoverRules.length === 1 &&
    /^translateX\(0(?:px)?\) scale\(1\.03\)$/.test(sample.hoverRules[0].transform || ''),
    `${label}: leftover Fale Connosco / Encomendar .social-wa scale lives in (hover: hover) (got ${JSON.stringify(sample.hoverRules)})`
  );
  ok(sample.unscopedSocialWa.length === 0,
    `${label}: no unscoped leftover Fale Connosco / Encomendar .social-wa scale (got ${sample.unscopedSocialWa.join(', ')})`);
  ok(sample.hoverNoneScale.length === 0,
    `${label}: leftover Fale Connosco / Encomendar .social-wa hover:none scale reset stays out (got ${sample.hoverNoneScale.join(', ')})`);
  ok(sample.unscopedSocialLink.length === 1,
    `${label}: leftover .social-link slide-out stays unscoped (got ${sample.unscopedSocialLink.join(', ')})`);
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
  await coarse.waitForSelector('.social-wa', { timeout: 15000 });
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
  const phone = await inspectWa(coarse);
  leftoverCssOk(phone, '390');
  ok(phone.count === 2, `390: leftover Fale Connosco / Encomendar .social-wa stay (got ${phone.count})`);
  ok(phone.labels.includes('Fale Connosco') && phone.labels.includes('Encomendar'),
    `390: leftover social-wa labels stay Fale Connosco / Encomendar (got ${phone.labels.join(', ')})`);
  ok(phone.titles.includes('Fale connosco no WhatsApp') && phone.titles.includes('Encomendar via WhatsApp'),
    `390: leftover social-wa titles stay (got ${phone.titles.join(', ')})`);
  ok(phone.hrefs.every(h => /wa\.me\/351932699850/.test(h)),
    `390: leftover social-wa hrefs stay wa.me/351932699850 (got ${phone.hrefs.join(', ')})`);
  ok(phone.targets.every(t => t === '_blank'),
    `390: leftover social-wa stays target=_blank (got ${phone.targets.join(', ')})`);
  ok(phone.panelDisplay === 'none',
    `390: leftover .social-panel stays hidden on leftover phones (display=${phone.panelDisplay})`);
  ok(!phone.hovered.canHover,
    `390: hover:none pointer (canHover=${phone.hovered.canHover})`);
  ok(!isScale103(phone.hovered.transform),
    `390 hover:none should not sticky-scale leftover Fale Connosco / Encomendar .social-wa (transform=${phone.hovered.transform})`);
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
    social: document.querySelectorAll('.social-wa').length,
  }));
  ok(afterAdd.count === '1', `390 after leftover Melancia 1/4 add: leftover cart stays (count=${afterAdd.count})`);
  ok(/wa\.me\/351932699850/.test(afterAdd.wa),
    `390 leftover 4-item bar WhatsApp stays wa.me/351932699850 (got ${afterAdd.wa})`);
  ok(afterAdd.social === 2, `390 after leftover Melancia 1/4 add: leftover social-wa stays (got ${afterAdd.social})`);

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
    social: document.querySelectorAll('.social-wa, .social-panel').length,
  }));
  ok(productHero.cards === 0, `390 product: leftover product-card stays homepage-only (got ${productHero.cards})`);
  ok(productHero.tiles === 0, `390 product: leftover cat-quick-btn stays homepage-only (got ${productHero.tiles})`);
  ok(productHero.ctas === 0, `390 product: leftover hero-ctas stay homepage-only (got ${productHero.ctas})`);
  ok(productHero.wa === 0, `390 product: leftover .btn-wa stays homepage-only (got ${productHero.wa})`);
  ok(productHero.scroll === 0, `390 product: leftover scroll-top stays homepage-only (got ${productHero.scroll})`);
  ok(productHero.nav === 0, `390 product: leftover carousel-nav stays homepage-only (got ${productHero.nav})`);
  ok(productHero.sc === 0, `390 product: leftover unused .sc stays homepage-CSS-only (got ${productHero.sc})`);
  ok(productHero.social === 0, `390 product: leftover .social-wa stays homepage-only (got ${productHero.social})`);
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
  await fine.waitForSelector('.social-wa', { timeout: 15000 });
  const wide = await inspectWa(fine);
  leftoverCssOk(wide, '1280');
  ok(wide.count === 2, `1280: leftover Fale Connosco / Encomendar .social-wa stay (got ${wide.count})`);
  ok(wide.labels.includes('Fale Connosco') && wide.labels.includes('Encomendar'),
    `1280: leftover social-wa labels stay Fale Connosco / Encomendar (got ${wide.labels.join(', ')})`);
  ok(wide.panelDisplay !== 'none',
    `1280: leftover .social-panel stays visible on leftover desktop (display=${wide.panelDisplay})`);
  ok(isIdentityScale(wide.restTransform),
    `1280 rest leftover Fale Connosco / Encomendar .social-wa scale stays 1 (got ${wide.restTransform})`);
  ok(!wide.hovered.canHover || isIdentityScale(wide.hovered.transform) || isScale103(wide.hovered.transform),
    `1280: if the pointer can hover, leftover 1.03 scale or animation fill stays (canHover=${wide.hovered.canHover}, transform=${wide.hovered.transform})`);
  ok(!isScale103(wide.hovered.transform) || wide.hovered.canHover,
    `1280: leftover 1.03 scale stays inside leftover hover-capable pointers (canHover=${wide.hovered.canHover}, transform=${wide.hovered.transform})`);
  ok(/wa\.me\/351932699850/.test(wide.hovered.href),
    `1280: leftover Fale Connosco href stays wa.me/351932699850 (got ${wide.hovered.href})`);
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
    const first = document.querySelector('.social-wa');
    if (first) first.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  });
  const afterClick = await fine.evaluate(() => document.getElementById('cart-count')?.textContent || '');
  ok(beforeClick === afterClick,
    `1280 leftover Fale Connosco click does not change leftover cart (before=${beforeClick}, after=${afterClick})`);
  await addMelancia(fine, '1280');

  await browser.close();
  server.close();
  if (errors.length) {
    console.error('check-homepage-social-wa-hover-scale-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
    process.exit(1);
  }
  console.log('check-homepage-social-wa-hover-scale-browser: ok');
} catch (err) {
  try { await browser.close(); } catch {}
  try { server.close(); } catch {}
  console.error(err);
  process.exit(1);
}
