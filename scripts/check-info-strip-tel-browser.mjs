#!/usr/bin/env node
/** Chrome: leftover homepage info-strip tel: link; add Melancia 1/4. */
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

async function leftoverStripTel(page, label, expectVisible) {
  const state = await page.evaluate(() => {
    const items = [...document.querySelectorAll('.info-strip .info-item')].map(el => ({
      tag: el.tagName,
      href: el.getAttribute('href') || '',
      text: (el.textContent || '').replace(/\s+/g, ' ').trim(),
      color: getComputedStyle(el).color,
      decoration: getComputedStyle(el).textDecorationLine,
      display: getComputedStyle(el).display,
    }));
    const strip = document.querySelector('.info-strip');
    const stripDisplay = strip ? getComputedStyle(strip).display : '';
    const contact = [...document.querySelectorAll('.contact-card a')].map(a => ({
      href: a.getAttribute('href') || '',
      text: (a.textContent || '').replace(/\s+/g, ' ').trim(),
    }));
    const tel = items.find(i => i.tag === 'A' && i.href === 'tel:932699850');
    return {
      items,
      stripDisplay,
      contact,
      tel,
      hoursIsDiv: items.some(i => i.tag === 'DIV' && /Seg–Dom: 8:00 – 20:00/.test(i.text)),
      addressIsDiv: items.some(i => i.tag === 'DIV' && /Av de Portugal, Centro Cívico, Carnaxide/.test(i.text)),
      pickupIsDiv: items.some(i => i.tag === 'DIV' && /Levantamento na Loja/.test(i.text)),
    };
  });

  ok(state.items.length === 4, `${label}: leftover info-strip still has 4 leftover items`);
  ok(state.hoursIsDiv, `${label}: leftover hours stay a leftover div`);
  ok(state.addressIsDiv, `${label}: leftover address stays a leftover div`);
  ok(state.pickupIsDiv, `${label}: leftover pickup stays a leftover div`);
  ok(!!state.tel, `${label}: leftover info-strip phone should be leftover tel:932699850`);
  ok(state.tel && /932 699 850/.test(state.tel.text),
    `${label}: leftover info-strip still shows leftover 932 699 850`);
  ok(state.contact.some(c => c.href === 'tel:932699850' && /932 699 850/.test(c.text)),
    `${label}: leftover Encontre-nos still uses leftover tel:932699850`);
  ok(state.contact.some(c => c.href === 'mailto:shahhossain87@gmail.com'),
    `${label}: leftover Encontre-nos email stays`);

  if (expectVisible) {
    ok(state.stripDisplay !== 'none', `${label}: leftover info-strip should stay visible`);
    ok(state.tel && state.tel.display === 'flex',
      `${label}: leftover info-strip tel: should keep leftover flex item layout`);
    ok(state.tel && state.tel.decoration === 'none',
      `${label}: leftover info-strip tel: should not underline`);
    const hours = state.items.find(i => /Seg–Dom/.test(i.text));
    ok(state.tel && hours && state.tel.color === hours.color,
      `${label}: leftover info-strip tel: should keep leftover strip color`);
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
      }
    }
    return {
      foundFooterLinks, foundFooterCredit, foundBackdrop, foundCsCard, foundCabazVer,
      foundGhost, foundPrim, foundShopLink, foundFloat, foundBar, foundHomeQuick, foundCatalogAdd,
      foundMenuRing, foundStripRing,
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
  await leftoverStripTel(desktop, '1280', true);
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
  await leftoverStripTel(tablet, '768', true);
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

  await leftoverStripTel(mobile, '390', false);
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

  await browser.close();
  server.close();
  if (errors.length) {
    console.error('check-info-strip-tel-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
    process.exit(1);
  }
  console.log('check-info-strip-tel-browser: ok');
} catch (err) {
  try { await browser.close(); } catch {}
  try { server.close(); } catch {}
  console.error(err);
  process.exit(1);
}
