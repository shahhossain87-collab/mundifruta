#!/usr/bin/env node
/**
 * Guards leftover catalog-page og:image:width / leftover og:image:height
 * on leftover product.foto / leftover homepage category-tile JPEGs.
 * Complementary to leftover catalog og:image:type (PR #283), leftover
 * catalog twitter:image:alt (PR #282), leftover catalog og:image:alt
 * (PR #269), and leftover catalog og:image / Twitter share tags
 * (PR #215); leftover og:image size slice of leftover catalog
 * share-photo work. Catalog share photos vary, so leftover width /
 * leftover height are leftover per-file dimensions (do not invent
 * leftover 500×500). Does not redo leftover catalog og:image:type,
 * leftover catalog twitter:image:alt, leftover catalog og:image:alt,
 * leftover catalog share photos, leftover homepage og:image:alt
 * (PR #244), leftover homepage twitter:image:alt (PR #245), leftover
 * homepage og:image size (PR #247), leftover homepage og:image:type
 * (PR #248), leftover credits share tags (PR #243), leftover credits
 * og:image:alt (PR #265), leftover credits twitter:image:alt (PR #266),
 * leftover credits og:image size (PR #267), leftover credits
 * og:image:type (PR #268), leftover wrapping-nav Ervas / Época /
 * Cabazes (PR #218), leftover catalog SEO drafts #195–#199, leftover
 * wrapping-nav / breadcrumb / Ver produto / crawl-link / title /
 * photo / footer forest rings (#208–#214), leftover product-page
 * full-width order CTA (PR #270), leftover category-card Ver produto
 * tap target (PR #281).
 */
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const css = readFileSync(join(root, 'css/estilos.css'), 'utf8');
const app = readFileSync(join(root, 'js/app.js'), 'utf8');
const extras = readFileSync(join(root, 'js/extras.js'), 'utf8');
const generator = readFileSync(join(root, 'scripts/generate-seo-pages.mjs'), 'utf8');
const product = readFileSync(join(root, 'produtos/melancia-1-4/index.html'), 'utf8');
const morango = readFileSync(join(root, 'produtos/morango-500g/index.html'), 'utf8');
const cabazLegumes = readFileSync(join(root, 'produtos/cabaz-de-legumes/index.html'), 'utf8');
const category = readFileSync(join(root, 'categorias/frutas/index.html'), 'utf8');
const legumes = readFileSync(join(root, 'categorias/legumes/index.html'), 'utf8');
const ervas = readFileSync(join(root, 'categorias/ervas-frescas/index.html'), 'utf8');
const epoca = readFileSync(join(root, 'categorias/frutas-da-epoca/index.html'), 'utf8');
const promocoes = readFileSync(join(root, 'categorias/promocoes/index.html'), 'utf8');
const cabazes = readFileSync(join(root, 'categorias/cabazes/index.html'), 'utf8');
const creditos = readFileSync(join(root, 'creditos.html'), 'utf8');
const shareJpeg = readFileSync(join(root, 'fotos/cabaz_mix.jpeg'));
const frutasTile = readFileSync(join(root, 'fotos/cabaz_frutas.jpeg'));
const legumesTile = readFileSync(join(root, 'fotos/cabaz_legumes.jpeg'));
const ervasTile = readFileSync(join(root, 'fotos/hortela.jpeg'));
const epocaTile = readFileSync(join(root, 'fotos/uvas.jpeg'));
const promoTile = readFileSync(join(root, 'fotos/morangos.jpeg'));
const cabazesTile = readFileSync(join(root, 'fotos/cabaz_detox.jpeg'));
const melanciaWebp = readFileSync(join(root, 'fotos/catalogo/melancia-quarto.webp'));
const morangoWebp = readFileSync(join(root, 'fotos/catalogo/morango-500g.webp'));
const cabazLegumesJpeg = readFileSync(join(root, 'fotos/cabaz_legumes.jpeg'));

const failures = [];
const assert = (cond, msg) => { if (!cond) failures.push(msg); };

