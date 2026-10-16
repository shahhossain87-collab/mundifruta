#!/usr/bin/env node
/** Chrome: leftover Avaliações Google maps hrefs; add Melancia 1/4. */
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
const mapsHref = 'https://maps.app.goo.gl/1gHGqMac4ahTtfxf8?g_st=ac';

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

async function leftoverReviewsHref(page, label) {
  const state = await page.evaluate(() => {
    const badge = document.getElementById('google-badge');
    const cta = document.getElementById('reviews-cta');
    const hero = document.querySelector('.hero-rating');
    const social = document.querySelector('.social-link.social-goog');
    const phoneStrip = [...document.querySelectorAll('.info-strip .info-item')]
      .find(el => /932 699 850/.test(el.textContent || ''));
    const addressStrip = [...document.querySelectorAll('.info-strip .info-item')]
      .find(el => /Av de Portugal, Centro Cívico, Carnaxide/.test(el.textContent || ''));
    const morada = [...document.querySelectorAll('.contact-card')].find(card =>
      /Morada/.test(card.textContent || '')
    );
    const tel = [...document.querySelectorAll('.contact-card a')].find(a =>
      (a.getAttribute('href') || '') === 'tel:932699850'
    );
    return {
      badgeHref: badge ? badge.getAttribute('href') : '',
      badgeRel: badge ? badge.getAttribute('rel') : '',
      badgeTarget: badge ? badge.getAttribute('target') : '',
      badgeText: badge ? (badge.textContent || '').replace(/\s+/g, ' ').trim() : '',
      ctaHref: cta ? cta.getAttribute('href') : '',
      ctaRel: cta ? cta.getAttribute('rel') : '',
      ctaTarget: cta ? cta.getAttribute('target') : '',
      ctaText: cta ? (cta.textContent || '').replace(/\s+/g, ' ').trim() : '',
      heroHref: hero ? hero.getAttribute('href') : '',
      socialHref: social ? social.getAttribute('href') : '',
      phoneStripTag: phoneStrip ? phoneStrip.tagName : '',
      addressStripTag: addressStrip ? addressStrip.tagName : '',
      moradaHasAnchor: !!(morada && morada.querySelector('a')),
      telHref: tel ? tel.getAttribute('href') : '',
    };
  });

  ok(state.badgeHref === mapsHref, `${label}: leftover Google-badge href stays leftover maps URL`);
  ok(state.ctaHref === mapsHref, `${label}: leftover reviews-cta href stays leftover maps URL`);
  ok(state.heroHref === mapsHref, `${label}: leftover hero Google-rating stays leftover maps URL`);
  ok(state.socialHref === mapsHref, `${label}: leftover Avalie-nos stays leftover maps URL`);
  ok(state.badgeRel === 'noopener' && state.ctaRel === 'noopener',
    `${label}: leftover Avaliações links keep leftover rel=noopener`);
  ok(state.badgeTarget === '_blank' && state.ctaTarget === '_blank',
    `${label}: leftover Avaliações links keep leftover target=_blank`);
  ok(/4,9/.test(state.badgeText) && /107/.test(state.badgeText),
    `${label}: leftover Google-badge still shows leftover 4,9 / 107`);
  ok(/Ver todas as avaliações no Google/.test(state.ctaText),
    `${label}: leftover reviews-cta copy stays`);
  ok(state.phoneStripTag === 'DIV', `${label}: leftover info-strip phone stays a leftover div`);
  ok(state.addressStripTag === 'DIV', `${label}: leftover info-strip address stays a leftover div`);
  ok(!state.moradaHasAnchor, `${label}: leftover Encontre-nos Morada stays leftover plain text`);
  ok(state.telHref === 'tel:932699850', `${label}: leftover Encontre-nos stays leftover tel:932699850`);
}

