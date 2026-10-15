#!/usr/bin/env node
/**
 * Guards leftover wrapping SEO nav: Ervas frescas / Frutas da época /
 * Cabazes now sit with leftover Início / Frutas / Legumes / Promoções.
 * Complementary to leftover catalog SEO drafts #195–#199 and leftover
 * wrapping-nav forest ring (#208). Does not redo hamburger, footer
 * contacts, og:image, category h2→h3, or leftover-ring drafts.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const generator = readFileSync(join(root, 'scripts/generate-seo-pages.mjs'), 'utf8');
const css = readFileSync(join(root, 'css/estilos.css'), 'utf8');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const herbs = readFileSync(join(root, 'categorias/ervas-frescas/index.html'), 'utf8');
const season = readFileSync(join(root, 'categorias/frutas-da-epoca/index.html'), 'utf8');
const baskets = readFileSync(join(root, 'categorias/cabazes/index.html'), 'utf8');
const lemon = readFileSync(join(root, 'produtos/limao/index.html'), 'utf8');
const fruits = readFileSync(join(root, 'categorias/frutas/index.html'), 'utf8');

const failures = [];
const assert = (cond, msg) => { if (!cond) failures.push(msg); };

const leftoverNav = [
  ['Início', '../../'],
  ['Frutas', '../../categorias/frutas/'],
  ['Legumes', '../../categorias/legumes/'],
  ['Ervas frescas', '../../categorias/ervas-frescas/'],
  ['Frutas da época', '../../categorias/frutas-da-epoca/'],
  ['Promoções', '../../categorias/promocoes/'],
  ['Cabazes', '../../categorias/cabazes/'],
];

function navBlock(page) {
  const match = page.match(/<nav class="seo-nav"[^>]*>([\s\S]*?)<\/nav>/);
  return match ? match[1] : '';
}

assert(
  generator.includes('function seoNav(') &&
  generator.includes('...categories.map(category =>') &&
  generator.includes('categorias/${category.slug}/') &&
  generator.includes("slug: 'ervas-frescas'") &&
  generator.includes("slug: 'frutas-da-epoca'") &&
  generator.includes("slug: 'cabazes'") &&
  generator.includes('aria-current="page"') &&
  generator.includes('currentSlug: category.slug'),
  'generator should emit leftover wrapping nav from leftover category slugs and mark the current page'
);

for (const page of [herbs, season, baskets, lemon, fruits]) {
  const nav = navBlock(page);
  assert(nav.length > 0, 'generated page should keep leftover wrapping seo-nav');
  for (const [label, href] of leftoverNav) {
    assert(
      nav.includes(`href="${href}"`) && nav.includes(`>${label}<`),
      `leftover wrapping nav should list ${label}`
    );
  }
  assert(!/hamburger|mobile-menu|aria-expanded/.test(nav), 'must not add a leftover SEO hamburger');
}

assert(
  /<a href="\.\.\/\.\.\/categorias\/ervas-frescas\/" aria-current="page">Ervas frescas<\/a>/.test(navBlock(herbs)),
  'ervas-frescas page should mark leftover Ervas frescas as current'
);
assert(
  /<a href="\.\.\/\.\.\/categorias\/frutas-da-epoca\/" aria-current="page">Frutas da época<\/a>/.test(navBlock(season)),
  'frutas-da-epoca page should mark leftover Frutas da época as current'
);
assert(
  /<a href="\.\.\/\.\.\/categorias\/cabazes\/" aria-current="page">Cabazes<\/a>/.test(navBlock(baskets)),
  'cabazes page should mark leftover Cabazes as current'
);
assert(
  /<a href="\.\.\/\.\.\/categorias\/frutas\/" aria-current="page">Frutas<\/a>/.test(navBlock(lemon)),
  'product page should mark leftover primary category Frutas as current'
);
assert(
  !navBlock(herbs).includes('aria-current="page">Início<') &&
  !navBlock(lemon).includes('aria-current="page">Início<'),
  'Início should stay a leftover home link, not the current page'
);

assert(
  herbs.includes('css/estilos.css?v=67') &&
  lemon.includes('css/estilos.css?v=67'),
  'generated catalog pages should cache-bust leftover estilos.css?v=67'
);
assert(
  html.includes('css/estilos.css?v=66') &&
  html.includes('js/app.js?v=40') &&
  html.includes('js/extras.js?v=21') &&
  html.includes('js/dados.js?v=26'),
  'homepage cache tokens stay ?v=66 / app.js?v=40 / extras.js?v=21 / dados.js?v=26'
);

assert(
  css.includes('.seo-nav a:hover, .seo-nav a[aria-current="page"] { color:var(--forest); }') &&
  css.includes('.seo-nav { justify-content:flex-start; gap:8px 12px; }'),
  'leftover wrapping nav should keep a forest current-page color and wrap on small screens'
);

assert(
  !herbs.includes('og:image') &&
  !lemon.includes('twitter:card') &&
  !herbs.includes('wa.me/351932699850') &&
  herbs.includes('<h2>Produtos</h2>') &&
  herbs.includes('<h2><a href="../../produtos/agriao/">Agrião</a></h2>') &&
  herbs.includes('<footer class="seo-footer"><a href="../../">MUNDIFRUTA</a> · Frutas e legumes frescos em Carnaxide.</footer>'),
  'must not redo leftover og:image, Twitter cards, footer contacts, or category h2→h3'
);
assert(
  lemon.includes('Ver no catálogo e encomendar') &&
  lemon.includes('/?produto=limao#produtos') &&
  !css.includes('.seo-nav a:focus-visible'),
  'leftover product order CTA stays; must not add leftover seo-nav focus ring'
);

if (failures.length) {
  console.error('check-seo-nav-categories failed:\n' + failures.map(f => ' - ' + f).join('\n'));
  process.exit(1);
}
console.log('check-seo-nav-categories: ok');