const shareImage = 'https://mundifruta.com/fotos/cabaz_mix.jpeg';
const shareTitle = 'MUNDIFRUTA — Frutas &amp; Legumes Frescos em Carnaxide';
const fontsPreconnect = '<link rel="preconnect" href="https://fonts.googleapis.com">';
const widthMetaTpl = '<meta property="og:image:width" content="${esc(imageWidth)}"/>';
const heightMetaTpl = '<meta property="og:image:height" content="${esc(imageHeight)}"/>';

function jpegSize(buf) {
  let i = 2;
  while (i + 9 < buf.length) {
    if (buf[i] !== 0xFF) { i += 1; continue; }
    const marker = buf[i + 1];
    if (marker === 0xC0 || marker === 0xC1 || marker === 0xC2) {
      return { width: (buf[i + 7] << 8) | buf[i + 8], height: (buf[i + 5] << 8) | buf[i + 6] };
    }
    if (marker === 0xD8 || marker === 0xD9) { i += 2; continue; }
    const length = (buf[i + 2] << 8) | buf[i + 3];
    i += 2 + length;
  }
  return { width: 0, height: 0 };
}

function webpSize(buf) {
  if (buf.slice(0, 4).toString('ascii') !== 'RIFF' || buf.slice(8, 12).toString('ascii') !== 'WEBP') {
    return { width: 0, height: 0 };
  }
  let i = 12;
  while (i + 8 <= buf.length) {
    const chunk = buf.slice(i, i + 4).toString('ascii');
    const size = buf.readUInt32LE(i + 4);
    const dataStart = i + 8;
    if (chunk === 'VP8X' && buf.length >= dataStart + 10) {
      return {
        width: 1 + (buf[dataStart + 4] | (buf[dataStart + 5] << 8) | (buf[dataStart + 6] << 16)),
        height: 1 + (buf[dataStart + 7] | (buf[dataStart + 8] << 8) | (buf[dataStart + 9] << 16)),
      };
    }
    if (chunk === 'VP8 ' && buf.length >= dataStart + 10) {
      return {
        width: buf.readUInt16LE(dataStart + 6) & 0x3fff,
        height: buf.readUInt16LE(dataStart + 8) & 0x3fff,
      };
    }
    if (chunk === 'VP8L' && buf.length >= dataStart + 5) {
      const bits = buf.readUInt32LE(dataStart + 1);
      return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
    }
    i += 8 + size + (size & 1);
  }
  return { width: 0, height: 0 };
}

