#!/usr/bin/env node
/** Chrome: leftover cabaz-modal-close does not stick cream-3 on touch; search + add Melancia 1/4. */
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

function isCream2(color) {
  const p = rgbParts(color);
  return !!(p && Math.abs(p.r - 245) <= 4 && Math.abs(p.g - 237) <= 4 && Math.abs(p.b - 224) <= 4);
}

function isCream3(color) {
  const p = rgbParts(color);
  return !!(p && Math.abs(p.r - 232) <= 4 && Math.abs(p.g - 213) <= 4 && Math.abs(p.b - 192) <= 4);
}

async function openReady(page, vw, vh, media = []) {
  await page.setViewport({ width: vw, height: vh, deviceScaleFactor: 1, isMobile: vw <= 430, hasTouch: vw <= 430 });
  if (media.length) {
    try {
      await page.emulateMediaFeatures(media);
    } catch {
      const supported = media.filter(f =>
        f.name === 'prefers-reduced-motion' ||
        f.name === 'prefers-color-scheme' ||
        f.name === 'prefers-contrast'
      );
      if (supported.length) await page.emulateMediaFeatures(supported);
    }
  }
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

async function leftoverCabazCssom(page, label) {
  const rules = await page.evaluate(() => {
    const out = { hoverNone: false, reduce: false };
    for (const sheet of document.styleSheets) {
      let list;
      try { list = sheet.cssRules; } catch { continue; }
      for (const rule of list) {
        const text = rule.cssText || '';
        if (rule.type === CSSRule.MEDIA_RULE && /hover:\s*none/i.test(rule.conditionText || '')) {
          if (/\.cabaz-modal-close:hover/.test(text) && /--cream-2/.test(text)) {
            out.hoverNone = true;
          }
        }
        if (rule.type === CSSRule.MEDIA_RULE && /prefers-reduced-motion:\s*reduce/i.test(rule.conditionText || '')) {
          if (/\.cabaz-modal-close/.test(text) && /--cream-2/.test(text) && /transition:\s*none/i.test(text)) {
            out.reduce = true;
          }
        }
      }
    }
    return out;
  });
  ok(rules.hoverNone, `${label}: leftover hover:none cabaz-modal-close rule is in the live stylesheet`);
  ok(rules.reduce, `${label}: leftover reduced-motion cabaz-modal-close rule is in the live stylesheet`);
}

async function leftoverOpenModal(page, label) {
  const data = await page.evaluate(() => {
    const btn = [...document.querySelectorAll('#grid-cabazes .cabaz-ver')]
      .find(el => /Ver o que leva/i.test(el.textContent || ''));
    if (!btn) return { ok: false, reason: 'button missing' };
    btn.scrollIntoView({ block: 'center' });
    btn.click();
    const modal = document.getElementById('cabaz-modal') || document.querySelector('.cabaz-modal');
    const close = document.querySelector('.cabaz-modal-close');
    const open = !!(modal && (modal.classList.contains('open') || getComputedStyle(modal).visibility === 'visible'));
    const cs = close ? getComputedStyle(close) : null;
    return {
      ok: true,
      open,
      hasClose: !!close,
      closeLabel: close ? (close.getAttribute('aria-label') || '') : '',
      closeText: close ? (close.textContent || '').trim() : '',
      bg: cs ? cs.backgroundColor : '',
      display: cs ? cs.display : '',
    };
  });
  ok(data.ok && data.open, `${label}: leftover Ver o que leva still opens leftover cabaz modal`);
  ok(data.hasClose, `${label}: leftover cabaz-modal-close is rendered`);
  ok(data.closeLabel === 'Fechar', `${label}: leftover cabaz-modal-close name stays (${data.closeLabel})`);
  ok(data.closeText === '✕', `${label}: leftover cabaz-modal-close mark stays (${data.closeText})`);
  ok(data.display !== 'none', `${label}: leftover cabaz-modal-close stays visible`);
  return data;
}

async function leftoverCloseModal(page, label) {
  const data = await page.evaluate(() => {
    const close = document.querySelector('.cabaz-modal-close');
    if (close) close.click();
    else if (typeof window.fecharCabaz === 'function') window.fecharCabaz();
    const modal = document.getElementById('cabaz-modal') || document.querySelector('.cabaz-modal');
    const open = !!(modal && modal.classList.contains('open'));
    return { closed: !open };
  });
  ok(data.closed, `${label}: leftover cabaz-modal-close still closes leftover cabaz modal`);
}

async function leftoverFirstTap(page, label, expectDesktopHover) {
  const preview = await page.evaluate(() => {
    const modal = document.getElementById('cabaz-modal');
    if (modal && !modal.classList.contains('open')) {
      const btn = [...document.querySelectorAll('#grid-cabazes .cabaz-ver')]
        .find(el => /Ver o que leva/i.test(el.textContent || ''));
      if (btn) btn.click();
    }
    const close = document.querySelector('.cabaz-modal-close');
    if (!close) return { ok: false };
    close.scrollIntoView({ block: 'center' });
    close.style.transition = 'none';
    close.classList.add('force-hover-probe');
    return {
      ok: true,
      label: close.getAttribute('aria-label') || '',
    };
  });
  ok(preview.ok, `${label}: leftover first-tap found leftover cabaz-modal-close`);
  const handle = await page.evaluateHandle(() => document.querySelector('.cabaz-modal-close'));
  if (handle) {
    try { await handle.hover(); } catch { /* hover can fail if offscreen */ }
  }
  const after = await page.evaluate(() => {
    const close = document.querySelector('.cabaz-modal-close');
    if (!close) return { ok: false };
    const cs = getComputedStyle(close);
    return {
      ok: true,
      bg: cs.backgroundColor,
      hoverNone: window.matchMedia('(hover: none)').matches,
      reduce: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      label: close.getAttribute('aria-label') || '',
      mark: (close.textContent || '').trim(),
    };
  });
  ok(after.ok, `${label}: leftover first-tap still has leftover cabaz-modal-close`);
  ok(after.label === 'Fechar',
    `${label}: leftover first-tap keeps leftover close name (${after.label})`);
  ok(after.mark === '✕',
    `${label}: leftover first-tap keeps leftover close mark (${after.mark})`);
  if (expectDesktopHover && !after.hoverNone && !after.reduce) {
    ok(isCream3(after.bg),
      `${label}: leftover desktop pointer hover cream-3 stays (${after.bg})`);
  } else if (after.hoverNone || after.reduce) {
    ok(isCream2(after.bg) && !isCream3(after.bg),
      `${label}: leftover first-tap cabaz-modal-close stays uncreamed (${after.bg})`);
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
    return { before, after, count: document.getElementById('cart-count')?.textContent || '' };
  });
  ok(data.before === '1' && data.after === '2',
    `${label}: leftover checkout + still increments 1→2 (${data.before}→${data.after})`);
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
    return {
      ok: true,
      count: document.getElementById('cart-count')?.textContent || '',
      visible: fc ? fc.classList.contains('visible') : false,
      title: fc ? (fc.getAttribute('title') || '') : '',
      text: (fc?.querySelector('.fc-text')?.textContent || '').replace(/\s+/g, ' ').trim(),
      selected: card.classList.contains('selected'),
    };
  });
  ok(added.ok && added.count === '1', `${label}: add Melancia 1/4 (count=${added.count})`);
  ok(added.visible, `${label}: leftover float-cart becomes visible after leftover add`);
  ok(/Ver a sua encomenda/.test(added.title || ''),
    `${label}: leftover float-cart title stays after leftover add (${added.title})`);
  ok(/1\s*·/.test(added.text || ''),
    `${label}: leftover float-cart text keeps leftover count after leftover add (${added.text})`);
  ok(added.selected, `${label}: leftover Melancia card stays selected after leftover add`);
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
  await leftoverCabazCssom(page390, '390');
  await leftoverOpenModal(page390, '390');
  await leftoverFirstTap(page390, '390', false);
  await leftoverCloseModal(page390, '390');
  await leftoverOpenModal(page390, '390-reopen');
  await leftoverCloseModal(page390, '390-reopen');
  await addMelancia(page390, '390');
  await leftoverIncrement(page390, '390');
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
  await leftoverCabazCssom(page768, '768');
  await leftoverSearch(page768, '768');
  await leftoverOpenModal(page768, '768');
  await leftoverFirstTap(page768, '768', false);
  await leftoverCloseModal(page768, '768');
  await addMelancia(page768, '768');
  await leftoverIncrement(page768, '768');
  await page768.close();

  const pageReduce = await browser.newPage();
  pageReduce.on('pageerror', err => errors.push(`1280-reduce pageerror: ${err.message}`));
  await openReady(pageReduce, 1280, 800, [
    { name: 'prefers-reduced-motion', value: 'reduce' },
    { name: 'hover', value: 'hover' },
    { name: 'pointer', value: 'fine' },
  ]);
  await leftoverCabazCssom(pageReduce, '1280-reduce');
  await leftoverSearch(pageReduce, '1280-reduce');
  await leftoverOpenModal(pageReduce, '1280-reduce');
  const reduceDur = await pageReduce.evaluate(() => {
    const el = document.querySelector('.cabaz-modal-close');
    if (el) el.style.transition = '';
    const parse = (v) => (v || '').split(',').map(s => parseFloat(s) || 0);
    const dur = el ? parse(getComputedStyle(el).transitionDuration) : [1];
    return { max: Math.max(0, ...dur) };
  });
  ok(reduceDur.max === 0,
    `1280-reduce: leftover cabaz-modal-close transition is 0s (max=${reduceDur.max})`);
  await leftoverFirstTap(pageReduce, '1280-reduce', false);
  await leftoverCloseModal(pageReduce, '1280-reduce');
  await addMelancia(pageReduce, '1280-reduce');
  await leftoverIncrement(pageReduce, '1280-reduce');
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
  await leftoverOpenModal(page1280, '1280');
  await leftoverFirstTap(page1280, '1280', true);
  await leftoverCloseModal(page1280, '1280');
  await addMelancia(page1280, '1280');
  await leftoverIncrement(page1280, '1280');
  await page1280.close();
} finally {
  await browser.close();
  server.close();
}

if (errors.length) {
  console.error('check-cabaz-modal-close-hover-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
  process.exit(1);
}
console.log('check-cabaz-modal-close-hover-browser: ok');
