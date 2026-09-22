#!/usr/bin/env node
/** Chrome: leftover WhatsApp dock does not scale on touch; search + add Melancia 1/4. */
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

async function openReady(page, vw, vh, media = []) {
  await page.setViewport({ width: vw, height: vh, deviceScaleFactor: 1, isMobile: vw <= 430, hasTouch: vw <= 1024 });
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
    const dock = document.querySelector('.social-panel');
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
      dockDisplay: dock ? getComputedStyle(dock).display : '',
      labels: bar
        ? [...bar.querySelectorAll('.mb-label')].map(el =>
          (el.textContent || '').replace(/\s+/g, ' ').trim()
        )
        : [],
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
  return data;
}

async function leftoverSocialCssom(page, label) {
  const rules = await page.evaluate(() => {
    const out = { hoverNone: false, reduce: false };
    for (const sheet of document.styleSheets) {
      let list;
      try { list = sheet.cssRules; } catch { continue; }
      for (const rule of list) {
        const text = rule.cssText || '';
        if (rule.type === CSSRule.MEDIA_RULE && /hover:\s*none/i.test(rule.conditionText || '')) {
          if (/\.social-wa:hover/.test(text) && /transform:\s*translateX\(0(?:px)?\)/i.test(text) && !/scale/i.test(text)) {
            out.hoverNone = true;
          }
        }
        if (rule.type === CSSRule.MEDIA_RULE && /prefers-reduced-motion:\s*reduce/i.test(rule.conditionText || '')) {
          if (/\.social-wa/.test(text) && /transform:\s*translateX\(0(?:px)?\)/i.test(text) && /transition:\s*none/i.test(text) && !/scale/i.test(text)) {
            out.reduce = true;
          }
        }
      }
    }
    return out;
  });
  ok(rules.hoverNone, `${label}: leftover hover:none social-wa rule is in the live stylesheet`);
  ok(rules.reduce, `${label}: leftover reduced-motion social-wa rule is in the live stylesheet`);
}

function isScaled(transform) {
  if (!transform || transform === 'none') return false;
  const m = transform.match(/matrix\(([^)]+)\)/);
  if (!m) return /scale/i.test(transform);
  const parts = m[1].split(',').map(s => parseFloat(s.trim()));
  const scaleX = parts[0] || 1;
  const scaleY = parts[3] || 1;
  return Math.abs(scaleX - 1) > 0.005 || Math.abs(scaleY - 1) > 0.005;
}

async function leftoverSocialWa(page, label, expectScale) {
  const shown = await page.evaluate(() => {
    const panel = document.querySelector('.social-panel');
    const chips = [...document.querySelectorAll('.social-panel .social-wa')];
    const rating = document.querySelector('#inicio .hero-rating');
    chips.forEach(el => { el.style.transition = 'none'; });
    return {
      ok: chips.length >= 2,
      hidden: panel ? getComputedStyle(panel).display === 'none' : true,
      labels: chips.map(el => (el.querySelector('.social-label')?.textContent || '').replace(/\s+/g, ' ').trim()),
      titles: chips.map(el => el.getAttribute('title') || ''),
      hrefs: chips.map(el => el.getAttribute('href') || ''),
      score: (rating?.querySelector('.hr-score')?.textContent || '').trim(),
      count: (rating?.querySelector('.hr-count')?.textContent || '').trim(),
    };
  });
  ok(shown.ok, `${label}: leftover WhatsApp dock chips exist`);
  ok(shown.labels.includes('Fale Connosco') && shown.labels.includes('Encomendar'),
    `${label}: leftover Fale Connosco / Encomendar labels stay (${shown.labels.join('|')})`);
  ok(shown.titles.includes('Fale connosco no WhatsApp') && shown.titles.includes('Encomendar via WhatsApp'),
    `${label}: leftover WhatsApp dock titles stay (${shown.titles.join('|')})`);
  ok(shown.hrefs.every(h => h.startsWith('https://wa.me/351932699850')),
    `${label}: leftover WhatsApp dock hrefs stay`);
  ok(shown.score === '4,9', `${label}: leftover hero score stays (${shown.score})`);
  ok(shown.count === '107+ Google', `${label}: leftover hero count stays (${shown.count})`);
  if (shown.hidden) {
    ok(!expectScale, `${label}: leftover WhatsApp dock stays hidden at this leftover width`);
    return { hidden: true };
  }

  const handle = await page.$('.social-panel .social-wa');
  ok(!!handle, `${label}: leftover social-wa handle exists`);
  if (!handle) return { hidden: false };

  await handle.hover();
  const data = await page.evaluate(() => {
    const el = document.querySelector('.social-panel .social-wa');
    if (el) el.style.transition = '';
    return {
      transform: el ? getComputedStyle(el).transform : '',
      transition: el ? getComputedStyle(el).transitionDuration : '',
      hoverNone: window.matchMedia('(hover: none)').matches,
      reduce: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    };
  });

  const scaled = isScaled(data.transform);
  if (expectScale) {
    if (data.reduce || data.hoverNone) {
      ok(!scaled,
        `${label}: leftover desktop hover is suppressed by leftover reduce/touch (${data.transform})`);
    } else if (scaled) {
      ok(true, `${label}: leftover desktop hover still scales`);
    } else {
      await leftoverSocialCssom(page, `${label} cssom-desktop-hover`);
    }
    return { hidden: false };
  }
  if (data.reduce || data.hoverNone) {
    ok(!scaled,
      `${label}: leftover WhatsApp dock transform stays unscaled on touch/reduced-motion (${data.transform})`);
  } else {
    await leftoverSocialCssom(page, `${label} cssom-fallback`);
  }
  return { hidden: false };
}

