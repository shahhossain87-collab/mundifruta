#!/usr/bin/env node
/**
 * Headless Chrome: footer links must not sit under the desktop social dock.
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
  const file = url.pathname === '/' ? '/index.html' : decodeURIComponent(url.pathname);
  const path = join(root, file);
  if (!path.startsWith(root)) { res.writeHead(403); res.end(); return; }
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

const userData = join(tmpdir(), `mf-footer-dock-${process.pid}`);
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

async function measure(width, height) {
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
  await new Promise(r => setTimeout(r, 400));
  await cdp.send('Runtime.evaluate', {
    expression: `(() => {
      const hide = id => { const el = document.getElementById(id); if (el) { el.hidden = true; el.style.display = 'none'; } };
      hide('consent'); hide('offer-pop');
      document.documentElement.style.scrollBehavior = 'auto';
      const footer = document.querySelector('footer');
      if (footer) footer.scrollIntoView({ block: 'end', behavior: 'instant' });
      hide('consent'); hide('offer-pop');
      document.body.style.overflow = '';
    })()`,
    returnByValue: true,
  });
  await new Promise(r => setTimeout(r, 200));
  const evaled = await cdp.send('Runtime.evaluate', {
    expression: `(() => {
      const footer = document.querySelector('footer');
      const linksBox = document.querySelector('.footer-links');
      const links = [...document.querySelectorAll('.footer-links a')].map(a => {
        const r = a.getBoundingClientRect();
        return { text: a.textContent.trim(), left: r.left, right: r.right, top: r.top, bottom: r.bottom };
      });
      const dock = document.querySelector('.social-panel');
      const dockCs = dock ? getComputedStyle(dock) : null;
      const dockRect = dock ? dock.getBoundingClientRect() : null;
      const privacy = links.find(l => l.text === 'Privacidade');
      const footerRect = footer ? footer.getBoundingClientRect() : null;
      return {
        dockDisplay: dockCs?.display || 'missing',
        dock: dockRect && { left: dockRect.left, right: dockRect.right, top: dockRect.top, bottom: dockRect.bottom, width: dockRect.width },
        privacy,
        links,
        footerInView: !!(footerRect && footerRect.bottom > 0 && footerRect.top < window.innerHeight),
        linksMarginRight: linksBox ? getComputedStyle(linksBox).marginRight : null,
        footerPadRight: footer ? getComputedStyle(footer).paddingRight : null,
        footerZ: footer ? getComputedStyle(footer).zIndex : null,
        landmark: dock?.getAttribute('aria-label') || null,
        tag: dock?.tagName || null,
        consentHidden: !!document.getElementById('consent')?.hidden,
        offerHidden: !!document.getElementById('offer-pop')?.hidden,
      };
    })()`,
    returnByValue: true,
  });
  const shot = await cdp.send('Page.captureScreenshot', { format: 'png' });
  const shotPath = join(tmpdir(), `mf-footer-dock-${width}.png`);
  writeFileSync(shotPath, Buffer.from(shot.data, 'base64'));
  cdp.close();
  return { ...evaled.result.value, shotPath };
}

async function shopSmoke() {
  const list = await fetch(`http://127.0.0.1:${debugPort}/json/list`).then(r => r.json());
  const target = list.find(t => t.type === 'page') || list[0];
  const cdp = connect(target.webSocketDebuggerUrl);
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 1280, height: 800, deviceScaleFactor: 1, mobile: false,
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
  const evaled = await cdp.send('Runtime.evaluate', {
    expression: `(() => {
      const hide = id => { const el = document.getElementById(id); if (el) el.hidden = true; };
      hide('consent'); hide('offer-pop');
      const input = document.getElementById('search-input');
      if (input) { input.value = 'Melancia'; }
      if (typeof pesquisar === 'function') pesquisar();
      const btn = [...document.querySelectorAll('.add-btn')].find(b => !b.disabled);
      if (btn) btn.click();
      const badge = document.getElementById('cart-count');
      const name = document.querySelector('.product-name');
      return {
        added: badge ? badge.textContent.trim() : null,
        product: name ? name.textContent.trim() : null,
      };
    })()`,
    returnByValue: true,
  });
  cdp.close();
  return evaled.result.value;
}

const checks = [];
function ok(name, pass, detail = '') {
  checks.push({ name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
}

try {
  const desktop = await measure(1280, 800);
  const mobile = await measure(390, 844);
  const cart = await shopSmoke();

  ok('desktop dock is visible', desktop.dockDisplay !== 'none', desktop.dockDisplay);
  ok('desktop dock is a NAV landmark', desktop.tag === 'NAV' && desktop.landmark === 'Contactos rápidos', `${desktop.tag} ${desktop.landmark}`);
  ok('desktop footer is in the viewport', desktop.footerInView === true);
  ok('desktop welcome overlays are dismissed', desktop.consentHidden && desktop.offerHidden);
  ok('desktop footer links have 180px margin-right', desktop.linksMarginRight === '180px', desktop.linksMarginRight);
  ok('desktop footer z-index is above the dock', desktop.footerZ === '901', desktop.footerZ);
  const gap = desktop.dock && desktop.privacy ? desktop.dock.left - desktop.privacy.right : null;
  ok(
    'Privacidade sits left of the dock with a gap',
    gap != null && gap >= 8,
    `privacy.right=${desktop.privacy?.right} dock.left=${desktop.dock?.left} gap=${gap}`
  );
  const overlap = desktop.links.some(l =>
    desktop.dock
    && l.right > desktop.dock.left + 1
    && l.left < desktop.dock.right - 1
    && l.bottom > desktop.dock.top + 1
    && l.top < desktop.dock.bottom - 1
  );
  ok('no footer link rectangle overlaps the dock', !overlap, JSON.stringify({
    links: desktop.links, dock: desktop.dock,
  }).slice(0, 400));
  ok('mobile dock is hidden', mobile.dockDisplay === 'none', mobile.dockDisplay);
  ok('mobile footer links have no extra gutter', mobile.linksMarginRight === '0px', mobile.linksMarginRight);
  ok('mobile footer keeps 24px side padding', mobile.footerPadRight === '24px', mobile.footerPadRight);
  ok('add Melancia 1/4 updates the cart badge', cart.added === '1' && /Melancia/i.test(cart.product || ''), JSON.stringify(cart));
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
