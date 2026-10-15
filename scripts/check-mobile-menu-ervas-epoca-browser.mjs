#!/usr/bin/env node
/** Chrome: leftover homepage mobile-menu Ervas / Época catalog jumps; add Melancia 1/4. */
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

async function leftoverMenuLinks(page, label) {
  const links = await page.evaluate(() => {
    return [...document.querySelectorAll('#mobile-menu a')].map(a => ({
      text: (a.textContent || '').replace(/\s+/g, ' ').trim(),
      href: a.getAttribute('href') || '',
      onclick: a.getAttribute('onclick') || '',
    }));
  });
  const texts = links.map(l => l.text);
  ok(texts.includes('Frutas'), `${label}: leftover mobile-menu still lists Frutas`);
  ok(texts.includes('Legumes'), `${label}: leftover mobile-menu still lists Legumes`);
  ok(texts.includes('Ervas'), `${label}: leftover mobile-menu lists leftover Ervas`);
  ok(texts.includes('Época'), `${label}: leftover mobile-menu lists leftover Época`);
  ok(texts.includes('Promoções'), `${label}: leftover mobile-menu still lists Promoções`);
  ok(texts.includes('Cabazes'), `${label}: leftover mobile-menu still lists Cabazes`);
  ok(texts.includes('Como Funciona'), `${label}: leftover mobile-menu still lists Como Funciona`);
  ok(texts.includes('Produtos'), `${label}: leftover mobile-menu still lists Produtos`);
  ok(texts.includes('Quem Somos'), `${label}: leftover mobile-menu still lists Quem Somos`);
  ok(texts.includes('Avaliações'), `${label}: leftover mobile-menu still lists Avaliações`);
  ok(texts.includes('Encomendar'), `${label}: leftover mobile-menu still lists Encomendar`);
  ok(texts.includes('Contacto'), `${label}: leftover mobile-menu still lists Contacto`);
  ok(!texts.includes('Ervas frescas') && !texts.includes('Frutas da Época') && !texts.includes('Fruta da Época'),
    `${label}: leftover mobile-menu Ervas / Época stay short labels`);
  const ervas = links.find(l => l.text === 'Ervas');
  const epoca = links.find(l => l.text === 'Época');
  ok(ervas?.href === '#produtos' && /abrirCatalogo\('ervas'\)/.test(ervas?.onclick || '') && /toggleMenu\(\)/.test(ervas?.onclick || ''),
    `${label}: leftover Ervas opens leftover ervas catalog and leftover closes leftover menu`);
  ok(epoca?.href === '#produtos' && /abrirCatalogo\('epoca'\)/.test(epoca?.onclick || '') && /toggleMenu\(\)/.test(epoca?.onclick || ''),
    `${label}: leftover Época opens leftover epoca catalog and leftover closes leftover menu`);
}

async function leftoverMenuCatalog(page, linkText, tabId, crumb, sample, label) {
  const hamburger = await page.$('.hamburger');
  ok(!!hamburger, `${label}: leftover hamburger should exist`);
  if (!hamburger) return;
  const hamburgerVisible = await page.evaluate(el => {
    const cs = getComputedStyle(el);
    return cs.display !== 'none' && cs.visibility !== 'hidden';
  }, hamburger);
  ok(hamburgerVisible, `${label}: leftover hamburger should be visible`);
  await hamburger.click();
  await page.waitForFunction(
    () => document.getElementById('mobile-menu')?.classList.contains('open'),
    { timeout: 5000 }
  );

  const handle = await page.evaluateHandle((text) => {
    return [...document.querySelectorAll('#mobile-menu a')]
      .find(a => (a.textContent || '').replace(/\s+/g, ' ').trim() === text);
  }, linkText);
  const el = handle.asElement();
  ok(!!el, `${label}: leftover mobile-menu ${linkText} control should exist`);
  if (!el) return;
  await el.click();
  await page.waitForFunction(
    () => !document.getElementById('mobile-menu')?.classList.contains('open'),
    { timeout: 5000 }
  );
  await page.waitForFunction(
    () => {
      const el = document.getElementById('produtos');
      if (!el) return false;
      const top = el.getBoundingClientRect().top;
      return top < window.innerHeight && top > -el.offsetHeight;
    },
    { timeout: 8000 }
  );
  const state = await page.evaluate((tab, sampleName) => {
    const tabEl = document.getElementById(tab);
    const produtos = document.getElementById('produtos');
    const crumbEl = document.getElementById('crumb-cat');
    const names = [...document.querySelectorAll('.shop-main .product-card .product-name, .shop-main .product-card h3, .shop-main .product-card')]
      .map(n => (n.textContent || '').replace(/\s+/g, ' ').trim());
    const menu = document.getElementById('mobile-menu');
    return {
      selected: tabEl ? tabEl.getAttribute('aria-selected') : null,
      active: tabEl ? tabEl.classList.contains('active') : false,
      crumb: crumbEl ? (crumbEl.textContent || '').trim() : '',
      sample: names.some(n => n.includes(sampleName)),
      visible: !!(produtos && produtos.getBoundingClientRect().top < window.innerHeight),
      menuOpen: !!(menu && menu.classList.contains('open')),
    };
  }, tabId, sample);
  ok(!state.menuOpen, `${label}: leftover mobile-menu should close after leftover ${linkText}`);
  ok(state.visible, `${label}: leftover #produtos should be in view after leftover ${linkText}`);
  ok(state.selected === 'true' && state.active, `${label}: leftover ${tabId} should be the leftover active catalog tab`);
  ok(state.crumb === crumb, `${label}: leftover crumb should read ${crumb} (got "${state.crumb}")`);
  ok(state.sample, `${label}: leftover ${linkText} catalog should still list leftover ${sample}`);
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
      }
    }
    return {
      foundFooterLinks, foundFooterCredit, foundBackdrop, foundCsCard, foundCabazVer,
      foundGhost, foundPrim, foundShopLink, foundFloat, foundBar, foundHomeQuick, foundCatalogAdd,
      foundMenuRing,
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
}

