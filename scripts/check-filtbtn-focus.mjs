#!/usr/bin/env node
/**
 * Guards for leftover mobile Filtros / drawer-close keyboard rings.
 * Complementary to #2–#153 (does not move catalog/search, restyle the nav,
 * change the 4-item mobile bar, fold search accents, add a cabaz hint,
 * jump-to-catalog, rewrite modal visible CTAs, or change JSON-LD).
 *
 * Not a redo of:
 * - PR #32 / #52 / #55 / #56 / #63 leftover chrome rings (search-clear,
 *   hamburger, mobile-close, cat-quick, featured, menu)
 * - PR #41 leftover filter-drawer Tab trap
 * - PR #47 leftover focus return to .filtbtn
 * - PR #61 leftover catalog-sort :focus-visible forest ring
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const css = readFileSync(join(root, 'css/estilos.css'), 'utf8');
const creditos = readFileSync(join(root, 'creditos.html'), 'utf8');

const failures = [];
const assert = (cond, msg) => { if (!cond) failures.push(msg); };

assert(
  html.includes('css/estilos.css?v=65'),
  'index.html should cache-bust estilos.css?v=65'
);
assert(
  creditos.includes('css/estilos.css?v=65'),
  'creditos.html should match leftover estilos.css?v=65'
);
assert(
  html.includes('js/app.js?v=38') &&
  html.includes('js/extras.js?v=21') &&
  html.includes('js/dados.js?v=25'),
  'app.js stays ?v=38, extras.js stays ?v=21, dados.js stays ?v=25'
);

assert(
  /<button class="filtbtn" type="button" onclick="toggleFiltros\(\)" aria-label="Abrir filtros e categorias">⚙️ Filtros<\/button>/.test(html),
  'leftover Filtros control stays type=button with Abrir filtros e categorias'
);
assert(
  /<button class="sidebar-close" type="button" onclick="toggleFiltros\(\)" aria-label="Fechar filtros">✕<\/button>/.test(html),
  'leftover drawer close stays type=button with Fechar filtros'
);

assert(
  /\.filtbtn:focus-visible/.test(css) &&
  /\.sidebar-close:focus-visible/.test(css),
  'leftover Filtros and drawer close should join the leftover forest :focus-visible ring'
);
assert(
  css.includes('.filtbtn:focus-visible, .sidebar-close:focus-visible') &&
  css.includes('outline:3px solid var(--forest)'),
  'leftover Filtros / drawer close must use the leftover catalog forest ring (not a new color)'
);

assert(
  html.includes('id="mobile-bar"') &&
  html.includes('id="mb-cart-label">Carrinho</span>') &&
  html.includes('mb-label">Promoções</span>') &&
  html.includes('mb-label">WhatsApp</span>') &&
  html.includes('mb-label">Como Chegar</span>'),
  'leftover 4-item bar labels stay Carrinho / Promoções / WhatsApp / Como Chegar'
);
assert(
  html.includes('class="hamburger"') &&
  !html.includes('aria-expanded'),
  'leftover hamburger stays without expanded (PR #70)'
);
assert(
  html.includes('id="produtos"') &&
  html.indexOf('id="produtos"') < html.indexOf('id="inicio"'),
  'catalog still starts above leftover #inicio in leftover HTML'
);

assert(
  !/\.cat-quick-btn:focus-visible/.test(css),
  'must not redo PR #25 leftover shortcut focus rings'
);
assert(
  !/\.shop-main \.search-clear:focus-visible/.test(css) &&
  !/\.search-clear:focus-visible/.test(css),
  'must not redo PR #56 leftover search-clear peach ring'
);
assert(
  !/\.hamburger:focus-visible/.test(css) &&
  !/\.mobile-close:focus-visible/.test(css) &&
  !/\.logo:focus-visible/.test(css) &&
  !/\.btn-prim:focus-visible/.test(css) &&
  !/\.btn-wa:focus-visible/.test(css),
  'must not redo leftover hamburger / close / wordmark / CTA rings'
);
assert(
  !/\.filtbtn \{[^}]*min-(width|height):44px/.test(css) &&
  !/\.sidebar-close \{[^}]*min-(width|height):44px/.test(css),
  'must not redo leftover 44px tap-target PRs for Filtros / drawer close'
);
assert(
  !html.includes('for="cust-nome"') &&
  !html.includes('role="tabpanel"'),
  'must not redo leftover order labels or catalog tabpanel'
);

if (failures.length) {
  console.error('check-filtbtn-focus failed:\n' + failures.map(f => ' - ' + f).join('\n'));
  process.exit(1);
}
console.log('check-filtbtn-focus: ok');
