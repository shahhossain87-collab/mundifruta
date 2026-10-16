#!/usr/bin/env node
/** Chrome: leftover Encontre-nos Morada maps link; add Melancia 1/4. */
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

async function leftoverMoradaMaps(page, label, stripVisible) {
  const state = await page.evaluate((href) => {
    const items = [...document.querySelectorAll('.info-strip .info-item')].map(el => ({
      tag: el.tagName,
      href: el.getAttribute('href') || '',
      text: (el.textContent || '').replace(/\s+/g, ' ').trim(),
    }));
    const strip = document.querySelector('.info-strip');
    const contact = [...document.querySelectorAll('.contact-card')].map(card => {
      const link = card.querySelector('a');
      const para = card.querySelector('p');
      return {
        title: (card.querySelector('h4')?.textContent || '').replace(/\s+/g, ' ').trim(),
        p: (para?.textContent || '').replace(/\s+/g, ' ').trim(),
        href: link ? link.getAttribute('href') || '' : '',
        target: link ? link.getAttribute('target') || '' : '',
        rel: link ? link.getAttribute('rel') || '' : '',
        aText: (link?.textContent || '').replace(/\s+/g, ' ').trim(),
        aDisplay: link ? getComputedStyle(link).display : '',
        aDecoration: link ? getComputedStyle(link).textDecorationLine : '',
        aColor: link ? getComputedStyle(link).color : '',
      };
    });
    const morada = contact.find(c => c.title === 'Morada');
    const phone = contact.find(c => c.title === 'Telefone / WhatsApp');
    const email = contact.find(c => c.title === 'Email');
    const hours = contact.find(c => c.title === 'Horário');
    const hero = document.querySelector('.hero-rating');
    const goog = document.querySelector('.social-link.social-goog');
    const badge = document.getElementById('google-badge');
    const reviews = document.getElementById('reviews-cta');
    const contactSection = document.getElementById('contacto');
    return {
      items,
      stripDisplay: strip ? getComputedStyle(strip).display : '',
      contactDisplay: contactSection ? getComputedStyle(contactSection).display : '',
      morada,
      phone,
      email,
      hours,
      heroHref: hero ? hero.getAttribute('href') : '',
      googHref: goog ? goog.getAttribute('href') : '',
      badgeHref: badge ? badge.getAttribute('href') : '',
      reviewsHref: reviews ? reviews.getAttribute('href') : '',
      hoursIsDiv: items.some(i => i.tag === 'DIV' && /Seg–Dom: 8:00 – 20:00/.test(i.text)),
      phoneIsDiv: items.some(i => i.tag === 'DIV' && /932 699 850/.test(i.text)),
      addressIsDiv: items.some(i => i.tag === 'DIV' && /Av de Portugal, Centro Cívico, Carnaxide/.test(i.text)),
      pickupIsDiv: items.some(i => i.tag === 'DIV' && /Levantamento na Loja/.test(i.text)),
      mapsHref: href,
    };
  }, mapsHref);

  ok(state.items.length === 4, `${label}: leftover info-strip still has 4 leftover items`);
  ok(state.hoursIsDiv, `${label}: leftover info-strip hours stay a leftover div`);
  ok(state.phoneIsDiv, `${label}: leftover info-strip phone stays a leftover div`);
  ok(state.addressIsDiv, `${label}: leftover info-strip address stays a leftover div (PR #234)`);
  ok(state.pickupIsDiv, `${label}: leftover info-strip pickup stays a leftover div`);
  ok(state.contactDisplay !== 'none', `${label}: leftover Encontre-nos stays visible`);
  ok(state.morada && state.morada.href === mapsHref,
    `${label}: leftover Encontre-nos Morada should use leftover maps URL`);
  ok(state.morada && /Av de Portugal, Centro Cívico/.test(state.morada.aText) && /Loja 24-C, 2790-129 Carnaxide/.test(state.morada.aText),
    `${label}: leftover Encontre-nos still shows leftover Av de Portugal, Centro Cívico / Loja 24-C, 2790-129 Carnaxide`);
  ok(state.morada && state.morada.target === '_blank' && /\bnoopener\b/.test(state.morada.rel),
    `${label}: leftover Encontre-nos Morada keeps leftover target=_blank rel=noopener`);
  ok(state.morada && state.morada.aDecoration === 'none',
    `${label}: leftover Encontre-nos Morada should not underline`);
  ok(state.phone && state.phone.href === 'tel:932699850',
    `${label}: leftover Encontre-nos still uses leftover tel:932699850`);
  ok(state.email && state.email.href === 'mailto:shahhossain87@gmail.com',
    `${label}: leftover Encontre-nos email stays`);
  ok(state.hours && /Segunda – Domingo/.test(state.hours.p) && !state.hours.href,
    `${label}: leftover Encontre-nos Horário stays leftover <p>`);
  ok(state.heroHref === mapsHref, `${label}: leftover hero Google-rating stays leftover maps URL`);
  ok(state.googHref === mapsHref, `${label}: leftover Avalie-nos stays leftover maps URL`);
  ok(state.badgeHref === mapsHref, `${label}: leftover Google-badge still receives leftover maps URL from leftover renderAvaliacoes`);
  ok(state.reviewsHref === mapsHref, `${label}: leftover reviews-cta still receives leftover maps URL from leftover renderAvaliacoes`);

  if (stripVisible) {
    ok(state.stripDisplay !== 'none', `${label}: leftover info-strip should stay visible`);
  } else {
    ok(state.stripDisplay === 'none', `${label}: leftover info-strip stays hidden on leftover narrow phones`);
  }
}

