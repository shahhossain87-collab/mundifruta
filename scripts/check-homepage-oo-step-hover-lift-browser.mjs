#!/usr/bin/env node
/** Chrome: leftover unused .oo-step cards lift only on hover-capable pointers. */
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
const isLift4 = value => {
  if (!value) return false;
  if (/translateY\(-4px\)/.test(value)) return true;
  const m = value.match(/^matrix\(([^)]+)\)$/);
  if (!m) return false;
  const parts = m[1].split(',').map(s => parseFloat(s.trim()));
  return parts.length === 6 &&
    Math.abs(parts[0] - 1) < 0.01 &&
    Math.abs(parts[3] - 1) < 0.01 &&
    Math.abs(parts[4]) < 0.5 &&
    Math.abs(parts[5] - (-4)) < 0.6;
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
    if (!document.getElementById('oo-hover-fixture')) {
      const fixture = document.createElement('div');
      fixture.className = 'oo-step';
      fixture.id = 'oo-hover-fixture';
      fixture.innerHTML = '<div class="oo-ic">1</div><h4>Escolha</h4><p>fixture leftover Encomenda online passo</p>';
      document.body.appendChild(fixture);
    }
  });
}

async function measureCard(page) {
  const rest = await page.evaluate(() => {
    const live = document.querySelector('.online-order .oo-step, #encomenda .oo-step, .oo-step:not(#oo-hover-fixture)');
    const card = document.getElementById('oo-hover-fixture');
    if (card) {
      card.style.transition = 'none';
      card.scrollIntoView({ block: 'center', inline: 'nearest' });
      void card.offsetHeight;
    }
    const headings = [...document.querySelectorAll('#contacto .contact-card h4')]
      .map(el => (el.textContent || '').replace(/\s+/g, ' ').trim());
    const hero = [...document.querySelectorAll('.hero-ctas a')]
      .map(a => (a.textContent || '').replace(/\s+/g, ' ').trim());
    const stepTitles = [...document.querySelectorAll('#como-funciona .step-title')]
      .map(el => (el.textContent || '').replace(/\s+/g, ' ').trim());
    const hoverRules = [];
    const unscopedLift = [];
    const stepUnscoped = [];
    const csUnscoped = [];
    const contactUnscoped = [];
    const catUnscopedLift = [];
    const shopUnscopedLift = [];
    const shopUnscopedZoom = [];
    const catalogUnscoped = [];
    const scUnscopedLift = [];
    const hoverNoneOo = [];
    for (const sheet of document.styleSheets) {
      let list;
      try { list = [...sheet.cssRules]; } catch { continue; }
      for (const rule of list) {
        if (rule instanceof CSSMediaRule && /\(hover:\s*hover\)/.test(rule.conditionText || '')) {
          for (const inner of rule.cssRules) {
            const sel = inner.selectorText || '';
            if (sel === '.oo-step:hover') {
              hoverRules.push({
                media: rule.conditionText,
                selector: sel,
                transform: inner.style.transform,
              });
            }
          }
        }
        if (rule instanceof CSSMediaRule && /\(hover:\s*none\)/.test(rule.conditionText || '')) {
          for (const inner of rule.cssRules) {
            const sel = inner.selectorText || '';
            if (sel === '.oo-step:hover') hoverNoneOo.push(sel);
          }
        }
        if (rule instanceof CSSStyleRule) {
          const sel = rule.selectorText || '';
          if (sel === '.oo-step:hover' && /translateY/.test(rule.style.transform || '')) {
            unscopedLift.push(sel + ' ' + rule.style.transform);
          }
          if (sel === '.step-card:hover' && /translateY/.test(rule.style.transform || '')) {
            stepUnscoped.push(sel);
          }
          if (sel === '.cs-card:hover' && /translateY/.test(rule.style.transform || '')) {
            csUnscoped.push(sel);
          }
          if (sel === '.contact-card:hover' && /translateY/.test(rule.style.transform || '')) {
            contactUnscoped.push(sel);
          }
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
      unused: !live,
      found: Boolean(card),
      restTransform: card ? getComputedStyle(card).transform : '',
      headings,
      hero,
      stepTitles,
      hoverRules,
      unscopedLift: [...new Set(unscopedLift)],
      stepUnscoped,
      csUnscoped,
      contactUnscoped,
      catUnscopedLift,
      shopUnscopedLift,
      shopUnscopedZoom,
      catalogUnscoped,
      scUnscopedLift,
      hoverNoneOo,
    };
  });
  const handle = await page.evaluateHandle(() => document.getElementById('oo-hover-fixture'));
  const card = handle.asElement();
  if (card) await card.hover();
  await new Promise(r => setTimeout(r, 400));
  const hovered = await page.evaluate(() => {
    const card = document.getElementById('oo-hover-fixture');
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
  return added;
}

try {
  const coarse = await browser.newPage();
  coarse.on('pageerror', err => errors.push('390 pageerror: ' + err.message));
  await openReady(coarse, 390, 844);
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
  const phone = await measureCard(coarse);
  ok(phone.unused, '390: leftover Encomenda online markup stays unused');
  ok(phone.found, '390: leftover .oo-step fixture is present for hover-lift measurement');
  ok(
    phone.hoverRules.length === 1 &&
    phone.hoverRules[0].transform === 'translateY(-4px)',
    `390: leftover .oo-step lift lives in (hover: hover) (got ${JSON.stringify(phone.hoverRules)})`
  );
  ok(phone.unscopedLift.length === 0, `390: no unscoped leftover .oo-step lift (got ${phone.unscopedLift.join(', ')})`);
  ok(phone.hoverNoneOo.length === 0,
    `390: leftover unused online-order hover:none reset stays out (PR #148) (got ${phone.hoverNoneOo.join(', ')})`);
  ok(phone.stepUnscoped.length === 1,
    `390: leftover Como Encomendar step-card lift stays unscoped (PR #352) (got ${phone.stepUnscoped.join(', ')})`);
  ok(phone.csUnscoped.length === 1,
    `390: leftover Combina bem cs-card lift stays unscoped (PR #351) (got ${phone.csUnscoped.join(', ')})`);
  ok(phone.contactUnscoped.length === 1,
    `390: leftover Encontre-nos contact-card lift stays unscoped (PR #280) (got ${phone.contactUnscoped.join(', ')})`);
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
  ok(!isLift4(phone.hovered.transform),
    `390 hover:none should not sticky-lift leftover unused .oo-step cards (transform=${phone.hovered.transform})`);
  ok(
    phone.stepTitles.includes('Escolha os Produtos') &&
    phone.stepTitles.includes('Levante na Loja') &&
    phone.stepTitles.length === 5,
    `390: leftover Como Encomendar 5 passos stay (got ${phone.stepTitles.join(' / ')})`
  );
  ok(
    phone.headings.includes('Morada') &&
    phone.headings.includes('Telefone / WhatsApp') &&
    phone.headings.includes('Email') &&
    phone.headings.includes('Horário'),
    `390: leftover Encontre-nos cards stay (got ${phone.headings.join(' / ')})`
  );
  ok(phone.hero.some(t => /Ver Produtos/i.test(t)) && phone.hero.some(t => /Encomendar por WhatsApp/i.test(t)),
    `390: leftover hero CTAs stay (got ${phone.hero.join(' / ')})`);
  await addMelancia(coarse, '390');

  const fine = await browser.newPage();
  fine.on('pageerror', err => errors.push('1280 pageerror: ' + err.message));
  await openReady(fine, 1280, 800);
  const wide = await measureCard(fine);
  ok(wide.unused, '1280: leftover Encomenda online markup stays unused');
  ok(wide.found, '1280: leftover .oo-step fixture is present for hover-lift measurement');
  ok(
    wide.hoverRules.length === 1 &&
    wide.hoverRules[0].transform === 'translateY(-4px)',
    `1280: leftover .oo-step lift lives in (hover: hover) (got ${JSON.stringify(wide.hoverRules)})`
  );
  ok(wide.unscopedLift.length === 0, `1280: no unscoped leftover .oo-step lift (got ${wide.unscopedLift.join(', ')})`);
  ok(isIdentity(wide.restTransform), `1280 rest transform identity (got ${wide.restTransform})`);
  ok(!wide.hovered.canHover || isIdentity(wide.hovered.transform) || isLift4(wide.hovered.transform),
    `1280: if the pointer can hover, leftover 4px lift or animation fill stays (canHover=${wide.hovered.canHover}, transform=${wide.hovered.transform})`);
  ok(wide.hero.some(t => /Ver Produtos/i.test(t)) && wide.hero.some(t => /Encomendar por WhatsApp/i.test(t)),
    `1280: leftover hero CTAs stay (got ${wide.hero.join(' / ')})`);
  ok(
    wide.stepTitles.includes('Escolha os Produtos') &&
    wide.stepTitles.includes('Levante na Loja') &&
    wide.stepTitles.length === 5,
    `1280: leftover Como Encomendar 5 passos stay (got ${wide.stepTitles.join(' / ')})`
  );
  await addMelancia(fine, '1280');

  await browser.close();
  server.close();
  if (errors.length) {
    console.error('check-homepage-oo-step-hover-lift-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
    process.exit(1);
  }
  console.log('check-homepage-oo-step-hover-lift-browser: ok');
} catch (err) {
  try { await browser.close(); } catch {}
  try { server.close(); } catch {}
  console.error(err);
  process.exit(1);
}
