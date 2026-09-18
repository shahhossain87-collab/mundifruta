/**
 * Headless Chrome: catalog search matches origem / peso / badge on the live DOM.
 * Requires a local server: python3 -m http.server 8765 --bind 127.0.0.1
 * Run: node scripts/check-search-browser.mjs
 */
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';

const BASE = process.env.MF_BASE || 'http://127.0.0.1:8765/';
const PORT = 9229;

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function cdp(ws, method, params = {}, sessionId) {
  const id = cdp._n = (cdp._n || 0) + 1;
  const msg = { id, method, params };
  if (sessionId) msg.sessionId = sessionId;
  const result = await new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('CDP timeout ' + method)), 15000);
    ws._pending.set(id, { resolve, reject, t });
    ws.send(JSON.stringify(msg));
  });
  if (result.error) throw new Error(`${method}: ${JSON.stringify(result.error)}`);
  return result.result;
}

async function main() {
  const chrome = spawn('google-chrome', [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--disable-dev-shm-usage',
    `--remote-debugging-port=${PORT}`,
    '--user-data-dir=/tmp/mf-chrome-search',
    'about:blank',
  ], { stdio: 'ignore' });

  let ws;
  try {
    let version;
    for (let i = 0; i < 40; i++) {
      try {
        version = await fetch(`http://127.0.0.1:${PORT}/json/version`).then(r => r.json());
        break;
      } catch {
        await sleep(100);
      }
    }
    assert(version?.webSocketDebuggerUrl, 'Chrome DevTools websocket not ready');

    ws = new WebSocket(version.webSocketDebuggerUrl);
    ws._pending = new Map();
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = () => reject(new Error('websocket error'));
    });
    ws.onmessage = ev => {
      const data = JSON.parse(ev.data);
      if (data.id && ws._pending.has(data.id)) {
        const p = ws._pending.get(data.id);
        clearTimeout(p.t);
        ws._pending.delete(data.id);
        p.resolve(data);
      }
    };

    const { targetId } = await cdp(ws, 'Target.createTarget', { url: BASE });
    const { sessionId } = await cdp(ws, 'Target.attachToTarget', { targetId, flatten: true });
    const send = (method, params) => cdp(ws, method, params, sessionId);

    await send('Page.enable');
    await send('Runtime.enable');
    await send('Page.navigate', { url: BASE });
    for (let i = 0; i < 40; i++) {
      const ready = await send('Runtime.evaluate', {
        expression: 'document.readyState',
        returnByValue: true,
      });
      if (ready.result?.value === 'complete') break;
      await sleep(150);
    }
    await sleep(700);

    const evaluate = async (expression) => {
      const { result, exceptionDetails } = await send('Runtime.evaluate', {
        expression,
        returnByValue: true,
        awaitPromise: true,
      });
      if (exceptionDetails) {
        throw new Error(exceptionDetails.text || JSON.stringify(exceptionDetails));
      }
      return result.value;
    };

    const errors = await evaluate(`window.__mfConsole || []`);
    // dismiss overlays that block typing
    await evaluate(`
      const consent = document.getElementById('consent');
      if (consent) consent.hidden = true;
      const offer = document.getElementById('offer-pop');
      if (offer) offer.hidden = true;
      document.body.style.overflow = '';
    `);

    const runQuery = async (q) => evaluate(`
      (function () {
        const input = document.getElementById('search-input');
        input.value = ${JSON.stringify(q)};
        input.dispatchEvent(new Event('input', { bubbles: true }));
        const names = [...document.querySelectorAll('.cat-section.visible .product-name')]
          .map(el => el.textContent.trim());
        const visibleCat = document.querySelector('.cat-section.visible')?.id || '';
        const frutasN = document.querySelectorAll('#grid-frutas .product-name').length;
        const legumesN = document.querySelectorAll('#grid-legumes .product-name').length;
        return { names, visibleCat, frutasN, legumesN, q: input.value };
      })()
    `);

    const bio = await runQuery('bio');
    assert(bio.names.length >= 1, 'bio shows at least one card');
    assert(bio.names.every(n => !/bio/i.test(n)), 'bio results are not name matches');
    assert(
      bio.names.some(n => /brócolos|couve-flor|limão|curgete|espinafres|pepino|tomate salada/i.test(n)),
      'bio includes a known Bio-badge product, got ' + bio.names.join(', ')
    );

    const molho = await runQuery('molho');
    assert(molho.visibleCat === 'cat-legumes', 'molho switches to legumes tab');
    assert(molho.names.length >= 1, 'molho shows cards');
    assert(
      molho.names.every(n => /agrião|coentros|espinafres|grelo|hortelã|nabiça|salsa/i.test(n)),
      'molho cards are herbs/greens sold by molho, got ' + molho.names.join(', ')
    );

    const morango = await runQuery('morango');
    assert(morango.names.includes('Morangos'), 'morango still finds Morangos');

    const cleared = await runQuery('');
    assert(cleared.names.length >= 12, 'clearing search restores a full page of fruit cards');

    const consoleErrs = await evaluate(`
      (function () {
        return (window.__mfPageErrors || []).concat(
          performance.getEntriesByType('resource')
            .filter(e => e.name.includes('app.js') && e.decodedBodySize === 0)
            .map(e => e.name)
        );
      })()
    `);
    assert(!Array.isArray(consoleErrs) || consoleErrs.length === 0, 'no page errors ' + JSON.stringify(consoleErrs));

    console.log('check-search-browser: ok');
    console.log(' - bio:', bio.names.join(', '));
    console.log(' - molho:', molho.names.join(', '));
    console.log(' - morango still works; empty query restores catalog');
  } finally {
    try { ws?.close(); } catch {}
    chrome.kill('SIGKILL');
  }
}

main().catch(err => {
  console.error('check-search-browser failed:', err.message);
  process.exit(1);
});
