#!/usr/bin/env node
/**
 * Guards leftover homepage category-tile card lift: hover-capable pointers only.
 * Complementary to leftover unused .sc card lift (PR #277), leftover unused
 * .sc photo zoom (PR #276), leftover homepage Quem Somos gallery hover zoom
 * (PR #275), leftover homepage featured-photo hover zoom (PR #274), leftover
 * homepage category-tile hover zoom (PR #273), leftover homepage shop-card
 * hover zoom (PR #272), leftover catalog category-card hover zoom (PR #271),
 * and leftover homepage shop-card hover lift (PR #278); leftover
 * .cat-quick-btn lift slice of the leftover hover-capable pass.
 * Does not redo leftover unused .sc card lift (PR #277), leftover unused
 * .sc photo zoom (PR #276), leftover homepage Quem Somos gallery zoom
 * (PR #275), leftover homepage featured-photo zoom (PR #274), leftover
 * homepage category-tile zoom (PR #273), leftover homepage shop-card zoom
 * (PR #272), leftover catalog card zoom (PR #271), leftover homepage
 * shop-card lift (PR #278), leftover product-page full-width order CTA
 * (PR #270), leftover wrapping-nav Ervas / Época / Cabazes (PR #218),
 * leftover catalog share photos (PR #215), leftover SEO header padding
 * (PR #195), leftover forest wordmark (PR #196), leftover hamburger
 * aria-expanded (PR #70).
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const css = readFileSync(join(root, 'css', 'estilos.css'), 'utf8');
const generator = readFileSync(join(root, 'scripts', 'generate-seo-pages.mjs'), 'utf8');
const index = readFileSync(join(root, 'index.html'), 'utf8');
const extras = readFileSync(join(root, 'js', 'extras.js'), 'utf8');
const credits = readFileSync(join(root, 'creditos.html'), 'utf8');
const product = readFileSync(join(root, 'produtos', 'banana-madeira', 'index.html'), 'utf8');
const category = readFileSync(join(root, 'categorias', 'frutas', 'index.html'), 'utf8');

const failures = [];
const assert = (cond, msg) => { if (!cond) failures.push(msg); };

assert(
  index.includes('css/estilos.css?v=74') &&
  index.includes('js/app.js?v=40') &&
  index.includes('js/extras.js?v=21') &&
  index.includes('js/dados.js?v=26'),
  'homepage cache should be estilos.css?v=74 / app.js?v=40 / extras.js?v=21 / dados.js?v=26'
);
assert(
  /estilos\.css\?v=65/.test(generator) &&
  !/estilos\.css\?v=74/.test(generator),
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

const genericLift = css.match(/@media \(hover:\s*hover\) \{\s*\.cat-quick-btn:hover \{ transform:translateY\(-4px\); box-shadow:var\(--sh-lg\); border-color:var\(--sage\); \}\s*\}/);
assert(genericLift, 'leftover generic category-tile card lift should be inside @media (hover: hover)');
const homepageLift = css.match(/@media \(hover:\s*hover\) \{\s*body\.homepage \.homepage-category \.cat-quick-btn:hover \{\s*transform:translateY\(-4px\);\s*\}\s*\}/);
assert(homepageLift, 'leftover homepage category-tile card lift should be inside @media (hover: hover)');

const genericLiftRule = '.cat-quick-btn:hover { transform:translateY(-4px); box-shadow:var(--sh-lg); border-color:var(--sage); }';
assert(
  (css.split(genericLiftRule).length - 1) === 1,
  'leftover generic category-tile card lift must appear once, scoped to hover-capable pointers'
);
assert(
  (css.split('body.homepage .homepage-category .cat-quick-btn:hover {\n        transform:translateY(-4px);').length - 1) === 1,
  'leftover homepage category-tile card lift must appear once, scoped to hover-capable pointers'
);
assert(
  /body\.homepage \.homepage-category \.cat-quick-btn:focus-visible \{\s*transform:translateY\(-4px\);\s*\}/.test(css),
  'leftover homepage category-tile keyboard :focus-visible lift should stay outside hover media'
);
assert(
  /body\.homepage \.homepage-category \.cat-quick-btn:focus-visible,\s*body\.homepage \.homepage-category \.cat-quick-btn:hover \{\s*outline:3px solid rgba\(82,183,136,\.3\);/.test(css),
  'leftover homepage category-tile hover/focus outline should stay outside hover media'
);

assert(
  /\.cat-quick-btn:hover img \{ transform:scale\(1\.055\); \}/.test(css) &&
  !/@media \(hover:\s*hover\) \{\s*\.cat-quick-btn:hover img/.test(css),
  'must not redo leftover homepage category-tile photo zoom (PR #273)'
);
assert(
  /body\.homepage \.homepage-category \.cat-quick-btn:hover img \{ transform:scale\(1\.06\); \}/.test(css) &&
  !/@media \(hover:\s*hover\) \{\s*body\.homepage \.homepage-category \.cat-quick-btn:hover img/.test(css),
  'must not redo leftover homepage category-tile homepage photo zoom (PR #273)'
);
assert(
  /\.product-card:hover \{ transform:translateY\(-12px\) scale\(1\.02\); box-shadow:var\(--sh-lg\); \}/.test(css) &&
  !/@media \(hover:\s*hover\) \{\s*\.product-card:hover \{ transform:translateY\(-12px\)/.test(css),
  'must not redo leftover homepage shop-card lift (PR #278)'
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
  /\.sc:hover \{ transform:translateY\(-16px\) scale\(1\.025\);/.test(css) &&
  !/@media \(hover:\s*hover\) \{\s*\.sc:hover \{/.test(css),
  'must not redo leftover unused .sc card lift (PR #277)'
);
assert(
  /\.sc:hover img \{ transform:scale\(1\.1\); \}/.test(css) &&
  !/@media \(hover:\s*hover\) \{\s*\.sc:hover img/.test(css),
  'must not redo leftover unused .sc photo zoom (PR #276)'
);
assert(
  /\.qs-photo:hover img \{ transform:scale\(1\.06\); \}/.test(css) &&
  !/@media \(hover:\s*hover\) \{\s*\.qs-photo:hover img/.test(css),
  'must not redo leftover homepage Quem Somos gallery zoom (PR #275)'
);
assert(
  /\.feature-photo:hover img \{ transform:scale\(1\.045\); \}/.test(css) &&
  !/@media \(hover:\s*hover\) \{\s*\.feature-photo:hover img/.test(css),
  'must not redo leftover homepage featured-photo zoom (PR #274)'
);

assert(
  css.includes('.summer-section') &&
  css.includes('.summer-scroll') &&
  css.includes('.sc-name') &&
  !index.includes('class="sc"') &&
  !index.includes('summer-scroll') &&
  !extras.includes('class="sc"') &&
  !extras.includes('summer-scroll'),
  'leftover unused summer-carousel CSS should stay unused (no leftover .sc markup)'
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
  index.includes('id="quem-somos"') &&
  index.includes('id="qs-gallery"') &&
  index.includes('Quem Somos') &&
  extras.includes('class="qs-photo"') &&
  extras.includes('Mundi Fruta — seleção diária'),
  'homepage Quem Somos gallery should keep leftover qs-gallery / qs-photo / seleção diária alts'
);
assert(
  index.includes('Promoções da Semana') &&
  index.includes('Frutas Populares') &&
  index.includes('Fruta da Época') &&
  index.includes('Legumes Frescos') &&
  index.includes('id="promo-grid"') &&
  index.includes('id="popular-grid"') &&
  index.includes('id="season-grid"') &&
  index.includes('id="veg-featured-grid"'),
  'homepage featured sections should keep leftover Promoções / Frutas Populares / Fruta da Época / Legumes Frescos'
);
assert(
  index.includes('Ver Produtos') &&
  index.includes('Encomendar por WhatsApp'),
  'homepage hero CTAs should stay leftover Ver Produtos / Encomendar por WhatsApp'
);
assert(
  index.includes('Ver catálogo completo') &&
  index.includes('Ver todas as frutas') &&
  index.includes('Explorar fruta') &&
  index.includes('Ver todos os legumes'),
  'featured shop-links should stay leftover catalog jumps'
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
  console.error('check-homepage-category-tile-hover-lift failed:\n' + failures.map(item => ` - ${item}`).join('\n'));
  process.exit(1);
}
console.log('check-homepage-category-tile-hover-lift: ok');
