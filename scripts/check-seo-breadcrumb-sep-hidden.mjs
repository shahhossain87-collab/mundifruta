#!/usr/bin/env node
/**
 * Guards leftover SEO breadcrumb › separators with aria-hidden="true"
 * on generated `produtos/` and `categorias/` pages. Homepage leftover
 * `.crumb-sep` already ships leftover aria-hidden. Complementary to
 * leftover catalog SEO drafts #195–#199 (padding, wordmark, ItemList,
 * favicon, BreadcrumbList) and leftover wrapping-nav / breadcrumb
 * forest rings (#208–#209). Does not redo leftover catalog
 * hreflang="x-default" (PR #236), leftover wrapping-nav Ervas /
 * Época / Cabazes (PR #218), leftover catalog og:image / Twitter
 * share tags (PR #215), leftover-ring drafts #141–#190, leftover
 * ticker/html/JS/carousel reduced-motion drafts #200/#202–#204,
 * leftover credits-page favicon (draft #201), leftover hero-eyebrow
 * pulse, leftover floating-fruit CSS, leftover 4-item-bar rings, or
 * leftover Encontre-nos / info-strip / Avaliações maps work
 * (#232–#235).
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
const morango = readFileSync(join(root, 'produtos/morango-500g/index.html'), 'utf8');
const category = readFileSync(join(root, 'categorias/frutas/index.html'), 'utf8');
const promocoes = readFileSync(join(root, 'categorias/promocoes/index.html'), 'utf8');
const cabazes = readFileSync(join(root, 'categorias/cabazes/index.html'), 'utf8');
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
  generator.includes("cssPath: '../../css/estilos.css?v=65'") &&
  product.includes('css/estilos.css?v=65') &&
  category.includes('css/estilos.css?v=65'),
  'generated catalog pages should keep estilos.css?v=65'
);
assert(
  creditos.includes('css/estilos.css?v=64'),
  'creditos.html cache stays estilos.css?v=64 (do not combine leftover credits favicon)'
);
assert(
  html.includes('class="crumb-sep" aria-hidden="true"') &&
  html.includes('hreflang="pt-PT" href="https://mundifruta.com/"') &&
  html.includes('hreflang="x-default" href="https://mundifruta.com/"'),
  'leftover homepage crumb-sep aria-hidden and leftover pt-PT + x-default hreflang stay'
);
assert(
  !creditos.includes('hreflang='),
  'leftover credits page stays without hreflang (do not combine)'
);
assert(
  !generator.includes('hreflang="x-default"') &&
  !category.includes('hreflang="x-default"') &&
  !product.includes('hreflang="x-default"'),
  'must not redo leftover catalog hreflang x-default (PR #236)'
);
assert(
  generator.includes('<a href="../..">Início</a><span aria-hidden="true">›</span><span>${esc(category.label)}</span>') &&
  generator.includes('<a href="../..">Início</a><span aria-hidden="true">›</span><a href="../../categorias/${category.slug}/">${esc(category.label)}</a><span aria-hidden="true">›</span><span>${esc(product.nome)}</span>'),
  'generator should hide leftover SEO breadcrumb › separators from assistive tech'
);
assert(
  /<nav class="seo-breadcrumbs" aria-label="Breadcrumb"><a href="\.\.\/\.\.">Início<\/a><span aria-hidden="true">›<\/span><span>Frutas<\/span><\/nav>/.test(category) &&
  /<nav class="seo-breadcrumbs" aria-label="Breadcrumb"><a href="\.\.\/\.\.">Início<\/a><span aria-hidden="true">›<\/span><span>Promoções<\/span><\/nav>/.test(promocoes) &&
  /<nav class="seo-breadcrumbs" aria-label="Breadcrumb"><a href="\.\.\/\.\.">Início<\/a><span aria-hidden="true">›<\/span><span>Cabazes<\/span><\/nav>/.test(cabazes),
  'leftover category breadcrumbs should keep visible Início › label and hide leftover ›'
);
assert(
  /<nav class="seo-breadcrumbs" aria-label="Breadcrumb"><a href="\.\.\/\.\.">Início<\/a><span aria-hidden="true">›<\/span><a href="\.\.\/\.\.\/categorias\/frutas\/">Frutas<\/a><span aria-hidden="true">›<\/span><span>Melancia 1\/4<\/span><\/nav>/.test(product) &&
  /<nav class="seo-breadcrumbs" aria-label="Breadcrumb"><a href="\.\.\/\.\.">Início<\/a><span aria-hidden="true">›<\/span><a href="\.\.\/\.\.\/categorias\/frutas\/">Frutas<\/a><span aria-hidden="true">›<\/span><span>Morango 500g<\/span><\/nav>/.test(morango),
  'leftover product breadcrumbs should keep visible Início › category › name and hide leftover ›'
);
assert(
  !/<nav class="seo-breadcrumbs"[^>]*>[^<]*<span>›<\/span>/.test(category) &&
  !/<nav class="seo-breadcrumbs"[^>]*>[^<]*<span>›<\/span>/.test(product) &&
  !generator.includes('<span>›</span>'),
  'leftover SEO breadcrumb › must not stay as an unhidden span'
);
assert(
  /<nav class="seo-nav" aria-label="Navegação principal">\s*<a href="\.\.\/\.\.\/">Início<\/a>\s*<a href="\.\.\/\.\.\/categorias\/frutas\/">Frutas<\/a>\s*<a href="\.\.\/\.\.\/categorias\/legumes\/">Legumes<\/a>\s*<a href="\.\.\/\.\.\/categorias\/promocoes\/">Promoções<\/a>\s*<\/nav>/.test(category),
  'visible leftover wrapping Início / Frutas / Legumes / Promoções must stay'
);
assert(
  /<footer class="seo-footer"><a href="\.\.\/\.\.\/">MUNDIFRUTA<\/a> · Frutas e legumes frescos em Carnaxide\.<\/footer>/.test(category) &&
  /<h2><a href="\.\.\/\.\.\/produtos\/melancia-1-4\/">Melancia 1\/4<\/a><\/h2>/.test(category) &&
  category.includes('>Ver produto</a>') &&
  product.includes('Ver no catálogo e encomendar') &&
  !category.includes('<h3>') &&
  !product.includes('mailto:shahhossain87@gmail.com') &&
  !product.includes('rel="icon"') &&
  !category.includes('rel="icon"') &&
  !product.includes('property="og:image"') &&
  !category.includes('property="og:image"'),
  'must not redo leftover category-card h3, leftover SEO footer contacts, leftover catalog favicon, or leftover catalog og:image'
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
  !/\.seo-nav a:focus-visible/.test(css) &&
  !/\.seo-breadcrumbs a:focus-visible/.test(css) &&
  !/\.seo-text-link:focus-visible/.test(css) &&
  !/\.seo-crawl-links a:focus-visible/.test(css) &&
  !/\.seo-product-card h2 a:focus-visible/.test(css) &&
  !/\.seo-product-image:focus-visible/.test(css) &&
  !/\.seo-footer a:focus-visible/.test(css) &&
  !/\.logo:focus-visible/.test(css) &&
  !/\.btn-wa:focus-visible/.test(css) &&
  !/\.feature-add:focus-visible/.test(css) &&
  !/\.float-cart:focus-visible/.test(css) &&
  !/\.order-optional-toggle:focus-visible/.test(css) &&
  !/\.mb-item:focus-visible/.test(css) &&
  !/\.seo-header \.logo \{[^}]*color:var\(--forest\)/.test(css) &&
  !html.includes('role="tabpanel"'),
  'must not redo leftover catalog forest rings, leftover peach rings, leftover SEO header forest wordmark, or catalog tabpanel'
);
assert(
  html.includes('Explorar o catálogo') &&
  html.includes('categorias/frutas/') &&
  html.includes('lang="pt"') &&
  !app.includes('function irParaSeccao') &&
  !extras.includes("behavior: reduzir ? 'auto' : 'smooth'"),
  'leftover homepage crawl links and leftover lang="pt" stay; must not rewrite leftover JS scroll helper'
);

if (failures.length) {
  console.error('check-seo-breadcrumb-sep-hidden failed:\n' + failures.map(f => ' - ' + f).join('\n'));
  process.exit(1);
}
console.log('check-seo-breadcrumb-sep-hidden: ok');
