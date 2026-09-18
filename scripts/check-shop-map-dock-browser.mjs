#!/usr/bin/env node
/**
 * Headless Chrome: shop CTAs / map zoom must not sit under the desktop social dock;
 * mobile cart tab keeps “Carrinho” in its accessible name after add-to-cart.
 */
import { createServer } from 'node:http';
import { readFileSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
};

const server = createServer((req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1');
  const file = url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname).replace(/^\/+/, '');
  const path = join(root, file);
  if (!path.startsWith(root + '/') && path !== root) { res.writeHead(403); res.end(); return; }
  try {
    const body = readFileSync(path);
    res.writeHead(200, { 'content-type': mime[extname(path)] || 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404); res.end('not found');
  }
});

await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const port = server.address().port;
const origin = `http://127.0.0.1:${port}/`;

const userData = join(tmpdir(), `mf-shop-dock-${process.pid}`);
mkdirSync(userData, { recursive: true });
const chrome = spawn('google-chrome-stable', [
  '--headless=new',
  '--disable-gpu',
  '--no-sandbox',
  '--disable-dev-shm-usage',
  `--user-data-dir=${userData}`,
  '--remote-debugging-port=0',
  'about:blank',
], { stdio: ['ignore', 'ignore', 'pipe'] });

let stderr = '';
const debugPort = await new Promise((resolve, reject) => {
  const t = setTimeout(() => reject(new Error(`chrome debug port timeout\n${stderr}`)), 15000);
  chrome.stderr.on('data', chunk => {
    stderr += chunk.toString();
    const m = stderr.match(/DevTools listening on ws:\/\/127\.0\.0\.1:(\d+)/);
    if (m) { clearTimeout(t); resolve(m[1]); }
  });
  chrome.on('error', err => { clearTimeout(t); reject(err); });
});

function connect(wsUrl) {
  const ws = new WebSocket(wsUrl);
  let id = 0;
  const pending = new Map();
  const waiters = new Map();
  ws.addEventListener('message', ev => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(JSON.stringify(msg.error)));
      else resolve(msg.result);
    } else if (msg.method && waiters.has(msg.method)) {
      const list = waiters.get(msg.method);
      waiters.delete(msg.method);
      list.forEach(resolve => resolve(msg.params));
    }
  });
  const ready = new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve);
    ws.addEventListener('error', reject);
  });
  async function send(method, params = {}) {
    await ready;
    const msgId = ++id;
    const result = new Promise((resolve, reject) => pending.set(msgId, { resolve, reject }));
    ws.send(JSON.stringify({ id: msgId, method, params }));
    return result;
  }
  async function once(method) {
    await ready;
    return new Promise(resolve => {
      const list = waiters.get(method) || [];
      list.push(resolve);
      waiters.set(method, list);
    });
  }
  return { send, once, close: () => ws.close() };
}

async function openPage(width, height) {
  const list = await fetch(`http://127.0.0.1:${debugPort}/json/list`).then(r => r.json());
  const target = list.find(t => t.type === 'page') || list[0];
  if (!target?.webSocketDebuggerUrl) throw new Error(`no page target: ${JSON.stringify(list)}`);
  const cdp = connect(target.webSocketDebuggerUrl);
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width, height, deviceScaleFactor: 1, mobile: width < 800,
  });
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Page.addScriptToEvaluateOnNewDocument', {
    source: `try {
      localStorage.setItem('mf_consent', 'essential');
      localStorage.setItem('mf_coupon', JSON.stringify({ code: 'TEST', status: 'dismissed', issuedAt: Date.now() }));
    } catch (e) {}`,
  });
  const loaded = cdp.once('Page.loadEventFired');
  await cdp.send('Page.navigate', { url: origin });
  await Promise.race([loaded, new Promise(r => setTimeout(r, 8000))]);
  await new Promise(r => setTimeout(r, 500));
  await cdp.send('Runtime.evaluate', {
    expression: `(() => {
      const hide = id => { const el = document.getElementById(id); if (el) { el.hidden = true; el.style.display = 'none'; } };
      hide('consent'); hide('offer-pop');
      document.body.style.overflow = '';
      document.documentElement.style.scrollBehavior = 'auto';
    })()`,
    returnByValue: true,
  });
  return cdp;
}

