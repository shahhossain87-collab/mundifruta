#!/usr/bin/env node
/** Chrome: leftover homepage Google-rating lift only on hover-capable pointers. */
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
const isLift = value => {
  if (!value) return false;
  if (/translateY\(-2px\)/.test(value)) return true;
  const m = value.match(/^matrix\(([^)]+)\)$/);
  if (!m) return false;
  const parts = m[1].split(',').map(s => parseFloat(s.trim()));
  return parts.length === 6 &&
    Math.abs(parts[0] - 1) < 0.01 &&
    Math.abs(parts[3] - 1) < 0.01 &&
    Math.abs(parts[4]) < 0.6 &&
    Math.abs(parts[5] - (-2)) < 0.6;
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

async function measureRating(page) {
  const rest = await page.evaluate(() => {
    const btn = document.querySelector('.hero-rating');
    if (btn) {
      btn.style.transition = 'none';
      btn.scrollIntoView({ block: 'center', inline: 'nearest' });
      void btn.offsetHeight;
    }
    const headings = [...document.querySelectorAll('#contacto .contact-card h4')]
      .map(el => (el.textContent || '').replace(/\s+/g, ' ').trim());
    const hero = [...document.querySelectorAll('.hero-ctas a')]
      .map(a => (a.textContent || '').replace(/\s+/g, ' ').trim());
    const stepTitles = [...document.querySelectorAll('#como-funciona .step-title')]
      .map(el => (el.textContent || '').replace(/\s+/g, ' ').trim());
    const hoverRules = [];
    const unscopedRating = [];
    const arrowUnscoped = [];
    const ghostUnscoped = [];
    const primUnscoped = [];
    const navOrderUnscoped = [];
    const ooUnscoped = [];
    const stepUnscoped = [];
    const csUnscoped = [];
    const contactUnscoped = [];
    const googleUnscoped = [];
    const catUnscopedLift = [];
    const shopUnscopedLift = [];
    const shopUnscopedZoom = [];
    const catalogUnscoped = [];
    const scUnscopedLift = [];
    const hoverNoneRating = [];
    for (const sheet of document.styleSheets) {
      let list;
      try { list = [...sheet.cssRules]; } catch { continue; }
      for (const rule of list) {
        if (rule instanceof CSSMediaRule && /\(hover:\s*hover\)/.test(rule.conditionText || '')) {
          for (const inner of rule.cssRules) {
            const innerSel = inner.selectorText || '';
            if (innerSel === '.hero-rating:hover') {
              hoverRules.push({
                media: rule.conditionText,
                selector: innerSel,
                transform: inner.style.transform,
              });
            }
          }
        }
        if (rule instanceof CSSMediaRule && /\(hover:\s*none\)/.test(rule.conditionText || '')) {
          for (const inner of rule.cssRules) {
            const innerSel = inner.selectorText || '';
            if (innerSel === '.hero-rating:hover') hoverNoneRating.push(innerSel);
          }
        }
        if (rule instanceof CSSStyleRule) {
          const ruleSel = rule.selectorText || '';
          if (ruleSel === '.hero-rating:hover') {
            unscopedRating.push(ruleSel + ' ' + (rule.style.transform || ''));
          }
          if (ruleSel === 'body.homepage .hero-ctas a:hover span' && /translate\(/.test(rule.style.transform || '')) {
            arrowUnscoped.push(ruleSel);
          }
          if (ruleSel === '.btn-ghost:hover' && /translateY/.test(rule.style.transform || '')) {
            ghostUnscoped.push(ruleSel);
          }
          if (ruleSel === '.btn-prim:hover' && /translateY/.test(rule.style.transform || '')) {
            primUnscoped.push(ruleSel);
          }
          if (ruleSel === '.nav-order:hover' && /translateY/.test(rule.style.transform || '')) {
            navOrderUnscoped.push(ruleSel);
          }
          if (ruleSel === '.oo-step:hover' && /translateY/.test(rule.style.transform || '')) {
            ooUnscoped.push(ruleSel);
          }
          if (ruleSel === '.step-card:hover' && /translateY/.test(rule.style.transform || '')) {
            stepUnscoped.push(ruleSel);
          }
          if (ruleSel === '.cs-card:hover' && /translateY/.test(rule.style.transform || '')) {
            csUnscoped.push(ruleSel);
          }
          if (ruleSel === '.contact-card:hover' && /translateY/.test(rule.style.transform || '')) {
            contactUnscoped.push(ruleSel);
          }
          if (ruleSel === '.google-badge:hover' && /translateY/.test(rule.style.transform || '')) {
            googleUnscoped.push(ruleSel);
          }
          if (/\.cat-quick-btn:hover/.test(ruleSel) && !/img/.test(ruleSel) && /translateY/.test(rule.style.transform || '')) {
            catUnscopedLift.push(ruleSel);
          }
          if (ruleSel === '.product-card:hover') shopUnscopedLift.push(ruleSel);
          if (/\.product-card:hover/.test(ruleSel) && /\.photo-wrap img/.test(ruleSel)) shopUnscopedZoom.push(ruleSel);
          if (/\.seo-product-card:hover/.test(ruleSel) && /\.seo-product-image img/.test(ruleSel)) catalogUnscoped.push(ruleSel);
          if (ruleSel === '.sc:hover') scUnscopedLift.push(ruleSel);
        }
      }
    }
    return {
      found: Boolean(btn),
      label: btn ? (btn.textContent || '').replace(/\s+/g, ' ').trim() : '',
      href: btn ? btn.getAttribute('href') || '' : '',
      title: btn ? btn.getAttribute('title') || '' : '',
      restTransform: btn ? getComputedStyle(btn).transform : '',
      display: btn ? getComputedStyle(btn).display : '',
      headings,
      hero,
      stepTitles,
      hoverRules,
      unscopedRating: [...new Set(unscopedRating)],
      arrowUnscoped,
      ghostUnscoped,
      primUnscoped,
      navOrderUnscoped,
      ooUnscoped,
      stepUnscoped,
      csUnscoped,
      contactUnscoped,
      googleUnscoped,
      catUnscopedLift,
      shopUnscopedLift,
      shopUnscopedZoom,
      catalogUnscoped,
      scUnscopedLift,
      hoverNoneRating,
    };
  });
  if (rest.display && rest.display !== 'none') {
    const handle = await page.evaluateHandle(() => document.querySelector('.hero-rating'));
    const el = handle.asElement();
    if (el) {
      try { await el.hover(); } catch {}
    }
    await new Promise(r => setTimeout(r, 400));
  }
  const hovered = await page.evaluate(() => {
    const btn = document.querySelector('.hero-rating');
    const canHover = window.matchMedia('(hover: hover)').matches;
    return {
      transform: btn ? getComputedStyle(btn).transform : '',
      canHover,
      btnHovered: btn ? btn.matches(':hover') : false,
    };
  });
  return { ...rest, hovered };
}

async function addMelancia(page, label) {
  const added = await page.evaluate(() => {
    if (window.limparTudo) window.limparTudo();
    if (typeof removerProduto === 'function') {
      document.querySelectorAll('[data-product-id].selected').forEach(card => {
        const id = card.getAttribute('data-product-id');
        if (id) removerProduto(id);
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
    return {
      ok: true,
      count: document.getElementById('cart-count')?.textContent || '',
    };
  });
  ok(added.ok && added.count === '1', `${label}: add Melancia 1/4 (count=${added.count})`);
  return added;
}

function leftoverCssOk(sample, label) {
  ok(
    sample.hoverRules.length === 1 &&
    sample.hoverRules[0].transform === 'translateY(-2px)',
    `${label}: leftover .hero-rating lift lives in (hover: hover) (got ${JSON.stringify(sample.hoverRules)})`
  );
  ok(sample.unscopedRating.length === 0, `${label}: no unscoped leftover .hero-rating lift (got ${sample.unscopedRating.join(', ')})`);
  ok(sample.hoverNoneRating.length === 0,
    `${label}: leftover .hero-rating hover:none reset stays out (got ${sample.hoverNoneRating.join(', ')})`);
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
  ok(sample.googleUnscoped.length === 1,
    `${label}: leftover .google-badge lift stays unscoped (got ${sample.googleUnscoped.join(', ')})`);
  ok(sample.catUnscopedLift.length >= 1,
    `${label}: leftover category-tile lift stays unscoped (PR #279) (got ${sample.catUnscopedLift.join(', ')})`);
  ok(sample.shopUnscopedLift.length === 3,
    `${label}: leftover shop-card lift stays unscoped (PR #278) (got ${sample.shopUnscopedLift.join(', ')})`);
  ok(sample.shopUnscopedZoom.length === 1,
    `${label}: leftover shop-card photo zoom stays unscoped (PR #272) (got ${sample.shopUnscopedZoom.join(', ')})`);
  ok(sample.catalogUnscoped.length === 1,
    `${label}: leftover catalog card zoom stays unscoped (PR #271) (got ${sample.catalogUnscoped.join(', ')})`);
  ok(sample.scUnscopedLift.length === 1,
    `${label}: leftover unused .sc card lift stays unscoped (PR #277) (got ${sample.scUnscopedLift.join(', ')})`);
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
  const phone = await measureRating(coarse);
  leftoverCssOk(phone, '390');
  ok(phone.found, '390: leftover homepage Google rating is present');
  ok(/4,9/.test(phone.label) && /107\+ Google/.test(phone.label),
    `390: leftover 4,9 / 107+ Google stays (got "${phone.label}")`);
  ok(phone.href === 'https://maps.app.goo.gl/1gHGqMac4ahTtfxf8?g_st=ac' &&
    phone.title === 'Ver avaliações no Google',
    `390: leftover Google maps href and title stay (got ${phone.href} / ${phone.title})`);
  ok(phone.display !== 'none',
    `390: leftover Google rating stays visible on leftover phones (display=${phone.display})`);
  ok(isIdentity(phone.restTransform), `390 rest rating transform identity (got ${phone.restTransform})`);
  ok(!phone.hovered.canHover,
    `390: hover:none pointer (canHover=${phone.hovered.canHover})`);
  ok(!isLift(phone.hovered.transform),
    `390 hover:none should not sticky-lift leftover Google rating (transform=${phone.hovered.transform})`);
  ok(
    phone.stepTitles.includes('Escolha os Produtos') &&
    phone.stepTitles.includes('Levante na Loja') &&
    phone.stepTitles.length === 5,
    `390: leftover Como Encomendar 5 passos stay (got ${phone.stepTitles.join(' / ')})`
  );
  ok(
    phone.headings.includes('Morada') &&
    phone.headings.includes('Telefone / WhatsApp') &&
    phone.headings.includes('Email') &&
    phone.headings.includes('Horário'),
    `390: leftover Encontre-nos cards stay (got ${phone.headings.join(' / ')})`
  );
  ok(phone.hero.some(t => /Ver Produtos/i.test(t)) && phone.hero.some(t => /Encomendar por WhatsApp/i.test(t)),
    `390: leftover hero CTAs stay (got ${phone.hero.join(' / ')})`);
  const waBar = await coarse.evaluate(() => {
    const a = document.querySelector('.mb-item[href*="wa.me/351932699850"]');
    return a ? a.getAttribute('href') || '' : '';
  });
  ok(/wa\.me\/351932699850/.test(waBar),
    `390: leftover 4-item bar WhatsApp stays wa.me/351932699850 (got ${waBar})`);
  await addMelancia(coarse, '390');

  const productPhone = await browser.newPage();
  productPhone.on('pageerror', err => errors.push('390 product pageerror: ' + err.message));
  await openReady(productPhone, 390, 844, '/produtos/banana-madeira/');
  const productHero = await productPhone.evaluate(() => ({
    rating: document.querySelectorAll('.hero-rating').length,
    ctas: document.querySelectorAll('.hero-ctas a').length,
  }));
  ok(productHero.rating === 0, `390 product: leftover hero-rating stays homepage-only (got ${productHero.rating})`);
  ok(productHero.ctas === 0, `390 product: leftover hero-ctas stay homepage-only (got ${productHero.ctas})`);
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
  const wide = await measureRating(fine);
  leftoverCssOk(wide, '1280');
  ok(wide.found, '1280: leftover homepage Google rating is present');
  ok(/4,9/.test(wide.label) && /107\+ Google/.test(wide.label),
    `1280: leftover 4,9 / 107+ Google stays (got "${wide.label}")`);
  ok(wide.display !== 'none',
    `1280: leftover Google rating stays visible (display=${wide.display})`);
  ok(isIdentity(wide.restTransform), `1280 rest rating transform identity (got ${wide.restTransform})`);
  ok(!wide.hovered.canHover || isIdentity(wide.hovered.transform) || isLift(wide.hovered.transform),
    `1280: if the pointer can hover, leftover 2px lift or animation fill stays (canHover=${wide.hovered.canHover}, transform=${wide.hovered.transform})`);
  ok(wide.hero.some(t => /Ver Produtos/i.test(t)) && wide.hero.some(t => /Encomendar por WhatsApp/i.test(t)),
    `1280: leftover hero CTAs stay (got ${wide.hero.join(' / ')})`);
  ok(
    wide.stepTitles.includes('Escolha os Produtos') &&
    wide.stepTitles.includes('Levante na Loja') &&
    wide.stepTitles.length === 5,
    `1280: leftover Como Encomendar 5 passos stay (got ${wide.stepTitles.join(' / ')})`
  );
  await addMelancia(fine, '1280');

  await browser.close();
  server.close();
  if (errors.length) {
    console.error('check-homepage-hero-rating-hover-lift-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
    process.exit(1);
  }
  console.log('check-homepage-hero-rating-hover-lift-browser: ok');
} catch (err) {
  try { await browser.close(); } catch {}
  try { server.close(); } catch {}
  console.error(err);
  process.exit(1);
}
