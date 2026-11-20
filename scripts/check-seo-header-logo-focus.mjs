#!/usr/bin/env node
/**
 * Guards leftover catalog header MUNDIFRUTA keyboard rings
 * (`.seo-header .logo`: leftover wrapping header wordmark).
 * Complementary to leftover wrapping-nav forest ring (PR #208), leftover
 * breadcrumb forest ring (PR #209), leftover Ver produto forest ring
 * (PR #210), leftover Explorar o catálogo ring (PR #211 / PR #348), leftover
 * product-page order CTA ring (PR #349), leftover product-title ring
 * (PR #212), leftover product-photo ring (PR #213), leftover catalog
 * footer ring (PR #214), leftover catalog header tap (PR #289), leftover
 * homepage wordmark ring (PR #174), leftover forest wordmark (PR #196),
 * leftover crawl-chip tap (PR #347), leftover wrapping-nav 44px
 * (PR #285), leftover Ver produto 44px (PR #281), leftover
 * `.seo-order-link` 44px (PR #270), leftover wrapping Ervas / Época /
 * Cabazes (PR #218). Does not redo leftover SEO nav / breadcrumb / Ver
 * produto / crawl-chip / title / photo / footer / order-CTA rings,
 * leftover homepage `.logo:focus-visible` (PR #174), leftover catalog
 * SEO drafts #195–#199, leftover-ring drafts #141–#190, leftover
 * float-cart / Hora toggle rings (#205/#206), leftover
 * ticker/html/JS/carousel reduced-motion drafts #200/#202–#204,
 * leftover credits-page favicon (draft #201), leftover hero-eyebrow
 * pulse, leftover floating-fruit CSS, leftover 4-item-bar rings,
 * leftover crawl-chip 44px tap (PR #347), leftover wrapping Ervas /
 * Época / Cabazes (PR #218), leftover wrapping-nav 44px (PR #285),
 * leftover Ver produto 44px (PR #281), leftover `.seo-order-link`
 * 44px / full-width phones (PR #270), leftover combined
 * all-breakpoint crawl-chip 44px, leftover `.seo-header .logo`
 * 44px tap (PR #289), leftover `.seo-header .logo { color:var(--forest) }`
 * (PR #196), or leftover homepage `.btn-prim:focus-visible` (PR #175).
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const css = readFileSync(join(root, 'css/estilos.css'), 'utf8');
const app = readFileSync(join(root, 'js/app.js'), 'utf8');
const extras = readFileSync(join(root, 'js/extras.js'), 'utf8');
const generator = readFileSync(join(root, 'scripts/generate-seo-pages.mjs'), 'utf8');
const product = readFileSync(join(root, 'produtos/melancia-1-4/index.html'), 'utf8');
const category = readFileSync(join(root, 'categorias/frutas/index.html'), 'utf8');
const creditos = readFileSync(join(root, 'creditos.html'), 'utf8');

const failures = [];
const assert = (cond, msg) => { if (!cond) failures.push(msg); };

assert(
  html.includes('css/estilos.css?v=66') && html.includes('js/app.js?v=40'),
  'index.html should keep estilos.css?v=66 and app.js?v=40'
);
assert(
  html.includes('js/extras.js?v=21') && html.includes('js/dados.js?v=26'),
  'homepage extras.js should stay ?v=21 and dados.js should stay ?v=26'
);
assert(
  generator.includes("cssPath: '../../css/estilos.css?v=67'") &&
  product.includes('css/estilos.css?v=67') &&
  category.includes('css/estilos.css?v=67'),
  'generated catalog pages should cache-bust estilos.css?v=67'
);
assert(
  creditos.includes('css/estilos.css?v=64'),
  'creditos.html cache stays estilos.css?v=64 (do not combine leftover credits favicon)'
);
assert(
  /\.seo-header \.logo:focus-visible/.test(css) &&
  css.includes('outline:3px solid var(--forest)'),
  'leftover catalog header MUNDIFRUTA should join the leftover catalog :focus-visible forest ring'
);
const unscopedLogoFocus = css.replace(/\.seo-header \.logo:focus-visible/g, '');
assert(
  !/\.logo:focus-visible/.test(unscopedLogoFocus),
  'must not redo leftover homepage header wordmark keyboard ring (PR #174)'
);
assert(
  !/\.btn-prim:focus-visible/.test(css) &&
  !/\.seo-nav a:focus-visible/.test(css) &&
  !/\.seo-breadcrumbs a:focus-visible/.test(css) &&
  !/\.seo-text-link:focus-visible/.test(css) &&
  !/\.seo-product-card h2 a:focus-visible/.test(css) &&
  !/\.seo-product-image:focus-visible/.test(css) &&
  !/\.seo-footer a:focus-visible/.test(css) &&
  !/\.seo-crawl-links a:focus-visible/.test(css) &&
  !/\.seo-order-link:focus-visible/.test(css),
  'must not combine leftover homepage .btn-prim, wrapping-nav, breadcrumb, Ver produto, title, photo, footer, crawl-chip, or order-CTA forest rings in this run'
);
assert(
  !/\.seo-header \.logo \{[^}]*min-height:4[48]px/.test(css) &&
  !/@media \(max-width:640px\) \{[^}]*\.seo-header \.logo \{[^}]*min-height:4[48]px/.test(css) &&
  !/\.seo-header \.logo \{[^}]*color:var\(--forest\)/.test(css),
  'must not combine leftover catalog header 44px tap (PR #289) or leftover forest wordmark (PR #196) in this run'
);
assert(
  /<a class="logo" href="\.\.\/\.\.\/">MUNDI<span class="logo-accent">FRUTA<\/span><\/a>/.test(product) &&
  /<a class="logo" href="\.\.\/\.\.\/">MUNDI<span class="logo-accent">FRUTA<\/span><\/a>/.test(category),
  'visible leftover catalog header MUNDIFRUTA stays linking to the homepage'
);
assert(
  product.includes('Ver no catálogo e encomendar') &&
  /class="btn-prim seo-order-link" href="\/\?produto=melancia-1-4#produtos"/.test(product),
  'visible leftover product-page order CTA stays Ver no catálogo e encomendar at /?produto=melancia-1-4#produtos'
);
assert(
  /<a href="\.\.\/\.\.">Início<\/a>/.test(category) &&
  category.includes('>Ver produto</a>') &&
  !category.includes('seo-order-link'),
  'visible leftover category Início breadcrumb and leftover Ver produto stay; leftover category pages stay without the order CTA'
);
assert(
  /<a href="\.\.\/\.\.\/">Início<\/a>\s*<a href="\.\.\/\.\.\/categorias\/frutas\/">Frutas<\/a>\s*<a href="\.\.\/\.\.\/categorias\/legumes\/">Legumes<\/a>\s*<a href="\.\.\/\.\.\/categorias\/promocoes\/">Promoções<\/a>\s*<\/nav>/.test(category),
  'visible leftover wrapping Início / Frutas / Legumes / Promoções must stay'
);
assert(
  html.includes('Explorar o catálogo') &&
  /<nav aria-label="Categorias do catálogo"><a href="categorias\/frutas\/">Frutas<\/a><a href="categorias\/legumes\/">Legumes<\/a><a href="categorias\/ervas-frescas\/">Ervas frescas<\/a><a href="categorias\/frutas-da-epoca\/">Frutas da época<\/a><a href="categorias\/promocoes\/">Promoções<\/a><a href="categorias\/cabazes\/">Cabazes<\/a><\/nav>/.test(html),
  'visible leftover Explorar o catálogo crawl links stay Frutas / Legumes / Ervas frescas / Frutas da época / Promoções / Cabazes'
);
assert(
  !product.includes('hamburger') &&
  !category.includes('hamburger') &&
  !generator.includes('hamburger') &&
  !product.includes('aria-expanded') &&
  !html.includes('aria-expanded'),
  'must not add a SEO-page hamburger or leftover hamburger aria-expanded'
);
assert(
  !/\.btn-wa:focus-visible/.test(css) &&
  !/\.feature-add:focus-visible/.test(css) &&
  !/\.float-cart:focus-visible/.test(css) &&
  !/\.order-optional-toggle:focus-visible/.test(css) &&
  !/\.mb-item:focus-visible/.test(css) &&
  !html.includes('role="tabpanel"'),
  'must not redo leftover peach rings, float-cart / Hora / 4-item-bar rings, or catalog tabpanel'
);
assert(
  !app.includes('function irParaSeccao') &&
  !extras.includes("behavior: reduzir ? 'auto' : 'smooth'"),
  'must not rewrite leftover JS scroll helper'
);

if (failures.length) {
  console.error('check-seo-header-logo-focus failed:\n' + failures.map(f => ' - ' + f).join('\n'));
  process.exit(1);
}
console.log('check-seo-header-logo-focus: ok');
