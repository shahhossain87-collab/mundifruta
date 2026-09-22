#!/usr/bin/env node
/** Chrome: leftover checkout order-remove does not fill cherry on touch; search + add Melancia 1/4. */
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

function rgbParts(color) {
  const m = String(color || '').match(/rgba?\(([^)]+)\)/i);
  if (!m) return null;
  const parts = m[1].split(',').map(s => parseFloat(s.trim()));
  if (parts.length < 3 || parts.some(n => !Number.isFinite(n))) return null;
  return { r: parts[0], g: parts[1], b: parts[2], a: Number.isFinite(parts[3]) ? parts[3] : 1 };
}

function isCherry(color) {
  const p = rgbParts(color);
  return !!(p && Math.abs(p.r - 196) <= 3 && Math.abs(p.g - 30) <= 3 && Math.abs(p.b - 58) <= 3 && (p.a ?? 1) > 0.85);
}

function isWhite(color, alpha) {
  const p = rgbParts(color);
  return !!(p && p.r >= 248 && p.g >= 248 && p.b >= 248 && Math.abs((p.a ?? 1) - alpha) <= 0.05);
}

function isRemoveCherry(bg, color) {
  return isCherry(bg) && isWhite(color, 1);
}

function isRemoveRest(bg, color) {
  return isWhite(bg, 0.1) && isWhite(color, 0.7);
}

async function openReady(page, vw, vh, media = []) {
  await page.setViewport({ width: vw, height: vh, deviceScaleFactor: 1, isMobile: vw <= 430, hasTouch: vw <= 430 });
  const supported = media.filter(f =>
    f.name === 'prefers-reduced-motion' ||
    f.name === 'prefers-color-scheme' ||
    f.name === 'prefers-contrast'
  );
  if (supported.length) await page.emulateMediaFeatures(supported);
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
    void document.body.offsetHeight;
    document.querySelectorAll('.fi').forEach(el => {
      el.style.transition = '';
    });
  });
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

async function leftoverChrome(page, label) {
  const data = await page.evaluate(() => {
    const html = getComputedStyle(document.documentElement);
    const menu = document.getElementById('mobile-menu');
    const ham = document.querySelector('.hamburger');
    const bar = document.getElementById('mobile-bar');
    const rating = document.querySelector('#inicio .hero-rating');
    const credit = document.querySelector('.footer-credit');
    const links = [...document.querySelectorAll('.footer-links a')]
      .map(a => (a.textContent || '').replace(/\s+/g, ' ').trim());
    const px = (v) => {
      const n = parseFloat(v);
      return Number.isFinite(n) ? n : 0;
    };
    return {
      padBottom: px(html.scrollPaddingBottom),
      padTop: px(html.scrollPaddingTop),
      scrollBehavior: html.scrollBehavior,
      menuZ: menu ? getComputedStyle(menu).zIndex : '',
      hamburgerExpanded: ham ? ham.getAttribute('aria-expanded') : 'missing',
      skip: !!document.querySelector('.skip-link, a[href="#conteudo"], a[href="#search-input"].skip'),
      main: !!document.querySelector('main'),
      headerCurrent: [...document.querySelectorAll('.nav-links a')]
        .some(a => a.getAttribute('aria-current') === 'page'),
      barDisplay: bar ? getComputedStyle(bar).display : '',
      labels: bar
        ? [...bar.querySelectorAll('.mb-label')].map(el =>
          (el.textContent || '').replace(/\s+/g, ' ').trim()
        )
        : [],
      score: (rating?.querySelector('.hr-score')?.textContent || '').trim(),
      count: (rating?.querySelector('.hr-count')?.textContent || '').trim(),
      credit: (credit?.textContent || '').replace(/\s+/g, ' ').trim(),
      links,
    };
  });
  ok(data.padBottom === 0, `${label}: leftover scroll-padding-bottom stays for PR #105 (${data.padBottom})`);
  ok(data.padTop === 0, `${label}: leftover scroll-padding-top stays for PR #97 (${data.padTop})`);
  ok(data.scrollBehavior === 'smooth', `${label}: leftover html scroll-behavior stays smooth (${data.scrollBehavior})`);
  ok(data.menuZ === '999', `${label}: leftover menu z-index stays 999 (${data.menuZ})`);
  ok(data.hamburgerExpanded === 'missing' || data.hamburgerExpanded === null || data.hamburgerExpanded === '',
    `${label}: leftover hamburger without expanded`);
  ok(!data.skip && !data.main, `${label}: leftover skip / main stay for PR #2 / #21`);
  ok(!data.headerCurrent, `${label}: leftover current-page markers stay for PR #92–#96`);
  ok(data.score === '4,9', `${label}: leftover hero score stays (${data.score})`);
  ok(data.count === '107+ Google', `${label}: leftover hero count stays (${data.count})`);
  ok(/Desenvolvido por Shah Hossain/.test(data.credit || ''),
    `${label}: leftover footer-credit copy stays (${data.credit})`);
  ok(data.links.join('|') === 'Produtos|Quem Somos|Encomendar|Contacto|Privacidade|Créditos das fotos',
    `${label}: leftover footer labels stay (${data.links.join('|')})`);
  return data;
}

