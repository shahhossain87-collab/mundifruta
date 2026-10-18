#!/usr/bin/env node
/**
 * Guards leftover category-card “Ver produto” tap target on 2-column
 * phones. Complementary to leftover product-page order CTA (PR #270)
 * and leftover Ver produto keyboard ring (PR #210); does not expand
 * wrapping nav, restyle category h2, or redo leftover seo-order-link.
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
  /estilos\.css\?v=68/.test(generator) &&
  !/estilos\.css\?v=65/.test(generator) &&
  !/estilos\.css\?v=67/.test(generator),
  'generated catalog CSS cache should be estilos.css?v=68'
);
assert(
  product.includes('css/estilos.css?v=68') &&
  category.includes('css/estilos.css?v=68'),
  'generated Banana Madeira / Frutas pages should load estilos.css?v=68'
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

const cardRule = css.match(/\.seo-product-card \.seo-text-link\s*\{[^}]+\}/);
assert(
  cardRule &&
  /display:\s*inline-flex/.test(cardRule[0]) &&
  /align-items:\s*center/.test(cardRule[0]) &&
  /align-self:\s*flex-start/.test(cardRule[0]),
  'leftover .seo-product-card .seo-text-link should be inline-flex, vertically centered, and hug the label on desktop'
);

assert(
  /@media \(max-width:640px\) \{[\s\S]*\.seo-product-card \.seo-text-link \{ width:100%; min-height:44px; box-sizing:border-box; align-self:stretch; \}/.test(css),
  'phones (max-width:640px) should make leftover category-card Ver produto full-width with min-height:44px'
);

assert(
  /@media \(max-width:640px\) \{[\s\S]*\.seo-product-grid \{ grid-template-columns:repeat\(2,minmax\(0,1fr\)\); gap:12px; \}/.test(css),
  'phones should keep leftover 2-column leftover category grid'
);

assert(
  category.includes('>Ver produto<') &&
  /class="seo-text-link" href="\.\.\/\.\.\/produtos\/melancia-1-4\/">Ver produto</.test(category),
  'Frutas should keep leftover Ver produto copy and leftover Melancia 1/4 href'
);
assert(
  product.includes('Ver no catálogo e encomendar') &&
  product.includes('href="/?produto=banana-madeira#produtos"') &&
  /class="btn-prim seo-order-link"/.test(product),
  'Banana Madeira should keep leftover Ver no catálogo e encomendar + catalog href'
);
assert(
  /display:inline-block; margin-top:14px; text-decoration:none;/.test(css) &&
  !/@media \(max-width:640px\) \{[\s\S]*\.seo-order-link \{ width:100%; min-height:48px/.test(css),
  'should not redo leftover product-page seo-order-link full-width CTA (PR #270)'
);
assert(
  /<nav class="seo-nav" aria-label="Navegação principal">\s*<a href="\.\.\/\.\.\/">Início<\/a>\s*<a href="\.\.\/\.\.\/categorias\/frutas\/">Frutas<\/a>\s*<a href="\.\.\/\.\.\/categorias\/legumes\/">Legumes<\/a>\s*<a href="\.\.\/\.\.\/categorias\/promocoes\/">Promoções<\/a>\s*<\/nav>/.test(category),
  'wrapping nav should stay leftover Início / Frutas / Legumes / Promoções'
);
assert(
  !category.includes('aria-current') &&
  !category.includes('og:image') &&
  !category.includes('twitter:card') &&
  !product.includes('og:image') &&
  !product.includes('twitter:card'),
  'should not redo leftover wrapping-nav aria-current, leftover catalog og:image, or leftover Twitter cards'
);

if (failures.length) {
  console.error('check-seo-ver-produto-tap failed:\n' + failures.map(item => ` - ${item}`).join('\n'));
  process.exit(1);
}
console.log('check-seo-ver-produto-tap: ok');