function overlaps(a, b) {
  return a && b
    && a.right > b.left + 1
    && a.left < b.right - 1
    && a.bottom > b.top + 1
    && a.top < b.bottom - 1;
}

async function measureDesktop() {
  const cdp = await openPage(1280, 800);
  await cdp.send('Runtime.evaluate', {
    expression: `(() => {
      const el = document.getElementById('promocoes');
      if (el) el.scrollIntoView({ block: 'start', behavior: 'instant' });
    })()`,
    returnByValue: true,
  });
  await new Promise(r => setTimeout(r, 200));
  const promo = await cdp.send('Runtime.evaluate', {
    expression: `(() => {
      const box = r => r && { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width };
      const dock = document.querySelector('.social-panel');
      const shopLink = document.querySelector('#promocoes .shop-link');
      const next = document.querySelector('#promocoes .carousel-nav.next');
      const wrap = document.querySelector('#promocoes .carousel-wrap');
      return {
        dockDisplay: dock ? getComputedStyle(dock).display : 'missing',
        dock: box(dock?.getBoundingClientRect()),
        shopLink: box(shopLink?.getBoundingClientRect()),
        shopText: shopLink?.textContent.trim() || null,
        next: box(next?.getBoundingClientRect()),
        wrapMarginRight: wrap ? getComputedStyle(wrap).marginRight : null,
        headMarginRight: getComputedStyle(document.querySelector('#promocoes .shop-feature-head')).marginRight,
      };
    })()`,
    returnByValue: true,
  });
  await cdp.send('Runtime.evaluate', {
    expression: `(() => {
      const el = document.getElementById('contacto');
      if (el) el.scrollIntoView({ block: 'start', behavior: 'instant' });
    })()`,
    returnByValue: true,
  });
  await new Promise(r => setTimeout(r, 250));
  const contact = await cdp.send('Runtime.evaluate', {
    expression: `(() => {
      const box = r => r && { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width };
      const dock = document.querySelector('.social-panel');
      const map = document.querySelector('.map-wrap');
      const iframe = document.querySelector('.map-wrap iframe');
      return {
        dock: box(dock?.getBoundingClientRect()),
        map: box(map?.getBoundingClientRect()),
        iframe: box(iframe?.getBoundingClientRect()),
        mapMarginRight: map ? getComputedStyle(map).marginRight : null,
        mapTitle: iframe?.getAttribute('title') || null,
      };
    })()`,
    returnByValue: true,
  });
  const shot = await cdp.send('Page.captureScreenshot', { format: 'png' });
  const shotPath = join(tmpdir(), `mf-shop-dock-1280.png`);
  writeFileSync(shotPath, Buffer.from(shot.data, 'base64'));
  cdp.close();
  return { promo: promo.result.value, contact: contact.result.value, shotPath };
}

async function measureMobileCart() {
  const cdp = await openPage(390, 844);
  const before = await cdp.send('Runtime.evaluate', {
    expression: `(() => {
      const btn = document.getElementById('mb-cart');
      return {
        dockDisplay: getComputedStyle(document.querySelector('.social-panel')).display,
        mapMarginRight: getComputedStyle(document.querySelector('.map-wrap')).marginRight,
        headMarginRight: getComputedStyle(document.querySelector('.shop-feature-head')).marginRight,
        label: document.getElementById('mb-cart-label')?.textContent.trim() || null,
        name: btn?.getAttribute('aria-label') || null,
      };
    })()`,
    returnByValue: true,
  });
  const added = await cdp.send('Runtime.evaluate', {
    expression: `(() => {
      const hide = id => { const el = document.getElementById(id); if (el) el.hidden = true; };
      hide('consent'); hide('offer-pop');
      const input = document.getElementById('search-input');
      if (input) input.value = 'Melancia';
      if (typeof pesquisar === 'function') pesquisar();
      const btn = [...document.querySelectorAll('.add-btn')].find(b => !b.disabled);
      if (btn) btn.click();
      const cart = document.getElementById('mb-cart');
      return {
        badge: document.getElementById('cart-count')?.textContent.trim() || null,
        product: document.querySelector('.product-name')?.textContent.trim() || null,
        visibleLabel: document.getElementById('mb-cart-label')?.textContent.trim() || null,
        name: cart?.getAttribute('aria-label') || null,
        floatName: document.getElementById('float-cart')?.getAttribute('aria-label') || null,
      };
    })()`,
    returnByValue: true,
  });
  const shot = await cdp.send('Page.captureScreenshot', { format: 'png' });
  const shotPath = join(tmpdir(), `mf-shop-dock-390.png`);
  writeFileSync(shotPath, Buffer.from(shot.data, 'base64'));
  cdp.close();
  return { before: before.result.value, added: added.result.value, shotPath };
}

