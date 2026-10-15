#!/usr/bin/env node
/** Chrome: leftover homepage footer Cabazes / Promoções / Avaliações shop-links; add Melancia 1/4. */
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

async function leftoverFooterLinks(page, label) {
  const links = await page.evaluate(() => {
    return [...document.querySelectorAll('.footer-links a')].map(a => ({
      text: (a.textContent || '').replace(/\s+/g, ' ').trim(),
      href: a.getAttribute('href') || '',
    }));
  });
  const texts = links.map(l => l.text);
  ok(texts.includes('Produtos'), `${label}: leftover footer still lists Produtos`);
  ok(texts.includes('Frutas'), `${label}: leftover footer still lists Frutas`);
  ok(texts.includes('Legumes'), `${label}: leftover footer still lists Legumes`);
  ok(texts.includes('Cabazes'), `${label}: leftover footer lists leftover Cabazes`);
  ok(texts.includes('Promoções'), `${label}: leftover footer lists leftover Promoções`);
  ok(texts.includes('Quem Somos'), `${label}: leftover footer still lists Quem Somos`);
  ok(texts.includes('Avaliações'), `${label}: leftover footer lists leftover Avaliações`);
  ok(texts.includes('Encomendar'), `${label}: leftover footer still lists Encomendar`);
  ok(texts.includes('Contacto'), `${label}: leftover footer still lists Contacto`);
  ok(texts.includes('Privacidade'), `${label}: leftover footer still lists Privacidade`);
  ok(texts.includes('Créditos das fotos'), `${label}: leftover footer still lists Créditos das fotos`);
  ok(!texts.includes('Ervas frescas') && !texts.includes('Frutas da Época'),
    `${label}: leftover footer must not add leftover Ervas / Época in this run`);
  ok(links.find(l => l.text === 'Cabazes')?.href === '#cabazes', `${label}: leftover Cabazes goes to #cabazes`);
  ok(links.find(l => l.text === 'Promoções')?.href === '#promocoes', `${label}: leftover Promoções goes to #promocoes`);
  ok(links.find(l => l.text === 'Avaliações')?.href === '#avaliacoes', `${label}: leftover Avaliações goes to #avaliacoes`);
}

async function leftoverFooterJump(page, href, sectionId, label) {
  const before = await page.evaluate(() => window.scrollY);
  await page.click(`.footer-links a[href="${href}"]`);
  await page.waitForFunction(
    (id) => {
      const el = document.getElementById(id);
      if (!el) return false;
      const top = el.getBoundingClientRect().top;
      return top < window.innerHeight && top > -el.offsetHeight;
    },
    { timeout: 8000 },
    sectionId
  );
  const after = await page.evaluate((id) => {
    const el = document.getElementById(id);
    return {
      y: window.scrollY,
      visible: !!(el && el.getBoundingClientRect().top < window.innerHeight),
    };
  }, sectionId);
  ok(after.y !== before || after.visible, `${label}: leftover ${href} should move toward leftover #${sectionId}`);
  ok(after.visible, `${label}: leftover #${sectionId} should be in view after leftover ${href}`);
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
      }
    }
    return {
      foundFooterLinks, foundFooterCredit, foundBackdrop, foundCsCard, foundCabazVer,
      foundGhost, foundPrim, foundShopLink, foundFloat, foundBar, foundHomeQuick, foundCatalogAdd,
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
  await leftoverFooterLinks(desktop, '1280');
  await leftoverHomeRules(desktop, '1280');
  await leftoverFooterJump(desktop, '#cabazes', 'cabazes', '1280');
  await leftoverFooterJump(desktop, '#promocoes', 'promocoes', '1280');
  await leftoverFooterJump(desktop, '#avaliacoes', 'avaliacoes', '1280');
  await addMelancia(desktop, '1280');

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

  await leftoverFooterLinks(mobile, '390');
  await leftoverHomeRules(mobile, '390');
  await leftoverFooterJump(mobile, '#cabazes', 'cabazes', '390');
  await leftoverFooterJump(mobile, '#promocoes', 'promocoes', '390');
  await leftoverFooterJump(mobile, '#avaliacoes', 'avaliacoes', '390');
  await addMelancia(mobile, '390');

  const hamburger = await mobile.evaluate(() => {
    const btn = document.querySelector('.hamburger');
    return btn ? btn.getAttribute('aria-label') : '';
  });
  ok(hamburger === 'Menu', '390: leftover hamburger stays named Menu');

  await browser.close();
  server.close();
  if (errors.length) {
    console.error('check-footer-nav-links-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
    process.exit(1);
  }
  console.log('check-footer-nav-links-browser: ok');
} catch (err) {
  try { await browser.close(); } catch {}
  try { server.close(); } catch {}
  console.error(err);
  process.exit(1);
}
