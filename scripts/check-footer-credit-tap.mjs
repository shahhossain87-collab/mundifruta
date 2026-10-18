#!/usr/bin/env node
/**
 * Guards leftover homepage footer Shah Hossain tap target on phones.
 * Complementary to leftover catalog header-logo tap (PR #289), leftover
 * catalog footer tap (PR #288), leftover wrapping-nav tap (PR #285), leftover
 * breadcrumb tap (PR #286), leftover category-card product-title tap (PR #287),
 * leftover category-card Ver produto (PR #281), and leftover product-page
 * order CTA (PR #270); does not redo leftover footer-credit forest ring
 * (PR #223), leftover footer-links tap, leftover wrapping-nav expansion
 * (PR #218), or leftover forest wordmark (PR #196).
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
  index.includes('css/estilos.css?v=67') &&
  index.includes('js/app.js?v=40') &&
  index.includes('js/extras.js?v=21') &&
  index.includes('js/dados.js?v=26'),
  'homepage cache should be estilos.css?v=67 / app.js?v=40 / extras.js?v=21 / dados.js?v=26'
);
assert(
  /estilos\.css\?v=65/.test(generator) &&
  product.includes('css/estilos.css?v=65') &&
  category.includes('css/estilos.css?v=65'),
  'generated catalog CSS cache should stay estilos.css?v=65'
);
assert(
  credits.includes('css/estilos.css?v=64'),
  'credits cache should stay estilos.css?v=64'
);

const creditRules = css.match(/\.footer-credit a \{[^}]+\}/g) || [];
const desktopCredit = creditRules.find(rule => !/min-height:\s*44px/.test(rule));
assert(
  desktopCredit &&
  /display:\s*inline-flex/.test(desktopCredit) &&
  /align-items:\s*center/.test(desktopCredit) &&
  !/min-height:\s*44px/.test(desktopCredit),
  'leftover .footer-credit a should be inline-flex and vertically centered, hugging the label on desktop'
);

assert(
  /@media \(max-width:640px\) \{[\s\S]*\.footer-credit a \{ min-height:44px; box-sizing:border-box; \}/.test(css),
  'phones (max-width:640px) should make leftover homepage Shah Hossain min-height:44px'
);

assert(
  /<div class="footer-credit">Desenvolvido por <a href="mailto:shahhossain050187@gmail.com">Shah Hossain<\/a><\/div>/.test(index),
  'homepage footer credit should keep leftover Desenvolvido por Shah Hossain mailto'
);

assert(
  index.includes('>Produtos<') &&
  index.includes('>Frutas<') &&
  index.includes('>Legumes<') &&
  index.includes('>Quem Somos<') &&
  index.includes('>Encomendar<') &&
  index.includes('>Contacto<') &&
  index.includes('>Privacidade<') &&
  index.includes('>Créditos das fotos<') &&
  index.includes('href="creditos.html"'),
  'homepage footer shop-links should stay leftover Produtos / Frutas / Legumes / Quem Somos / Encomendar / Contacto / Privacidade / Créditos das fotos'
);

assert(
  /<nav class="seo-nav" aria-label="Navegação principal">\s*<a href="\.\.\/\.\.\/">Início<\/a>\s*<a href="\.\.\/\.\.\/categorias\/frutas\/">Frutas<\/a>\s*<a href="\.\.\/\.\.\/categorias\/legumes\/">Legumes<\/a>\s*<a href="\.\.\/\.\.\/categorias\/promocoes\/">Promoções<\/a>\s*<\/nav>/.test(category) &&
  /<nav class="seo-nav" aria-label="Navegação principal">\s*<a href="\.\.\/\.\.\/">Início<\/a>\s*<a href="\.\.\/\.\.\/categorias\/frutas\/">Frutas<\/a>\s*<a href="\.\.\/\.\.\/categorias\/legumes\/">Legumes<\/a>\s*<a href="\.\.\/\.\.\/categorias\/promocoes\/">Promoções<\/a>\s*<\/nav>/.test(product),
  'wrapping nav should stay leftover Início / Frutas / Legumes / Promoções'
);

assert(
  category.includes('>Ver produto<') &&
  product.includes('Ver no catálogo e encomendar') &&
  product.includes('href="/?produto=melancia-1-4#produtos"'),
  'catalog Ver produto / Ver no catálogo e encomendar should stay'
);

assert(
  !/@media \(max-width:640px\) \{[\s\S]*\.footer-links a \{ min-height:44px/.test(css),
  'should not redo leftover homepage footer-links tap target'
);
assert(
  !/@media \(max-width:640px\) \{[\s\S]*\.seo-header \.logo \{ min-height:44px; box-sizing:border-box; \}/.test(css),
  'should not redo leftover catalog header-logo tap target (PR #289)'
);
assert(
  !/@media \(max-width:640px\) \{[\s\S]*\.seo-footer a \{ min-height:44px; box-sizing:border-box; \}/.test(css),
  'should not redo leftover catalog footer tap target (PR #288)'
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
  !/\.footer-credit a:focus-visible/.test(css),
  'should not redo leftover footer-credit forest ring (PR #223)'
);
assert(
  !/\.seo-header \.logo \{[^}]*color:\s*var\(--forest\)/.test(css),
  'should not redo leftover forest wordmark on white catalog headers (PR #196)'
);
assert(
  /<a href="\$\{homePath\}">Início<\/a>\s*<a href="\$\{homePath\}categorias\/frutas\/">Frutas<\/a>\s*<a href="\$\{homePath\}categorias\/legumes\/">Legumes<\/a>\s*<a href="\$\{homePath\}categorias\/promocoes\/">Promoções<\/a>/.test(generator) &&
  !/<nav class="seo-nav"[^>]*>[\s\S]*ervas-frescas/.test(generator),
  'generator wrapping nav should stay leftover Início / Frutas / Legumes / Promoções'
);

if (failures.length) {
  console.error('check-footer-credit-tap failed:\n' + failures.map(item => ` - ${item}`).join('\n'));
  process.exit(1);
}
console.log('check-footer-credit-tap: ok');
