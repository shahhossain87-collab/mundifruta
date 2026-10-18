#!/usr/bin/env node
/**
 * Guards leftover catalog breadcrumb tap target on phones. Complementary to
 * leftover wrapping-nav tap (PR #285), leftover category-card Ver produto
 * (PR #281), and leftover product-page order CTA (PR #270); does not expand
 * wrapping nav, restyle category h2, or redo leftover seo-nav / leftover
 * seo-text-link / leftover seo-order-link.
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
  /estilos\.css\?v=70/.test(generator) &&
  !/estilos\.css\?v=65/.test(generator) &&
  !/estilos\.css\?v=69/.test(generator),
  'generated catalog CSS cache should be estilos.css?v=70'
);
assert(
  product.includes('css/estilos.css?v=70') &&
  category.includes('css/estilos.css?v=70'),
  'generated Banana Madeira / Frutas pages should load estilos.css?v=70'
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

const crumbLinkRule = css.match(/\.seo-breadcrumbs a \{[^}]+\}/);
assert(
  crumbLinkRule &&
  /display:\s*inline-flex/.test(crumbLinkRule[0]) &&
  /align-items:\s*center/.test(crumbLinkRule[0]) &&
  !/min-height:\s*44px/.test(crumbLinkRule[0]),
  'leftover .seo-breadcrumbs a should be inline-flex and vertically centered, hugging the label on desktop'
);

assert(
  /@media \(max-width:640px\) \{[\s\S]*\.seo-breadcrumbs a \{ min-height:44px; box-sizing:border-box; \}/.test(css),
  'phones (max-width:640px) should make leftover breadcrumb links min-height:44px'
);

assert(
  /<nav class="seo-breadcrumbs" aria-label="Breadcrumb"><a href="\.\.\/\.\.">Início<\/a><span>›<\/span><span>Frutas<\/span><\/nav>/.test(category),
  'Frutas breadcrumb should stay leftover Início › Frutas'
);
assert(
  /<nav class="seo-breadcrumbs" aria-label="Breadcrumb"><a href="\.\.\/\.\.">Início<\/a><span>›<\/span><a href="\.\.\/\.\.\/categorias\/frutas\/">Frutas<\/a><span>›<\/span><span>Banana Madeira<\/span><\/nav>/.test(product),
  'Banana Madeira breadcrumb should stay leftover Início › Frutas › Banana Madeira'
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
  !category.includes('aria-hidden') &&
  !product.includes('BreadcrumbList') &&
  !generator.includes('BreadcrumbList'),
  'should not redo leftover breadcrumb aria-hidden separators (PR #237) or leftover BreadcrumbList (PR #199)'
);

if (failures.length) {
  console.error('check-seo-breadcrumb-tap failed:\n' + failures.map(item => ` - ${item}`).join('\n'));
  process.exit(1);
}
console.log('check-seo-breadcrumb-tap: ok');
