#!/usr/bin/env node
/**
 * Guards leftover hero-eyebrow pulse respects prefers-reduced-motion.
 * Complementary to leftover hero-slide / homepage-rise / offer-reveal
 * reduced-motion rules. Does not redo leftover-ring drafts, catalog SEO
 * drafts, leftover ticker/html/JS/carousel reduced-motion, or hero copy.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const css = readFileSync(join(root, 'css/estilos.css'), 'utf8');

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
  html.includes('class="hero-eyebrow"') &&
  html.includes('Frescura local em Carnaxide'),
  'leftover hero-eyebrow copy must stay'
);
assert(
  /animation:\s*pulse 2s infinite/.test(css),
  'default leftover hero-eyebrow pulse must stay for users without reduced motion'
);
assert(
  /@media \(prefers-reduced-motion:\s*reduce\)\s*\{\s*\.hero-eyebrow i\s*\{\s*animation:\s*none;/.test(css),
  'leftover .hero-eyebrow i must stop under prefers-reduced-motion'
);
assert(
  !html.includes('aria-expanded'),
  'must not redo leftover hamburger aria-expanded (PR #70)'
);
assert(
  !/\.float-cart:focus-visible/.test(css) &&
  !/\.order-optional-toggle:focus-visible/.test(css) &&
  !/\.scroll-top:focus-visible/.test(css) &&
  !/\.mb-item:focus-visible/.test(css),
  'must not add leftover :focus-visible forest rings in this run'
);

if (failures.length) {
  console.error('check-hero-eyebrow-pulse-reduced-motion failed:\n' + failures.map(f => ' - ' + f).join('\n'));
  process.exit(1);
}
console.log('check-hero-eyebrow-pulse-reduced-motion: ok');
