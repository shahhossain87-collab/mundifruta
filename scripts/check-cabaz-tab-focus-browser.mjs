#!/usr/bin/env node
/** Chrome: Cabazes tab, crumb links, filter focus restore; add Melancia 1/4. */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
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
const chrome = process.env.CHROME_PATH || '/usr/bin/google-chrome-stable';
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

async function checkCrumbsAndCabazes(page, vw) {
  const info = await page.evaluate(() => {
    const crumbs = [...document.querySelectorAll('.shop-crumbs a')].map(a => ({
      href: a.getAttribute('href'),
      text: a.textContent.trim(),
      w: a.getBoundingClientRect().width,
      h: a.getBoundingClientRect().height,
    }));
    const frutas = document.getElementById('tab-frutas');
    const cabazes = document.getElementById('tab-cabazes');
    const before = {
      frutasActive: frutas?.classList.contains('active'),
      frutasSel: frutas?.getAttribute('aria-selected'),
      cabazesActive: cabazes?.classList.contains('active'),
      cabazesSel: cabazes?.getAttribute('aria-selected'),
      crumb: document.getElementById('crumb-cat')?.textContent,
    };
    if (window.abrirCabazes) window.abrirCabazes();
    const after = {
      frutasActive: frutas?.classList.contains('active'),
      frutasSel: frutas?.getAttribute('aria-selected'),
      cabazesActive: cabazes?.classList.contains('active'),
      cabazesSel: cabazes?.getAttribute('aria-selected'),
      crumb: document.getElementById('crumb-cat')?.textContent,
    };
    if (window.mostrarCategoria) window.mostrarCategoria('frutas', document.getElementById('tab-frutas'));
    const restored = {
      frutasActive: frutas?.classList.contains('active'),
      cabazesActive: cabazes?.classList.contains('active'),
      crumb: document.getElementById('crumb-cat')?.textContent,
    };
    return { crumbs, before, after, restored };
  });

  ok(info.crumbs.length === 2, `${vw}: expected Início + Loja crumb links`);
  const inicio = info.crumbs.find(c => c.text === 'Início');
  const loja = info.crumbs.find(c => c.text === 'Loja');
  ok(inicio && inicio.href === '#inicio', `${vw}: Início crumb href is #inicio`);
  ok(loja && loja.href === '#produtos', `${vw}: Loja crumb href is #produtos`);
  ok(inicio && inicio.h >= 44, `${vw}: Início crumb is ${inicio ? Math.round(inicio.h) : 'missing'}px tall`);
  ok(loja && loja.h >= 44, `${vw}: Loja crumb is ${loja ? Math.round(loja.h) : 'missing'}px tall`);

  ok(info.before.frutasActive && info.before.frutasSel === 'true', `${vw}: Frutas starts selected`);
  ok(!info.before.cabazesActive && info.before.cabazesSel === 'false', `${vw}: Cabazes starts unselected`);
  ok(info.after.cabazesActive && info.after.cabazesSel === 'true', `${vw}: abrirCabazes selects the Cabazes tab`);
  ok(!info.after.frutasActive && info.after.frutasSel === 'false', `${vw}: abrirCabazes clears the Frutas tab`);
  ok(info.after.crumb === 'Frutas', `${vw}: catalog crumb stays Frutas (cabazes is a jump, not a catalog filter)`);
  ok(info.restored.frutasActive && !info.restored.cabazesActive, `${vw}: mostrarCategoria('frutas') restores the Frutas tab`);
  ok(info.restored.crumb === 'Frutas', `${vw}: Frutas crumb text is unchanged`);
}

