#!/usr/bin/env node
/** Static checks: leftover dialog/checkout taps + filter-drawer bar clearance. */
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

ok(html.includes('css/estilos.css?v=50'), 'index.html must cache-bust estilos.css?v=50');
ok(html.includes('js/app.js?v=36'), 'app.js cache token must stay ?v=36');
ok(html.includes('js/extras.js?v=21'), 'extras.js cache token must stay ?v=21');
ok(!html.includes('css/estilos.css?v=43'), 'must not keep the previous CSS cache token');
ok(!html.includes('css/estilos.css?v=49'), 'must not use the PR #45 CSS cache token');

const qtyBlock = css.match(/\.product-modal-qty button\s*\{[^}]+\}/g);
ok(qtyBlock && qtyBlock.length >= 2, 'missing leftover .product-modal-qty button rule');
if (qtyBlock) {
  const leftover = qtyBlock[qtyBlock.length - 1];
  ok(/min-height:\s*44px/.test(leftover), 'product-modal qty must be min-height 44px');
  ok(/min-width:\s*44px/.test(leftover), 'product-modal qty must be min-width 44px');
  ok(/flex:\s*0\s+0\s+44px/.test(leftover), 'product-modal qty must not shrink below 44px');
}

const skipBlock = css.match(/\.cs-pop-skip\s*\{[^}]+\}/g);
ok(skipBlock && skipBlock.some(b => /min-height:\s*44px/.test(b)),
  '.cs-pop-skip leftover tap must be min-height 44px');

const consentBlock = css.match(/\.consent-no,\s*\.consent-yes\s*\{[^}]+\}/);
ok(consentBlock && /min-height:\s*44px/.test(consentBlock[0]),
  'consent leftover taps must be min-height 44px');

const contBlock = css.match(/\.btn-continuar\s*\{[^}]+\}/g);
ok(contBlock && contBlock.some(b => /min-height:\s*44px/.test(b)),
  '.btn-continuar leftover tap must be min-height 44px');

const resetBlock = css.match(/\.privacy-reset\s*\{[^}]+\}/g);
ok(resetBlock && resetBlock.some(b => /min-height:\s*44px/.test(b)),
  '.privacy-reset leftover tap must be min-height 44px');

const emBlock = css.match(/\.btn-em\s*\{[^}]+\}/g);
ok(emBlock && emBlock.some(b => /min-height:\s*44px/.test(b)),
  '.btn-em leftover tap must be min-height 44px');

ok(/padding-bottom:\s*calc\(\s*28px\s*\+\s*72px/.test(css),
  'mobile drawer must pad last filters above the 4-item bar');

ok(!/\.shop-main\s+\.qty-btn/.test(css), 'must not redo PR #44 .shop-main .qty-btn');
ok(!/\.shop-main\s+\.add-btn\s*\{[^}]*min-height:\s*44px/.test(css),
  'must not redo PR #43 .shop-main .add-btn 44px');
ok(!/#cabazes\s+\.cabaz-ver/.test(css), 'must not redo PR #45 cabaz leftover taps');
ok(!/\.feature-add\s*\{[^}]*min-height:\s*44px/.test(css),
  'must not redo PR #45 .feature-add 44px');
ok(!/z-index:\s*1300/.test(css), 'must not redo PR #40 drawer z-index');
ok(!/pointer-events:\s*none/.test(css) || !/body\.filtros-open\s+\.mobile-bar/.test(css),
  'must not redo PR #40 bar pointer-events');
ok(!/@media\s*\(\s*min-width:\s*769px\s*\)[\s\S]{0,180}\.privacy-modal/.test(css),
  'must not redo PR #44 dialog dock gutter');

ok(app.includes('function toggleFiltros'), 'app.js filter drawer must remain');
ok(app.includes('function abrirProduto'), 'app.js product modal must remain');
ok(html.includes('class="cs-pop-skip"'), 'cross-sell skip control must remain');
ok(html.includes('id="consent"'), 'cookie banner must remain');
ok(dados.includes('Melancia 1/4'), 'dados.js product list must stay intact');
ok(extras.includes('function initConsent'), 'extras.js must stay untouched in this change');

if (errors.length) {
  console.error('FAIL\n' + errors.map(e => '- ' + e).join('\n'));
  process.exit(1);
}
console.log('OK static leftover dialog taps + drawer clearance');