async function leftoverOverlayCss(page, label) {
  const css = await page.evaluate(() => {
    const menu = document.getElementById('mobile-menu');
    const close = document.querySelector('.mobile-close');
    const menuCs = menu ? getComputedStyle(menu) : null;
    const closeCs = close ? getComputedStyle(close) : null;
    return {
      overflowY: menuCs ? menuCs.overflowY : '',
      closePosition: closeCs ? closeCs.position : '',
    };
  });
  ok(css.overflowY === 'auto' || css.overflowY === 'scroll',
    `${label}: leftover mobile-menu overflow-y should be auto (got "${css.overflowY}")`);
  ok(css.closePosition === 'fixed',
    `${label}: leftover mobile-close should stay position:fixed (got "${css.closePosition}")`);
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
  await leftoverMenuLinks(desktop, '1280');
  await leftoverHomeRules(desktop, '1280');
  await leftoverOverlayCss(desktop, '1280');
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

  await leftoverMenuLinks(mobile, '390');
  await leftoverHomeRules(mobile, '390');
  await leftoverOverlayCss(mobile, '390');
  await leftoverMenuCatalog(mobile, 'Ervas', 'tab-ervas', 'Ervas frescas', 'Hortelã', '390');
  await leftoverMenuCatalog(mobile, 'Época', 'tab-epoca', 'Frutas da Época', 'Figos', '390');
  await addMelancia(mobile, '390');

  const hamburger = await mobile.evaluate(() => {
    const btn = document.querySelector('.hamburger');
    return btn ? btn.getAttribute('aria-label') : '';
  });
  ok(hamburger === 'Menu', '390: leftover hamburger stays named Menu');

  const short = await browser.newPage();
  short.on('pageerror', err => errors.push('390x667 pageerror: ' + err.message));
  await openReady(short, 390, 667);
  await leftoverMenuLinks(short, '390x667');
  const shortGap = await short.evaluate(() => {
    const menu = document.getElementById('mobile-menu');
    return menu ? getComputedStyle(menu).gap : '';
  });
  ok(shortGap === '12px', `390x667: leftover short-viewport mobile-menu gap should be 12px (got "${shortGap}")`);
  const shortHamburger = await short.$('.hamburger');
  if (shortHamburger) {
    await shortHamburger.click();
    await short.waitForFunction(
      () => document.getElementById('mobile-menu')?.classList.contains('open'),
      { timeout: 5000 }
    );
    const visible = await short.evaluate(() => {
      const texts = ['Ervas', 'Época', 'Contacto'];
      return texts.every(text => {
        const a = [...document.querySelectorAll('#mobile-menu a')]
          .find(el => (el.textContent || '').replace(/\s+/g, ' ').trim() === text);
        if (!a) return false;
        const r = a.getBoundingClientRect();
        return r.bottom > 0 && r.top < window.innerHeight;
      });
    });
    ok(visible, '390x667: leftover Ervas / Época / Contacto should stay in leftover viewport');
  }

  await browser.close();
  server.close();
  if (errors.length) {
    console.error('check-mobile-menu-ervas-epoca-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
    process.exit(1);
  }
  console.log('check-mobile-menu-ervas-epoca-browser: ok');
} catch (err) {
  try { await browser.close(); } catch {}
  try { server.close(); } catch {}
  console.error(err);
  process.exit(1);
}
