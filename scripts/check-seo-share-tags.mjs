#!/usr/bin/env node
/**
 * Guards leftover SEO catalog share photos (og:image / Twitter cards)
 * on generated `produtos/` and `categorias/` pages. Complementary to
 * leftover catalog SEO drafts #195–#199 (padding, wordmark, ItemList,
 * favicon, BreadcrumbList). Does not redo leftover wrapping-nav /
 * breadcrumb / Ver produto / crawl-link / product-title / product-photo
 * / footer forest rings (#208–#214), leftover-ring drafts #141–#190,
 * leftover float-cart / Hora toggle rings (#205/#206), leftover
 * ticker/html/JS/carousel reduced-motion drafts #200/#202–#204,
 * leftover credits-page favicon (draft #201), leftover hero-eyebrow
 * pulse, leftover floating-fruit CSS, leftover 4-item-bar rings, or
 * draft #192 share/nav/h3/footer (nav expansion, h3, footer contacts).
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
const promocoes = readFileSync(join(root, 'categorias/promocoes/index.html'), 'utf8');
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
  html.includes('property="og:image" content="https://mundifruta.com/fotos/cabaz_mix.jpeg"') &&
  html.includes('name="twitter:card" content="summary_large_image"'),
  'leftover homepage cabaz_mix share photo stays'
);
assert(
  generator.includes('function shareTags') &&
  generator.includes('fotos/cabaz_frutas.jpeg') &&
  generator.includes('fotos/cabaz_legumes.jpeg') &&
  generator.includes('fotos/hortela.jpeg') &&
  generator.includes('fotos/uvas.jpeg') &&
  generator.includes('fotos/morangos.jpeg') &&
  generator.includes('fotos/cabaz_detox.jpeg'),
  'generator should reuse leftover homepage category-tile photos for leftover category share tags'
);
assert(
  category.includes('property="og:image" content="https://mundifruta.com/fotos/cabaz_frutas.jpeg"') &&
  category.includes('property="og:image:alt" content="Seleção de frutas frescas"') &&
  category.includes('name="twitter:card" content="summary_large_image"') &&
  category.includes('name="twitter:image" content="https://mundifruta.com/fotos/cabaz_frutas.jpeg"'),
  'leftover Frutas category page should share leftover cabaz_frutas.jpeg'
);
assert(
  promocoes.includes('property="og:image" content="https://mundifruta.com/fotos/morangos.jpeg"') &&
  promocoes.includes('property="og:image:alt" content="Promoções e destaques da semana"'),
  'leftover Promoções category page should share leftover morangos.jpeg'
);
assert(
  product.includes('property="og:image" content="https://mundifruta.com/fotos/catalogo/melancia-quarto.webp"') &&
  product.includes('name="twitter:image" content="https://mundifruta.com/fotos/catalogo/melancia-quarto.webp"') &&
  product.includes('"image":"https://mundifruta.com/fotos/catalogo/melancia-quarto.webp"'),
  'leftover Melancia 1/4 share photo should match leftover Product JSON-LD image'
);
assert(
  /<nav class="seo-nav" aria-label="Navegação principal">\s*<a href="\.\.\/\.\.\/">Início<\/a>\s*<a href="\.\.\/\.\.\/categorias\/frutas\/">Frutas<\/a>\s*<a href="\.\.\/\.\.\/categorias\/legumes\/">Legumes<\/a>\s*<a href="\.\.\/\.\.\/categorias\/promocoes\/">Promoções<\/a>\s*<\/nav>/.test(category) &&
  /<nav class="seo-breadcrumbs" aria-label="Breadcrumb"><a href="\.\.\/\.\.">Início<\/a><span>›<\/span><span>Frutas<\/span><\/nav>/.test(category),
  'visible leftover wrapping Início / Frutas / Legumes / Promoções and leftover category Início breadcrumb must stay'
);
assert(
  /<footer class="seo-footer"><a href="\.\.\/\.\.\/">MUNDIFRUTA<\/a> · Frutas e legumes frescos em Carnaxide\.<\/footer>/.test(category) &&
  /<h2><a href="\.\.\/\.\.\/produtos\/melancia-1-4\/">Melancia 1\/4<\/a><\/h2>/.test(category) &&
  category.includes('>Ver produto</a>') &&
  product.includes('Ver no catálogo e encomendar') &&
  !category.includes('<h3>') &&
  !product.includes('mailto:shahhossain87@gmail.com') &&
  !product.includes('rel="icon"') &&
  !category.includes('rel="icon"'),
  'must not redo leftover category-card h3, leftover SEO footer contacts, or leftover catalog favicon'
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
  !app.includes('function irParaSeccao') &&
  !extras.includes("behavior: reduzir ? 'auto' : 'smooth'"),
  'leftover homepage crawl links stay; must not rewrite leftover JS scroll helper'
);

if (failures.length) {
  console.error('check-seo-share-tags failed:\n' + failures.map(f => ' - ' + f).join('\n'));
  process.exit(1);
}
console.log('check-seo-share-tags: ok');
