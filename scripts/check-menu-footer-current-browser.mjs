#!/usr/bin/env node
/** Chrome: leftover mobile-menu / footer current-page markers; add Melancia 1/4. */
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

async function leftoverMenuFooter(page, label) {
  const data = await page.evaluate(async () => {
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

    const card = [...document.querySelectorAll('.shop-main .product-card')]
      .find(c => /Melancia 1\/4/i.test(c.textContent || ''));
    const add = card && card.querySelector('.add-btn');
    if (add) add.click();
    const cs = document.getElementById('cs-pop');
    if (cs) cs.hidden = true;

    const snapshot = () => ({
      menu: [...document.querySelectorAll('#mobile-menu a')].map(a => ({
        href: a.getAttribute('href') || '',
        current: a.getAttribute('aria-current') || '',
        text: (a.textContent || '').trim(),
      })),
      footer: [...document.querySelectorAll('.footer-links a')].map(a => ({
        href: a.getAttribute('href') || '',
        current: a.getAttribute('aria-current') || '',
        text: (a.textContent || '').trim(),
      })),
      header: [...document.querySelectorAll('.nav-links a')].map(a => ({
        href: a.getAttribute('href') || '',
        current: a.getAttribute('aria-current') || '',
        active: a.classList.contains('active'),
      })),
    });

    const jump = async (id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const top = el.getBoundingClientRect().top + window.scrollY - (window.innerHeight * 0.40);
      window.scrollTo({ top: Math.max(0, top), behavior: 'auto' });
      const href = '#' + id;
      for (let i = 0; i < 24; i++) {
        await new Promise(r => requestAnimationFrame(r));
        const menuHit = [...document.querySelectorAll(`#mobile-menu a[href="${href}"]`)]
          .some(a => a.getAttribute('aria-current') === 'page');
        const footerHit = [...document.querySelectorAll(`.footer-links a[href="${href}"]`)]
          .some(a => a.getAttribute('aria-current') === 'page');
        const hasTarget = document.querySelector(`#mobile-menu a[href="${href}"], .footer-links a[href="${href}"]`);
        if ((hasTarget && (menuHit || footerHit)) || (!hasTarget && i > 8)) return;
        await new Promise(r => setTimeout(r, 50));
      }
    };

    const watched = ['produtos', 'cabazes', 'avaliacoes', 'contacto'];
    const reports = [];
    for (const id of watched) {
      await jump(id);
      reports.push({ id, snap: snapshot() });
    }

    const marked = (list, href) => list.filter(l => l.href === href && l.current === 'page');
    const others = (list, href) => list.filter(l => l.href !== href && l.current === 'page');
    const ecoOk = reports.every(r => {
      const href = '#' + r.id;
      const menuMarks = marked(r.snap.menu, href);
      const footerMarks = marked(r.snap.footer, href);
      const menuOthers = others(r.snap.menu, href);
      const footerOthers = others(r.snap.footer, href);
      const hasMenu = r.snap.menu.some(l => l.href === href);
      const hasFooter = r.snap.footer.some(l => l.href === href);
      return menuOthers.length === 0 &&
        footerOthers.length === 0 &&
        (!hasMenu || menuMarks.length === 1) &&
        (!hasFooter || footerMarks.length === 1);
    });
    const sawCurrent = reports.some(r =>
      r.snap.menu.some(l => l.current === 'page') ||
      r.snap.footer.some(l => l.current === 'page')
    );
    const headerCurrent = reports.some(r => r.snap.header.some(l => l.current === 'page'));
    const promocoesCurrent = reports.some(r =>
      r.snap.menu.some(l => l.href === '#promocoes' && l.current === 'page') ||
      r.snap.footer.some(l => l.href === '#promocoes' && l.current === 'page')
    );
    const quemSomosCurrent = reports.some(r =>
      r.snap.menu.some(l => l.href === '#quem-somos' && l.current === 'page') ||
      r.snap.footer.some(l => l.href === '#quem-somos' && l.current === 'page')
    );
    const ham = document.querySelector('.hamburger');
    const crumb = document.getElementById('crumb-cat');
    const featured = document.querySelector('.feature-add');
    const modalAdd = document.getElementById('product-modal-add');

    return {
      morango,
      tomate,
      count: document.getElementById('cart-count')?.textContent || '',
      reports,
      ecoOk,
      sawCurrent,
      headerCurrent,
      promocoesCurrent,
      quemSomosCurrent,
      hamExpanded: ham ? ham.getAttribute('aria-expanded') : 'missing',
      crumbCurrent: crumb ? crumb.getAttribute('aria-current') : 'missing',
      featuredText: featured ? (featured.textContent || '').trim() : '',
      featuredHidden: featured ? featured.querySelector('[aria-hidden="true"]') : null,
      modalText: modalAdd ? (modalAdd.textContent || '').trim() : '',
      inicioLink: !!document.querySelector('.shop-crumbs a[href="#inicio"]'),
    };
  });

  ok(data.morango, `${label}: leftover search morango still finds a card`);
  ok(data.tomate, `${label}: leftover search tomate still finds a card`);
  ok(Number(data.count) >= 1, `${label}: add Melancia 1/4 (count=${data.count})`);
  ok(
    data.ecoOk && data.sawCurrent,
    `${label}: leftover mobile-menu / footer mark the leftover watched section (got=${JSON.stringify(data.reports)})`
  );
  ok(
    !data.headerCurrent,
    `${label}: leftover header spy current stays for PR #92`
  );
  ok(
    !data.promocoesCurrent && !data.quemSomosCurrent,
    `${label}: leftover Promoções / Quem Somos stay unwatched (PR #5)`
  );
  ok(!data.inicioLink, `${label}: leftover Início crumb stays unlinked (PR #47)`);
  ok(
    data.crumbCurrent === null,
    `${label}: leftover crumb location stays for PR #92`
  );
  ok(
    data.featuredText === '＋' && !data.featuredHidden,
    `${label}: leftover featured plus-only add stays unwrapped`
  );
  ok(
    data.modalText === '＋',
    `${label}: leftover product-modal plus-only add stays unwrapped`
  );
  ok(
    data.hamExpanded === null,
    `${label}: leftover hamburger stays without expanded`
  );
}

try {
  const desktop = await browser.newPage();
  desktop.on('pageerror', err => errors.push('1280 pageerror: ' + err.message));
  await openReady(desktop, 1280, 800);
  await leftoverMenuFooter(desktop, '1280');

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

  await leftoverMenuFooter(mobile, '390');

  await browser.close();
  server.close();
  if (errors.length) {
    console.error('check-menu-footer-current-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
    process.exit(1);
  }
  console.log('check-menu-footer-current-browser: ok');
} catch (err) {
  try { await browser.close(); } catch {}
  try { server.close(); } catch {}
  console.error(err);
  process.exit(1);
}
