#!/usr/bin/env node
/**
 * Guards leftover announcement ticker respects prefers-reduced-motion.
 * Complementary to leftover hero-slide / homepage / offer-reveal reduced-motion
 * rules. Does not redo leftover-ring drafts, catalog SEO drafts, or ticker copy.
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
  html.includes('class="announcement-track"') &&
  html.includes('🛒 Encomende por WhatsApp e levante na loja'),
  'leftover pickup ticker copy must stay'
);
assert(
  !html.includes('Entregas rápidas para Carnaxide e Oeiras'),
  'must not revert leftover ticker to delivery copy'
);
assert(
  /animation:\s*ticker 20s linear infinite/.test(css),
  'default leftover ticker animation must stay for users without reduced motion'
);
assert(
  /@media \(prefers-reduced-motion:\s*reduce\)\s*\{\s*\.announcement-track\s*\{\s*animation:\s*none;/.test(css),
  'leftover .announcement-track must stop under prefers-reduced-motion'
);
assert(
  !html.includes('aria-expanded'),
  'must not redo leftover hamburger aria-expanded (PR #70)'
);
assert(
  !/\.announcement-track:focus-visible/.test(css) &&
  !/\.float-cart:focus-visible/.test(css) &&
  !/\.order-optional-toggle:focus-visible/.test(css),
  'must not add leftover :focus-visible forest rings in this run'
);

if (failures.length) {
  console.error('check-ticker-reduced-motion failed:\n' + failures.map(f => ' - ' + f).join('\n'));
  process.exit(1);
}
console.log('check-ticker-reduced-motion: ok');
