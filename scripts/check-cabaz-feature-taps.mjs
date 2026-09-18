#!/usr/bin/env node
/** Static checks: leftover cabaz card taps + featured ＋ size. */
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

ok(html.includes('css/estilos.css?v=49'), 'index.html must cache-bust estilos.css?v=49');
ok(html.includes('js/app.js?v=36'), 'app.js cache token must stay ?v=36');
ok(html.includes('js/extras.js?v=21'), 'extras.js cache token must stay ?v=21');
ok(!html.includes('css/estilos.css?v=43'), 'must not keep the previous CSS cache token');
ok(!html.includes('css/estilos.css?v=48'), 'must not use the PR #44 CSS cache token');

const featureBlock = css.match(/\.feature-add\s*\{[^}]+\}/);
ok(featureBlock, 'missing .feature-add rule');
if (featureBlock) {
  ok(/min-width:\s*44px/.test(featureBlock[0]), '.feature-add must be min-width 44px');
  ok(/min-height:\s*44px/.test(featureBlock[0]), '.feature-add must be min-height 44px');
  ok(/height:\s*44px/.test(featureBlock[0]), '.feature-add must be height 44px');
  ok(!/min-height:\s*34px/.test(featureBlock[0]), '.feature-add must not stay 34px');
}

const verBlock = css.match(/#cabazes\s+\.cabaz-ver\s*\{[^}]+\}/);
ok(verBlock, 'missing #cabazes .cabaz-ver leftover tap rule');
if (verBlock) {
  ok(/min-height:\s*44px/.test(verBlock[0]), '#cabazes .cabaz-ver must be min-height 44px');
}

const addBlock = css.match(/#cabazes\s+\.add-btn\s*\{[^}]+\}/);
ok(addBlock, 'missing #cabazes .add-btn leftover tap rule');
if (addBlock) {
  ok(/min-height:\s*44px/.test(addBlock[0]), '#cabazes .add-btn must be min-height 44px');
}

const qtyBlock = css.match(/#cabazes\s+\.qty-btn\s*\{[^}]+\}/);
ok(qtyBlock, 'missing #cabazes .qty-btn leftover tap rule');
if (qtyBlock) {
  ok(/min-height:\s*44px/.test(qtyBlock[0]), '#cabazes .qty-btn must be min-height 44px');
  ok(/min-width:\s*44px/.test(qtyBlock[0]), '#cabazes .qty-btn must be min-width 44px');
  ok(/flex:\s*0\s+0\s+44px/.test(qtyBlock[0]), '#cabazes .qty-btn must not shrink below 44px');
}

ok(!/\.shop-main\s+\.qty-btn/.test(css), 'must not redo PR #44 .shop-main .qty-btn');
ok(!/\.shop-main\s+\.add-btn\s*\{[^}]*min-height:\s*44px/.test(css),
  'must not redo PR #43 .shop-main .add-btn 44px');
ok(!/@media\s*\(\s*min-width:\s*769px\s*\)[\s\S]{0,180}\.privacy-modal/.test(css),
  'must not redo PR #44 dialog dock gutter');

ok(app.includes('function renderCabazes'), 'app.js cabaz renderer must remain');
ok(app.includes('class="cabaz-ver"'), 'cabaz “Ver o que leva” control must remain');
ok(app.includes('class="feature-add"'), 'featured ＋ control must remain');
ok(dados.includes('Cabaz Detox'), 'dados.js cabaz list must stay intact');
ok(dados.includes('Melancia 1/4'), 'dados.js product list must stay intact');
ok(extras.includes('function initCarousels'), 'extras.js must stay untouched in this change');

if (errors.length) {
  console.error('FAIL\n' + errors.map(e => '- ' + e).join('\n'));
  process.exit(1);
}
console.log('OK static leftover cabaz + featured tap sizes');
