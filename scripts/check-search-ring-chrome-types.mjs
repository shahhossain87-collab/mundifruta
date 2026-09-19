#!/usr/bin/env node
/**
 * Guards for leftover Phase A catalog-search keyboard ring and leftover
 * chrome button types. Complementary to PR #61 (leftover sort :focus
 * outline:none, not leftover search), PR #18 (generic cherry
 * .search-input:focus, not Phase A .shop-main), PR #4 (generic
 * search/sort outline), PR #57 (search *size*), PR #41 (16px search),
 * PR #16 / #43 (search-clear *size*), PR #56 (search-clear peach ring),
 * PR #7 (hamburger *size*), PR #9 (menu overlay / trap / 44px close),
 * PR #31 (hamburger *focus* ring), PR #25 (Encomendar type),
 * PR #5 (catalog leftover qty labels).
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const css = readFileSync(join(root, 'css/estilos.css'), 'utf8');
const app = readFileSync(join(root, 'js/app.js'), 'utf8');

const failures = [];
const assert = (cond, msg) => { if (!cond) failures.push(msg); };

assert(
  html.includes('css/estilos.css?v=64') && html.includes('js/app.js?v=36'),
  'index.html should cache-bust estilos.css?v=64 and keep app.js?v=36'
);
assert(
  html.includes('js/extras.js?v=21'),
  'extras.js cache token should stay ?v=21'
);
assert(
  /\.shop-main \.search-input:focus-visible \{/.test(css) &&
  !/\.shop-main \.search-input:focus \{/.test(css),
  'leftover catalog search should use :focus-visible (not always-on :focus)'
);
assert(
  css.includes('.shop-main .search-input:focus-visible') &&
  css.includes('outline:3px solid var(--forest)'),
  'leftover catalog search should join the leftover forest :focus-visible ring'
);
assert(
  /\.shop-main \.price-sort:focus \{[^}]*outline:none/.test(css),
  'must not redo leftover .shop-main .price-sort:focus outline:none (PR #61)'
);
assert(
  /\.filter-select:focus-visible/.test(css) &&
  !/\.filter-select:focus,/.test(css) &&
  !/\.filter-select:focus \{/.test(css),
  'leftover filter-select should use :focus-visible (not :focus { outline:none })'
);
assert(
  /^\s*\.price-sort:focus-visible \{/m.test(css) &&
  !/^\s*\.price-sort:focus \{ outline:none/m.test(css),
  'leftover generic .price-sort should use :focus-visible without outline:none'
);
assert(
  /<button type="button" class="hamburger"/.test(html),
  'leftover hamburger should be type=button'
);
assert(
  /<button type="button" class="mobile-close"[^>]*aria-label="Fechar menu"/.test(html),
  'leftover mobile-close should be type=button and named Fechar menu'
);
assert(
  /id="search-clear" type="button"/.test(html),
  'leftover catalog search-clear should be type=button'
);
assert(
  app.includes('aria-label="Diminuir"') &&
  app.includes('aria-label="Aumentar"') &&
  app.includes('aria-label="Menos"') &&
  app.includes('aria-label="Mais"'),
  'must not redo leftover catalog qty labels (PR #5) or cart stepper names (PR #31)'
);
assert(
  !html.includes('for="cust-nome"') &&
  !html.includes('id="cust-nome-label"') &&
  !app.includes('function irParaSeccao') &&
  !app.includes('function atualizarPainelCatalogo') &&
  !app.includes('function aplicarFiltroPreco') &&
  !app.includes('aria-label="Adicionar ${item.nome}') &&
  !app.includes('aria-label="Diminuir quantidade de ${item.nome}"'),
  'must not redo leftover order labels, catalog helpers, add-name templates, or cabaz qty names'
);
assert(
  !html.includes('role="tabpanel"') &&
  !/<button type="button" class="cat-tab"/.test(html) &&
  !html.includes('class="nav-order" type="button"') &&
  !html.includes('type="button" class="nav-order"'),
  'must not redo leftover catalog tabpanel, leftover tab types (PR #61), or Encomendar type (PR #25)'
);
assert(
  !/\.shop-main \.search-input \{[^}]*min-height:44px/.test(css) &&
  !/\.hamburger \{[^}]*min-(width|height):44px/.test(css) &&
  !/\.mobile-close \{[^}]*min-(width|height):44px/.test(css) &&
  !/\.shop-main \.search-clear \{[^}]*min-(width|height):44px/.test(css) &&
  !/\.btn-wa \{[^}]*min-height:44px/.test(css) &&
  !/\.shop-main \.price-sort \{[^}]*min-height:44px/.test(css),
  'must not redo leftover 44px tap-target PRs'
);
assert(
  !/\.hamburger:focus-visible/.test(css) &&
  !/\.search-clear:focus-visible/.test(css) &&
  !/\.mobile-close:focus-visible/.test(css) &&
  !/\.logo:focus-visible/.test(css) &&
  !/\.btn-wa:focus-visible/.test(css),
  'must not redo leftover peach rings from open PRs'
);

if (failures.length) {
  console.error('check-search-ring-chrome-types failed:\n' + failures.map(f => ' - ' + f).join('\n'));
  process.exit(1);
}
console.log('check-search-ring-chrome-types: ok');
