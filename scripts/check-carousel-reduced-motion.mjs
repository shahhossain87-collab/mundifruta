#!/usr/bin/env node
/**
 * Guards leftover featured-row carousel prefers-reduced-motion.
 * Complementary to leftover hero reduced-motion, leftover ticker
 * reduced-motion (draft #200), leftover html CSS scroll (draft #202),
 * leftover JS scroll helper, leftover-ring drafts #141–#190, draft
 * #192 share/nav/h3/footer, leftover catalog SEO drafts #195–#199,
 * leftover credits-page favicon (draft #201), leftover floating-fruit
 * CSS, leftover forest rings, leftover hamburger aria-expanded,
 * leftover SEO hamburger, leftover catalog h2-before-h1.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const css = readFileSync(join(root, 'css/estilos.css'), 'utf8');
const extras = readFileSync(join(root, 'js/extras.js'), 'utf8');
const app = readFileSync(join(root, 'js/app.js'), 'utf8');

const failures = [];
const assert = (cond, msg) => { if (!cond) failures.push(msg); };

assert(
  html.includes('css/estilos.css?v=67') &&
  html.includes('js/extras.js?v=22') &&
  html.includes('js/app.js?v=40') &&
  html.includes('js/dados.js?v=26'),
  'homepage cache should be estilos.css?v=67, extras.js?v=22, app.js?v=40, dados.js?v=26'
);

const carouselCss = css.slice(
  css.indexOf('.feature-grid.carousel'),
  css.indexOf('.hero-eyebrow')
);
assert(
  carouselCss.includes('scroll-behavior:smooth'),
  'leftover featured carousel keeps scroll-behavior:smooth by default'
);
assert(
  /@media \(prefers-reduced-motion:\s*reduce\)/.test(carouselCss) &&
  /scroll-behavior:\s*auto/.test(carouselCss),
  'leftover featured carousel should use scroll-behavior:auto under prefers-reduced-motion'
);
assert(
  html.includes('id="promo-grid"') &&
  html.includes('id="popular-grid"') &&
  html.includes('id="season-grid"') &&
  html.includes('id="veg-featured-grid"'),
  'leftover featured-row grids stay'
);

assert(
  extras.includes("const reduzir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;") &&
  extras.includes("const comportamento = reduzir ? 'auto' : 'smooth'") &&
  extras.includes("behavior: comportamento") &&
  extras.includes('if (reduzir) return;'),
  'leftover carousel prev/next should map reduced motion to auto and keep leftover auto-advance skip'
);
assert(
  !extras.includes("behavior: 'smooth'") &&
  !extras.includes('behavior: "smooth"'),
  'leftover carousel JS must not hard-code smooth scroll'
);

assert(
  !/@media \(prefers-reduced-motion:\s*reduce\)\s*\{\s*html\s*\{[^}]*scroll-behavior:\s*auto/.test(css),
  'must not redo leftover html CSS scroll-behavior (draft #202)'
);
assert(
  css.includes('html { scroll-behavior: smooth; }'),
  'leftover html scroll-behavior:smooth stays by default'
);
assert(
  css.includes('animation: ticker 20s linear infinite') &&
  !/@media \(prefers-reduced-motion:[^)]*\)[\s\S]{0,180}\.announcement-track/.test(css),
  'must not redo leftover ticker reduced-motion (draft #200)'
);
assert(
  !app.includes('function preferenciaScroll') &&
  app.includes("scrollIntoView({ behavior:'smooth'"),
  'must not redo leftover JS scroll reduced-motion helper'
);
assert(
  css.includes('.ff1') &&
  css.includes('animation:fA') &&
  css.includes('.ff10'),
  'must not redo leftover floating-fruit CSS'
);
assert(
  html.includes('id="tab-ervas"') &&
  html.includes('Promoções') &&
  html.includes('Cabazes'),
  'visible leftover Promoções / Cabazes stay'
);

if (failures.length) {
  console.error('check-carousel-reduced-motion failed:\n' + failures.map(f => ' - ' + f).join('\n'));
  process.exit(1);
}
console.log('check-carousel-reduced-motion: ok');
