#!/usr/bin/env node
/**
 * Static checks: Phase A main-column leftover taps are 44px, and
 * active-filter tags are built with DOM text (not innerHTML of the query).
 * Complementary to PRs #2–#42 (does not redo sidebar 44px, Filtros/close,
 * Tab trap, iOS 16px, or social-dock gutters).
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const css = readFileSync(join(root, 'css/estilos.css'), 'utf8');
const js = readFileSync(join(root, 'js/app.js'), 'utf8');

const checks = [];
function ok(name, pass, detail = '') {
  checks.push({ name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
}

ok(
  'active filter tags are 44px tap targets',
  /\.filter-tag \{[\s\S]*?min-height:44px;/.test(css)
);
ok(
  'catalog add buttons stay 44px on the Phase D grid',
  /\.shop-main \.product-card \.add-btn \{ margin-top:auto; min-height:44px; \}/.test(css)
  && /\.shop-main \.add-btn \{ min-height:44px;/.test(css)
);
ok(
  'catalog search-clear is a 44px control',
  /\.shop-main \.search-clear \{[\s\S]*?min-height:44px;/.test(css)
);
ok(
  'Phase A search hides the native cancel so only the 44px clear remains',
  /\.shop-main \.search-input::-webkit-search-cancel-button \{ display:none; \}/.test(css)
);
ok(
  'catalog sort select is 44px',
  /\.shop-main \.price-sort \{[\s\S]*?min-height:44px;/.test(css)
);
ok(
  'empty-results Limpar filtros is 44px',
  /\.no-results \.link-btn \{ min-height:44px;/.test(css)
);
ok(
  'search-clear is type=button',
  /id="search-clear"[^>]*type="button"/.test(html)
);
ok(
  'active filter tags are built with DOM text, not innerHTML of the query',
  js.includes("document.createElement('button')")
  && js.includes("btn.append(tag.txt, ' ')")
  && js.includes("x.textContent = '✕'")
  && !/box\.innerHTML = tags\.map/.test(js)
);
ok(
  'does not redo sidebar 44px or temas-row dock gutter (PR #42)',
  !/\.shop-sidebar \.cat-tab \{[^}]*min-height:44px;/.test(css)
  && !/\.temas-row \{\s*max-width: min\(1000px, calc\(100% - 180px\)\)/.test(css)
);
ok(
  'does not redo Filtros/close 44px, drawer z-index, or inert (PR #40)',
  !/\.filtbtn \{[^}]*min-height:44px/.test(css)
  && !/flex:0 0 44px/.test(css)
  && !css.includes('z-index:1300')
  && !js.includes('inert')
);
ok(
  'does not redo open-drawer Tab trap or Phase A 16px (PR #41)',
  !js.includes('prenderTabFiltros')
  && !js.includes('gavetaFiltrosAberta')
  && !/\.shop-main \.search-input[\s\S]{0,180}font-size:\s*16px/.test(css)
);
ok(
  'does not redo catalog/order/reviews dock gutters (PR #36/#37)',
  !/\.product-container \{\s*max-width: min\(1280px, calc\(100% - 180px\)\)/.test(css)
  && !/\.reviews-cta \{[\s\S]*width:max-content/.test(css)
);
ok(
  'does not change ticker copy, 4-item mobile bar, or contact details',
  html.includes('Entregas rápidas para Carnaxide e Oeiras')
  && (html.match(/class="mb-item"/g) || []).length === 4
  && html.includes('932 699 850')
  && html.includes('wa.me/351932699850')
);
ok(
  'cache-bust CSS and app.js; extras.js unchanged',
  html.includes('estilos.css?v=47')
  && html.includes('app.js?v=39')
  && html.includes('extras.js?v=21')
);

const failed = checks.filter(c => !c.pass);
if (failed.length) {
  console.error(`\n${failed.length} check(s) failed.`);
  process.exit(1);
}
console.log(`\n${checks.length} checks passed.`);
