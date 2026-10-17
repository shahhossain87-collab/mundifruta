#!/usr/bin/env node
/**
 * Guards leftover credits-page og:image:width / og:image:height on leftover
 * fotos/cabaz_mix.jpeg (500×500). Complementary to leftover homepage
 * og:image width and height (PR #247), leftover credits og:image / Twitter
 * share tags (PR #243), leftover credits og:image:alt (PR #265), and leftover
 * credits twitter:image:alt (PR #266); does not redo leftover homepage
 * og:image:alt (PR #244), leftover homepage twitter:image:alt (PR #245),
 * leftover homepage og:image:width / leftover og:image:height, leftover
 * homepage og:image:type (PR #248), leftover credits share tags, leftover
 * credits og:image:alt, leftover credits twitter:image:alt, leftover
 * credits og:image:type, leftover credits fonts.gstatic.com preconnect
 * (PR #246), leftover credits Open Graph identity (PR #241), leftover
 * credits og:locale (PR #242), leftover credits hreflang (PR #238), leftover
 * credits favicon (draft #201), leftover credits theme-color (PR #250),
 * leftover credits apple status bar (PR #253), leftover credits
 * apple-capable (PR #256), leftover credits color-scheme (PR #258), leftover
 * credits mobile-web-app-capable (PR #262), leftover homepage theme-color
 * (PR #249), leftover homepage apple status bar (PR #252), leftover
 * homepage apple-capable (PR #255), leftover homepage color-scheme
 * (PR #257), leftover homepage mobile-web-app-capable (PR #261), leftover
 * CSS color-scheme (PR #260), leftover catalog theme-color (PR #251),
 * leftover catalog apple status bar (PR #254), leftover catalog
 * apple-capable (PR #264), leftover catalog color-scheme (PR #259), leftover
 * catalog mobile-web-app-capable (PR #263), leftover catalog og:locale
 * (PR #240), leftover homepage lang (PR #239), leftover SEO breadcrumb ›
 * aria-hidden (PR #237), leftover catalog hreflang="x-default" (PR #236),
 * leftover catalog og:image / Twitter share tags (PR #215), leftover
 * wrapping-nav Ervas / Época / Cabazes (PR #218), leftover catalog SEO
 * drafts #195–#199, leftover wrapping-nav / breadcrumb / Ver produto /
 * crawl-link / title / photo / footer forest rings (#208–#214), leftover
 * Encontre-nos Morada maps (PR #235), leftover info-strip maps (PR #234),
 * leftover Avaliações maps hrefs (PR #233), leftover info-strip tel:
 * (PR #232), leftover-ring drafts #141–#190, leftover ticker/html/JS/
 * carousel reduced-motion drafts #200/#202–#204, leftover hero-eyebrow
 * pulse, leftover floating-fruit CSS, leftover 4-item-bar rings, leftover
 * homepage category-tile rings from #194.
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

function jpegSize(buf) {
  let i = 0;
  while (i < buf.length - 8) {
    if (buf[i] === 0xFF && (buf[i + 1] === 0xC0 || buf[i + 1] === 0xC1 || buf[i + 1] === 0xC2)) {
      return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
    }
    i += 1;
  }
  return { width: 0, height: 0 };
}

const shareImage = 'https://mundifruta.com/fotos/cabaz_mix.jpeg';
const shareAlt = 'MUNDIFRUTA — Frutas &amp; Legumes Frescos em Carnaxide';
const creditsCanonical = 'https://mundifruta.com/creditos.html';
const ogImageWidthMeta = '<meta property="og:image:width" content="500"/>';
const ogImageHeightMeta = '<meta property="og:image:height" content="500"/>';
const creditsCanonicalLink = `<link rel="canonical" href="${creditsCanonical}"/>`;
const creditsPreconnect = '<link rel="preconnect" href="https://fonts.googleapis.com">';
const jpeg = jpegSize(shareJpeg);

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
  existsSync(join(root, 'fotos/cabaz_mix.jpeg')),
  'leftover share photo fotos/cabaz_mix.jpeg must stay on disk'
);
assert(
  jpeg.width === 500 && jpeg.height === 500,
  `leftover share photo fotos/cabaz_mix.jpeg must stay 500×500 (got ${jpeg.width}×${jpeg.height})`
);
assert(
  html.includes(`property="og:image" content="${shareImage}"`) &&
  html.includes('name="twitter:card" content="summary_large_image"') &&
  html.includes(`name="twitter:image" content="${shareImage}"`) &&
  html.includes(`property="og:title" content="${shareAlt}"`) &&
  !html.includes('og:image:alt') &&
  !html.includes('twitter:image:alt') &&
  !html.includes('og:image:width') &&
  !html.includes('og:image:height') &&
  !html.includes('og:image:type'),
  'leftover homepage share photo stays; must not redo leftover homepage og:image:alt (PR #244), leftover homepage twitter:image:alt (PR #245), leftover homepage og:image size (PR #247), or leftover homepage og:image:type (PR #248)'
);
assert(
  creditos.includes(creditsCanonicalLink) &&
  creditos.includes(ogImageWidthMeta) &&
  creditos.includes(ogImageHeightMeta) &&
  creditos.includes(creditsPreconnect) &&
  creditos.indexOf(creditsCanonicalLink) < creditos.indexOf(ogImageWidthMeta) &&
  creditos.indexOf(ogImageWidthMeta) < creditos.indexOf(ogImageHeightMeta) &&
  creditos.indexOf(ogImageHeightMeta) < creditos.indexOf(creditsPreconnect),
  'leftover credits og:image:width 500 and leftover og:image:height 500 should sit between leftover canonical and leftover fonts.googleapis.com preconnect'
);
assert(
  (creditos.match(/property="og:image:width"/g) || []).length === 1 &&
  (creditos.match(/property="og:image:height"/g) || []).length === 1,
  'leftover credits og:image size stays a single leftover 500×500 hint'
);
assert(
  !/<meta property="og:image" content=/.test(creditos) &&
  !creditos.includes('og:image:alt') &&
  !creditos.includes('twitter:card') &&
  !/<meta name="twitter:image" content=/.test(creditos) &&
  !creditos.includes('twitter:image:alt') &&
  !creditos.includes('og:image:type'),
  'must not combine leftover credits share tags (PR #243), leftover credits og:image:alt (PR #265), leftover credits twitter:image:alt (PR #266), or leftover credits og:image:type'
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
  !creditos.includes('fonts.gstatic.com') &&
  !creditos.includes('name="theme-color"') &&
  !creditos.includes('apple-mobile-web-app-status-bar-style') &&
  !creditos.includes('apple-mobile-web-app-capable') &&
  !creditos.includes('name="mobile-web-app-capable"') &&
  !creditos.includes('name="color-scheme"'),
  'leftover credits lang, title, back link, and h1 stay; leftover credits hreflang stays out (PR #238); leftover credits fonts.gstatic.com preconnect stays out (PR #246); leftover credits theme-color stays out (PR #250); leftover credits apple status bar stays out (PR #253); leftover credits apple-capable stays out (PR #256); leftover credits mobile-web-app-capable stays out (PR #262); leftover credits color-scheme stays out (PR #258)'
);
assert(
  !creditos.includes('rel="icon"') &&
  !creditos.includes('og:type') &&
  !creditos.includes('og:site_name') &&
  !creditos.includes('og:title') &&
  !creditos.includes('og:description') &&
  !creditos.includes('og:url') &&
  !creditos.includes('og:locale'),
  'must not combine leftover credits favicon, leftover credits Open Graph identity (PR #241), or leftover credits og:locale (PR #242)'
);
assert(
  !html.includes('name="theme-color"') &&
  !html.includes('apple-mobile-web-app-status-bar-style') &&
  !html.includes('name="color-scheme"') &&
  !html.includes('apple-mobile-web-app-capable') &&
  !html.includes('name="mobile-web-app-capable"') &&
  !html.includes('msapplication-TileColor') &&
  html.includes('property="og:locale" content="pt_PT"') &&
  html.includes('hreflang="pt-PT" href="https://mundifruta.com/"') &&
  html.includes('hreflang="x-default" href="https://mundifruta.com/"') &&
  html.includes('<html lang="pt">') &&
  !html.includes('<html lang="pt-PT">'),
  'leftover homepage lang="pt", leftover og:locale pt_PT, and leftover pt-PT + x-default hreflang stay; leftover homepage theme-color stays out (PR #249); leftover homepage apple status bar stays out (PR #252); leftover homepage apple-capable stays out (PR #255); leftover homepage color-scheme stays out (PR #257); leftover homepage mobile-web-app-capable stays out (PR #261)'
);
assert(
  generator.includes('property="og:type" content="website"') &&
  generator.includes('property="og:site_name" content="MUNDIFRUTA"') &&
  generator.includes('property="og:title" content="${esc(title)}"') &&
  generator.includes('property="og:description" content="${esc(description)}"') &&
  generator.includes('property="og:url" content="${canonical}"') &&
  !generator.includes('og:locale') &&
  !generator.includes('og:image') &&
  !generator.includes('og:image:alt') &&
  !generator.includes('og:image:type') &&
  !generator.includes('og:image:width') &&
  !generator.includes('twitter:card') &&
  !generator.includes('twitter:image:alt') &&
  !generator.includes('apple-mobile-web-app-capable') &&
  !generator.includes('name="mobile-web-app-capable"') &&
  !generator.includes('name="color-scheme"') &&
  !generator.includes('theme-color') &&
  category.includes('property="og:type" content="website"') &&
  category.includes('property="og:url" content="https://mundifruta.com/categorias/frutas/"') &&
  !category.includes('og:locale') &&
  !product.includes('og:locale') &&
  !morango.includes('og:locale') &&
  !promocoes.includes('og:locale') &&
  !cabazes.includes('og:locale'),
  'leftover catalog Open Graph identity stays; must not redo leftover catalog og:locale (PR #240), leftover catalog share tags (PR #215), leftover catalog og:image:alt, leftover catalog apple-capable (PR #264), leftover catalog mobile-web-app-capable (PR #263), leftover catalog color-scheme (PR #259), or leftover catalog theme-color (PR #251)'
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
  !category.includes('twitter:image:alt') &&
  !product.includes('og:image:width') &&
  !category.includes('og:image:width'),
  'must not redo leftover category-card h3, leftover SEO footer contacts, leftover catalog favicon, leftover catalog og:image / Twitter cards, or leftover catalog og:image size'
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
  !/^[\s\S]*:root\s*\{[\s\S]*color-scheme:/m.test(css),
  'must not redo leftover catalog forest rings, leftover peach rings, leftover credits rings, leftover SEO header forest wordmark, leftover CSS color-scheme (PR #260), or catalog tabpanel'
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
  console.error('check-credits-og-image-size failed:\n' + failures.map(f => ' - ' + f).join('\n'));
  process.exit(1);
}
console.log('check-credits-og-image-size: ok');
