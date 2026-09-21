#!/usr/bin/env node
/**
 * Guards leftover dialog-box overscroll containment.
 * Complementary to PR #27 (product / cabaz / privacy / welcome-offer
 * overlay *backdrops*, not the leftover inner scroll boxes), PR #100
 * (cs-row overscroll), PR #99 (featured-carousel overscroll), PR #98
 * (filter-drawer / menu overscroll), PR #97 (scroll-padding-nav),
 * PR #39 (cs-pop dock gutter), and leftover skip / <main> / current-page.
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

const privacyBox = css.match(/\.privacy-box \{[^}]+\}/);
assert(
  privacyBox && /overscroll-behavior:\s*contain/.test(privacyBox[0]) && /overflow-y:\s*auto/.test(privacyBox[0]),
  'leftover .privacy-box should contain overscroll and stay overflow-y:auto'
);
const productBox = css.match(/\.product-modal-box \{[^}]+\}/);
assert(
  productBox && /overscroll-behavior:\s*contain/.test(productBox[0]) && /overflow:\s*auto/.test(productBox[0]),
  'leftover .product-modal-box should contain overscroll and stay overflow:auto'
);
const cabazBox = css.match(/\.cabaz-modal-box \{[^}]*overflow-y:\s*auto[^}]+\}/);
assert(
  cabazBox && /overscroll-behavior:\s*contain/.test(cabazBox[0]),
  'leftover .cabaz-modal-box should contain overscroll and stay overflow-y:auto'
);

assert(
  html.includes('id="privacy-title">Política de Privacidade') &&
  html.includes('id="product-modal-name"') &&
  html.includes('Este cabaz é composto pelos seguintes itens:') &&
  html.includes('class="privacy-box"') &&
  html.includes('class="product-modal-box"') &&
  html.includes('class="cabaz-modal-box"'),
  'visible leftover privacy / product / cabaz dialog copy stays'
);
assert(
  extras.includes('window.abrirPrivacidade') &&
  app.includes('function abrirProduto') &&
  app.includes('function abrirCabaz'),
  'leftover privacy / product / cabaz open helpers stay'
);

assert(
  !/\.product-modal \{[^}]*overscroll-behavior/.test(css) &&
  !/\.cabaz-modal \{[^}]*overscroll-behavior/.test(css) &&
  !/\.privacy-modal \{[^}]*overscroll-behavior/.test(css) &&
  !/\.offer-reveal \{[^}]*overscroll-behavior/.test(css) &&
  !/\.cs-pop \{[^}]*overscroll-behavior/.test(css),
  'must not redo leftover overlay overscroll (PR #27) or restyle leftover .cs-pop'
);

const csRowBlock = css.match(/\.cs-row \{[^}]+\}/);
assert(
  csRowBlock && !/overscroll-behavior/.test(csRowBlock[0]),
  'must not redo leftover cs-row overscroll (PR #100)'
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

if (failures.length) {
  console.error('check-dialog-box-overscroll failed:\n' + failures.map(f => ' - ' + f).join('\n'));
  process.exit(1);
}
console.log('check-dialog-box-overscroll: ok');
