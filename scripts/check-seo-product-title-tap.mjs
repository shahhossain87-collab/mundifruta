#!/usr/bin/env node
/**
 * Guards leftover catalog category-card product-title tap target on phones.
 * Complementary to leftover wrapping-nav tap (PR #285), leftover breadcrumb
 * tap (PR #286), leftover category-card Ver produto (PR #281), and leftover
 * product-page order CTA (PR #270); does not expand wrapping nav, restyle
 * category h2 to h3, or redo leftover seo-nav / leftover seo-text-link /
 * leftover seo-breadcrumbs / leftover seo-order-link.
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
  /estilos\.css\?v=71/.test(generator) &&
  !/estilos\.css\?v=65/.test(generator) &&
  !/estilos\.css\?v=70/.test(generator),
  'generated catalog CSS cache should be estilos.css?v=71'
);
assert(
  product.includes('css/estilos.css?v=71') &&
  category.includes('css/estilos.css?v=71'),
  'generated Banana Madeira / Frutas pages should load estilos.css?v=71'
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

const titleLinkRule = css.match(/\.seo-product-card h2 a \{[^}]+\}/);
assert(
  titleLinkRule &&
  /display:\s*inline-block/.test(titleLinkRule[0]) &&
  /max-width:\s*100%/.test(titleLinkRule[0]) &&
  !/min-height:\s*44px/.test(titleLinkRule[0]),
  'leftover .seo-product-card h2 a should be inline-block with max-width 100%, hugging the label on desktop'
);

assert(
  /@media \(max-width:640px\) \{[\s\S]*\.seo-product-card h2 a \{ display:block; width:100%; min-height:44px; \}/.test(css),
  'phones (max-width:640px) should make leftover category-card product titles min-height:44px'
);

assert(
  /<h2><a href="\.\.\/\.\.\/produtos\/melancia-1-4\/">Melancia 1\/4<\/a><\/h2>/.test(category),
  'Frutas should keep leftover Melancia 1/4 product title link'
);
assert(
  /<h2><a href="\.\.\/\.\.\/produtos\/banana-madeira\/">Banana Madeira<\/a><\/h2>/.test(category),
  'Frutas should keep leftover Banana Madeira product title link'
);

assert(
  /<nav class="seo-nav" aria-label="Navegação principal">\s*<a href="\.\.\/\.\.\/">Início<\/a>\s*<a href="\.\.\/\.\.\/categorias\/frutas\/">Frutas<\/a>\s*<a href="\.\.\/\.\.\/categorias\/legumes\/">Legumes<\/a>\s*<a href="\.\.\/\.\.\/categorias\/promocoes\/">Promoções<\/a>\s*<\/nav>/.test(category) &&
  /<nav class="seo-nav" aria-label="Navegação principal">\s*<a href="\.\.\/\.\.\/">Início<\/a>\s*<a href="\.\.\/\.\.\/categorias\/frutas\/">Frutas<\/a>\s*<a href="\.\.\/\.\.\/categorias\/legumes\/">Legumes<\/a>\s*<a href="\.\.\/\.\.\/categorias\/promocoes\/">Promoções<\/a>\s*<\/nav>/.test(product),
  'wrapping nav should stay leftover Início / Frutas / Legumes / Promoções'
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
  !/@media \(max-width:640px\) \{[\s\S]*\.seo-nav a \{ min-height:44px; box-sizing:border-box; \}/.test(css),
  'should not redo leftover wrapping-nav tap target (PR #285)'
);
assert(
  !/@media \(max-width:640px\) \{[\s\S]*\.seo-breadcrumbs a \{ min-height:44px; box-sizing:border-box; \}/.test(css),
  'should not redo leftover breadcrumb tap target (PR #286)'
);
assert(
  /display:inline-block; margin-top:14px; text-decoration:none;/.test(css) &&
  !/@media \(max-width:640px\) \{[\s\S]*\.seo-order-link \{ width:100%; min-height:48px/.test(css),
  'should not redo leftover product-page seo-order-link full-width CTA (PR #270)'
);
assert(
  !/@media \(max-width:640px\) \{[\s\S]*\.seo-product-card \.seo-text-link \{ width:100%; min-height:44px/.test(css),
  'should not redo leftover category-card Ver produto tap target (PR #281)'
);
assert(
  !category.includes('aria-current') &&
  !category.includes('og:image') &&
  !category.includes('twitter:card') &&
  !product.includes('og:image') &&
  !product.includes('twitter:card'),
  'should not redo leftover wrapping-nav aria-current, leftover catalog og:image, or leftover Twitter cards'
);
assert(
  /<a href="\$\{homePath\}">Início<\/a>\s*<a href="\$\{homePath\}categorias\/frutas\/">Frutas<\/a>\s*<a href="\$\{homePath\}categorias\/legumes\/">Legumes<\/a>\s*<a href="\$\{homePath\}categorias\/promocoes\/">Promoções<\/a>/.test(generator) &&
  !/<nav class="seo-nav"[^>]*>[\s\S]*ervas-frescas/.test(generator),
  'generator wrapping nav should stay leftover Início / Frutas / Legumes / Promoções'
);
assert(
  /<h2><a href="\$\{productPath\}">\$\{esc\(product\.nome\)\}<\/a><\/h2>/.test(generator),
  'generator should keep leftover category-card h2 product titles'
);

if (failures.length) {
  console.error('check-seo-product-title-tap failed:\n' + failures.map(item => ` - ${item}`).join('\n'));
  process.exit(1);
}
console.log('check-seo-product-title-tap: ok');
