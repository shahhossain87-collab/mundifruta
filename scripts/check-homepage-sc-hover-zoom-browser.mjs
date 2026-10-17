#!/usr/bin/env node
/** Chrome: leftover unused .sc photos zoom only on hover-capable pointers. */
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
    if (!document.getElementById('sc-hover-fixture')) {
      const fixture = document.createElement('div');
      fixture.className = 'sc';
      fixture.id = 'sc-hover-fixture';
      const img = document.createElement('img');
      img.src = 'fotos/cabaz_mix.jpeg';
      img.alt = 'fixture leftover summer-carousel photo';
      fixture.appendChild(img);
      document.body.appendChild(fixture);
    }
  });
}

async function measureCarousel(page) {
  const rest = await page.evaluate(() => {
    const live = document.querySelector('.summer-scroll .sc, #verao .sc, .sc:not(#sc-hover-fixture)');
    const photo = document.getElementById('sc-hover-fixture');
    const img = photo ? photo.querySelector('img') : null;
    const titles = [...document.querySelectorAll('#quem-somos .section-title, .shop-feature .section-title')]
      .map(el => (el.textContent || '').replace(/\s+/g, ' ').trim());
    const hero = [...document.querySelectorAll('.hero-ctas a')]
      .map(a => (a.textContent || '').replace(/\s+/g, ' ').trim());
    const hoverRules = [];
    const unscoped = [];
    const qsUnscoped = [];
    const featuredUnscoped = [];
    const shopUnscoped = [];
    const catalogUnscoped = [];
    const tileUnscoped = [];
    const liftUnscoped = [];
    for (const sheet of document.styleSheets) {
      let list;
      try { list = [...sheet.cssRules]; } catch { continue; }
      for (const rule of list) {
        if (rule instanceof CSSMediaRule && /\(hover:\s*hover\)/.test(rule.conditionText || '')) {
          for (const inner of rule.cssRules) {
            if (/\.sc:hover/.test(inner.selectorText || '') &&
                /img/.test(inner.selectorText || '')) {
              hoverRules.push({
                media: rule.conditionText,
                selector: inner.selectorText,
                transform: inner.style.transform,
              });
            }
          }
        }
        if (rule instanceof CSSStyleRule) {
          const sel = rule.selectorText || '';
          if (/\.sc:hover/.test(sel) && /img/.test(sel)) unscoped.push(sel);
          if (/\.sc:hover/.test(sel) && !/img/.test(sel)) liftUnscoped.push(sel);
          if (/\.qs-photo:hover/.test(sel) && /img/.test(sel)) qsUnscoped.push(sel);
          if (/\.feature-photo:hover/.test(sel) && /img/.test(sel)) featuredUnscoped.push(sel);
          if (/\.product-card:hover/.test(sel) && /\.photo-wrap img/.test(sel)) shopUnscoped.push(sel);
          if (/\.seo-product-card:hover/.test(sel) && /\.seo-product-image img/.test(sel)) catalogUnscoped.push(sel);
          if (/\.cat-quick-btn:hover/.test(sel) && /img/.test(sel)) tileUnscoped.push(sel);
        }
      }
    }
    return {
      unused: !live,
      found: Boolean(photo && img),
      restTransform: img ? getComputedStyle(img).transform : '',
      titles,
      hero,
      hoverRules,
      unscoped,
      qsUnscoped,
      featuredUnscoped,
      shopUnscoped,
      catalogUnscoped,
      tileUnscoped,
      liftUnscoped,
    };
  });
  const handle = await page.evaluateHandle(() => document.getElementById('sc-hover-fixture'));
  const photo = handle.asElement();
  if (photo) await photo.hover();
  await new Promise(r => setTimeout(r, 450));
  const hovered = await page.evaluate(() => {
    const photo = document.getElementById('sc-hover-fixture');
    const img = photo ? photo.querySelector('img') : null;
    return {
      transform: img ? getComputedStyle(img).transform : '',
      canHover: window.matchMedia('(hover: hover)').matches,
      photoHovered: photo ? photo.matches(':hover') : false,
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
  const phone = await measureCarousel(coarse);
  ok(phone.unused, '390: leftover summer-carousel markup stays unused');
  ok(phone.found, '390: leftover .sc fixture is present for hover-zoom measurement');
  ok(phone.hoverRules.length === 1 && phone.hoverRules[0].transform === 'scale(1.1)',
    `390: leftover .sc zoom lives in (hover: hover) (got ${JSON.stringify(phone.hoverRules)})`);
  ok(phone.unscoped.length === 0, `390: no unscoped leftover .sc photo zoom (got ${phone.unscoped.join(', ')})`);
  ok(phone.liftUnscoped.length === 1,
    `390: leftover unused .sc card lift stays unscoped (got ${phone.liftUnscoped.join(', ')})`);
  ok(phone.qsUnscoped.length === 1,
    `390: leftover Quem Somos zoom stays unscoped (PR #275) (got ${phone.qsUnscoped.join(', ')})`);
  ok(phone.featuredUnscoped.length === 1,
    `390: leftover featured-photo zoom stays unscoped (PR #274) (got ${phone.featuredUnscoped.join(', ')})`);
  ok(phone.shopUnscoped.length === 1,
    `390: leftover shop-card zoom stays unscoped (PR #272) (got ${phone.shopUnscoped.join(', ')})`);
  ok(phone.catalogUnscoped.length === 1,
    `390: leftover catalog card zoom stays unscoped (PR #271) (got ${phone.catalogUnscoped.join(', ')})`);
  ok(phone.tileUnscoped.length >= 1,
    `390: leftover category-tile zoom stays unscoped (PR #273) (got ${phone.tileUnscoped.join(', ')})`);
  ok(isIdentity(phone.restTransform), `390 rest transform identity (got ${phone.restTransform})`);
  ok(!phone.hovered.canHover && isIdentity(phone.hovered.transform),
    `390 hover:none should not sticky-zoom leftover .sc photos (canHover=${phone.hovered.canHover}, transform=${phone.hovered.transform})`);
  ok(
    phone.titles.some(t => /Quem Somos/i.test(t)) &&
    phone.titles.some(t => /Promoções da Semana/i.test(t)) &&
    phone.titles.some(t => /Frutas Populares/i.test(t)) &&
    phone.titles.some(t => /Fruta da Época/i.test(t)) &&
    phone.titles.some(t => /Legumes Frescos/i.test(t)),
    `390: leftover Quem Somos + featured sections stay (got ${phone.titles.join(' / ')})`
  );
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
  const wide = await measureCarousel(fine);
  ok(wide.unused, '1280: leftover summer-carousel markup stays unused');
  ok(wide.found, '1280: leftover .sc fixture is present for hover-zoom measurement');
  ok(wide.hoverRules.length === 1 && wide.hoverRules[0].transform === 'scale(1.1)',
    `1280: leftover .sc zoom lives in (hover: hover) (got ${JSON.stringify(wide.hoverRules)})`);
  ok(wide.unscoped.length === 0, `1280: no unscoped leftover .sc photo zoom (got ${wide.unscoped.join(', ')})`);
  ok(isIdentity(wide.restTransform), `1280 rest transform identity (got ${wide.restTransform})`);
  ok(!wide.hovered.canHover || /matrix\(1\.1|scale\(1\.1\)/.test(wide.hovered.transform),
    `1280: if the pointer can hover, leftover 1.1 zoom stays (canHover=${wide.hovered.canHover}, transform=${wide.hovered.transform})`);
  ok(wide.hero.some(t => /Ver Produtos/i.test(t)) && wide.hero.some(t => /Encomendar por WhatsApp/i.test(t)),
    `1280: leftover hero CTAs stay (got ${wide.hero.join(' / ')})`);
  await addMelancia(fine, '1280');

  await browser.close();
  server.close();
  if (errors.length) {
    console.error('check-homepage-sc-hover-zoom-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
    process.exit(1);
  }
  console.log('check-homepage-sc-hover-zoom-browser: ok');
} catch (err) {
  try { await browser.close(); } catch {}
  try { server.close(); } catch {}
  console.error(err);
  process.exit(1);
}