const checks = [];
function ok(name, pass, detail = '') {
  checks.push({ name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
}

try {
  const desktop = await measureDesktop();
  const mobile = await measureMobileCart();
  const { promo, contact } = desktop;

  ok('desktop dock is visible', promo.dockDisplay !== 'none', promo.dockDisplay);
  ok('desktop shop-link copy is unchanged', promo.shopText === 'Ver catálogo completo →', promo.shopText);
  ok('desktop shop head has 180px margin-right', promo.headMarginRight === '180px', promo.headMarginRight);
  ok('desktop carousel wrap has 180px margin-right', promo.wrapMarginRight === '180px', promo.wrapMarginRight);
  ok(
    'Ver catálogo completo does not overlap the dock',
    !overlaps(promo.shopLink, promo.dock),
    JSON.stringify({ shopLink: promo.shopLink, dock: promo.dock }).slice(0, 280)
  );
  const shopGap = promo.dock && promo.shopLink ? promo.dock.left - promo.shopLink.right : null;
  ok('shop-link sits left of the dock', shopGap != null && shopGap >= 8, `gap=${shopGap}`);
  ok(
    'carousel next does not overlap the dock',
    !promo.next || !overlaps(promo.next, promo.dock),
    JSON.stringify({ next: promo.next, dock: promo.dock }).slice(0, 280)
  );
  ok('desktop map has 180px margin-right', contact.mapMarginRight === '180px', contact.mapMarginRight);
  ok('map iframe title is unchanged', contact.mapTitle === 'Localização MUNDIFRUTA', contact.mapTitle);
  ok(
    'map iframe does not overlap the dock',
    !overlaps(contact.iframe, contact.dock),
    JSON.stringify({ iframe: contact.iframe, dock: contact.dock }).slice(0, 280)
  );
  const mapGap = contact.dock && contact.iframe ? contact.dock.left - contact.iframe.right : null;
  ok('map sits left of the dock', mapGap != null && mapGap >= 8, `gap=${mapGap}`);

  ok('mobile dock is hidden', mobile.before.dockDisplay === 'none', mobile.before.dockDisplay);
  ok('mobile map has no extra gutter', mobile.before.mapMarginRight === '0px', mobile.before.mapMarginRight);
  ok('empty mobile cart is named Carrinho', mobile.before.name === 'Carrinho', mobile.before.name);
  ok(
    'add Melancia 1/4 updates the cart badge',
    mobile.added.badge === '1' && /Melancia/i.test(mobile.added.product || ''),
    JSON.stringify(mobile.added)
  );
  ok(
    'filled mobile cart name still includes Carrinho',
    /^Carrinho: 1 artigo, /.test(mobile.added.name || ''),
    mobile.added.name
  );
  ok(
    'floating cart name describes the order',
    /Ver a sua encomenda/.test(mobile.added.floatName || ''),
    mobile.added.floatName
  );

  console.log(`desktop shot: ${desktop.shotPath}`);
  console.log(`mobile shot: ${mobile.shotPath}`);

  const failed = checks.filter(c => !c.pass);
  if (failed.length) {
    console.error(`\n${failed.length} browser check(s) failed.`);
    process.exitCode = 1;
  } else {
    console.log(`\nAll ${checks.length} browser checks passed.`);
  }
} finally {
  chrome.kill('SIGTERM');
  server.close();
  setTimeout(() => {
    try { rmSync(userData, { recursive: true, force: true }); } catch {}
  }, 500);
}
