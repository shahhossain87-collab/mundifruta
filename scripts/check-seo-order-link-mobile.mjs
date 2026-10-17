#!/usr/bin/env node
/**
 * Guards the leftover product-page order CTA: full-width 48px on phones,
 * existing “Ver no catálogo e encomendar” copy and catalog href.
 * Complementary to leftover .btn-prim focus (PR #175) and draft #192
 * (share/nav/h3/footer); does not expand wrapping nav or add a hamburger.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const css = readFileSync(join(root, 'css', 'estilos.css'), 'utf8');
const generator = readFileSync(join(root, 'scripts', 'generate-seo-pages.mjs'), 'utf8');
const index = readFileSync(join(root, 'index.html'), 'utf8');
const credits = readFileSync(join(root, 'creditos.html'), 'utf8');
const product = readFileSync(join(root, 'produtos', 'banana-madeira', 'index.html'), 'utf8');
const category = readFileSync(join(root, 'categorias', 'frutas', 'index.html'), 'utf8');

const failures = [];
const assert = (cond, msg) => { if (!cond) failures.push(msg); };

assert(
  /estilos\.css\?v=67/.test(generator) &&
  !/estilos\.css\?v=65/.test(generator),
  'generated catalog CSS cache should be estilos.css?v=67'
);
assert(
  product.includes('css/estilos.css?v=67') &&
  category.includes('css/estilos.css?v=67'),
  'generated Banana Madeira / Frutas pages should load estilos.css?v=67'
);
assert(
  index.includes('css/estilos.css?v=66') &&
  index.includes('js/app.js?v=40') &&
  index.includes('js/extras.js?v=21') &&
  index.includes('js/dados.js?v=26'),
  'homepage cache should stay estilos.css?v=66 / app.js?v=40 / extras.js?v=21 / dados.js?v=26'
);
assert(
  credits.includes('css/estilos.css?v=64'),
  'credits cache should stay estilos.css?v=64'
);

const orderRule = css.match(/\.seo-order-link\s*\{[^}]+\}/);
assert(
  orderRule &&
  /display:\s*inline-flex/.test(orderRule[0]) &&
  /justify-content:\s*center/.test(orderRule[0]),
  'leftover .seo-order-link should be inline-flex and centered, not leftover inline-block'
);

assert(
  /@media \(max-width:640px\) \{[\s\S]*\.seo-order-link \{ width:100%; min-height:48px; box-sizing:border-box; \}/.test(css),
  'phones (max-width:640px) should make leftover .seo-order-link full-width with min-height:48px'
);

assert(
  product.includes('Ver no catálogo e encomendar') &&
  product.includes('href="/?produto=banana-madeira#produtos"') &&
  /class="btn-prim seo-order-link"/.test(product),
  'Banana Madeira should keep leftover Ver no catálogo e encomendar + catalog href'
);
assert(
  /<nav class="seo-nav" aria-label="Navegação principal">\s*<a href="\.\.\/\.\.\/">Início<\/a>\s*<a href="\.\.\/\.\.\/categorias\/frutas\/">Frutas<\/a>\s*<a href="\.\.\/\.\.\/categorias\/legumes\/">Legumes<\/a>\s*<a href="\.\.\/\.\.\/categorias\/promocoes\/">Promoções<\/a>\s*<\/nav>/.test(product),
  'wrapping nav should stay leftover Início / Frutas / Legumes / Promoções'
);
assert(
  !product.includes('aria-current') &&
  !product.includes('og:image') &&
  !product.includes('twitter:card'),
  'should not redo leftover wrapping-nav aria-current, leftover catalog og:image, or leftover Twitter cards'
);

if (failures.length) {
  console.error('check-seo-order-link-mobile failed:\n' + failures.map(item => ` - ${item}`).join('\n'));
  process.exit(1);
}
console.log('check-seo-order-link-mobile: ok');
