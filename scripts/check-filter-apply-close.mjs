#!/usr/bin/env node
/** Static: Phase A leftover filter apply closes the mobile drawer. */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const html = readFileSync(resolve(root, 'index.html'), 'utf8');
const js = readFileSync(resolve(root, 'js/app.js'), 'utf8');

const errors = [];
const assert = (cond, msg) => { if (!cond) errors.push(msg); };

assert(
  /function selecionarSubcat\(key\) \{[\s\S]*?fecharFiltros\(\);/.test(js),
  'selecionarSubcat closes the filter drawer after applying a subcategory'
);
assert(
  /function alternarFiltro\(tipo, btn\) \{[\s\S]*?fecharFiltros\(\);/.test(js),
  'alternarFiltro closes the filter drawer after a promo/available chip'
);
assert(
  /function aplicarFiltroPreco\(\) \{[\s\S]*?catalogo\.pagina = 1;[\s\S]*?aplicarCatalogo\(\);[\s\S]*?fecharFiltros\(\);/.test(js),
  'aplicarFiltroPreco resets to page 1, applies the catalog, and closes the drawer'
);
assert(
  /id="filter-preco"[^>]*onchange="aplicarFiltroPreco\(\)"/.test(html),
  'price select commits through aplicarFiltroPreco'
);
assert(
  !/id="filter-preco"[^>]*onchange="aplicarCatalogo\(\)"/.test(html),
  'price select no longer applies without resetting the page or closing the drawer'
);
assert(
  /fecharFiltros\(\); \/\/ no mobile, escolher categoria fecha o painel de filtros/.test(js),
  'category pick still closes the drawer (unchanged)'
);
assert(
  /js\/app\.js\?v=41/.test(html),
  'app.js cache token is v=41'
);
assert(
  /css\/estilos\.css\?v=43/.test(html),
  'estilos.css cache token stays v=43 (no CSS change)'
);
assert(
  /js\/extras\.js\?v=21/.test(html),
  'extras.js cache token stays v=21'
);

if (errors.length) {
  console.error('check-filter-apply-close failed:\n- ' + errors.join('\n- '));
  process.exit(1);
}
console.log('check-filter-apply-close: ok');