async function leftoverHomeRules(page, label) {
  const rules = await page.evaluate(() => {
    let foundFooterLinks = false;
    let foundFooterCredit = false;
    let foundBackdrop = false;
    let foundCsCard = false;
    let foundCabazVer = false;
    let foundGhost = false;
    let foundPrim = false;
    let foundShopLink = false;
    let foundFloat = false;
    let foundBar = false;
    let foundHomeQuick = false;
    let foundCatalogAdd = false;
    let foundMenuRing = false;
    let foundStripRing = false;
    let foundContactRing = false;
    for (const sheet of [...document.styleSheets]) {
      let sheetRules;
      try { sheetRules = [...sheet.cssRules]; } catch { continue; }
      for (const rule of sheetRules) {
        const text = rule.cssText || '';
        if (/\.footer-links a:focus-visible/.test(text) && /outline/.test(text)) foundFooterLinks = true;
        if (/\.footer-credit a:focus-visible/.test(text) && /outline/.test(text)) foundFooterCredit = true;
        if (/\.shop-backdrop:focus-visible/.test(text) && /outline/.test(text)) foundBackdrop = true;
        if (/\.cs-card:focus-visible/.test(text) && /outline/.test(text)) foundCsCard = true;
        if (/\.cabaz-ver:focus-visible/.test(text) && /outline/.test(text)) foundCabazVer = true;
        if (/\.btn-ghost:focus-visible/.test(text) && /outline/.test(text)) foundGhost = true;
        if (/\.btn-prim:focus-visible/.test(text) && /outline/.test(text)) foundPrim = true;
        if (/\.shop-link:focus-visible/.test(text) && /outline/.test(text)) foundShopLink = true;
        if (/\.float-cart:focus-visible/.test(text) && /outline/.test(text)) foundFloat = true;
        if (/\.mb-item:focus-visible/.test(text) && /outline/.test(text)) foundBar = true;
        if (/body\.homepage \.homepage-category \.cat-quick-btn:focus-visible/.test(text)) foundHomeQuick = true;
        if (/\.add-btn:focus-visible/.test(text) && /outline/.test(text)) foundCatalogAdd = true;
        if (/(#mobile-menu a|\.mobile-menu a):focus-visible/.test(text) && /outline/.test(text)) foundMenuRing = true;
        if (/(a\.info-item|\.info-item|\.info-strip a):focus-visible/.test(text) && /outline/.test(text)) foundStripRing = true;
        if (/\.contact-card a:focus-visible/.test(text) && /outline/.test(text)) foundContactRing = true;
      }
    }
    return {
      foundFooterLinks, foundFooterCredit, foundBackdrop, foundCsCard, foundCabazVer,
      foundGhost, foundPrim, foundShopLink, foundFloat, foundBar, foundHomeQuick, foundCatalogAdd,
      foundMenuRing, foundStripRing, foundContactRing,
    };
  });
  ok(rules.foundCatalogAdd, `${label}: leftover catalog Adicionar forest ring stays`);
  ok(rules.foundHomeQuick, `${label}: leftover homepage category tiles keep leftover #194 focus-visible`);
  ok(!rules.foundFooterLinks, `${label}: leftover footer shop-link rings must not land in this run (PR #181)`);
  ok(!rules.foundFooterCredit, `${label}: leftover footer-credit must not get a ring in this run`);
  ok(!rules.foundBackdrop, `${label}: leftover shop-backdrop must not get a ring in this run`);
  ok(!rules.foundCsCard, `${label}: leftover cs-card must not get a ring in this run`);
  ok(!rules.foundCabazVer, `${label}: leftover cabaz-ver must not get a ring in this run`);
  ok(!rules.foundGhost, `${label}: leftover hero ghost CTA must not get a ring in this run`);
  ok(!rules.foundPrim, `${label}: leftover primary CTA must not get a ring in this run`);
  ok(!rules.foundShopLink, `${label}: leftover shop-link must not get a ring in this run`);
  ok(!rules.foundFloat, `${label}: leftover float-cart must not get a ring in this run`);
  ok(!rules.foundBar, `${label}: leftover 4-item-bar must not get a ring in this run`);
  ok(!rules.foundMenuRing, `${label}: leftover mobile-menu link rings must not land in this run (PR #184)`);
  ok(!rules.foundStripRing, `${label}: leftover info-strip must not get a leftover forest ring in this run`);
  ok(!rules.foundContactRing, `${label}: leftover Encontre-nos contact-link ring must not land in this run (PR #188)`);
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
  const desktop = await browser.newPage();
  desktop.on('pageerror', err => errors.push('1280 pageerror: ' + err.message));
  await openReady(desktop, 1280, 800);
  await leftoverMoradaMaps(desktop, '1280', true);
  await leftoverHomeRules(desktop, '1280');
  await addMelancia(desktop, '1280');

  const wrapping = await desktop.evaluate(() => {
    return [...document.querySelectorAll('.nav-links a')].map(a =>
      (a.textContent || '').replace(/\s+/g, ' ').trim()
    );
  });
  ok(wrapping.includes('Frutas') && wrapping.includes('Legumes') && wrapping.includes('Cabazes'),
    '1280: leftover wrapping-nav Frutas / Legumes / Cabazes stay');
  ok(!wrapping.includes('Ervas') && !wrapping.includes('Época'),
    '1280: leftover wrapping-nav must not redo leftover Ervas / Época (PR #218)');

  const tablet = await browser.newPage();
  tablet.on('pageerror', err => errors.push('768 pageerror: ' + err.message));
  await openReady(tablet, 768, 1024);
  await leftoverMoradaMaps(tablet, '768', true);
  await leftoverHomeRules(tablet, '768');
  await addMelancia(tablet, '768');

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

  await leftoverMoradaMaps(mobile, '390', false);
  await leftoverHomeRules(mobile, '390');
  await addMelancia(mobile, '390');

  const hamburger = await mobile.evaluate(() => {
    const btn = document.querySelector('.hamburger');
    return btn ? btn.getAttribute('aria-label') : '';
  });
  ok(hamburger === 'Menu', '390: leftover hamburger stays named Menu');

  const menu = await mobile.evaluate(() => {
    return [...document.querySelectorAll('#mobile-menu a')].map(a =>
      (a.textContent || '').replace(/\s+/g, ' ').trim()
    );
  });
  ok(menu.includes('Frutas') && menu.includes('Legumes') && menu.includes('Promoções'),
    '390: leftover mobile-menu Frutas / Legumes / Promoções stay');
  ok(!menu.includes('Ervas') && !menu.includes('Época'),
    '390: leftover mobile-menu must not redo leftover Ervas / Época (PR #231)');

  const heroCtas = await mobile.evaluate(() => {
    return [...document.querySelectorAll('.hero-ctas a, .hero-ctas button')].map(el =>
      (el.textContent || '').replace(/\s+/g, ' ').trim()
    );
  });
  ok(heroCtas.some(t => /Ver Produtos/i.test(t)), '390: leftover Ver Produtos stays');
  ok(heroCtas.some(t => /Encomendar por WhatsApp/i.test(t)), '390: leftover Encomendar por WhatsApp stays');

  await browser.close();
  server.close();
  if (errors.length) {
    console.error('check-contact-morada-maps-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
    process.exit(1);
  }
  console.log('check-contact-morada-maps-browser: ok');
} catch (err) {
  try { await browser.close(); } catch {}
  try { server.close(); } catch {}
  console.error(err);
  process.exit(1);
}
