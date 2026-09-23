#!/usr/bin/env node
/**
 * Guards for leftover product-preview − / + keyboard rings.
 * Complementary to #2–#154 (does not move catalog/search, restyle the nav,
 * change the 4-item mobile bar, fold search accents, add a cabaz hint,
 * jump-to-catalog, rewrite modal visible CTAs, or change JSON-LD).
 *
 * Not a redo of:
 * - PR #154 leftover Filtros / drawer-close forest rings
 * - PR #32 leftover product-modal qty names
 * - PR #46 leftover product-modal qty tap sizes
 * - PR #55 leftover product-modal-add peach ring
 * - PR #5 leftover catalog qty labels
 * - PR #61 leftover catalog-sort :focus-visible forest ring
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const css = readFileSync(join(root, 'css/estilos.css'), 'utf8');
const creditos = readFileSync(join(root, 'creditos.html'), 'utf8');
const app = readFileSync(join(root, 'js/app.js'), 'utf8');

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
  html.includes('class="product-modal-qty"') &&
  html.includes('onclick="alterarQtdModal(-1)"') &&
  html.includes('onclick="alterarQtdModal(1)"') &&
  html.includes('aria-label="Diminuir quantidade"') &&
  html.includes('aria-label="Aumentar quantidade"'),
  'leftover product-preview − / + stay Diminuir quantidade / Aumentar quantidade'
);
assert(
  /id="product-modal-add"[^>]*>＋<\/button>/.test(html),
  'leftover product-modal add stays a visible plus (PR #2 / #26)'
);

assert(
  /\.product-modal-qty button:focus-visible/.test(css),
  'leftover product-preview − / + should join the leftover forest :focus-visible ring'
);
assert(
  css.includes('.product-modal-qty button:focus-visible') &&
  css.includes('outline:3px solid var(--forest)'),
  'leftover product-preview qty must use the leftover catalog forest ring (not a new color)'
);
assert(
  css.includes('.qty-btn:focus-visible') &&
  css.includes('.add-btn:focus-visible'),
  'leftover catalog qty / Adicionar forest rings stay'
);

assert(
  html.includes('id="mobile-bar"') &&
  html.includes('id="mb-cart-label">Carrinho') &&
  html.includes('mb-label">Promoções') &&
  html.includes('mb-label">WhatsApp') &&
  html.includes('mb-label">Como Chegar'),
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
  !/\.filtbtn:focus-visible/.test(css) &&
  !/\.sidebar-close:focus-visible/.test(css),
  'must not redo PR #154 leftover Filtros / drawer-close forest rings'
);
assert(
  !/\.product-modal-add:focus-visible/.test(css),
  'must not redo PR #55 leftover product-modal-add peach ring'
);
assert(
  !/\.cat-quick-btn:focus-visible/.test(css),
  'must not redo PR #25 leftover shortcut focus rings'
);
assert(
  !/\.search-clear:focus-visible/.test(css) &&
  !/\.hamburger:focus-visible/.test(css) &&
  !/\.mobile-close:focus-visible/.test(css) &&
  !/\.logo:focus-visible/.test(css) &&
  !/\.btn-prim:focus-visible/.test(css) &&
  !/\.btn-wa:focus-visible/.test(css),
  'must not redo leftover search-clear / hamburger / close / wordmark / CTA rings'
);
assert(
  !/\.product-modal-qty button \{[^}]*min-(width|height):44px/.test(css) &&
  !/\.product-modal-qty button \{[^}]*min-height:44px/.test(css),
  'must not redo leftover 44px tap-target PRs for product-preview qty'
);
assert(
  app.includes('aria-label="Diminuir"') &&
  app.includes('aria-label="Aumentar"') &&
  !html.includes('for="cust-nome"') &&
  !html.includes('role="tabpanel"'),
  'must not redo leftover catalog qty labels, order labels, or catalog tabpanel'
);

if (failures.length) {
  console.error('check-product-modal-qty-focus failed:\n' + failures.map(f => ' - ' + f).join('\n'));
  process.exit(1);
}
console.log('check-product-modal-qty-focus: ok');
