#!/usr/bin/env node
/**
 * Guards leftover catalog-page og:image:alt on leftover product.alt /
 * leftover homepage category-tile alts. Complementary to leftover
 * homepage og:image:alt (PR #244) and leftover catalog og:image /
 * Twitter share tags (PR #215); does not redo leftover homepage
 * og:image:alt, leftover homepage twitter:image:alt (PR #245), leftover
 * homepage og:image:width / leftover og:image:height (PR #247), leftover
 * homepage og:image:type (PR #248), leftover credits share tags (PR #243),
 * leftover credits og:image:alt (PR #265), leftover credits
 * twitter:image:alt (PR #266), leftover credits og:image size (PR #267),
 * leftover credits og:image:type (PR #268), leftover credits
 * fonts.gstatic.com preconnect (PR #246), leftover credits Open Graph
 * identity (PR #241), leftover credits og:locale (PR #242), leftover
 * credits hreflang (PR #238), leftover credits favicon (draft #201),
 * leftover credits theme-color (PR #250), leftover credits apple status
 * bar (PR #253), leftover credits apple-capable (PR #256), leftover
 * credits color-scheme (PR #258), leftover credits
 * mobile-web-app-capable (PR #262), leftover homepage theme-color
 * (PR #249), leftover homepage apple status bar (PR #252), leftover
 * homepage apple-capable (PR #255), leftover homepage color-scheme
 * (PR #257), leftover homepage mobile-web-app-capable (PR #261), leftover
 * CSS color-scheme (PR #260), leftover catalog theme-color (PR #251),
 * leftover catalog apple status bar (PR #254), leftover catalog
 * apple-capable (PR #264), leftover catalog color-scheme (PR #259), leftover
 * catalog mobile-web-app-capable (PR #263), leftover catalog og:locale
 * (PR #240), leftover homepage lang (PR #239), leftover SEO breadcrumb ›
 * aria-hidden (PR #237), leftover catalog hreflang="x-default" (PR #236),
 * leftover catalog og:image / Twitter share tags, leftover catalog
 * twitter:image:alt, leftover catalog og:image:width, leftover catalog
 * og:image:type, leftover wrapping-nav Ervas / Época / Cabazes (PR #218),
 * leftover catalog SEO drafts #195–#199, leftover wrapping-nav /
 * breadcrumb / Ver produto / crawl-link / title / photo / footer forest
 * rings (#208–#214), leftover Encontre-nos Morada maps (PR #235), leftover
 * info-strip maps (PR #234), leftover Avaliações maps hrefs (PR #233),
 * leftover info-strip tel: (PR #232), leftover-ring drafts #141–#190,
 * leftover ticker/html/JS/carousel reduced-motion drafts #200/#202–#204,
 * leftover hero-eyebrow pulse, leftover floating-fruit CSS, leftover
 * 4-item-bar rings, leftover homepage category-tile rings from #194.
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
const legumes = readFileSync(join(root, 'categorias/legumes/index.html'), 'utf8');
const ervas = readFileSync(join(root, 'categorias/ervas-frescas/index.html'), 'utf8');
const epoca = readFileSync(join(root, 'categorias/frutas-da-epoca/index.html'), 'utf8');
const promocoes = readFileSync(join(root, 'categorias/promocoes/index.html'), 'utf8');
const cabazes = readFileSync(join(root, 'categorias/cabazes/index.html'), 'utf8');
const creditos = readFileSync(join(root, 'creditos.html'), 'utf8');

const failures = [];
const assert = (cond, msg) => { if (!cond) failures.push(msg); };

const shareImage = 'https://mundifruta.com/fotos/cabaz_mix.jpeg';
const shareAlt = 'MUNDIFRUTA — Frutas &amp; Legumes Frescos em Carnaxide';
const fontsPreconnect = '<link rel="preconnect" href="https://fonts.googleapis.com">';
const ogImageAltMeta = '<meta property="og:image:alt" content="${esc(imageAlt)}"/>';
const productAlt = 'Quarto de melancia com sementes pretas em fundo branco';
const morangoAlt = 'Morangos frescos isolados em fundo branco';
const frutasAlt = 'Seleção de frutas frescas';
const legumesAlt = 'Seleção apenas de legumes frescos';
const ervasAlt = 'Ervas frescas e aromáticas';
const epocaAlt = 'Fruta fresca da época';
const promoAlt = 'Promoções e destaques da semana';
const cabazesAlt = 'Cabazes de frutas e legumes';

function leftoverAlt(page, alt, canonical) {
  const meta = `<meta property="og:image:alt" content="${alt}"/>`;
  const canonicalLink = `<link rel="canonical" href="${canonical}"/>`;
  assert(
    page.includes(canonicalLink) &&
    page.includes(meta) &&
    page.includes(fontsPreconnect) &&
    page.indexOf(canonicalLink) < page.indexOf(meta) &&
    page.indexOf(meta) < page.indexOf(fontsPreconnect),
    `leftover catalog og:image:alt "${alt}" should sit between leftover canonical and leftover fonts.googleapis.com preconnect`
  );
  assert(
    (page.match(/property="og:image:alt"/g) || []).length === 1,
    `leftover catalog og:image:alt stays a single leftover hint for ${canonical}`
  );
  assert(
    !/<meta property="og:image" content=/.test(page) &&
    !page.includes('twitter:card') &&
    !/<meta name="twitter:image" content=/.test(page) &&
    !page.includes('twitter:image:alt') &&
    !page.includes('og:image:width') &&
    !page.includes('og:image:height') &&
    !page.includes('og:image:type'),
    `must not redo leftover catalog og:image / Twitter cards (PR #215), leftover catalog twitter:image:alt, leftover catalog og:image size, or leftover catalog og:image:type on ${canonical}`
  );
}

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
  generator.includes(ogImageAltMeta) &&
  generator.includes("imageAlt: category.imageAlt") &&
  generator.includes('imageAlt: product.alt || product.nome') &&
  !generator.includes("image: 'fotos/") &&
  !generator.includes('property="og:image" content=') &&
  !generator.includes('og:image:width') &&
  !generator.includes('og:image:type') &&
  !generator.includes('twitter:card') &&
  !generator.includes('twitter:image:alt') &&
  !generator.includes('og:locale') &&
  !generator.includes('apple-mobile-web-app-capable') &&
  !generator.includes('name="mobile-web-app-capable"') &&
  !generator.includes('name="color-scheme"') &&
  !generator.includes('theme-color'),
  'leftover catalog generator emits leftover og:image:alt only; must not redo leftover catalog share photos (PR #215), leftover catalog twitter:image:alt, leftover catalog og:image size, leftover catalog og:image:type, leftover catalog og:locale (PR #240), leftover catalog apple-capable (PR #264), leftover catalog mobile-web-app-capable (PR #263), leftover catalog color-scheme (PR #259), or leftover catalog theme-color (PR #251)'
);
assert(
  generator.includes("imageAlt: 'Seleção de frutas frescas'") &&
  generator.includes("imageAlt: 'Seleção apenas de legumes frescos'") &&
  generator.includes("imageAlt: 'Ervas frescas e aromáticas'") &&
  generator.includes("imageAlt: 'Fruta fresca da época'") &&
  generator.includes("imageAlt: 'Promoções e destaques da semana'") &&
  generator.includes("imageAlt: 'Cabazes de frutas e legumes'") &&
  html.includes('alt="Seleção de frutas frescas"') &&
  html.includes('alt="Seleção apenas de legumes frescos"') &&
  html.includes('alt="Ervas frescas e aromáticas"') &&
  html.includes('alt="Fruta fresca da época"') &&
  html.includes('alt="Promoções e destaques da semana"') &&
  html.includes('alt="Cabazes de frutas e legumes"'),
  'leftover catalog category og:image:alt reuses leftover homepage category-tile alts'
);
leftoverAlt(product, productAlt, 'https://mundifruta.com/produtos/melancia-1-4/');
leftoverAlt(morango, morangoAlt, 'https://mundifruta.com/produtos/morango-500g/');
leftoverAlt(category, frutasAlt, 'https://mundifruta.com/categorias/frutas/');
leftoverAlt(legumes, legumesAlt, 'https://mundifruta.com/categorias/legumes/');
leftoverAlt(ervas, ervasAlt, 'https://mundifruta.com/categorias/ervas-frescas/');
leftoverAlt(epoca, epocaAlt, 'https://mundifruta.com/categorias/frutas-da-epoca/');
leftoverAlt(promocoes, promoAlt, 'https://mundifruta.com/categorias/promocoes/');
leftoverAlt(cabazes, cabazesAlt, 'https://mundifruta.com/categorias/cabazes/');
assert(
  !creditos.includes('og:image:alt') &&
  !/<meta property="og:image" content=/.test(creditos) &&
  !creditos.includes('twitter:card') &&
  !/<meta name="twitter:image" content=/.test(creditos) &&
  !creditos.includes('twitter:image:alt') &&
  !creditos.includes('og:image:width') &&
  !creditos.includes('og:image:height') &&
  !creditos.includes('og:image:type'),
  'must not combine leftover credits share tags (PR #243), leftover credits og:image:alt (PR #265), leftover credits twitter:image:alt (PR #266), leftover credits og:image size (PR #267), or leftover credits og:image:type (PR #268)'
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
  generator.includes('hreflang="pt-PT" href="${canonical}"') &&
  !generator.includes('hreflang="x-default"') &&
  category.includes('hreflang="pt-PT" href="https://mundifruta.com/categorias/frutas/"') &&
  !category.includes('hreflang="x-default"') &&
  !promocoes.includes('hreflang="x-default"') &&
  !cabazes.includes('hreflang="x-default"') &&
  product.includes('hreflang="pt-PT" href="https://mundifruta.com/produtos/melancia-1-4/"') &&
  !product.includes('hreflang="x-default"') &&
  !morango.includes('hreflang="x-default"'),
  'leftover catalog Open Graph identity stays; must not redo leftover catalog hreflang="x-default" (PR #236)'
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
  !category.includes('rel="icon"'),
  'must not redo leftover category-card h3, leftover SEO footer contacts, or leftover catalog favicon'
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
  console.error('check-catalog-og-image-alt failed:\n' + failures.map(f => ' - ' + f).join('\n'));
  process.exit(1);
}
console.log('check-catalog-og-image-alt: ok');