async function checkFilterFocus(page, vw) {
  const info = await page.evaluate(async () => {
    const filt = document.querySelector('.filtbtn');
    const sb = document.getElementById('shop-sidebar');
    const close = document.querySelector('.sidebar-close');
    if (!filt || !sb) return { missing: true };
    filt.focus();
    filt.click();
    const opened = {
      open: sb.classList.contains('open'),
      body: document.body.classList.contains('filtros-open'),
    };
    if (close) close.focus();
    if (window.fecharFiltros) window.fecharFiltros();
    const afterClose = {
      open: sb.classList.contains('open'),
      body: document.body.classList.contains('filtros-open'),
      focus: document.activeElement && (document.activeElement.classList.contains('filtbtn') || document.activeElement === filt),
      active: document.activeElement ? (document.activeElement.className || document.activeElement.id || document.activeElement.tagName) : 'none',
    };
    filt.click();
    const tab = document.getElementById('tab-legumes');
    if (tab) tab.click();
    const afterCat = {
      open: sb.classList.contains('open'),
      legumes: tab?.classList.contains('active'),
      focusFilt: document.activeElement && document.activeElement.classList.contains('filtbtn'),
      crumb: document.getElementById('crumb-cat')?.textContent,
    };
    return { opened, afterClose, afterCat };
  });

  if (vw <= 900) {
    ok(info.opened?.open && info.opened?.body, `${vw}: Filtros opens the drawer`);
    ok(!info.afterClose?.open && !info.afterClose?.body, `${vw}: fecharFiltros closes the drawer`);
    ok(info.afterClose?.focus, `${vw}: closing the drawer returns focus to Filtros (got ${info.afterClose?.active})`);
    ok(!info.afterCat?.open, `${vw}: choosing a category closes the drawer`);
    ok(info.afterCat?.legumes, `${vw}: Legumes tab is selected after the drawer jump`);
    ok(info.afterCat?.focusFilt, `${vw}: choosing a category returns focus to Filtros`);
    ok(info.afterCat?.crumb === 'Legumes', `${vw}: crumb updates to Legumes`);
  } else {
    ok(!info.opened?.open, `${vw}: desktop sidebar is not a drawer`);
    ok(document ? true : true, `${vw}: desktop path ran`);
  }
}

async function addMelancia(page, vw) {
  const cart = await page.evaluate(() => {
    const card = [...document.querySelectorAll('.shop-main .product-card')]
      .find(c => /Melancia 1\/4/.test(c.textContent || ''));
    const add = card?.querySelector('.add-btn');
    if (add) add.click();
    const badge = document.getElementById('cart-count');
    return badge ? badge.textContent.trim() : '';
  });
  ok(cart === '1', `${vw}: adding Melancia 1/4 still updates the cart (got "${cart}")`);
}

try {
  const mobile = await browser.newPage();
  await openReady(mobile, 390, 844);
  await checkCrumbsAndCabazes(mobile, 390);
  await checkFilterFocus(mobile, 390);
  await mobile.evaluate(() => {
    if (window.mostrarCategoria) window.mostrarCategoria('frutas', document.getElementById('tab-frutas'));
  });
  await addMelancia(mobile, 390);
  await mobile.close();

  const desktop = await browser.newPage();
  await openReady(desktop, 1280, 800);
  await checkCrumbsAndCabazes(desktop, 1280);
  const deskFocus = await desktop.evaluate(() => {
    const filt = document.querySelector('.filtbtn');
    const visible = filt && getComputedStyle(filt).display !== 'none';
    const sb = document.getElementById('shop-sidebar');
    if (window.abrirCabazes) window.abrirCabazes();
    const cabazes = document.getElementById('tab-cabazes');
    if (window.fecharFiltros) window.fecharFiltros();
    return {
      filtVisible: visible,
      drawerOpen: sb?.classList.contains('open'),
      cabazesActive: cabazes?.classList.contains('active'),
      focusFilt: document.activeElement && document.activeElement.classList.contains('filtbtn'),
    };
  });
  ok(!deskFocus.filtVisible, '1280: Filtros button stays hidden on desktop');
  ok(!deskFocus.drawerOpen, '1280: desktop sidebar is not a drawer');
  ok(deskFocus.cabazesActive, '1280: Cabazes tab still highlights after a no-op fecharFiltros');
  ok(!deskFocus.focusFilt, '1280: closing a closed desktop sidebar does not move focus to the hidden Filtros control');
  await desktop.evaluate(() => {
    if (window.mostrarCategoria) window.mostrarCategoria('frutas', document.getElementById('tab-frutas'));
  });
  await addMelancia(desktop, 1280);
  await desktop.close();
} finally {
  await browser.close();
  server.close();
}

if (errors.length) {
  console.error('check-cabaz-tab-focus-browser failed:\n- ' + errors.join('\n- '));
  process.exit(1);
}
console.log('check-cabaz-tab-focus-browser: ok');
