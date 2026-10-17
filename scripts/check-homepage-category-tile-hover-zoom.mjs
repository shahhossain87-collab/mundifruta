#!/usr/bin/env node
/**
 * Guards leftover homepage category-tile photo zoom: hover-capable pointers only.
 * Complementary to leftover homepage shop-card hover zoom (PR #272) and leftover
 * catalog category-card hover zoom (PR #271); next leftover homepage slice of
 * draft #192 leftover hover-capable photo zoom.
 * Does not redo leftover homepage shop-card zoom (PR #272), leftover catalog
 * card zoom (PR #271), leftover product-page full-width order CTA (PR #270),
 * leftover wrapping-nav Ervas / Época / Cabazes (PR #218), leftover catalog
 * share photos (PR #215), leftover SEO header padding (PR #195), leftover
 * forest wordmark (PR #196), leftover hamburger aria-expanded (PR #70).
 * Does not redo leftover featured-photo / .sc / .qs-photo sticky zoom.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const css = readFileSync(join(root, 'css', 'estilos.css'), 'utf8');
const generator = readFileSync(join(root, 'scripts', 'generate-seo-pages.mjs'), 'utf8');
const index = readFileSync(join(root, 'index.html'), 'utf8');
const credits = readFileSync(join(root, 'creditos.html'), 'utf8');
const product = readFileSync(join(root, 'produtos', 'banana-madeira', 'index.html'), 'utf8');
const category = readFileSync(join(root, 'categorias', 'frutas', 'index.html'), 'utf8');

const failures = [];
const assert = (cond, msg) => { if (!cond) failures.push(msg); };

assert(
  index.includes('css/estilos.css?v=68') &&
  index.includes('js/app.js?v=40') &&
  index.includes('js/extras.js?v=21') &&
  index.includes('js/dados.js?v=26'),
  'homepage cache should be estilos.css?v=68 / app.js?v=40 / extras.js?v=21 / dados.js?v=26'
);
assert(
  /estilos\.css\?v=65/.test(generator) &&
  !/estilos\.css\?v=68/.test(generator),
  'generated catalog CSS cache should stay estilos.css?v=65'
);
assert(
  product.includes('css/estilos.css?v=65') &&
  category.includes('css/estilos.css?v=65'),
  'generated Banana Madeira / Frutas pages should stay estilos.css?v=65'
);
assert(
  credits.includes('css/estilos.css?v=64'),
  'credits cache should stay estilos.css?v=64'
);

const genericHover = css.match(/@media \(hover:\s*hover\) \{\s*\.cat-quick-btn:hover img \{ transform:scale\(1\.055\); \}\s*\}/);
assert(genericHover, 'leftover generic category-tile photo zoom should be inside @media (hover: hover)');
const homepageHover = css.match(/@media \(hover:\s*hover\) \{\s*body\.homepage \.homepage-category \.cat-quick-btn:hover img \{ transform:scale\(1\.06\); \}\s*\}/);
assert(homepageHover, 'leftover homepage category-tile photo zoom should be inside @media (hover: hover)');

const genericZoom = '.cat-quick-btn:hover img { transform:scale(1.055); }';
const homepageZoom = 'body.homepage .homepage-category .cat-quick-btn:hover img { transform:scale(1.06); }';
assert(
  (css.split(genericZoom).length - 1) === 1,
  'leftover generic category-tile photo zoom must appear once, scoped to hover-capable pointers'
);
assert(
  (css.split(homepageZoom).length - 1) === 1,
  'leftover homepage category-tile photo zoom must appear once, scoped to hover-capable pointers'
);
assert(
  /\.product-card:hover \.photo-wrap img \{ transform:scale\(1\.09\); \}/.test(css) &&
  !/@media \(hover:\s*hover\) \{\s*\.product-card:hover \.photo-wrap img/.test(css),
  'must not redo leftover homepage shop-card photo zoom (PR #272)'
);
assert(
  /\.seo-product-card:hover \.seo-product-image img \{ transform:scale\(1\.04\); \}/.test(css) &&
  !/@media \(hover:\s*hover\) \{\s*\.seo-product-card:hover \.seo-product-image img/.test(css),
  'must not redo leftover catalog category-card photo zoom (PR #271)'
);
assert(
  /\.feature-photo:hover img \{ transform:scale\(1\.045\); \}/.test(css) &&
  !/@media \(hover:\s*hover\) \{\s*\.feature-photo:hover img/.test(css),
  'must not redo leftover featured-photo sticky zoom'
);
assert(
  /\.sc:hover img \{ transform:scale\(1\.1\); \}/.test(css) &&
  !/@media \(hover:\s*hover\) \{\s*\.sc:hover img/.test(css),
  'must not redo leftover .sc sticky zoom'
);
assert(
  /\.qs-photo:hover img \{ transform:scale\(1\.06\); \}/.test(css) &&
  !/@media \(hover:\s*hover\) \{\s*\.qs-photo:hover img/.test(css),
  'must not redo leftover .qs-photo sticky zoom'
);

assert(
  index.includes('Encontre o que procura') &&
  index.includes('data-count-label="frutas">Frutas</span>') &&
  index.includes('data-count-label="legumes">Legumes</span>') &&
  index.includes('data-count-label="cabazes">Cabazes</span>') &&
  index.includes('data-count-label="promocoes">Promoções</span>') &&
  index.includes('data-count-label="ervas">Ervas frescas</span>') &&
  index.includes('data-count-label="epoca">Fruta da Época</span>'),
  'homepage category tiles should keep leftover Frutas / Legumes / Cabazes / Promoções / Ervas frescas / Fruta da Época'
);
assert(
  index.includes('Ver Produtos') &&
  index.includes('Encomendar por WhatsApp'),
  'homepage hero CTAs should stay leftover Ver Produtos / Encomendar por WhatsApp'
);
assert(
  category.includes('Ver produto') &&
  /class="seo-text-link"/.test(category),
  'Frutas cards should keep leftover Ver produto text links'
);
assert(
  product.includes('Ver no catálogo e encomendar') &&
  product.includes('href="/?produto=banana-madeira#produtos"'),
  'Banana Madeira should keep leftover Ver no catálogo e encomendar + catalog href'
);
{
  const nav = category.match(/<nav class="seo-nav"[^>]*>[\s\S]*?<\/nav>/);
  assert(
    nav &&
    /Início/.test(nav[0]) &&
    /Frutas/.test(nav[0]) &&
    /Legumes/.test(nav[0]) &&
    /Promoções/.test(nav[0]) &&
    !/Ervas/.test(nav[0]) &&
    !/Época/.test(nav[0]) &&
    !/Cabazes/.test(nav[0]),
    'wrapping nav should stay leftover Início / Frutas / Legumes / Promoções'
  );
}
assert(
  !category.includes('aria-current') &&
  !category.includes('og:image') &&
  !category.includes('twitter:card'),
  'should not redo leftover wrapping-nav aria-current, leftover catalog og:image, or leftover Twitter cards'
);

if (failures.length) {
  console.error('check-homepage-category-tile-hover-zoom failed:\n' + failures.map(item => ` - ${item}`).join('\n'));
  process.exit(1);
}
console.log('check-homepage-category-tile-hover-zoom: ok');