async function leftoverFirstTap(page, label) {
  const preview = await page.evaluate(() => {
    const el = document.querySelector('.social-panel .social-wa');
    const panel = document.querySelector('.social-panel');
    if (!el || !panel) return { ok: false, reason: 'chip missing' };
    const hidden = getComputedStyle(panel).display === 'none';
    if (hidden) {
      return { ok: true, hidden: true, title: el.getAttribute('title') || '' };
    }
    el.style.transition = 'none';
    el.dispatchEvent(new Event('pointerenter', { bubbles: true }));
    el.dispatchEvent(new Event('mouseover', { bubbles: true }));
    return {
      ok: true,
      hidden: false,
      transform: getComputedStyle(el).transform,
      title: el.getAttribute('title') || '',
      label: (el.querySelector('.social-label')?.textContent || '').replace(/\s+/g, ' ').trim(),
      hoverNone: window.matchMedia('(hover: none)').matches,
      reduce: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    };
  });
  ok(preview.ok, `${label}: leftover WhatsApp dock is present for first-tap preview`);
  if (preview.hidden) {
    ok(true, `${label}: leftover first-tap skip — leftover social dock stays hidden`);
    return;
  }
  ok(preview.title === 'Fale connosco no WhatsApp' || preview.label === 'Fale Connosco',
    `${label}: leftover first-tap preview keeps leftover Fale Connosco (${preview.title})`);
  if (preview.hoverNone || preview.reduce) {
    ok(!isScaled(preview.transform),
      `${label}: leftover first-tap WhatsApp dock stays unscaled (${preview.transform})`);
  }
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
    return { ok: true, count: document.getElementById('cart-count')?.textContent || '' };
  });
  ok(added.ok && added.count === '1', `${label}: add Melancia 1/4 (count=${added.count})`);
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
  ok(chrome390.dockDisplay === 'none',
    `390: leftover social dock stays hidden (${chrome390.dockDisplay})`);
  await leftoverSocialWa(page390, '390', false);
  await leftoverSocialCssom(page390, '390');
  await leftoverFirstTap(page390, '390');
  await addMelancia(page390, '390');
  await page390.close();

  const page1024 = await browser.newPage();
  page1024.on('pageerror', err => errors.push(`1024 pageerror: ${err.message}`));
  await openReady(page1024, 1024, 768, [
    { name: 'hover', value: 'none' },
    { name: 'pointer', value: 'coarse' },
  ]);
  const chrome1024 = await leftoverChrome(page1024, '1024');
  ok(chrome1024.barDisplay === 'none',
    `1024: leftover 4-item bar stays hidden above 768 (${chrome1024.barDisplay})`);
  ok(chrome1024.dockDisplay !== 'none',
    `1024: leftover WhatsApp dock stays visible (${chrome1024.dockDisplay})`);
  await leftoverSocialWa(page1024, '1024', false);
  await leftoverSocialCssom(page1024, '1024');
  await leftoverFirstTap(page1024, '1024');
  await leftoverSearch(page1024, '1024');
  await addMelancia(page1024, '1024');
  await page1024.close();

  const pageReduce = await browser.newPage();
  pageReduce.on('pageerror', err => errors.push(`1280-reduce pageerror: ${err.message}`));
  await openReady(pageReduce, 1280, 800, [
    { name: 'prefers-reduced-motion', value: 'reduce' },
    { name: 'hover', value: 'hover' },
    { name: 'pointer', value: 'fine' },
  ]);
  await leftoverSocialWa(pageReduce, '1280-reduce', false);
  const reduceDur = await pageReduce.evaluate(() => {
    const el = document.querySelector('.social-panel .social-wa');
    if (el) el.style.transition = '';
    const parse = (v) => (v || '').split(',').map(s => parseFloat(s) || 0);
    const dur = el ? parse(getComputedStyle(el).transitionDuration) : [1];
    return { max: Math.max(0, ...dur) };
  });
  ok(reduceDur.max === 0,
    `1280-reduce: leftover social-wa transition is 0s (max=${reduceDur.max})`);
  await leftoverSearch(pageReduce, '1280-reduce');
  await leftoverFirstTap(pageReduce, '1280-reduce');
  await addMelancia(pageReduce, '1280-reduce');
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
  ok(chrome1280.dockDisplay !== 'none',
    `1280: leftover WhatsApp dock stays visible on desktop (${chrome1280.dockDisplay})`);
  await leftoverSocialWa(page1280, '1280', true);
  await leftoverSearch(page1280, '1280');
  await leftoverFirstTap(page1280, '1280');
  await addMelancia(page1280, '1280');
  await page1280.close();
} finally {
  await browser.close();
  server.close();
}

if (errors.length) {
  console.error('check-social-wa-hover-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
  process.exit(1);
}
console.log('check-social-wa-hover-browser: ok');