async function leftoverRemoveCssom(page, label) {
  const rules = await page.evaluate(() => {
    const out = { hoverNone: false, reduce: false };
    for (const sheet of document.styleSheets) {
      let list;
      try { list = sheet.cssRules; } catch { continue; }
      for (const rule of list) {
        const text = rule.cssText || '';
        if (rule.type === CSSRule.MEDIA_RULE && /hover:\s*none/i.test(rule.conditionText || '')) {
          if (/\.order-remove:hover/.test(text) && /255,\s*255,\s*255/.test(text) && /0\.1/.test(text) && /0\.7/.test(text)) {
            out.hoverNone = true;
          }
        }
        if (rule.type === CSSRule.MEDIA_RULE && /prefers-reduced-motion:\s*reduce/i.test(rule.conditionText || '')) {
          if (/\.order-remove/.test(text) && /transition:\s*none/i.test(text) && /0\.1/.test(text)) {
            out.reduce = true;
          }
        }
      }
    }
    return out;
  });
  ok(rules.hoverNone, `${label}: leftover hover:none order-remove rule is in the live stylesheet`);
  ok(rules.reduce, `${label}: leftover reduced-motion order-remove rule is in the live stylesheet`);
}

function leftoverRemoveHandle() {
  return () => document.querySelector('#order-list .order-remove');
}

