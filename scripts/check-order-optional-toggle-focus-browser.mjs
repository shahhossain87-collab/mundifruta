#!/usr/bin/env node
/** Chrome: leftover Hora de levantamento toggle keyboard ring; add Melancia 1/4. */
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
  });
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

async function leftoverOptionalRing(page, label) {
  const rules = await page.evaluate(() => {
    let foundOptional = false;
    let foundFloat = false;
    let foundScroll = false;
    let foundBar = false;
    let foundSocial = false;
    let foundNavOrder = false;
    let foundWa = false;
    let foundHamburger = false;
    let foundHomeQuick = false;
    for (const sheet of [...document.styleSheets]) {
      let sheetRules;
      try { sheetRules = [...sheet.cssRules]; } catch { continue; }
      for (const rule of sheetRules) {
        const text = rule.cssText || '';
        if (/\.order-optional-toggle:focus-visible/.test(text) && /outline/.test(text)) foundOptional = true;
        if (/\.float-cart:focus-visible/.test(text) && /outline/.test(text)) foundFloat = true;
        if (/\.scroll-top:focus-visible/.test(text) && /outline/.test(text)) foundScroll = true;
        if (/\.mb-item:focus-visible/.test(text) && /outline/.test(text)) foundBar = true;
        if (/\.social-link:focus-visible/.test(text) && /outline/.test(text)) foundSocial = true;
        if (/\.nav-order:focus-visible/.test(text) && /outline/.test(text)) foundNavOrder = true;
        if (/\.btn-wa:focus-visible/.test(text) && /outline/.test(text)) foundWa = true;
        if (/\.hamburger:focus-visible/.test(text) && /outline/.test(text)) foundHamburger = true;
        if (/body\.homepage \.homepage-category \.cat-quick-btn:focus-visible/.test(text)) foundHomeQuick = true;
      }
    }
    return {
      foundOptional, foundFloat, foundScroll, foundBar, foundSocial,
      foundNavOrder, foundWa, foundHamburger, foundHomeQuick,
    };
  });
  ok(rules.foundOptional, `${label}: leftover Hora de levantamento :focus-visible rule is in the live stylesheet`);
  ok(rules.foundHomeQuick, `${label}: leftover homepage category tiles keep leftover #194 focus-visible`);
  ok(!rules.foundFloat, `${label}: leftover float-cart must not get a ring in this run`);
  ok(!rules.foundScroll, `${label}: leftover Voltar ao topo must not get a ring in this run`);
  ok(!rules.foundBar, `${label}: leftover 4-item bar must not get a ring in this run`);
  ok(!rules.foundSocial, `${label}: leftover social dock must not get a ring in this run`);
  ok(!rules.foundNavOrder, `${label}: leftover header Encomendar must not get a ring in this run`);
  ok(!rules.foundWa, `${label}: leftover WhatsApp CTA must not get a ring in this run`);
  ok(!rules.foundHamburger, `${label}: leftover hamburger must not get a ring in this run`);

  const ring = await page.evaluate(async () => {
    const toggle = document.getElementById('order-optional-toggle');
    const optional = document.getElementById('order-optional');
    const hamburger = document.querySelector('.hamburger');
    const prim = document.querySelector('.hero-ctas .btn-prim');
    const ghost = document.querySelector('.hero-ctas .btn-ghost');
    if (!toggle) return null;
    try { toggle.focus({ preventScroll: true, focusVisible: true }); }
    catch { toggle.focus({ preventScroll: true }); }
    await new Promise(r => setTimeout(r, 200));
    if (document.activeElement !== toggle) {
      try { toggle.focus({ preventScroll: true, focusVisible: true }); }
      catch { toggle.focus({ preventScroll: true }); }
    }
    await new Promise(r => setTimeout(r, 200));
    const cs = getComputedStyle(toggle);
    const burgerCs = hamburger ? getComputedStyle(hamburger) : null;
    return {
      active: document.activeElement === toggle,
      type: toggle.getAttribute('type') || '',
      hidden: toggle.hidden,
      optionalHidden: optional ? optional.hidden : null,
      text: (toggle.textContent || '').replace(/\s+/g, ' ').trim(),
      outlineStyle: cs.outlineStyle,
      outlineWidth: cs.outlineWidth,
      outlineColor: cs.outlineColor,
      hamburgerLabel: hamburger ? hamburger.getAttribute('aria-label') : '',
      hamburgerExpanded: hamburger ? hamburger.hasAttribute('aria-expanded') : null,
      hamburgerDisplay: burgerCs ? burgerCs.display : '',
      primText: (prim?.textContent || '').replace(/\s+/g, ' ').trim(),
      ghostText: (ghost?.textContent || '').replace(/\s+/g, ' ').trim(),
    };
  });
  ok(ring && ring.active, `${label}: leftover Hora de levantamento toggle can take keyboard focus`);
  const hasOutline = ring && ring.outlineStyle && ring.outlineStyle !== 'none' && parseFloat(ring.outlineWidth || '0') > 0;
  ok(hasOutline, `${label}: leftover Hora de levantamento forest ring (outline=${ring?.outlineStyle}/${ring?.outlineWidth}/${ring?.outlineColor})`);
  ok(ring && /rgb\(27,\s*67,\s*50\)/.test(ring.outlineColor || ''), `${label}: leftover Hora de levantamento ring uses leftover forest`);
  ok(ring && ring.type === 'button', `${label}: leftover Hora de levantamento toggle stays type=button`);
  ok(ring && ring.hidden === false && ring.optionalHidden === true,
    `${label}: leftover optional fields stay hidden until leftover toggle is used`);
  ok(ring && /Hora de levantamento ou nota/i.test(ring.text),
    `${label}: leftover toggle copy stays Hora de levantamento ou nota`);
  ok(ring && /Ver Produtos/i.test(ring.primText), `${label}: leftover hero primary stays Ver Produtos`);
  ok(ring && /Encomendar por WhatsApp/i.test(ring.ghostText), `${label}: leftover hero ghost stays Encomendar por WhatsApp`);
  ok(ring && ring.hamburgerLabel === 'Menu' && ring.hamburgerExpanded === false,
    `${label}: leftover hamburger stays named Menu without expanded`);

  const revealed = await page.evaluate(() => {
    const toggle = document.getElementById('order-optional-toggle');
    const optional = document.getElementById('order-optional');
    const hora = document.getElementById('cust-levantamento');
    const notas = document.getElementById('cust-notas');
    if (toggle) toggle.click();
    return {
      toggleHidden: toggle ? toggle.hidden : null,
      optionalHidden: optional ? optional.hidden : null,
      hasHora: !!hora,
      hasNotas: !!notas,
    };
  });
  ok(revealed.toggleHidden === true && revealed.optionalHidden === false,
    `${label}: leftover toggle still reveals leftover Hora de levantamento / nota fields`);
  ok(revealed.hasHora && revealed.hasNotas,
    `${label}: leftover cust-levantamento and leftover cust-notas stay after leftover toggle`);
}

