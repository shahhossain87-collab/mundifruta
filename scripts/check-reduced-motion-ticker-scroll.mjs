#!/usr/bin/env node
/**
 * Guards leftover reduced-motion stops for the announcement ticker and
 * leftover html { scroll-behavior }. Complementary to PR #21 (catalog
 * search pairing / skip / contactPoint), PR #30 (carousel
 * scroll-behavior / float-cart.pop), PR #20 (cardIn), PR #16 (.fi),
 * PR #97 (scroll-padding-top), PR #103 (menu stacking).
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
  html.includes('js/app.js?v=38') &&
  html.includes('js/extras.js?v=21') &&
  html.includes('js/dados.js?v=25'),
  'app.js / extras.js / dados.js cache tokens should stay'
);

assert(
  /html\s*\{\s*scroll-behavior:\s*smooth;/.test(css),
  'leftover default html scroll-behavior should stay smooth'
);
assert(
  /@media \(prefers-reduced-motion: reduce\) \{[\s\S]*html \{ scroll-behavior: auto; \}[\s\S]*\.announcement-track \{ animation: none; \}/.test(css),
  'leftover html scroll-behavior and leftover ticker should stop under reduced motion'
);
assert(
  /@media \(prefers-reduced-motion:reduce\) \{[\s\S]*\.hero-slide \{ animation:none/.test(css),
  'must not drop leftover hero-slide reduced-motion (existing rule)'
);

assert(
  html.includes('class="announcement-track"') &&
  html.includes('Entregas rápidas para Carnaxide e Oeiras') &&
  html.includes('10€ de desconto na primeira compra acima de 40€'),
  'visible leftover ticker copy stays (delivery wording still needs owner approval)'
);
assert(
  /<button class="hamburger" onclick="toggleMenu\(\)" aria-label="Menu">/.test(html) &&
  !html.includes('aria-expanded='),
  'must not redo leftover hamburger expanded (PR #70)'
);
assert(
  html.includes('id="mobile-bar"') &&
  html.includes('Carrinho') &&
  html.includes('Promoções') &&
  html.includes('WhatsApp') &&
  html.includes('Como Chegar'),
  'leftover 4-item bar stays'
);
assert(
  !html.includes('skip-link') && !html.includes('<main'),
  'must not add leftover skip / <main> (PR #2 / #21)'
);
assert(
  !app.includes('aria-current') && !extras.includes('aria-current'),
  'must not redo leftover current-page markers (PR #92–#96)'
);
assert(
  css.includes('z-index:999') &&
  !/body:has\(#mobile-menu\.open\)/.test(css),
  'must not redo leftover menu-bar stacking (PR #103)'
);
assert(
  !/\.feature-grid\.carousel\s*\{[^}]*overscroll-behavior/.test(css) &&
  !/\.shop-sidebar\s*\{[^}]*overscroll-behavior/.test(css) &&
  !/\.cs-row\s*\{[^}]*overscroll-behavior/.test(css),
  'must not redo leftover overscroll PRs #98–#102'
);
assert(
  !/html\s*\{[^}]*scroll-padding-top/.test(css),
  'must not redo leftover scroll-padding (PR #97)'
);

if (failures.length) {
  console.error(failures.map(f => `FAIL: ${f}`).join('\n'));
  process.exit(1);
}
console.log('ok: leftover reduced-motion ticker + html scroll-behavior');
