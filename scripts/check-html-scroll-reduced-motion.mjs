#!/usr/bin/env node
/**
 * Guards leftover html { scroll-behavior: smooth } respects
 * prefers-reduced-motion. Complementary to leftover hero-slide /
 * homepage / offer-reveal reduced-motion rules. Does not redo leftover
 * ticker reduced-motion (draft #200), leftover-ring drafts, catalog SEO
 * drafts, floating-fruit animations, or JS scrollIntoView.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const css = readFileSync(join(root, 'css/estilos.css'), 'utf8');
const app = readFileSync(join(root, 'js/app.js'), 'utf8');
const generator = readFileSync(join(root, 'scripts/generate-seo-pages.mjs'), 'utf8');

const failures = [];
const assert = (cond, msg) => { if (!cond) failures.push(msg); };

assert(
  html.includes('css/estilos.css?v=67') && html.includes('js/app.js?v=40'),
  'index.html should cache-bust estilos.css?v=67 and app.js?v=40'
);
assert(
  html.includes('js/extras.js?v=21') && html.includes('js/dados.js?v=26'),
  'extras.js should stay ?v=21 and dados.js should stay ?v=26'
);
assert(
  generator.includes("cssPath: '../../css/estilos.css?v=65'"),
  'generated catalog CSS should stay ?v=65'
);
assert(
  html.includes('🛒 Encomende por WhatsApp e levante na loja'),
  'leftover pickup ticker copy must stay'
);
assert(
  !html.includes('Entregas rápidas para Carnaxide e Oeiras'),
  'must not revert leftover ticker to delivery copy'
);
assert(
  /html \{ scroll-behavior: smooth; \}/.test(css),
  'default leftover html scroll-behavior:smooth must stay for users without reduced motion'
);
assert(
  /@media \(prefers-reduced-motion:\s*reduce\)\s*\{\s*html \{ scroll-behavior: auto; \}/.test(css),
  'leftover html scroll-behavior must be auto under prefers-reduced-motion'
);
assert(
  app.includes("scrollIntoView({ behavior:'smooth'") ||
  app.includes('scrollIntoView({ behavior:\'smooth\''),
  'must not rewrite leftover JS scrollIntoView in this run'
);
assert(
  /\.ff1\s*\{[^}]*animation:fA/.test(css) &&
  !/@media \(prefers-reduced-motion:[^}]*\.ff\d/.test(css),
  'must not redo leftover floating-fruit reduced-motion in this run'
);
assert(
  !/@media \(prefers-reduced-motion:\s*reduce\)\s*\{\s*\.announcement-track/.test(css),
  'must not redo leftover ticker reduced-motion (draft #200)'
);
assert(
  !html.includes('aria-expanded'),
  'must not redo leftover hamburger aria-expanded (PR #70)'
);
assert(
  !/\.float-cart:focus-visible/.test(css) &&
  !/\.order-optional-toggle:focus-visible/.test(css) &&
  !/\.btn-wa:focus-visible/.test(css),
  'must not add leftover :focus-visible forest rings in this run'
);

if (failures.length) {
  console.error('check-html-scroll-reduced-motion failed:\n' + failures.map(f => ' - ' + f).join('\n'));
  process.exit(1);
}
console.log('check-html-scroll-reduced-motion: ok');
