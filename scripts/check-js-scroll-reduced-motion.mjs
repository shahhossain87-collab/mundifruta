#!/usr/bin/env node
/**
 * Guards leftover JS scrollIntoView / window.scrollTo honor
 * prefers-reduced-motion. Complementary to leftover html CSS
 * scroll-behavior (draft #202). Does not redo leftover ticker
 * reduced-motion (draft #200), leftover carousel CSS/JS, leftover
 * floating-fruit animations, leftover-ring drafts, or catalog SEO drafts.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const css = readFileSync(join(root, 'css/estilos.css'), 'utf8');
const app = readFileSync(join(root, 'js/app.js'), 'utf8');
const extras = readFileSync(join(root, 'js/extras.js'), 'utf8');
const generator = readFileSync(join(root, 'scripts/generate-seo-pages.mjs'), 'utf8');

const failures = [];
const assert = (cond, msg) => { if (!cond) failures.push(msg); };

assert(
  html.includes('css/estilos.css?v=66') && html.includes('js/app.js?v=41'),
  'index.html should cache-bust estilos.css?v=66 and app.js?v=41'
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
  /function preferenciaScroll\(\) \{\s*return window\.matchMedia\('\(prefers-reduced-motion: reduce\)'\)\.matches \? 'auto' : 'smooth';/.test(app),
  'leftover JS scroll helper must map reduced motion to auto and keep leftover smooth otherwise'
);
assert(
  !app.includes("scrollIntoView({ behavior:'smooth'") &&
  !app.includes('scrollIntoView({ behavior:"smooth"') &&
  !app.includes("window.scrollTo({ top: alvo, behavior:'smooth' }"),
  'leftover app.js must not hardcode smooth JS scrolling'
);
assert(
  app.includes("scrollIntoView({ behavior:preferenciaScroll(), block:'start' })") &&
  app.includes('scrollIntoView({ behavior:preferenciaScroll() })') &&
  app.includes('window.scrollTo({ top: alvo, behavior:preferenciaScroll() })'),
  'catalog, order, cabaz, and Continuar a comprar jumps must use preferenciaScroll'
);
assert(
  html.includes("scrollIntoView({behavior:preferenciaScroll()})") &&
  html.includes("window.scrollTo({top:0,behavior:preferenciaScroll()})") &&
  !html.includes("behavior:'smooth'"),
  'leftover homepage inline Carrinho / Ver catálogo / Voltar ao topo jumps must use preferenciaScroll'
);
assert(
  /html \{ scroll-behavior: smooth; \}/.test(css) &&
  !/@media \(prefers-reduced-motion:\s*reduce\)\s*\{\s*html \{ scroll-behavior: auto; \}/.test(css),
  'must not redo leftover html CSS scroll-behavior (draft #202)'
);
assert(
  /\.feature-grid\.carousel \{[^}]*scroll-behavior:smooth/.test(css) &&
  extras.includes("behavior: 'smooth'") &&
  extras.includes("grid.scrollBy({ left: -passo() * 2, behavior: 'smooth' })"),
  'must not redo leftover featured-row carousel smooth scroll'
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
  console.error('check-js-scroll-reduced-motion failed:\n' + failures.map(f => ' - ' + f).join('\n'));
  process.exit(1);
}
console.log('check-js-scroll-reduced-motion: ok');
