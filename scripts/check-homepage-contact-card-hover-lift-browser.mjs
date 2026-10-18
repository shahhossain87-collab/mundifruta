#!/usr/bin/env node
/** Chrome: leftover homepage Encontre-nos cards lift only on hover-capable pointers. */
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
const isLift6 = value => {
  if (!value) return false;
  if (/translateY\(-6px\)/.test(value)) return true;
  const m = value.match(/^matrix\(([^)]+)\)$/);
  if (!m) return false;
  const parts = m[1].split(',').map(s => parseFloat(s.trim()));
  return parts.length === 6 &&
    Math.abs(parts[0] - 1) < 0.01 &&
    Math.abs(parts[3] - 1) < 0.01 &&
    Math.abs(parts[4]) < 0.5 &&
    Math.abs(parts[5] - (-6)) < 0.6;
};

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

async function measureCard(page) {
  const rest = await page.evaluate(() => {
    const card = [...document.querySelectorAll('#contacto .contact-card')]
      .find(el => /Telefone/i.test(el.textContent || ''));
    if (card) {
      card.style.transition = 'none';
      card.classList.add('on');
      card.scrollIntoView({ block: 'center', inline: 'nearest' });
      void card.offsetHeight;
    }
    const headings = [...document.querySelectorAll('#contacto .contact-card h4')]
      .map(el => (el.textContent || '').replace(/\s+/g, ' ').trim());
    const tel = document.querySelector('#contacto a[href="tel:932699850"]');
    const email = document.querySelector('#contacto a[href="mailto:shahhossain87@gmail.com"]');
    const hero = [...document.querySelectorAll('.hero-ctas a')]
      .map(a => (a.textContent || '').replace(/\s+/g, ' ').trim());
    const hoverRules = [];
    const unscopedLift = [];
    const stepUnscoped = [];
    const csUnscoped = [];
    const catUnscopedLift = [];
    const shopUnscopedLift = [];
    const shopUnscopedZoom = [];
    const catalogUnscoped = [];
    const scUnscopedLift = [];
    for (const sheet of document.styleSheets) {
      let list;
      try { list = [...sheet.cssRules]; } catch { continue; }
      for (const rule of list) {
        if (rule instanceof CSSMediaRule && /\(hover:\s*hover\)/.test(rule.conditionText || '')) {
          for (const inner of rule.cssRules) {
            const sel = inner.selectorText || '';
            if (sel === '.contact-card:hover') {
              hoverRules.push({
                media: rule.conditionText,
                selector: sel,
                transform: inner.style.transform,
              });
            }
          }
        }
        if (rule instanceof CSSStyleRule) {
          const sel = rule.selectorText || '';
          if (sel === '.contact-card:hover' && /translateY/.test(rule.style.transform || '')) {
            unscopedLift.push(sel + ' ' + rule.style.transform);
          }
          if (sel === '.step-card:hover') stepUnscoped.push(sel);
          if (sel === '.cs-card:hover') csUnscoped.push(sel);
          if (/\.cat-quick-btn:hover/.test(sel) && !/img/.test(sel) && /translateY/.test(rule.style.transform || '')) {
            catUnscopedLift.push(sel);
          }
          if (sel === '.product-card:hover') shopUnscopedLift.push(sel);
          if (/\.product-card:hover/.test(sel) && /\.photo-wrap img/.test(sel)) shopUnscopedZoom.push(sel);
          if (/\.seo-product-card:hover/.test(sel) && /\.seo-product-image img/.test(sel)) catalogUnscoped.push(sel);
          if (sel === '.sc:hover') scUnscopedLift.push(sel);
        }
      }
    }
    return {
      found: Boolean(card),
      restTransform: card ? getComputedStyle(card).transform : '',
      headings,
      telText: tel ? (tel.textContent || '').replace(/\s+/g, ' ').trim() : '',
      emailText: email ? (email.textContent || '').trim() : '',
      hero,
      hoverRules,
      unscopedLift: [...new Set(unscopedLift)],
      stepUnscoped,
      csUnscoped,
      catUnscopedLift,
      shopUnscopedLift,
      shopUnscopedZoom,
      catalogUnscoped,
      scUnscopedLift,
    };
  });
  const handle = await page.evaluateHandle(() =>
    [...document.querySelectorAll('#contacto .contact-card')]
      .find(el => /Telefone/i.test(el.textContent || ''))
  );
  const card = handle.asElement();
  if (card) await card.hover();
  await new Promise(r => setTimeout(r, 400));
  const hovered = await page.evaluate(() => {
    const card = [...document.querySelectorAll('#contacto .contact-card')]
      .find(el => /Telefone/i.test(el.textContent || ''));
    const canHover = window.matchMedia('(hover: hover)').matches;
    return {
      transform: card ? getComputedStyle(card).transform : '',
      canHover,
      cardHovered: card ? card.matches(':hover') : false,
    };
  });
  return { ...rest, hovered };
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
    const bar = [...document.querySelectorAll('.mb-item')].map(el =>
      (el.textContent || '').replace(/\s+/g, ' ').trim()
    );
    return { ok: true, count: document.getElementById('cart-count')?.textContent || '', bar };
  });
  ok(added.ok && added.count === '1', `${label}: add Melancia 1/4 (count=${added.count})`);
  return added;
}

