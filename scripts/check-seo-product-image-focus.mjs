#!/usr/bin/env node
/**
 * Guards leftover SEO category-card product-photo keyboard rings
 * (`.seo-product-image`: leftover Melancia 1/4 and other product
 * photos). Complementary to leftover wrapping-nav forest ring (PR #208),
 * leftover breadcrumb forest ring (PR #209), leftover Ver produto
 * forest ring (PR #210), leftover Explorar o catálogo forest ring
 * (PR #211), and leftover product-title forest ring (PR #212). Does not
 * redo leftover SEO nav / breadcrumb / Ver produto / crawl-link /
 * product-title rings, leftover catalog SEO drafts #195–#199,
 * leftover-ring drafts #141–#190, leftover float-cart / Hora toggle
 * rings (#205/#206), leftover ticker/html/JS/carousel reduced-motion
 * drafts #200/#202–#204, leftover credits-page favicon (draft #201),
 * leftover hero-eyebrow pulse, leftover floating-fruit CSS, or leftover
 * 4-item-bar rings.
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
  generator.includes("cssPath: '../../css/estilos.css?v=71'") &&
  product.includes('css/estilos.css?v=71') &&
  category.includes('css/estilos.css?v=71'),
  'generated catalog pages should cache-bust estilos.css?v=71'
);
assert(
  creditos.includes('css/estilos.css?v=64'),
  'creditos.html cache stays estilos.css?v=64 (do not combine leftover credits favicon)'
);
assert(
  /\.seo-product-image:focus-visible/.test(css) &&
  css.includes('outline:3px solid var(--forest)'),
  'leftover SEO product photos should join the leftover catalog :focus-visible forest ring'
);
assert(
  !/\.seo-nav a:focus-visible/.test(css) &&
  !/\.seo-breadcrumbs a:focus-visible/.test(css) &&
  !/\.seo-text-link:focus-visible/.test(css) &&
  !/\.seo-crawl-links a:focus-visible/.test(css) &&
  !/\.seo-product-card h2 a:focus-visible/.test(css) &&
  !/\.seo-footer a:focus-visible/.test(css),
  'must not combine leftover wrapping-nav, breadcrumb, Ver produto, crawl-link, title, or footer forest rings in this run'
);
assert(
  /<a href="\.\.\/\.\.\/produtos\/melancia-1-4\/" class="seo-product-image">/.test(category) &&
  (category.match(/class="seo-product-image"/g) || []).length > 1 &&
  /<h2><a href="\.\.\/\.\.\/produtos\/melancia-1-4\/">Melancia 1\/4<\/a><\/h2>/.test(category) &&
  category.includes('>Ver produto</a>') &&
  product.includes('Ver no catálogo e encomendar'),
  'visible leftover category product photos stay; leftover titles, Ver produto, and leftover product-page order CTA stay'
);
assert(
  /<nav class="seo-nav" aria-label="Navegação principal">\s*<a href="\.\.\/\.\.\/">Início<\/a>\s*<a href="\.\.\/\.\.\/categorias\/frutas\/">Frutas<\/a>\s*<a href="\.\.\/\.\.\/categorias\/legumes\/">Legumes<\/a>\s*<a href="\.\.\/\.\.\/categorias\/promocoes\/">Promoções<\/a>\s*<\/nav>/.test(category) &&
  /<nav class="seo-breadcrumbs" aria-label="Breadcrumb"><a href="\.\.\/\.\.">Início<\/a><span>›<\/span><span>Frutas<\/span><\/nav>/.test(category),
  'visible leftover wrapping Início / Frutas / Legumes / Promoções and leftover category Início breadcrumb must stay'
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
  !/\.logo:focus-visible/.test(css) &&
  !/\.btn-wa:focus-visible/.test(css) &&
  !/\.feature-add:focus-visible/.test(css) &&
  !/\.float-cart:focus-visible/.test(css) &&
  !/\.order-optional-toggle:focus-visible/.test(css) &&
  !/\.mb-item:focus-visible/.test(css) &&
  !/\.seo-header \.logo \{[^}]*color:var\(--forest\)/.test(css) &&
  !html.includes('role="tabpanel"'),
  'must not redo leftover peach rings, float-cart / Hora / 4-item-bar rings, SEO header forest wordmark, or catalog tabpanel'
);
assert(
  html.includes('Explorar o catálogo') &&
  html.includes('categorias/frutas/') &&
  !app.includes('function irParaSeccao') &&
  !extras.includes("behavior: reduzir ? 'auto' : 'smooth'"),
  'leftover homepage crawl links stay; must not rewrite leftover JS scroll helper'
);

if (failures.length) {
  console.error('check-seo-product-image-focus failed:\n' + failures.map(f => ' - ' + f).join('\n'));
  process.exit(1);
}
console.log('check-seo-product-image-focus: ok');
