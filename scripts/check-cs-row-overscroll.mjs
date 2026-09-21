#!/usr/bin/env node
/**
 * Guards leftover cross-sell row overscroll containment.
 * Complementary to PR #99 (featured-carousel overscroll, not the leftover
 * Combina bem / Complete o seu pedido rows), PR #98 (filter-drawer /
 * menu overscroll, not the leftover CS rows), PR #27 (product / cabaz /
 * privacy / welcome-offer overlays, not the leftover CS rows), PR #39
 * (cs-pop dock gutter, not overscroll), and PR #88 (coupon / carousel /
 * CS decorative wraps, not overscroll).
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const credits = readFileSync(join(root, 'creditos.html'), 'utf8');
const css = readFileSync(join(root, 'css/estilos.css'), 'utf8');
const app = readFileSync(join(root, 'js/app.js'), 'utf8');
const extras = readFileSync(join(root, 'js/extras.js'), 'utf8');

const failures = [];
const assert = (cond, msg) => { if (!cond) failures.push(msg); };

assert(
  html.includes('css/estilos.css?v=65') && credits.includes('css/estilos.css?v=65'),
  'index.html and creditos.html should cache-bust estilos.css?v=65'
);
assert(
  html.includes('js/app.js?v=38') && html.includes('js/extras.js?v=21') && html.includes('js/dados.js?v=25'),
  'app.js / extras.js / dados.js cache tokens should stay'
);

const csRowBlock = css.match(/\.cs-row \{[^}]+\}/);
assert(
  csRowBlock && /overscroll-behavior:\s*contain/.test(csRowBlock[0]),
  'leftover .cs-row should contain overscroll'
);
assert(
  html.includes('id="cs-pop-row"') &&
  html.includes('id="crosssell-cart-row"') &&
  html.includes('class="cs-row"') &&
  extras.includes("document.getElementById('cs-pop-row')") &&
  extras.includes("document.getElementById('crosssell-cart-row')") &&
  extras.includes('function cartaoCS'),
  'leftover Combina bem popup row and Complete o seu pedido cart row stay'
);

const carouselBlock = css.match(/\.feature-grid\.carousel \{[^}]+\}/);
assert(
  carouselBlock && !/overscroll-behavior/.test(carouselBlock[0]),
  'must not redo leftover featured-carousel overscroll (PR #99)'
);
const sidebarBlock = css.match(/\.shop-sidebar \{[^}]+\}/);
assert(
  sidebarBlock && !/overscroll-behavior/.test(sidebarBlock[0]),
  'must not redo leftover filter-drawer overscroll (PR #98)'
);
assert(
  !/body\.filtros-open \{[^}]*overscroll-behavior/.test(css),
  'must not redo leftover body.filtros-open overscroll (PR #98)'
);
const menuBlock = css.match(/\.mobile-menu \{[^}]+\}/);
assert(
  menuBlock && !/overscroll-behavior/.test(menuBlock[0]),
  'must not redo leftover mobile-menu overscroll (PR #98)'
);
assert(
  !/\.product-modal \{[^}]*overscroll-behavior/.test(css) &&
  !/\.cabaz-modal \{[^}]*overscroll-behavior/.test(css) &&
  !/\.privacy-modal \{[^}]*overscroll-behavior/.test(css) &&
  !/\.offer-reveal \{[^}]*overscroll-behavior/.test(css) &&
  !/\.cs-pop \{[^}]*overscroll-behavior/.test(css),
  'must not redo leftover overlay overscroll (PR #27) or restyle leftover .cs-pop'
);
assert(
  !/html \{[^}]*scroll-padding-top/.test(css),
  'must not redo leftover scroll-padding-nav (PR #97)'
);
assert(
  !html.includes('id="skip-') && !html.includes('<main') && !html.includes('aria-current='),
  'must not redo leftover skip / <main> / current-page markers'
);
assert(
  !app.includes('function irParaSeccao') && app.includes('function promoverCatalogo'),
  'must not redo leftover irParaSeccao (PR #29); leftover promoverCatalogo stays'
);
assert(
  !html.includes('for="cust-nome"') &&
  !html.includes('role="tabpanel"') &&
  !app.includes('function aplicarFiltroPreco') &&
  !app.includes('aria-label="Adicionar ${item.nome}'),
  'must not redo leftover order labels, catalog tabpanel, or add-name templates'
);
assert(
  html.includes('id="tab-frutas"') &&
  html.includes('class="hamburger"') &&
  !html.includes('aria-expanded') &&
  html.includes('id="mobile-bar"') &&
  (html.match(/class="mb-item"/g) || []).length === 4,
  'leftover hamburger stays without expanded; leftover 4-item bar stays'
);
assert(
  extras.includes("'Combina bem com…'") &&
  html.includes('Complete o seu pedido') &&
  html.includes('Continuar sem adicionar') &&
  html.includes('id="cs-pop-title"'),
  'visible leftover CS copy stays'
);

if (failures.length) {
  console.error('check-cs-row-overscroll failed:\n' + failures.map(f => ' - ' + f).join('\n'));
  process.exit(1);
}
console.log('check-cs-row-overscroll: ok');