function leftoverSize(page, width, height, canonical) {
  const widthMeta = `<meta property="og:image:width" content="${width}"/>`;
  const heightMeta = `<meta property="og:image:height" content="${height}"/>`;
  const canonicalLink = `<link rel="canonical" href="${canonical}"/>`;
  assert(
    page.includes(canonicalLink) &&
    page.includes(widthMeta) &&
    page.includes(heightMeta) &&
    page.includes(fontsPreconnect) &&
    page.indexOf(canonicalLink) < page.indexOf(widthMeta) &&
    page.indexOf(widthMeta) < page.indexOf(heightMeta) &&
    page.indexOf(heightMeta) < page.indexOf(fontsPreconnect),
    `leftover catalog og:image size ${width}×${height} should sit between leftover canonical and leftover fonts.googleapis.com preconnect on ${canonical}`
  );
  assert(
    (page.match(/property="og:image:width"/g) || []).length === 1 &&
    (page.match(/property="og:image:height"/g) || []).length === 1,
    `leftover catalog og:image size stays a single leftover pair for ${canonical}`
  );
  assert(
    !/<meta property="og:image" content=/.test(page) &&
    !page.includes('twitter:card') &&
    !/<meta name="twitter:image" content=/.test(page) &&
    !page.includes('og:image:alt') &&
    !page.includes('twitter:image:alt') &&
    !page.includes('og:image:type'),
    `must not redo leftover catalog og:image / Twitter cards (PR #215), leftover catalog og:image:alt (PR #269), leftover catalog twitter:image:alt (PR #282), or leftover catalog og:image:type (PR #283) on ${canonical}`
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
  html.includes(`property="og:title" content="${shareTitle}"`) &&
  !html.includes('og:image:alt') &&
  !html.includes('twitter:image:alt') &&
  !html.includes('og:image:width') &&
  !html.includes('og:image:height') &&
  !html.includes('og:image:type'),
  'leftover homepage share photo stays; must not redo leftover homepage og:image:alt (PR #244), leftover homepage twitter:image:alt (PR #245), leftover homepage og:image size (PR #247), or leftover homepage og:image:type (PR #248)'
);
assert(
  generator.includes(widthMetaTpl) &&
  generator.includes(heightMetaTpl) &&
  generator.includes('function leftoverImageSize(foto)') &&
  generator.includes('const leftoverCategoryShareFotos') &&
  generator.includes("frutas: 'fotos/cabaz_frutas.jpeg'") &&
  generator.includes("legumes: 'fotos/cabaz_legumes.jpeg'") &&
  generator.includes("'ervas-frescas': 'fotos/hortela.jpeg'") &&
  generator.includes("'frutas-da-epoca': 'fotos/uvas.jpeg'") &&
  generator.includes("promocoes: 'fotos/morangos.jpeg'") &&
  generator.includes("cabazes: 'fotos/cabaz_detox.jpeg'") &&
  generator.includes('leftoverImageSize(leftoverCategoryShareFotos[category.slug])') &&
  generator.includes('leftoverImageSize(product.foto)') &&
  !generator.includes("image: 'fotos/") &&
  !generator.includes('property="og:image" content=') &&
  !generator.includes('og:image:type') &&
  !generator.includes('twitter:card') &&
  !generator.includes('twitter:image:alt') &&
  !generator.includes('og:image:alt') &&
  !generator.includes('og:locale') &&
  !generator.includes('apple-mobile-web-app-capable') &&
  !generator.includes('name="mobile-web-app-capable"') &&
  !generator.includes('name="color-scheme"') &&
  !generator.includes('theme-color'),
  'leftover catalog generator emits leftover og:image:width / leftover og:image:height only; must not redo leftover catalog share photos (PR #215), leftover catalog og:image:alt (PR #269), leftover catalog twitter:image:alt (PR #282), leftover catalog og:image:type (PR #283), leftover catalog og:locale (PR #240), leftover catalog apple-capable (PR #264), leftover catalog mobile-web-app-capable (PR #263), leftover catalog color-scheme (PR #259), or leftover catalog theme-color (PR #251)'
);

const frutasSize = jpegSize(frutasTile);
const legumesSize = jpegSize(legumesTile);
const ervasSize = jpegSize(ervasTile);
const epocaSize = jpegSize(epocaTile);
const promoSize = jpegSize(promoTile);
const cabazesSize = jpegSize(cabazesTile);
const melanciaSize = webpSize(melanciaWebp);
const morangoSize = webpSize(morangoWebp);
const cabazLegumesSize = jpegSize(cabazLegumesJpeg);
const shareSize = jpegSize(shareJpeg);

assert(
  frutasSize.width === 1400 && frutasSize.height === 1400,
  'leftover Frutas category-tile fotos/cabaz_frutas.jpeg must stay 1400×1400 so leftover og:image size stays honest'
);
assert(
  legumesSize.width === 500 && legumesSize.height === 500,
  'leftover Legumes category-tile fotos/cabaz_legumes.jpeg must stay 500×500 so leftover og:image size stays honest'
);
assert(
  ervasSize.width === 629 && ervasSize.height === 612 &&
  epocaSize.width === 629 && epocaSize.height === 612 &&
  promoSize.width === 629 && promoSize.height === 612,
  'leftover Ervas / Época / Promoções category-tile JPEGs must stay 629×612 so leftover og:image size stays honest'
);
assert(
  cabazesSize.width === 500 && cabazesSize.height === 500,
  'leftover Cabazes category-tile fotos/cabaz_detox.jpeg must stay 500×500 so leftover og:image size stays honest'
);
assert(
  melanciaSize.width === 1400 && melanciaSize.height === 1400,
  'leftover Melancia 1/4 product photo must stay 1400×1400 so leftover og:image size stays honest'
);
assert(
  morangoSize.width === 1400 && morangoSize.height === 865,
  'leftover Morango 500g product photo must stay 1400×865 so leftover og:image size stays honest'
);
assert(
  cabazLegumesSize.width === 500 && cabazLegumesSize.height === 500,
  'leftover Cabaz de Legumes photo fotos/cabaz_legumes.jpeg must stay 500×500 so leftover og:image size stays honest'
);
assert(
  shareSize.width === 500 && shareSize.height === 500,
  'leftover homepage share photo fotos/cabaz_mix.jpeg must stay 500×500 (leftover homepage og:image size stays out as PR #247)'
);

leftoverSize(product, String(melanciaSize.width), String(melanciaSize.height), 'https://mundifruta.com/produtos/melancia-1-4/');
leftoverSize(morango, String(morangoSize.width), String(morangoSize.height), 'https://mundifruta.com/produtos/morango-500g/');
leftoverSize(cabazLegumes, String(cabazLegumesSize.width), String(cabazLegumesSize.height), 'https://mundifruta.com/produtos/cabaz-de-legumes/');
leftoverSize(category, String(frutasSize.width), String(frutasSize.height), 'https://mundifruta.com/categorias/frutas/');
leftoverSize(legumes, String(legumesSize.width), String(legumesSize.height), 'https://mundifruta.com/categorias/legumes/');
leftoverSize(ervas, String(ervasSize.width), String(ervasSize.height), 'https://mundifruta.com/categorias/ervas-frescas/');
leftoverSize(epoca, String(epocaSize.width), String(epocaSize.height), 'https://mundifruta.com/categorias/frutas-da-epoca/');
leftoverSize(promocoes, String(promoSize.width), String(promoSize.height), 'https://mundifruta.com/categorias/promocoes/');
leftoverSize(cabazes, String(cabazesSize.width), String(cabazesSize.height), 'https://mundifruta.com/categorias/cabazes/');

const { produtos } = vm.runInNewContext(
  `${readFileSync(join(root, 'js/dados.js'), 'utf8')}\n;({ produtos })`,
  { console },
  { filename: 'js/dados.js' }
);
const slugify = value => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/&/g, ' e ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const allProducts = [...produtos.frutas, ...produtos.legumes, ...produtos.cabazes];
for (const item of allProducts) {
  const slug = slugify(item.nome);
  const page = readFileSync(join(root, 'produtos', slug, 'index.html'), 'utf8');
  const rel = String(item.foto || '').split('?')[0];
  const buf = readFileSync(join(root, rel));
  const lower = rel.toLowerCase();
  const size = lower.endsWith('.webp') ? webpSize(buf) : jpegSize(buf);
  assert(size.width > 0 && size.height > 0, `leftover product ${slug} must have leftover per-file share-photo dimensions`);
  leftoverSize(page, String(size.width), String(size.height), `https://mundifruta.com/produtos/${slug}/`);
}

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
  !/<meta property="og:image" content=/.test(product) &&
  !/<meta property="og:image" content=/.test(category) &&
  !product.includes('twitter:card') &&
  !category.includes('twitter:card') &&
  !product.includes('twitter:image:alt') &&
  !category.includes('twitter:image:alt'),
  'must not redo leftover category-card h3, leftover SEO footer contacts, leftover catalog favicon, leftover catalog og:image / Twitter cards, or leftover catalog twitter:image:alt'
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
  console.error('check-catalog-og-image-size failed:\n' + failures.map(f => ' - ' + f).join('\n'));
  process.exit(1);
}
console.log('check-catalog-og-image-size: ok');
