#!/usr/bin/env node
/**
 * Guards leftover homepage shop-card photo zoom: hover-capable pointers only.
 * Complementary to leftover catalog category-card hover zoom (PR #271).
 * First leftover homepage slice of draft #192 leftover hover-capable photo zoom.
 * Does not redo leftover catalog card zoom (PR #271), leftover product-page
 * full-width order CTA (PR #270), leftover wrapping-nav Ervas / Época /
 * Cabazes (PR #218), leftover catalog share photos (PR #215), leftover SEO
 * header padding (PR #195), leftover forest wordmark (PR #196), leftover
 * hamburger aria-expanded (PR #70).
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
  index.includes('css/estilos.css?v=67') &&
  index.includes('js/app.js?v=40') &&
  index.includes('js/extras.js?v=21') &&
  index.includes('js/dados.js?v=26'),
  'homepage cache should be estilos.css?v=67 / app.js?v=40 / extras.js?v=21 / dados.js?v=26'
);
assert(
  /estilos\.css\?v=65/.test(generator) &&
  !/estilos\.css\?v=67/.test(generator),
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

const hoverBlock = css.match(/@media \(hover:\s*hover\) \{\s*\.product-card:hover \.photo-wrap img \{ transform:scale\(1\.09\); \}\s*\}/);
assert(hoverBlock, 'leftover homepage shop-card photo zoom should be inside @media (hover: hover)');
const zoomRule = '.product-card:hover .photo-wrap img { transform:scale(1.09); }';
const zoomCount = css.split(zoomRule).length - 1;
assert(
  zoomCount === 1,
  'leftover homepage shop-card photo zoom must appear once, scoped to hover-capable pointers'
);
assert(
  /\.seo-product-card:hover \.seo-product-image img \{ transform:scale\(1\.04\); \}/.test(css) &&
  !/@media \(hover:\s*hover\) \{\s*\.seo-product-card:hover \.seo-product-image img/.test(css),
  'must not redo leftover catalog category-card photo zoom (PR #271)'
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
assert(
  /<nav class="seo-nav" aria-label="Navegação principal">\s*<a href="\.\.\/\.\.\/">Início<\/a>\s*<a href="\.\.\/\.\.\/categorias\/frutas\/">Frutas<\/a>\s*<a href="\.\.\/\.\.\/categorias\/legumes\/">Legumes<\/a>\s*<a href="\.\.\/\.\.\/categorias\/promocoes\/">Promoções<\/a>\s*<\/nav>/.test(category),
  'wrapping nav should stay leftover Início / Frutas / Legumes / Promoções'
);
assert(
  !category.includes('aria-current') &&
  !category.includes('og:image') &&
  !category.includes('twitter:card'),
  'should not redo leftover wrapping-nav aria-current, leftover catalog og:image, or leftover Twitter cards'
);

if (failures.length) {
  console.error('check-homepage-card-hover-zoom failed:\n' + failures.map(item => ` - ${item}`).join('\n'));
  process.exit(1);
}
console.log('check-homepage-card-hover-zoom: ok');
