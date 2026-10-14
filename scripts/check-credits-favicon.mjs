#!/usr/bin/env node
/**
 * Guards leftover strawberry favicon on creditos.html.
 * Complementary to leftover homepage favicon and draft #198 catalog favicon.
 * Does not redo leftover-ring drafts, ticker reduced-motion, or catalog SEO drafts.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const credits = readFileSync(join(root, 'creditos.html'), 'utf8');
const generator = readFileSync(join(root, 'scripts/generate-seo-pages.mjs'), 'utf8');
const leftoverFavicon = "<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🍓</text></svg>\"/>";

const failures = [];
const assert = (cond, msg) => { if (!cond) failures.push(msg); };

assert(
  html.includes('css/estilos.css?v=66') && html.includes('js/app.js?v=40'),
  'index.html should cache-bust estilos.css?v=66 and app.js?v=40'
);
assert(
  html.includes('js/extras.js?v=21') && html.includes('js/dados.js?v=26'),
  'extras.js should stay ?v=21 and dados.js should stay ?v=26'
);
assert(
  html.includes(leftoverFavicon),
  'leftover homepage strawberry favicon must stay'
);
assert(
  credits.includes(leftoverFavicon),
  'leftover credits page should use the leftover homepage strawberry favicon'
);
assert(
  (credits.match(/rel="icon"/g) || []).length === 1,
  'credits page should have exactly one leftover favicon'
);
assert(
  credits.includes('<title>Créditos das fotos — MUNDIFRUTA</title>'),
  'leftover credits title must stay'
);
assert(
  credits.includes('rel="canonical" href="https://mundifruta.com/creditos.html"'),
  'leftover credits canonical must stay'
);
assert(
  credits.includes('class="credits-back" href="index.html"'),
  'leftover credits back link must stay'
);
assert(
  credits.includes('css/estilos.css?v=64'),
  'credits CSS cache should stay ?v=64'
);
assert(
  generator.includes("cssPath: '../../css/estilos.css?v=65'"),
  'generated catalog CSS cache should stay ?v=65'
);
assert(
  !generator.includes('rel="icon"'),
  'must not redo leftover catalog favicon (draft #198)'
);
assert(
  !html.includes('aria-expanded'),
  'must not redo leftover hamburger aria-expanded (PR #70)'
);
assert(
  !credits.includes('og:image') && !credits.includes('twitter:card'),
  'must not add leftover credits share tags in this run'
);

if (failures.length) {
  console.error('check-credits-favicon failed:\n' + failures.map(f => ' - ' + f).join('\n'));
  process.exit(1);
}
console.log('check-credits-favicon: ok');
