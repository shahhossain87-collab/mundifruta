#!/usr/bin/env node
/**
 * Guards leftover SEO catalog og:locale="pt_PT" on generated
 * `produtos/` and `categorias/` pages. Homepage already ships leftover
 * og:locale pt_PT next to leftover og:type / leftover og:site_name /
 * leftover og:title / leftover og:description / leftover og:url.
 * Complementary to leftover catalog Open Graph tags on master after
 * #191. Does not redo leftover catalog og:image / Twitter share tags
 * (PR #215), leftover catalog hreflang="x-default" (PR #236), leftover
 * SEO breadcrumb › aria-hidden (PR #237), leftover credits hreflang
 * (PR #238), leftover homepage lang="pt-PT" (PR #239), leftover
 * wrapping-nav Ervas / Época / Cabazes (PR #218), leftover catalog SEO
 * drafts #195–#199 (padding, wordmark, ItemList, favicon,
 * BreadcrumbList), leftover wrapping-nav / breadcrumb / Ver produto /
 * crawl-link / product-title / product-photo / footer forest rings
 * (#208–#214), leftover-ring drafts #141–#190, leftover
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
  html.includes('property="og:locale" content="pt_PT"') &&
  html.includes('hreflang="pt-PT" href="https://mundifruta.com/"') &&
  html.includes('hreflang="x-default" href="https://mundifruta.com/"'),
  'leftover homepage og:locale pt_PT and leftover pt-PT + x-default hreflang stay'
);
assert(
  html.includes('lang="pt"'),
  'leftover homepage lang="pt" stays (do not combine leftover homepage lang)'
);
assert(
  !creditos.includes('hreflang=') &&
  !creditos.includes('property="og:') &&
  !creditos.includes('name="twitter:') &&
  !creditos.includes('rel="icon"'),
  'leftover credits stays without leftover hreflang / leftover share tags / leftover favicon'
);
assert(
  generator.includes('property="og:locale" content="pt_PT"') &&
  generator.includes('property="og:url" content="${canonical}"'),
  'generator should emit leftover og:locale pt_PT next to leftover catalog og:url'
);
assert(
  category.includes('property="og:locale" content="pt_PT"') &&
  category.includes('property="og:url" content="https://mundifruta.com/categorias/frutas/"') &&
  promocoes.includes('property="og:locale" content="pt_PT"') &&
  cabazes.includes('property="og:locale" content="pt_PT"'),
  'leftover category pages should emit leftover og:locale pt_PT'
);
assert(
  product.includes('property="og:locale" content="pt_PT"') &&
  product.includes('property="og:url" content="https://mundifruta.com/produtos/melancia-1-4/"') &&
  morango.includes('property="og:locale" content="pt_PT"'),
  'leftover product pages should emit leftover og:locale pt_PT'
);
assert(
  generator.includes('hreflang="pt-PT" href="${canonical}"') &&
  !generator.includes('hreflang="x-default"') &&
  !category.includes('hreflang="x-default"') &&
  !product.includes('hreflang="x-default"'),
  'must not combine leftover catalog hreflang="x-default"'
);
assert(
  /<nav class="seo-nav" aria-label="Navegação principal">\s*<a href="\.\.\/\.\.\/">Início<\/a>\s*<a href="\.\.\/\.\.\/categorias\/frutas\/">Frutas<\/a>\s*<a href="\.\.\/\.\.\/categorias\/legumes\/">Legumes<\/a>\s*<a href="\.\.\/\.\.\/categorias\/promocoes\/">Promoções<\/a>\s*<\/nav>/.test(category) &&
  /<nav class="seo-breadcrumbs" aria-label="Breadcrumb"><a href="\.\.\/\.\.">Início<\/a><span>›<\/span><span>Frutas<\/span><\/nav>/.test(category) &&
  /<nav class="seo-breadcrumbs" aria-label="Breadcrumb"><a href="\.\.\/\.\.">Início<\/a><span>›<\/span><a href="\.\.\/\.\.\/categorias\/frutas\/">Frutas<\/a><span>›<\/span><span>Melancia 1\/4<\/span><\/nav>/.test(product),
  'visible leftover wrapping Início / Frutas / Legumes / Promoções and leftover Início breadcrumbs must stay'
);
assert(
  !category.includes('aria-hidden="true"') &&
  !product.includes('aria-hidden="true"') &&
  !generator.includes('aria-hidden="true"'),
  'must not combine leftover SEO breadcrumb › aria-hidden'
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
  !category.includes('property="og:image"') &&
  !product.includes('name="twitter:') &&
  !category.includes('name="twitter:'),
  'must not redo leftover category-card h3, leftover SEO footer contacts, leftover catalog favicon, leftover catalog og:image, or leftover catalog Twitter cards'
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
  console.error('check-seo-og-locale failed:\n' + failures.map(f => ' - ' + f).join('\n'));
  process.exit(1);
}
console.log('check-seo-og-locale: ok');
