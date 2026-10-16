#!/usr/bin/env node
/**
 * Guards leftover homepage og:image:type image/jpeg on leftover
 * fotos/cabaz_mix.jpeg. Homepage already ships leftover og:image /
 * leftover og:title / leftover twitter:card / leftover twitter:image.
 * Complementary to leftover homepage og:image:width / leftover
 * og:image:height (PR #247), leftover homepage twitter:image:alt
 * (PR #245), and leftover homepage og:image:alt (PR #244); does not
 * redo leftover homepage og:image size, leftover homepage
 * twitter:image:alt, leftover homepage og:image:alt, leftover
 * credits fonts.gstatic.com preconnect (PR #246), leftover credits
 * og:image / Twitter share tags (PR #243), leftover credits Open
 * Graph identity (PR #241), leftover credits og:locale (PR #242),
 * leftover catalog og:locale (PR #240), leftover homepage lang
 * (PR #239), leftover credits hreflang (PR #238), leftover SEO
 * breadcrumb › aria-hidden (PR #237), leftover catalog
 * hreflang="x-default" (PR #236), leftover catalog og:image /
 * Twitter share tags (PR #215), leftover wrapping-nav Ervas /
 * Época / Cabazes (PR #218), leftover catalog SEO drafts #195–#199,
 * leftover wrapping-nav / breadcrumb / Ver produto / crawl-link /
 * title / photo / footer forest rings (#208–#214), leftover
 * Encontre-nos Morada maps (PR #235), leftover info-strip maps
 * (PR #234), leftover Avaliações maps hrefs (PR #233), leftover
 * info-strip tel: (PR #232), leftover-ring drafts #141–#190,
 * leftover ticker/html/JS/carousel reduced-motion drafts
 * #200/#202–#204, leftover credits-page favicon (draft #201),
 * leftover hero-eyebrow pulse, leftover floating-fruit CSS,
 * leftover 4-item-bar rings, leftover homepage category-tile rings
 * from #194.
 */
import { readFileSync, existsSync } from 'node:fs';
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
const shareJpeg = readFileSync(join(root, 'fotos/cabaz_mix.jpeg'));

const failures = [];
const assert = (cond, msg) => { if (!cond) failures.push(msg); };

