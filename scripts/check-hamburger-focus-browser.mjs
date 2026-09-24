#!/usr/bin/env node
/**
 * Chrome: leftover hamburger keyboard ring;
 * leftover 4-item bar; leftover search morango/tomate; add Melancia 1/4.
 */
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

function isForest(color) {
  const c = String(color || '').replace(/\s+/g, '');
  return c === 'rgb(27,67,50)' || c === '#1B4332' || c === 'var(--forest)';
}

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
    document.querySelectorAll('.fi').forEach(el => {
      el.style.transition = 'none';
      el.classList.add('on');
    });
  });
}

async function leftoverChrome(page, label) {
  const chromeUi = await page.evaluate(() => {
    const hamburger = document.querySelector('.hamburger');
    const bar = [...document.querySelectorAll('.mb-item')].map(el =>
      (el.textContent || '').replace(/\s+/g, ' ').trim()
    );
    const burgerCs = hamburger ? getComputedStyle(hamburger) : null;
    return {
      burgerDisplay: burgerCs ? burgerCs.display : '',
      burgerExpanded: hamburger ? hamburger.getAttribute('aria-expanded') : 'missing',
      burgerLabel: hamburger ? (hamburger.getAttribute('aria-label') || '').trim() : '',
      barDisplay: getComputedStyle(document.getElementById('mobile-bar') || document.body).display,
      bar,
    };
  });
  if (label === '390') {
    ok(chromeUi.burgerDisplay === 'flex', `${label}: leftover hamburger stays visible`);
    ok(chromeUi.burgerExpanded === null, `${label}: leftover hamburger stays without expanded`);
    ok(chromeUi.burgerLabel === 'Menu', `${label}: leftover hamburger stays named Menu`);
    ok(chromeUi.barDisplay !== 'none', `${label}: leftover 4-item bar stays visible`);
    ok(chromeUi.bar.some(t => /Carrinho/i.test(t)), `${label}: leftover 4-item bar still lists Carrinho`);
    ok(chromeUi.bar.some(t => /Promoções/i.test(t)), `${label}: leftover 4-item bar still lists Promoções`);
    ok(chromeUi.bar.some(t => /WhatsApp/i.test(t)), `${label}: leftover 4-item bar still lists WhatsApp`);
    ok(chromeUi.bar.some(t => /Como Chegar/i.test(t)), `${label}: leftover 4-item bar still lists Como Chegar`);
    ok(chromeUi.bar.length === 4, `${label}: leftover 4-item bar stays (got ${chromeUi.bar.length})`);
  }
}

async function leftoverSearch(page, label) {
  const found = await page.evaluate(() => {
    const search = document.getElementById('search-input');
    if (search) {
      search.value = 'morango';
      search.dispatchEvent(new Event('input', { bubbles: true }));
    }
    const morango = [...document.querySelectorAll('.shop-main .product-card')]
      .some(c => /Morango/i.test(c.textContent || ''));
    if (search) {
      search.value = 'tomate';
      search.dispatchEvent(new Event('input', { bubbles: true }));
    }
    const tomate = [...document.querySelectorAll('.shop-main .product-card')]
      .some(c => /Tomate/i.test(c.textContent || ''));
    if (window.limparTudo) window.limparTudo();
    if (window.mostrarCategoria) window.mostrarCategoria('frutas', document.getElementById('tab-frutas'));
    return { morango, tomate };
  });
  ok(found.morango, `${label}: leftover search morango still finds a card`);
  ok(found.tomate, `${label}: leftover search tomate still finds a card`);
}