async function leftoverHomeRules(page, label) {
  const rules = await page.evaluate(() => {
    let foundReviews = false;
    let foundBadge = false;
    let foundHero = false;
    let foundStrip = false;
    for (const sheet of [...document.styleSheets]) {
      let sheetRules;
      try { sheetRules = [...sheet.cssRules]; } catch { continue; }
      for (const rule of sheetRules) {
        const text = rule.cssText || '';
        if (/\.reviews-cta:focus-visible/.test(text) && /outline/.test(text)) foundReviews = true;
        if (/\.google-badge:focus-visible/.test(text) && /outline/.test(text)) foundBadge = true;
        if (/\.hero-rating:focus-visible/.test(text) && /outline/.test(text)) foundHero = true;
        if (/\.info-item:focus-visible/.test(text) && /outline/.test(text)) foundStrip = true;
      }
    }
    return { foundReviews, foundBadge, foundHero, foundStrip };
  });
  ok(!rules.foundReviews, `${label}: must not redo leftover reviews-cta forest ring`);
  ok(!rules.foundBadge, `${label}: must not redo leftover Google-badge forest ring`);
  ok(!rules.foundHero, `${label}: must not redo leftover hero Google-rating forest ring`);
  ok(!rules.foundStrip, `${label}: must not add leftover info-strip forest ring`);
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

try {
  const raw = await fetch(base).then(r => r.text());
  ok(raw.includes(`id="google-badge" href="${mapsHref}"`),
    'static HTML leftover Google-badge already has leftover maps href before JS');
  ok(raw.includes(`id="reviews-cta" href="${mapsHref}"`),
    'static HTML leftover reviews-cta already has leftover maps href before JS');
  ok(!/id="google-badge"[^>]*href="#"/ .test(raw) && !/id="reviews-cta"[^>]*href="#"/ .test(raw),
    'static HTML leftover Avaliações links no longer use leftover href="#"');

  const desktop = await browser.newPage();
  desktop.on('pageerror', err => errors.push('1280 pageerror: ' + err.message));
  await openReady(desktop, 1280, 800);
  await leftoverReviewsHref(desktop, '1280');
  await leftoverHomeRules(desktop, '1280');
  await addMelancia(desktop, '1280');
  await desktop.evaluate(() => { if (window.irParaEncomenda) window.irParaEncomenda(); });
  await desktop.waitForFunction(() => {
    const enc = document.getElementById('encomenda');
    return !!(enc && enc.getBoundingClientRect().top < 260);
  }, { timeout: 4000 }).catch(() => {});
  const scrolled = await desktop.evaluate(() => {
    const enc = document.getElementById('encomenda');
    return !!(enc && enc.getBoundingClientRect().top < 260);
  });
  ok(scrolled, '1280: leftover irParaEncomenda still scrolls leftover #encomenda');

  const tablet = await browser.newPage();
  tablet.on('pageerror', err => errors.push('768 pageerror: ' + err.message));
  await openReady(tablet, 768, 1024);
  await leftoverReviewsHref(tablet, '768');
  const headerOrder = await tablet.evaluate(() => {
    const btn = document.querySelector('.nav-order');
    return btn ? getComputedStyle(btn).display : '';
  });
  ok(headerOrder === 'none', '768: leftover header Encomendar stays hidden');

  const mobile = await browser.newPage();
  mobile.on('pageerror', err => errors.push('390 pageerror: ' + err.message));
  await openReady(mobile, 390, 844);
  await leftoverReviewsHref(mobile, '390');
  const bar = await mobile.evaluate(() => {
    return [...document.querySelectorAll('.mb-item')].map(el =>
      (el.textContent || '').replace(/\s+/g, ' ').trim()
    );
  });
  ok(bar.some(t => /Carrinho/i.test(t)), '390: leftover 4-item bar still lists Carrinho');
  ok(bar.some(t => /Promoções/i.test(t)), '390: leftover 4-item bar still lists Promoções');
  ok(bar.some(t => /WhatsApp/i.test(t)), '390: leftover 4-item bar still lists WhatsApp');
  ok(bar.some(t => /Como Chegar/i.test(t)), '390: leftover 4-item bar still lists Como Chegar');
  ok(bar.length === 4, `390: leftover 4-item bar stays (got ${bar.length})`);

  const menu = await mobile.evaluate(() => {
    const burger = document.querySelector('.hamburger');
    const panel = document.getElementById('mobile-menu');
    if (burger) burger.click();
    const opened = panel ? panel.classList.contains('open') : false;
    const close = document.querySelector('.mobile-close');
    if (close) close.click();
    const closed = panel ? !panel.classList.contains('open') : false;
    const expanded = burger ? burger.getAttribute('aria-expanded') : null;
    return { opened, closed, expanded };
  });
  ok(menu.opened && menu.closed, '390: leftover hamburger still opens leftover menu and leftover ✕ still closes leftover menu');
  ok(menu.expanded === null, '390: leftover hamburger stays without leftover aria-expanded');

  const ctas = await mobile.evaluate(() => {
    const prim = document.querySelector('.hero-ctas .btn-prim');
    const ghost = document.querySelector('.hero-ctas .btn-ghost');
    return {
      prim: prim ? (prim.textContent || '').replace(/\s+/g, ' ').trim() : '',
      ghost: ghost ? (ghost.textContent || '').replace(/\s+/g, ' ').trim() : '',
      primDisplay: prim ? getComputedStyle(prim).display : '',
      ghostDisplay: ghost ? getComputedStyle(ghost).display : '',
    };
  });
  ok(/Ver Produtos/.test(ctas.prim) && ctas.primDisplay !== 'none',
    '390: leftover Ver Produtos stays');
  ok(/Encomendar por WhatsApp/.test(ctas.ghost) && ctas.ghostDisplay !== 'none',
    '390: leftover Encomendar por WhatsApp stays');

  await addMelancia(mobile, '390');

  await browser.close();
  server.close();
  if (errors.length) {
    console.error('check-reviews-maps-href-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
    process.exit(1);
  }
  console.log('check-reviews-maps-href-browser: ok');
} catch (err) {
  try { await browser.close(); } catch {}
  try { server.close(); } catch {}
  console.error(err);
  process.exit(1);
}