const shareImage = 'https://mundifruta.com/fotos/cabaz_mix.jpeg';
const shareTitle = 'MUNDIFRUTA — Frutas &amp; Legumes Frescos em Carnaxide';
const imageMeta = '<meta property="og:image" content="https://mundifruta.com/fotos/cabaz_mix.jpeg"/>';
const typeMeta = '<meta property="og:image:type" content="image/jpeg"/>';
const urlMeta = '<meta property="og:url" content="https://mundifruta.com/"/>';

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
  html.includes(imageMeta) &&
  html.includes(typeMeta) &&
  html.includes(`property="og:title" content="${shareTitle}"`) &&
  html.includes('name="twitter:card" content="summary_large_image"') &&
  html.includes(`name="twitter:title" content="${shareTitle}"`) &&
  html.includes(`name="twitter:image" content="${shareImage}"`),
  'leftover homepage og:image:type image/jpeg should sit with leftover cabaz_mix.jpeg'
);
assert(
  html.indexOf(imageMeta) < html.indexOf(typeMeta) &&
  html.indexOf(typeMeta) < html.indexOf(urlMeta),
  'leftover homepage og:image:type should sit between leftover og:image and leftover og:url'
);
assert(
  (html.match(/og:image:type/g) || []).length === 1,
  'leftover homepage og:image:type stays a single leftover hint'
);
assert(
  !html.includes('og:image:alt') &&
  !html.includes('twitter:image:alt') &&
  !html.includes('og:image:width') &&
  !html.includes('og:image:height') &&
  !html.includes('name="theme-color"'),
  'must not combine leftover homepage og:image:alt (PR #244), leftover homepage twitter:image:alt (PR #245), leftover homepage og:image size (PR #247), or leftover theme-color'
);
assert(
  existsSync(join(root, 'fotos/cabaz_mix.jpeg')),
  'leftover homepage share photo fotos/cabaz_mix.jpeg must stay on disk'
);
assert(
  shareJpeg[0] === 0xFF && shareJpeg[1] === 0xD8 && shareJpeg[2] === 0xFF,
  'leftover homepage share photo fotos/cabaz_mix.jpeg must stay a JPEG so leftover og:image:type image/jpeg stays honest'
);
assert(
  html.includes('property="og:locale" content="pt_PT"') &&
  html.includes('hreflang="pt-PT" href="https://mundifruta.com/"') &&
  html.includes('hreflang="x-default" href="https://mundifruta.com/"') &&
  html.includes('<html lang="pt">') &&
  !html.includes('<html lang="pt-PT">'),
  'leftover homepage lang="pt", leftover og:locale pt_PT, and leftover pt-PT + x-default hreflang stay'
);
assert(
  creditos.includes('<html lang="pt-PT">') &&
  creditos.includes('rel="canonical" href="https://mundifruta.com/creditos.html"') &&
  !creditos.includes('hreflang=') &&
  creditos.includes('<title>Créditos das fotos — MUNDIFRUTA</title>') &&
  creditos.includes('class="credits-back" href="index.html"') &&
  creditos.includes('>← Voltar à loja</a>') &&
  creditos.includes('<h1>Créditos das fotos</h1>') &&
  creditos.includes('<link rel="preconnect" href="https://fonts.googleapis.com">') &&
  !creditos.includes('fonts.gstatic.com'),
  'leftover credits lang, title, back link, and h1 stay; leftover credits hreflang stays out (PR #238); leftover credits fonts.gstatic.com preconnect stays out (PR #246)'
);
assert(
  !creditos.includes('rel="icon"') &&
  !creditos.includes('og:image') &&
  !creditos.includes('og:image:alt') &&
  !creditos.includes('og:image:type') &&
  !creditos.includes('og:image:width') &&
  !creditos.includes('og:image:height') &&
  !creditos.includes('twitter:card') &&
  !creditos.includes('twitter:image:alt') &&
  !creditos.includes('og:type') &&
  !creditos.includes('og:locale'),
  'must not combine leftover credits favicon, leftover credits share tags, leftover credits twitter:image:alt, leftover credits Open Graph identity, leftover credits og:locale, leftover credits og:image type, or leftover credits og:image size'
);
assert(
  generator.includes('property="og:type" content="website"') &&
  generator.includes('property="og:site_name" content="MUNDIFRUTA"') &&
  generator.includes('property="og:title" content="${esc(title)}"') &&
  generator.includes('property="og:description" content="${esc(description)}"') &&
  generator.includes('property="og:url" content="${canonical}"') &&
  !generator.includes('og:locale') &&
  !generator.includes('og:image') &&
  !generator.includes('og:image:type') &&
  !generator.includes('og:image:width') &&
  !generator.includes('twitter:card') &&
  !generator.includes('twitter:image:alt') &&
  category.includes('property="og:type" content="website"') &&
  category.includes('property="og:url" content="https://mundifruta.com/categorias/frutas/"') &&
  !category.includes('og:locale') &&
  !product.includes('og:locale') &&
  !morango.includes('og:locale') &&
  !promocoes.includes('og:locale') &&
  !cabazes.includes('og:locale') &&
  !category.includes('og:image:type') &&
  !product.includes('og:image:type') &&
  !morango.includes('og:image:type') &&
  !promocoes.includes('og:image:type') &&
  !cabazes.includes('og:image:type'),
  'leftover catalog Open Graph identity stays; must not redo leftover catalog og:locale (PR #240), leftover catalog share tags (PR #215), leftover catalog og:image type, or leftover catalog og:image size'
);
assert(
  generator.includes('hreflang="pt-PT" href="${canonical}"') &&
  !generator.includes('hreflang="x-default"') &&
  category.includes('hreflang="pt-PT" href="https://mundifruta.com/categorias/frutas/"') &&
  !category.includes('hreflang="x-default"') &&
  !promocoes.includes('hreflang="x-default"') &&
  !cabazes.includes('hreflang="x-default"') &&
  product.includes('hreflang="pt-PT" href="https://mundifruta.com/produtos/melancia-1-4/"') &&
  !product.includes('hreflang="x-default"') &&
  !morango.includes('hreflang="x-default"'),
  'must not redo leftover catalog hreflang="x-default" (PR #236)'
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
  'must not combine leftover SEO breadcrumb › aria-hidden (PR #237)'
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
  !product.includes('twitter:card') &&
  !category.includes('twitter:card') &&
  !product.includes('twitter:image:alt') &&
  !category.includes('twitter:image:alt'),
  'must not redo leftover category-card h3, leftover SEO footer contacts, leftover catalog favicon, or leftover catalog og:image / Twitter cards'
);
assert(
  !product.includes('hamburger') &&
  !category.includes('hamburger') &&
  !generator.includes('hamburger') &&
  !product.includes('aria-expanded') &&
  !html.includes('aria-expanded') &&
  !creditos.includes('hamburger'),
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
  !/\.credits-wrap a:focus-visible/.test(css) &&
  !/\.credits-back:focus-visible/.test(css) &&
  !/\.logo:focus-visible/.test(css) &&
  !/\.btn-wa:focus-visible/.test(css) &&
  !/\.feature-add:focus-visible/.test(css) &&
  !/\.float-cart:focus-visible/.test(css) &&
  !/\.order-optional-toggle:focus-visible/.test(css) &&
  !/\.mb-item:focus-visible/.test(css) &&
  !/\.seo-header \.logo \{[^}]*color:var\(--forest\)/.test(css) &&
  !html.includes('role="tabpanel"') &&
  !html.includes('name="theme-color"'),
  'must not redo leftover catalog forest rings, leftover peach rings, leftover credits rings, leftover SEO header forest wordmark, catalog tabpanel, or leftover theme-color'
);
assert(
  html.includes('Explorar o catálogo') &&
  html.includes('categorias/frutas/') &&
  html.includes('href="creditos.html">Créditos das fotos</a>') &&
  !app.includes('function irParaSeccao') &&
  !extras.includes("behavior: reduzir ? 'auto' : 'smooth'"),
  'leftover homepage crawl links and leftover footer credits link stay; must not rewrite leftover JS scroll helper'
);

if (failures.length) {
  console.error('check-homepage-og-image-type failed:\n' + failures.map(f => ' - ' + f).join('\n'));
  process.exit(1);
}
console.log('check-homepage-og-image-type: ok');