async function leftoverHamburgerRing(page, label) {
  const rules = await page.evaluate(() => {
    let foundHamburger = false;
    let foundClear = false;
    let foundNo = false;
    let foundYes = false;
    let foundLink = false;
    let foundReset = false;
    let foundClose = false;
    let foundMobileClose = false;
    for (const sheet of [...document.styleSheets]) {
      let sheetRules;
      try { sheetRules = [...sheet.cssRules]; } catch { continue; }
      for (const rule of sheetRules) {
        const text = rule.cssText || '';
        if (/\.hamburger:focus-visible/.test(text) && /outline/.test(text)) foundHamburger = true;
        if (/\.search-clear:focus-visible/.test(text) && /outline/.test(text)) foundClear = true;
        if (/\.consent-no:focus-visible/.test(text) && /outline/.test(text)) foundNo = true;
        if (/\.consent-yes:focus-visible/.test(text) && /outline/.test(text)) foundYes = true;
        if (/\.consent-link:focus-visible/.test(text) && /outline/.test(text)) foundLink = true;
        if (/\.privacy-reset:focus-visible/.test(text) && /outline/.test(text)) foundReset = true;
        if (/\.privacy-close:focus-visible/.test(text) && /outline/.test(text)) foundClose = true;
        if (/\.mobile-close:focus-visible/.test(text) && /outline/.test(text)) foundMobileClose = true;
      }
    }
    return { foundHamburger, foundClear, foundNo, foundYes, foundLink, foundReset, foundClose, foundMobileClose };
  });
  ok(rules.foundHamburger, `${label}: leftover hamburger :focus-visible rule is in the live stylesheet`);
  ok(!rules.foundClear, `${label}: leftover catalog search-clear must not get a ring in this run`);
  ok(!rules.foundReset, `${label}: leftover privacy Repor consentimento must not get a ring in this run`);
  ok(!rules.foundLink, `${label}: leftover consent Saber mais must not get a ring in this run`);
  ok(!rules.foundNo, `${label}: leftover consent Só essenciais must not get a ring in this run`);
  ok(!rules.foundYes, `${label}: leftover consent Aceitar tudo must not get a ring in this run`);
  ok(!rules.foundClose, `${label}: leftover privacy-dialog close must not get a ring in this run`);
  ok(!rules.foundMobileClose, `${label}: leftover mobile-menu close must not get a ring in this run`);

  const visible = label === '390' || label === '768';
  if (visible) {
    await page.evaluate(() => {
      const menu = document.getElementById('mobile-menu');
      if (menu) menu.classList.remove('open');
      const btn = document.querySelector('.hamburger');
      if (btn) btn.scrollIntoView({ block: 'center', inline: 'nearest' });
    });

    await page.focus('.logo');
    await page.keyboard.press('Tab');
    await page.waitForFunction(() => {
      const btn = document.querySelector('.hamburger');
      if (!btn) return false;
      if (document.activeElement !== btn) btn.focus();
      const cs = getComputedStyle(btn);
      const outline = cs.outlineStyle && cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth || '0') > 0;
      const color = String(cs.outlineColor || '').replace(/\s+/g, '');
      const forest = color === 'rgb(27,67,50)' || color === '#1B4332';
      return Boolean(document.activeElement === btn && outline && forest);
    }, { timeout: 5000 });

    const ring = await page.evaluate(() => {
      const btn = document.querySelector('.hamburger');
      if (!btn) return null;
      const cs = getComputedStyle(btn);
      return {
        active: document.activeElement === btn,
        display: cs.display,
        label: (btn.getAttribute('aria-label') || '').trim(),
        expanded: btn.getAttribute('aria-expanded'),
        outlineStyle: cs.outlineStyle,
        outlineWidth: cs.outlineWidth,
        outlineColor: cs.outlineColor,
      };
    });
    ok(!!ring, `${label}: leftover hamburger exists`);
    if (ring) {
      ok(ring.display === 'flex', `${label}: leftover hamburger stays visible`);
      ok(ring.active, `${label}: leftover hamburger can take keyboard focus`);
      ok(ring.label === 'Menu', `${label}: leftover hamburger stays named Menu`);
      ok(ring.expanded === null, `${label}: leftover hamburger stays without expanded`);
      ok(
        ring.outlineStyle && ring.outlineStyle !== 'none' && parseFloat(ring.outlineWidth || '0') > 0,
        `${label}: leftover hamburger keyboard ring (outline=${ring.outlineStyle}/${ring.outlineWidth})`
      );
      ok(isForest(ring.outlineColor), `${label}: leftover hamburger ring stays forest`);
    }

    const toggled = await page.evaluate(() => {
      const btn = document.querySelector('.hamburger');
      const menu = document.getElementById('mobile-menu');
      if (btn) btn.click();
      const opened = menu ? menu.classList.contains('open') : false;
      if (btn) btn.click();
      const closed = menu ? !menu.classList.contains('open') : false;
      return { opened, closed };
    });
    ok(toggled.opened, `${label}: leftover hamburger still opens leftover mobile-menu`);
    ok(toggled.closed, `${label}: leftover hamburger still closes leftover mobile-menu`);
  }

  const privacy = await page.evaluate(() => {
    if (window.abrirPrivacidade) window.abrirPrivacidade();
    const link = document.querySelector('.consent-link');
    return {
      consentHidden: document.getElementById('consent')?.hidden ?? true,
      privacyHidden: document.getElementById('privacy-modal')?.hidden ?? true,
      link: (link?.textContent || '').trim(),
      reset: (document.querySelector('.privacy-reset')?.textContent || '').trim(),
    };
  });
  ok(privacy.link === 'Saber mais', `${label}: leftover consent Saber mais stays`);
  ok(privacy.reset === 'Repor consentimento', `${label}: leftover privacy Repor consentimento stays`);
  ok(!privacy.privacyHidden, `${label}: leftover Saber mais still opens leftover privacy`);

  const closed = await page.evaluate(() => {
    if (window.fecharPrivacidade) window.fecharPrivacidade();
    return {
      privacyHidden: document.getElementById('privacy-modal')?.hidden ?? true,
    };
  });
  ok(closed.privacyHidden, `${label}: leftover ✕ / fecharPrivacidade still closes leftover privacy`);

  const essential = await page.evaluate(() => {
    if (window.reporConsentimento) window.reporConsentimento();
    const no = document.querySelector('.consent-no');
    if (no) no.click();
    return {
      hidden: document.getElementById('consent')?.hidden ?? true,
      stored: (() => { try { return localStorage.getItem('mf_consent'); } catch { return null; } })(),
      no: (document.querySelector('.consent-no')?.textContent || '').trim(),
      yes: (document.querySelector('.consent-yes')?.textContent || '').trim(),
    };
  });
  ok(essential.no === 'Só essenciais', `${label}: leftover consent Só essenciais stays`);
  ok(essential.yes === 'Aceitar tudo', `${label}: leftover consent Aceitar tudo stays`);
  ok(essential.hidden, `${label}: leftover Só essenciais still hides leftover consent`);
  ok(essential.stored === 'essential', `${label}: leftover Só essenciais still stores essential`);

  const acceptAll = await page.evaluate(() => {
    if (window.reporConsentimento) window.reporConsentimento();
    const shownAgain = !(document.getElementById('consent')?.hidden);
    const yes = document.querySelector('.consent-yes');
    if (yes) yes.click();
    return {
      shownAgain,
      hidden: document.getElementById('consent')?.hidden ?? true,
      stored: (() => { try { return localStorage.getItem('mf_consent'); } catch { return null; } })(),
    };
  });
  ok(acceptAll.shownAgain, `${label}: leftover consent can reopen after leftover Só essenciais`);
  ok(acceptAll.hidden, `${label}: leftover Aceitar tudo still hides leftover consent`);
  ok(acceptAll.stored === 'all', `${label}: leftover Aceitar tudo still stores all`);
}

