#!/usr/bin/env node
/** Static checks: leftover catalog qty taps + desktop dialog dock gutter. */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const css = readFileSync(resolve(root, 'css/estilos.css'), 'utf8');
const html = readFileSync(resolve(root, 'index.html'), 'utf8');
const app = readFileSync(resolve(root, 'js/app.js'), 'utf8');
const extras = readFileSync(resolve(root, 'js/extras.js'), 'utf8');
const dados = readFileSync(resolve(root, 'js/dados.js'), 'utf8');

const errors = [];
const ok = (cond, msg) => { if (!cond) errors.push(msg); };

ok(html.includes('css/estilos.css?v=48'), 'index.html must cache-bust estilos.css?v=48');
ok(html.includes('js/app.js?v=36'), 'app.js cache token must stay ?v=36');
ok(html.includes('js/extras.js?v=21'), 'extras.js cache token must stay ?v=21');

const qtyBlock = css.match(/\.shop-main\s+\.qty-btn\s*\{[^}]+\}/);
ok(qtyBlock, 'missing .shop-main .qty-btn leftover tap rule');
if (qtyBlock) {
  ok(/min-height:\s*44px/.test(qtyBlock[0]), '.shop-main .qty-btn must be min-height 44px');
  ok(/min-width:\s*44px/.test(qtyBlock[0]), '.shop-main .qty-btn must be min-width 44px');
  ok(/flex:\s*0\s+0\s+44px/.test(qtyBlock[0]), '.shop-main .qty-btn must not shrink below 44px');
}

const dockBlock = css.match(/@media\s*\(\s*min-width:\s*769px\s*\)\s*\{[\s\S]*?\.product-modal,[\s\S]*?\.privacy-modal\s*\{[^}]*padding-right:\s*200px;[^}]*\}/);
ok(dockBlock, 'desktop dialogs must use padding-right:200px from 769px');
ok(!/@media\s*\(\s*max-width:\s*768px\s*\)[\s\S]{0,200}\.product-modal[\s\S]{0,80}padding-right:\s*200px/.test(css),
  'must not apply the dock gutter at ≤768px');

ok(!html.includes('css/estilos.css?v=47'), 'must not keep the previous CSS cache token');
ok(app.includes('function adicionarProduto'), 'app.js add-to-cart helper must remain');
ok(dados.includes('Melancia 1/4'), 'dados.js product list must stay intact');
ok(extras.includes('function initCarousels'), 'extras.js must stay untouched in this change');

const appUnchangedHint = app.includes('function renderFiltrosAtivos');
ok(appUnchangedHint, 'app.js catalog helpers must remain');

if (errors.length) {
  console.error('FAIL\n' + errors.map(e => '- ' + e).join('\n'));
  process.exit(1);
}
console.log('OK static leftover qty taps + dialog dock gutter');
