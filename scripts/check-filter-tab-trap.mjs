#!/usr/bin/env node
/**
 * Static invariants: mobile filter drawer Tab trap + 16px catalog fields.
 * Does not require the open-drawer inert/dialog/z-index work.
 */
import { readFileSync } from 'node:fs';

const app = readFileSync(new URL('../js/app.js', import.meta.url), 'utf8');
const css = readFileSync(new URL('../css/estilos.css', import.meta.url), 'utf8');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const fails = [];
const assert = (cond, msg) => { if (!cond) fails.push(msg); };

assert(app.includes('function prenderTabFiltros'), 'prenderTabFiltros helper is missing');
assert(app.includes('function gavetaFiltrosAberta'), 'gavetaFiltrosAberta helper is missing');
assert(app.includes("e.key === 'Tab'"), 'keydown listener must handle Tab');
assert(app.includes("window.matchMedia('(max-width: 900px)')"), 'Tab trap is limited to the drawer breakpoint');
assert(!/shop-sidebar[\s\S]{0,80}inert/.test(app), 'do not redo PR #40 drawer inert here');
assert(
  html.includes("onclick=\"abrirCatalogo('frutas')\">Explorar fruta"),
  'do not redo the Época featured CTA here'
);

assert(
  /@media \(max-width:768px\) \{[\s\S]*?\.shop-main \.search-input,[\s\S]*?\.shop-main \.price-sort,[\s\S]*?\.shop-sidebar \.filter-select[\s\S]*?font-size:16px/.test(css),
  'Phase A search/sort/filter-select must be 16px under 768px'
);
assert(html.includes('estilos.css?v=45'), 'CSS cache query should be v=45');
assert(html.includes('app.js?v=38'), 'JS cache query should be v=38');

if (fails.length) {
  console.error(fails.map(f => `FAIL: ${f}`).join('\n'));
  process.exit(1);
}
console.log('ok: filter tab trap + 16px catalog fields');