async function leftoverStorefront(page, label) {
  const search = await page.evaluate(() => {
    const input = document.getElementById('search-input');
    if (!input || !window.pesquisar) return { ok: false };
    input.value = 'morango';
    window.pesquisar();
    const morango = [...document.querySelectorAll('.shop-main .product-card')].length;
    input.value = 'tomate';
    window.pesquisar();
    const tomate = [...document.querySelectorAll('.shop-main .product-card')].length;
    if (window.limparTudo) window.limparTudo();
    return { ok: true, morango, tomate };
  });
  ok(search.ok && search.morango > 0, `${label}: leftover search morango (${search.morango})`);
  ok(search.ok && search.tomate > 0, `${label}: leftover search tomate (${search.tomate})`);

  await addMelancia(page, label);
  const qty = await page.evaluate(() => {
    const card = [...document.querySelectorAll('.shop-main .product-card')]
      .find(c => /Melancia 1\/4/i.test(c.textContent || ''));
    const plus = card ? [...card.querySelectorAll('.qty-btn')].find(b => /\+|Mais|Aumentar/i.test(b.textContent + (b.getAttribute('aria-label') || ''))) : null;
    if (plus) plus.click();
    return document.getElementById('cart-count')?.textContent || '';
  });
  ok(qty === '2', `${label}: leftover + increments 1→2 (count=${qty})`);

  const dest = await page.evaluate(() => {
    const enc = document.getElementById('encomenda');
    if (window.irParaEncomenda) window.irParaEncomenda();
    return {
      hasEnc: !!enc,
      priv: typeof window.abrirPrivacidade === 'function',
    };
  });
  ok(dest.hasEnc && dest.priv, `${label}: leftover irParaEncomenda still targets leftover #encomenda and leftover Privacidade still opens`);
}

try {
  const desktop = await browser.newPage();
  desktop.on('pageerror', err => errors.push('1280 pageerror: ' + err.message));
  await openReady(desktop, 1280, 800);
  await leftoverOptionalRing(desktop, '1280');
  await leftoverStorefront(desktop, '1280');

  const tablet = await browser.newPage();
  tablet.on('pageerror', err => errors.push('768 pageerror: ' + err.message));
  await openReady(tablet, 768, 1024);
  await leftoverOptionalRing(tablet, '768');
  await addMelancia(tablet, '768');

  const mobile = await browser.newPage();
  mobile.on('pageerror', err => errors.push('390 pageerror: ' + err.message));
  await openReady(mobile, 390, 844);
  await leftoverOptionalRing(mobile, '390');

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

  const menu = await mobile.evaluate(() => {
    const burger = document.querySelector('.hamburger');
    const close = document.querySelector('.mobile-close');
    const panel = document.getElementById('mobile-menu');
    if (window.toggleMenu) window.toggleMenu();
    const opened = panel ? getComputedStyle(panel).display !== 'none' && (panel.classList.contains('open') || getComputedStyle(panel).visibility !== 'hidden') : false;
    if (close) close.click();
    else if (window.toggleMenu) window.toggleMenu();
    const closed = panel ? !panel.classList.contains('open') : false;
    return {
      opened,
      closed,
      burgerLabel: burger ? burger.getAttribute('aria-label') : '',
      closeText: (close?.textContent || '').trim(),
    };
  });
  ok(menu.opened, '390: leftover hamburger still opens leftover menu');
  ok(menu.closed, '390: leftover ✕ still closes leftover menu');
  ok(menu.burgerLabel === 'Menu', '390: leftover hamburger stays named Menu');
  ok(menu.closeText === '✕', '390: leftover mobile-close stays a visible ✕');

  await addMelancia(mobile, '390');

  await browser.close();
  server.close();
  if (errors.length) {
    console.error('check-order-optional-toggle-focus-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
    process.exit(1);
  }
  console.log('check-order-optional-toggle-focus-browser: ok');
} catch (err) {
  try { await browser.close(); } catch {}
  try { server.close(); } catch {}
  console.error(err);
  process.exit(1);
}
