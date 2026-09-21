#!/usr/bin/env node
/**
 * Guards leftover welcome-offer inner overscroll containment.
 * Complementary to PR #27 (offer-reveal / product / cabaz / privacy
 * overlay *backdrops*, not the leftover .reveal-inner scroller),
 * PR #101 (privacy / product / cabaz dialog *boxes*), PR #100
 * (cs-row overscroll), PR #99 (featured-carousel overscroll),
 * PR #98 (filter-drawer / menu overscroll), PR #97 (scroll-padding-nav),
 * leftover skip / <main> / hamburger expanded / current-page.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const credits = readFileSync(join(root, 'creditos.html'), 'utf8');
const css = readFileSync(join(root, 'css/estilos.css'), 'utf8');
const extras = readFileSync(join(root, 'js/extras.js'), 'utf8');
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

const inner = css.match(/\.reveal-inner \{[^}]+\}/);
assert(
  inner &&
  /overscroll-behavior:\s*contain/.test(inner[0]) &&
  /overflow-y:\s*auto/.test(inner[0]) &&
  /max-height:\s*100%/.test(inner[0]),
  'leftover .reveal-inner should contain overscroll and stay a vertical scroller'
);

assert(
  html.includes('class="reveal-inner"') &&
  html.includes('class="reveal-title">De Desconto') &&
  html.includes('🎁 Receber Oferta') &&
  html.includes('>Agora não</button>') &&
  html.includes('id="offer-pop"') &&
  html.includes('class="offer-reveal"'),
  'visible leftover welcome-offer copy stays'
);
assert(
  extras.includes('function mostrarOferta') &&
  extras.includes('window.aceitarOferta') &&
  extras.includes('window.fecharOferta'),
  'leftover welcome-offer open/close helpers stay'
);

assert(
  !/\.offer-reveal \{[^}]*overscroll-behavior/.test(css) &&
  !/\.product-modal \{[^}]*overscroll-behavior/.test(css) &&
  !/\.cabaz-modal \{[^}]*overscroll-behavior/.test(css) &&
  !/\.privacy-modal \{[^}]*overscroll-behavior/.test(css) &&
  !/\.cs-pop \{[^}]*overscroll-behavior/.test(css),
  'must not redo leftover overlay overscroll (PR #27) or restyle leftover .cs-pop'
);

const privacyBox = css.match(/\.privacy-box \{[^}]+\}/);
assert(
  privacyBox && !/overscroll-behavior/.test(privacyBox[0]),
  'must not redo leftover privacy-box overscroll (PR #101)'
);
const productBox = css.match(/\.product-modal-box \{[^}]+\}/);
assert(
  productBox && !/overscroll-behavior/.test(productBox[0]),
  'must not redo leftover product-modal-box overscroll (PR #101)'
);
const cabazBox = css.match(/\.cabaz-modal-box \{[^}]*overflow-y:\s*auto[^}]+\}/);
assert(
  cabazBox && !/overscroll-behavior/.test(cabazBox[0]),
  'must not redo leftover cabaz-modal-box overscroll (PR #101)'
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
  !/html \{[^}]*scroll-padding-top/.test(css) &&
  !/html \{[^}]*overscroll-behavior/.test(css),
  'must not redo leftover scroll-padding-nav (PR #97) or restyle leftover html'
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
  console.error('check-offer-inner-overscroll failed:\n' + failures.map(f => ' - ' + f).join('\n'));
  process.exit(1);
}
console.log('check-offer-inner-overscroll: ok');