try {
  const coarse = await browser.newPage();
  coarse.on('pageerror', err => errors.push('390 pageerror: ' + err.message));
  await openReady(coarse, 390, 844);
  const phone = await measureCard(coarse);
  ok(phone.found, '390: leftover Telefone contact card is present');
  ok(
    phone.hoverRules.length === 1 &&
    phone.hoverRules[0].transform === 'translateY(-6px)',
    `390: leftover contact-card lift lives in (hover: hover) (got ${JSON.stringify(phone.hoverRules)})`
  );
  ok(phone.unscopedLift.length === 0, `390: no unscoped leftover contact-card lift (got ${phone.unscopedLift.join(', ')})`);
  ok(phone.stepUnscoped.length === 1,
    `390: leftover Como Encomendar step-card lift stays unscoped (PR #117) (got ${phone.stepUnscoped.join(', ')})`);
  ok(phone.csUnscoped.length === 1,
    `390: leftover Combina bem cs-card lift stays unscoped (PR #116) (got ${phone.csUnscoped.join(', ')})`);
  ok(phone.catUnscopedLift.length >= 1,
    `390: leftover category-tile lift stays unscoped (PR #279) (got ${phone.catUnscopedLift.join(', ')})`);
  ok(phone.shopUnscopedLift.length === 3,
    `390: leftover shop-card lift stays unscoped (PR #278) (got ${phone.shopUnscopedLift.join(', ')})`);
  ok(phone.shopUnscopedZoom.length === 1,
    `390: leftover shop-card photo zoom stays unscoped (PR #272) (got ${phone.shopUnscopedZoom.join(', ')})`);
  ok(phone.catalogUnscoped.length === 1,
    `390: leftover catalog card zoom stays unscoped (PR #271) (got ${phone.catalogUnscoped.join(', ')})`);
  ok(phone.scUnscopedLift.length === 1,
    `390: leftover unused .sc card lift stays unscoped (PR #277) (got ${phone.scUnscopedLift.join(', ')})`);
  ok(isIdentity(phone.restTransform), `390 rest transform identity (got ${phone.restTransform})`);
  ok(!phone.hovered.canHover,
    `390: hover:none pointer (canHover=${phone.hovered.canHover})`);
  ok(!isLift6(phone.hovered.transform),
    `390 hover:none should not sticky-lift leftover Encontre-nos cards (transform=${phone.hovered.transform})`);
  ok(
    phone.headings.includes('Morada') &&
    phone.headings.includes('Telefone / WhatsApp') &&
    phone.headings.includes('Email') &&
    phone.headings.includes('Horário'),
    `390: leftover Encontre-nos cards stay (got ${phone.headings.join(' / ')})`
  );
  ok(phone.telText === '932 699 850', `390: leftover tel stays (got ${phone.telText})`);
  ok(phone.emailText === 'shahhossain87@gmail.com', `390: leftover email stays (got ${phone.emailText})`);
  ok(phone.hero.some(t => /Ver Produtos/i.test(t)) && phone.hero.some(t => /Encomendar por WhatsApp/i.test(t)),
    `390: leftover hero CTAs stay (got ${phone.hero.join(' / ')})`);
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
  await addMelancia(coarse, '390');

  const fine = await browser.newPage();
  fine.on('pageerror', err => errors.push('1280 pageerror: ' + err.message));
  await openReady(fine, 1280, 800);
  const wide = await measureCard(fine);
  ok(wide.found, '1280: leftover Telefone contact card is present');
  ok(
    wide.hoverRules.length === 1 &&
    wide.hoverRules[0].transform === 'translateY(-6px)',
    `1280: leftover contact-card lift lives in (hover: hover) (got ${JSON.stringify(wide.hoverRules)})`
  );
  ok(wide.unscopedLift.length === 0, `1280: no unscoped leftover contact-card lift (got ${wide.unscopedLift.join(', ')})`);
  ok(isIdentity(wide.restTransform), `1280 rest transform identity (got ${wide.restTransform})`);
  ok(!wide.hovered.canHover || isIdentity(wide.hovered.transform) || isLift6(wide.hovered.transform),
    `1280: if the pointer can hover, leftover 6px lift or animation fill stays (canHover=${wide.hovered.canHover}, transform=${wide.hovered.transform})`);
  ok(wide.hero.some(t => /Ver Produtos/i.test(t)) && wide.hero.some(t => /Encomendar por WhatsApp/i.test(t)),
    `1280: leftover hero CTAs stay (got ${wide.hero.join(' / ')})`);
  ok(
    wide.headings.includes('Morada') &&
    wide.headings.includes('Telefone / WhatsApp') &&
    wide.headings.includes('Email') &&
    wide.headings.includes('Horário'),
    `1280: leftover Encontre-nos cards stay (got ${wide.headings.join(' / ')})`
  );
  await addMelancia(fine, '1280');

  await browser.close();
  server.close();
  if (errors.length) {
    console.error('check-homepage-contact-card-hover-lift-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
    process.exit(1);
  }
  console.log('check-homepage-contact-card-hover-lift-browser: ok');
} catch (err) {
  try { await browser.close(); } catch {}
  try { server.close(); } catch {}
  console.error(err);
  process.exit(1);
}
