#!/usr/bin/env node
/**
 * Guards for leftover Phase A catalog pagination (status / 44px / grid focus)
 * and vertical category-tab arrows. Complementary to PR #27 (Left/Right) and
 * PR #29 (old frutas/legumes pagination + irParaSeccao / shop-link).
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
  /id="cat-tabs"[^>]*aria-orientation="vertical"/.test(html),
  'Phase A category tablist should declare vertical orientation'
);
assert(
  /id="grid-catalog" aria-label="Frutas"/.test(html),
  'catalog grid should have an accessible name'
);
assert(
  html.includes('css/estilos.css?v=52') && html.includes('js/app.js?v=42'),
  'index.html should cache-bust estilos.css?v=52 and app.js?v=42'
);
assert(
  html.includes('js/extras.js?v=21'),
  'extras.js cache token should stay ?v=21'
);

assert(
  /role="status">Página \$\{catalogo\.pagina\}/.test(app),
  'Phase A pagination should expose a status live region'
);
assert(
  app.includes('function rolarCatalogo(') &&
    app.includes("matchMedia('(prefers-reduced-motion: reduce)')"),
  'page changes should honor prefers-reduced-motion'
);
assert(
  !/getElementById\('catalog-toolbar'\)\.scrollIntoView\(\{ behavior:'smooth'/.test(app),
  'mudarPagina should not hard-code smooth scrollIntoView'
);
assert(
  app.includes("grid.setAttribute('tabindex', '-1')") &&
    app.includes('grid.focus({ preventScroll: true })'),
  'pagination should move focus to #grid-catalog'
);
assert(
  app.includes('if (grid && nome) grid.setAttribute(\'aria-label\', nome)') ||
    app.includes('if (grid && nome) grid.setAttribute("aria-label", nome)'),
  'catalog grid label should follow the active category'
);
assert(
  app.includes('function ligarSetasVerticaisCatalogo') &&
    app.includes("e.key !== 'ArrowDown'") &&
    app.includes("e.key !== 'ArrowUp'"),
  'vertical sidebar tabs should move with ArrowUp/ArrowDown'
);
assert(
  app.includes('ligarSetasVerticaisCatalogo();'),
  'vertical tab helper must run at init'
);
assert(
  !app.includes('function ligarSetasCategorias') &&
    !app.includes('function irParaSeccao') &&
    !app.includes('function comportamentoScroll'),
  'must not redo PR #27 Left/Right helper or PR #29 scroll helpers'
);

assert(
  /\.shop-main \.catalog-pagination button \{[^}]*min-height:44px/.test(css),
  'Phase A leftover pagination buttons should be at least 44px'
);
assert(
  /\.shop-main \.catalog-pagination button \{[^}]*min-width:44px/.test(css),
  'Phase A leftover pagination buttons should be at least 44px wide'
);

if (failures.length) {
  console.error('check-catalog-nav-leftover failed:\n' + failures.map(f => ' - ' + f).join('\n'));
  process.exit(1);
}
console.log('check-catalog-nav-leftover: ok');
