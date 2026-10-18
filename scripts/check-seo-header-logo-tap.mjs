#!/usr/bin/env node
/**
 * Guards leftover catalog header MUNDIFRUTA tap target on phones.
 * Complementary to leftover wrapping-nav tap (PR #285), leftover breadcrumb
 * tap (PR #286), leftover category-card product-title tap (PR #287), leftover
 * category-card Ver produto (PR #281), leftover product-page order CTA
 * (PR #270), and leftover footer tap (PR #288); does not expand wrapping nav,
 * restyle leftover forest wordmark (PR #196), restyle category h2 to h3, or
 * redo leftover seo-nav / leftover seo-text-link / leftover seo-breadcrumbs /
 * leftover seo-order-link / leftover product-title / leftover footer tap.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const css = readFileSync(join(root, 'css', 'estilos.css'), 'utf8');
const generator = readFileSync(join(root, 'scripts', 'generate-seo-pages.mjs'), 'utf8');
const index = readFileSync(join(root, 'index.html'), 'utf8');
const credits = readFileSync(join(root, 'creditos.html'), 'utf8');
const product = readFileSync(join(root, 'produtos', 'melancia-1-4', 'index.html'), 'utf8');
const category = readFileSync(join(root, 'categorias', 'frutas', 'index.html'), 'utf8');

const failures = [];
const assert = (cond, msg) => { if (!cond) failures.push(msg); };

assert(
  /estilos\.css\?v=66/.test(generator) &&
  !/estilos\.css\?v=65/.test(generator),
  'generated catalog CSS cache should be estilos.css?v=66'
);
assert(
  product.includes('css/estilos.css?v=66') &&
  category.includes('css/estilos.css?v=66'),
  'generated Melancia 1/4 / Frutas pages should load estilos.css?v=66'
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

const logoRule = css.match(/\.seo-header \.logo \{[^}]+\}/g) || [];
const desktopLogo = logoRule.find(rule => !/min-height:\s*44px/.test(rule));
assert(
  desktopLogo &&
  /display:\s*inline-flex/.test(desktopLogo) &&
  /align-items:\s*center/.test(desktopLogo) &&
  !/min-height:\s*44px/.test(desktopLogo) &&
  !/color:\s*var\(--forest\)/.test(desktopLogo),
  'leftover .seo-header .logo should be inline-flex and vertically centered, hugging the label on desktop, without leftover forest wordmark color'
);

assert(
  /@media \(max-width:640px\) \{[\s\S]*\.seo-header \.logo \{ min-height:44px; box-sizing:border-box; \}/.test(css),
  'phones (max-width:640px) should make leftover catalog header MUNDIFRUTA min-height:44px'
);

assert(
  /<a class="logo" href="\.\.\/\.\.\/">MUNDI<span class="logo-accent">FRUTA<\/span><\/a>/.test(category) &&
  /<a class="logo" href="\.\.\/\.\.\/">MUNDI<span class="logo-accent">FRUTA<\/span><\/a>/.test(product),
  'catalog header should keep leftover MUNDIFRUTA wordmark and leftover home href'
);

assert(
  /<nav class="seo-nav" aria-label="Navegação principal">\s*<a href="\.\.\/\.\.\/">Início<\/a>\s*<a href="\.\.\/\.\.\/categorias\/frutas\/">Frutas<\/a>\s*<a href="\.\.\/\.\.\/categorias\/legumes\/">Legumes<\/a>\s*<a href="\.\.\/\.\.\/categorias\/promocoes\/">Promoções<\/a>\s*<\/nav>/.test(category) &&
  /<nav class="seo-nav" aria-label="Navegação principal">\s*<a href="\.\.\/\.\.\/">Início<\/a>\s*<a href="\.\.\/\.\.\/categorias\/frutas\/">Frutas<\/a>\s*<a href="\.\.\/\.\.\/categorias\/legumes\/">Legumes<\/a>\s*<a href="\.\.\/\.\.\/categorias\/promocoes\/">Promoções<\/a>\s*<\/nav>/.test(product),
  'wrapping nav should stay leftover Início / Frutas / Legumes / Promoções'
);

assert(
  /<footer class="seo-footer"><a href="\.\.\/\.\.\/">MUNDIFRUTA<\/a> · Frutas e legumes frescos em Carnaxide\.<\/footer>/.test(category) &&
  /<footer class="seo-footer"><a href="\.\.\/\.\.\/">MUNDIFRUTA<\/a> · Frutas e legumes frescos em Carnaxide\.<\/footer>/.test(product),
  'catalog footer should keep leftover MUNDIFRUTA home link and leftover Carnaxide copy'
);

assert(
  category.includes('>Ver produto<') &&
  /class="seo-text-link" href="\.\.\/\.\.\/produtos\/melancia-1-4\/">Ver produto</.test(category),
  'Frutas should keep leftover Ver produto copy and leftover Melancia 1/4 href'
);
assert(
  product.includes('Ver no catálogo e encomendar') &&
  product.includes('href="/?produto=melancia-1-4#produtos"') &&
  /class="btn-prim seo-order-link"/.test(product),
  'Melancia 1/4 should keep leftover Ver no catálogo e encomendar + catalog href'
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
  !/@media \(max-width:640px\) \{[\s\S]*\.seo-product-card h2 a \{ display:block; width:100%; min-height:44px; \}/.test(css),
  'should not redo leftover category-card product-title tap target (PR #287)'
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
  !/@media \(max-width:640px\) \{[\s\S]*\.seo-footer a \{ min-height:44px; box-sizing:border-box; \}/.test(css),
  'should not redo leftover catalog footer tap target (PR #288)'
);
assert(
  !/\.seo-header \.logo \{[^}]*color:\s*var\(--forest\)/.test(css),
  'should not redo leftover forest wordmark on white catalog headers (PR #196)'
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
  /<a class="logo" href="\$\{homePath\}">MUNDI<span class="logo-accent">FRUTA<\/span><\/a>/.test(generator),
  'generator should keep leftover catalog header MUNDIFRUTA wordmark'
);

if (failures.length) {
  console.error('check-seo-header-logo-tap failed:\n' + failures.map(item => ` - ${item}`).join('\n'));
  process.exit(1);
}
console.log('check-seo-header-logo-tap: ok');