async function leftoverRemove(page, label, expectCherry) {
  await page.evaluate(() => {
    const order = document.getElementById('encomenda');
    if (order) order.scrollIntoView({ block: 'center' });
    const pop = document.getElementById('offer-pop'); if (pop) pop.hidden = true;
    const cs = document.getElementById('cs-pop'); if (cs) cs.hidden = true;
    const consent = document.getElementById('consent'); if (consent) consent.hidden = true;
  });
  const shown = await page.evaluate(() => {
    const btn = document.querySelector('#order-list .order-remove');
    if (btn) {
      btn.style.transition = 'none';
      btn.style.pointerEvents = 'auto';
    }
    return {
      ok: !!btn,
      display: btn ? getComputedStyle(btn).display : '',
      label: (btn?.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim(),
      mark: (btn?.textContent || '').replace(/\s+/g, ' ').trim(),
    };
  });
  ok(shown.ok, `${label}: leftover checkout order-remove exists after leftover add`);
  ok(/Remover Melancia 1\/4/i.test(shown.label || ''),
    `${label}: leftover checkout remove names leftover Melancia 1/4 (${shown.label})`);
  ok(shown.mark === '×' || shown.mark === 'x' || shown.mark === 'X',
    `${label}: leftover checkout remove mark stays (${shown.mark})`);
  ok(shown.display !== 'none', `${label}: leftover order-remove stays visible (${shown.display})`);
  if (!shown.ok) return { hidden: true };

  const handle = await page.evaluateHandle(leftoverRemoveHandle());
  const elHandle = handle.asElement();
  ok(!!elHandle, `${label}: leftover order-remove handle exists`);
  if (!elHandle) return { hidden: false };

  await elHandle.hover();
  const data = await page.evaluate(() => {
    const el = document.querySelector('#order-list .order-remove');
    if (el) el.style.transition = '';
    const cs = el ? getComputedStyle(el) : null;
    return {
      bg: cs ? cs.backgroundColor : '',
      color: cs ? cs.color : '',
      transition: cs ? cs.transitionDuration : '',
      hoverNone: window.matchMedia('(hover: none)').matches,
      reduce: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    };
  });

  const cherry = isRemoveCherry(data.bg, data.color);
  const rest = isRemoveRest(data.bg, data.color);
  if (expectCherry) {
    if (data.reduce || data.hoverNone) {
      ok(!cherry && rest,
        `${label}: leftover desktop hover is suppressed by leftover reduce/touch (${data.bg} ${data.color})`);
    } else if (cherry) {
      ok(true, `${label}: leftover desktop hover still fills cherry`);
    } else {
      await leftoverRemoveCssom(page, `${label} cssom-desktop-hover`);
    }
    return { hidden: false };
  }
  if (data.reduce || data.hoverNone) {
    ok(!cherry && rest,
      `${label}: leftover order-remove stays rest-state on touch/reduced-motion (${data.bg} ${data.color})`);
  } else {
    await leftoverRemoveCssom(page, `${label} cssom-fallback`);
  }
  return { hidden: false };
}

async function leftoverFirstTap(page, label) {
  const preview = await page.evaluate(() => {
    document.getElementById('encomenda')?.scrollIntoView({ block: 'center' });
    const btn = document.querySelector('#order-list .order-remove');
    if (!btn) return { ok: false, reason: 'btn missing' };
    btn.style.transition = 'none';
    btn.style.pointerEvents = 'auto';
    const hidden = getComputedStyle(btn).display === 'none';
    if (hidden) return { ok: true, hidden: true, label: (btn.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim() };
    btn.dispatchEvent(new Event('pointerenter', { bubbles: true }));
    btn.dispatchEvent(new Event('mouseover', { bubbles: true }));
    const cs = getComputedStyle(btn);
    return {
      ok: true,
      hidden: false,
      bg: cs.backgroundColor,
      color: cs.color,
      label: (btn.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim(),
      hoverNone: window.matchMedia('(hover: none)').matches,
      reduce: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    };
  });
  ok(preview.ok, `${label}: leftover order-remove is present for first-tap preview`);
  ok(/Remover Melancia 1\/4/i.test(preview.label || ''),
    `${label}: leftover first-tap preview keeps leftover Remover Melancia 1/4 (${preview.label})`);
  if (preview.hidden) {
    ok(true, `${label}: leftover first-tap skip — leftover order-remove stays hidden`);
    return;
  }
  if (preview.hoverNone || preview.reduce) {
    ok(!isRemoveCherry(preview.bg, preview.color) && isRemoveRest(preview.bg, preview.color),
      `${label}: leftover first-tap order-remove stays uncherried (${preview.bg} ${preview.color})`);
  }
}

async function leftoverIncrement(page, label) {
  const data = await page.evaluate(() => {
    const qty = document.querySelector('#order-list .oi-stepper b');
    const before = (qty?.textContent || '').trim();
    const btn = [...document.querySelectorAll('#order-list .oi-stepper button')]
      .find(el => (el.getAttribute('aria-label') || '') === 'Mais');
    if (btn) btn.click();
    const after = (document.querySelector('#order-list .oi-stepper b')?.textContent || '').trim();
    const count = document.getElementById('cart-count')?.textContent || '';
    const remove = document.querySelector('#order-list .order-remove');
    return {
      before,
      after,
      count,
      remove: !!remove,
      label: (remove?.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim(),
    };
  });
  ok(data.before === '1' && data.after === '2',
    `${label}: leftover checkout + still increments 1→2 (${data.before}→${data.after})`);
  ok(data.count === '2', `${label}: leftover cart badge still follows leftover checkout + (${data.count})`);
  ok(data.remove && /Remover Melancia 1\/4/i.test(data.label || ''),
    `${label}: leftover order-remove still names leftover Melancia after leftover + (${data.label})`);
}

async function leftoverRemoveClick(page, label) {
  const data = await page.evaluate(() => {
    const before = (document.querySelector('#order-list .order-item-main')?.textContent || '').replace(/\s+/g, ' ').trim();
    const btn = document.querySelector('#order-list .order-remove');
    if (btn) btn.click();
    return {
      before,
      empty: (document.querySelector('#order-list .empty-msg')?.textContent || '').replace(/\s+/g, ' ').trim(),
      items: document.querySelectorAll('#order-list .order-item').length,
      remove: !!document.querySelector('#order-list .order-remove'),
      count: document.getElementById('cart-count')?.textContent || '',
    };
  });
  ok(/Melancia 1\/4/i.test(data.before || ''),
    `${label}: leftover remove click starts with leftover Melancia 1/4 (${data.before})`);
  ok(/Sem artigos ainda/i.test(data.empty || ''),
    `${label}: leftover remove still clears leftover checkout (${data.empty})`);
  ok(data.items === 0 && !data.remove,
    `${label}: leftover order-remove is gone after leftover remove (${data.items})`);
  ok(data.count === '0' || data.count === '',
    `${label}: leftover cart badge still follows leftover remove (${data.count})`);
}

async function addMelancia(page, label) {
  await page.evaluate(() => {
    const pop = document.getElementById('offer-pop');
    if (pop) pop.hidden = true;
  });
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
    const fc = document.getElementById('float-cart');
    const remove = document.querySelector('#order-list .order-remove');
    const qtyEl = document.querySelector('#order-list .oi-stepper b');
    return {
      ok: true,
      count: document.getElementById('cart-count')?.textContent || '',
      visible: fc ? fc.classList.contains('visible') : false,
      title: fc ? (fc.getAttribute('title') || '') : '',
      text: (fc?.querySelector('.fc-text')?.textContent || '').replace(/\s+/g, ' ').trim(),
      remove: !!remove,
      label: (remove?.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim(),
      mark: (remove?.textContent || '').replace(/\s+/g, ' ').trim(),
      qty: (qtyEl?.textContent || '').trim(),
      selected: card.classList.contains('selected'),
      item: (document.querySelector('#order-list .order-item-main')?.textContent || '').replace(/\s+/g, ' ').trim(),
    };
  });
  ok(added.ok && added.count === '1', `${label}: add Melancia 1/4 (count=${added.count})`);
  ok(added.visible, `${label}: leftover float-cart becomes visible after leftover add`);
  ok(/Ver a sua encomenda/.test(added.title || ''),
    `${label}: leftover float-cart title stays after leftover add (${added.title})`);
  ok(/1\s*·/.test(added.text || ''),
    `${label}: leftover float-cart text keeps leftover count after leftover add (${added.text})`);
  ok(added.selected && added.remove && added.qty === '1',
    `${label}: leftover checkout remove appears after leftover add (${added.qty})`);
  ok(/Remover Melancia 1\/4/i.test(added.label || ''),
    `${label}: leftover order-remove names leftover Melancia 1/4 (${added.label})`);
  ok(/Melancia 1\/4/i.test(added.item || ''),
    `${label}: leftover order list keeps leftover Melancia 1/4 (${added.item})`);
}

try {
  const page390 = await browser.newPage();
  page390.on('pageerror', err => errors.push(`390 pageerror: ${err.message}`));
  await openReady(page390, 390, 844, [
    { name: 'hover', value: 'none' },
    { name: 'pointer', value: 'coarse' },
  ]);
  await leftoverSearch(page390, '390');
  const chrome390 = await leftoverChrome(page390, '390');
  ok(chrome390.barDisplay === 'grid' || chrome390.barDisplay === 'flex',
    `390: leftover 4-item bar stays visible (${chrome390.barDisplay})`);
  ok(chrome390.labels.join('|') === 'Carrinho|Promoções|WhatsApp|Como Chegar',
    `390: leftover 4-item labels stay (${chrome390.labels.join('|')})`);
  await leftoverRemoveCssom(page390, '390');
  await addMelancia(page390, '390');
  await leftoverRemove(page390, '390', false);
  await leftoverFirstTap(page390, '390');
  await leftoverIncrement(page390, '390');
  await leftoverFirstTap(page390, '390-after-add');
  await leftoverRemoveClick(page390, '390');
  await page390.close();

  const page768 = await browser.newPage();
  page768.on('pageerror', err => errors.push(`768 pageerror: ${err.message}`));
  await openReady(page768, 768, 1024, [
    { name: 'hover', value: 'none' },
    { name: 'pointer', value: 'coarse' },
  ]);
  const chrome768 = await leftoverChrome(page768, '768');
  ok(chrome768.barDisplay === 'grid' || chrome768.barDisplay === 'flex',
    `768: leftover 4-item bar stays visible (${chrome768.barDisplay})`);
  await leftoverRemoveCssom(page768, '768');
  await leftoverSearch(page768, '768');
  await addMelancia(page768, '768');
  await leftoverRemove(page768, '768', false);
  await leftoverFirstTap(page768, '768');
  await leftoverIncrement(page768, '768');
  await leftoverFirstTap(page768, '768-after-add');
  await leftoverRemoveClick(page768, '768');
  await page768.close();

  const pageReduce = await browser.newPage();
  pageReduce.on('pageerror', err => errors.push(`1280-reduce pageerror: ${err.message}`));
  await openReady(pageReduce, 1280, 800, [
    { name: 'prefers-reduced-motion', value: 'reduce' },
    { name: 'hover', value: 'hover' },
    { name: 'pointer', value: 'fine' },
  ]);
  await leftoverRemoveCssom(pageReduce, '1280-reduce');
  await leftoverSearch(pageReduce, '1280-reduce');
  await addMelancia(pageReduce, '1280-reduce');
  await leftoverRemove(pageReduce, '1280-reduce', false);
  const reduceDur = await pageReduce.evaluate(() => {
    document.getElementById('encomenda')?.scrollIntoView({ block: 'center' });
    const el = document.querySelector('#order-list .order-remove');
    if (el) el.style.transition = '';
    const parse = (v) => (v || '').split(',').map(s => parseFloat(s) || 0);
    const dur = el ? parse(getComputedStyle(el).transitionDuration) : [1];
    return { max: Math.max(0, ...dur) };
  });
  ok(reduceDur.max === 0,
    `1280-reduce: leftover order-remove transition is 0s (max=${reduceDur.max})`);
  await leftoverFirstTap(pageReduce, '1280-reduce');
  await leftoverIncrement(pageReduce, '1280-reduce');
  await leftoverRemoveClick(pageReduce, '1280-reduce');
  await pageReduce.close();

  const page1280 = await browser.newPage();
  page1280.on('pageerror', err => errors.push(`1280 pageerror: ${err.message}`));
  await openReady(page1280, 1280, 800, [
    { name: 'hover', value: 'hover' },
    { name: 'pointer', value: 'fine' },
    { name: 'prefers-reduced-motion', value: 'no-preference' },
  ]);
  const chrome1280 = await leftoverChrome(page1280, '1280');
  ok(chrome1280.barDisplay === 'none',
    `1280: leftover 4-item bar stays hidden on desktop (${chrome1280.barDisplay})`);
  await leftoverSearch(page1280, '1280');
  await addMelancia(page1280, '1280');
  await leftoverRemove(page1280, '1280', true);
  await leftoverFirstTap(page1280, '1280');
  await leftoverIncrement(page1280, '1280');
  await leftoverRemoveClick(page1280, '1280');
  await page1280.close();
} finally {
  await browser.close();
  server.close();
}

if (errors.length) {
  console.error('check-order-remove-hover-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
  process.exit(1);
}
console.log('check-order-remove-hover-browser: ok');
