#!/usr/bin/env node
/**
 * Guards leftover Phase A filter-sidebar / leftover mobile-menu
 * overscroll containment. Complementary to PR #27 (product / cabaz /
 * privacy / welcome-offer overlays, not the leftover drawer or menu),
 * PR #40 / #41 / #46 (drawer z-index / inert / Tab trap / pad, not
 * overscroll), and PR #9 (menu overlay / trap, not overscroll).
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const credits = readFileSync(join(root, 'creditos.html'), 'utf8');
const css = readFileSync(join(root, 'css/estilos.css'), 'utf8');
const app = readFileSync(join(root, 'js/app.js'), 'utf8');

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

const sidebarBlock = css.match(/\.shop-sidebar \{[^}]+\}/);
assert(
  sidebarBlock && /overscroll-behavior:\s*contain/.test(sidebarBlock[0]),
  'leftover Phase A .shop-sidebar should contain overscroll (desktop sticky + mobile drawer)'
);
assert(
  css.includes('body.filtros-open { overflow:hidden; overscroll-behavior:none; }'),
  'leftover open filter drawer should stop body overscroll on ≤900px'
);

const menuBlock = css.match(/\.mobile-menu \{[^}]+\}/);
assert(
  menuBlock && /overscroll-behavior:\s*contain/.test(menuBlock[0]),
  'leftover .mobile-menu should contain overscroll'
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
  !css.includes('overscroll-behavior:contain') || (
    !/\.product-modal \{[^}]*overscroll-behavior/.test(css) &&
    !/\.cabaz-modal \{[^}]*overscroll-behavior/.test(css) &&
    !/\.privacy-modal \{[^}]*overscroll-behavior/.test(css) &&
    !/\.offer-reveal \{[^}]*overscroll-behavior/.test(css)
  ),
  'must not redo leftover overlay overscroll (PR #27)'
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

if (failures.length) {
  console.error('check-filter-menu-overscroll failed:\n' + failures.map(f => ' - ' + f).join('\n'));
  process.exit(1);
}
console.log('check-filter-menu-overscroll: ok');