async function leftoverPreviewQty(page, label) {
  const plusThenClose = await page.evaluate(() => {
    if (window.limparTudo) window.limparTudo();
    if (window.mostrarCategoria) window.mostrarCategoria('frutas', document.getElementById('tab-frutas'));
    const card = [...document.querySelectorAll('.shop-main .product-card')]
      .find(c => /Melancia 1\/4/i.test(c.textContent || ''));
    const id = card ? card.dataset.productId : '';
    if (id && window.abrirProduto) window.abrirProduto(id);
    const plus = [...document.querySelectorAll('.product-modal-qty button')]
      .find(b => (b.getAttribute('aria-label') || '') === 'Aumentar quantidade');
    const before = (document.getElementById('product-modal-qty')?.textContent || '').trim();
    if (plus) plus.click();
    const after = (document.getElementById('product-modal-qty')?.textContent || '').trim();
    const add = document.getElementById('product-modal-add');
    if (window.fecharProduto) window.fecharProduto();
    return {
      opened: Boolean(id),
      before,
      after,
      add: add ? (add.textContent || '').trim() : '',
      closed: !document.getElementById('product-modal')?.classList.contains('open'),
    };
  });
  ok(plusThenClose.opened, `${label}: leftover Melancia 1/4 product preview opens`);
  ok(plusThenClose.add === '＋', `${label}: leftover product-modal add stays a visible plus`);
  ok(plusThenClose.before === '1' && plusThenClose.after === '2',
    `${label}: leftover + increments 1→2 (${plusThenClose.before}→${plusThenClose.after})`);
  ok(plusThenClose.closed, `${label}: leftover ✕ / fecharProduto still closes leftover preview`);
}

async function addMelancia(page, label) {
  const added = await page.evaluate(() => {
    if (window.limparTudo) window.limparTudo();
    if (typeof carrinho === 'object' && carrinho) {
      Object.keys(carrinho).forEach(id => {
        if (typeof removerProduto === 'function') removerProduto(id);
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
    const plus = card.querySelectorAll('.qty-btn')[1];
    if (plus) plus.click();
    return {
      ok: true,
      count: document.getElementById('cart-count')?.textContent || '',
      qty: card.querySelector('.qty-num')?.textContent || '',
    };
  });
  ok(added.ok && added.count === '2', `${label}: add Melancia 1/4 then leftover + increments 1→2 (count=${added.count})`);
}

try {
  const desktop = await browser.newPage();
  desktop.on('pageerror', err => errors.push('1280 pageerror: ' + err.message));
  await openReady(desktop, 1280, 800);
  await leftoverHamburgerRing(desktop, '1280');
  await leftoverPreviewQty(desktop, '1280');
  await leftoverSearch(desktop, '1280');
  await addMelancia(desktop, '1280');

  const tablet = await browser.newPage();
  tablet.on('pageerror', err => errors.push('768 pageerror: ' + err.message));
  await openReady(tablet, 768, 1024);
  await leftoverHamburgerRing(tablet, '768');
  await leftoverPreviewQty(tablet, '768');

  const mobile = await browser.newPage();
  mobile.on('pageerror', err => errors.push('390 pageerror: ' + err.message));
  await openReady(mobile, 390, 844);
  await leftoverChrome(mobile, '390');
  await leftoverHamburgerRing(mobile, '390');
  await leftoverPreviewQty(mobile, '390');
  await leftoverSearch(mobile, '390');
  await addMelancia(mobile, '390');

  await browser.close();
  server.close();
  if (errors.length) {
    console.error('check-hamburger-focus-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
    process.exit(1);
  }
  console.log('check-hamburger-focus-browser: ok');
} catch (err) {
  try { await browser.close(); } catch {}
  try { server.close(); } catch {}
  console.error(err);
  process.exit(1);
}
