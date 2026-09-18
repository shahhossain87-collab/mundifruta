#!/usr/bin/env node
/**
 * Guards for featured-carousel keyboard pause, named carousel regions,
 * reduced-motion carousel scrolling, and print chrome.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const css = readFileSync(join(root, 'css/estilos.css'), 'utf8');
const extras = readFileSync(join(root, 'js/extras.js'), 'utf8');

const failures = [];
function assert(cond, msg) {
  if (!cond) failures.push(msg);
}

assert(/estilos\.css\?v=38/.test(html), 'index.html should cache-bust estilos.css?v=38');
assert(/extras\.js\?v=22/.test(html), 'index.html should cache-bust extras.js?v=22');
assert(/app\.js\?v=32/.test(html), 'this run should not bump app.js cache');

assert(/setAttribute\('role', 'region'\)/.test(extras),
  'featured carousels should be named regions');
assert(/querySelector\('\.section-title'\)/.test(extras),
  'carousel accessible name should reuse the existing section title');
assert(/wrap\.addEventListener\('focusin', parar\)/.test(extras),
  'carousel autoplay should pause when keyboard focus enters');
assert(/wrap\.addEventListener\('focusout'/.test(extras),
  'carousel autoplay should resume after keyboard focus leaves');
assert(/:focus-within/.test(extras),
  'pointer leave should not restart autoplay while focus stays inside');

assert(/prefers-reduced-motion:reduce[\s\S]*?\.feature-grid\.carousel \{ scroll-behavior:auto; \}/.test(css),
  'carousel CSS scroll-behavior should be auto under reduced motion');
assert(/prefers-reduced-motion:reduce[\s\S]*?\.float-cart\.pop \{ animation:none; \}/.test(css),
  'floating cart pop should not animate under reduced motion');
assert(/@media print \{[\s\S]*?#main-nav[\s\S]*?\.mobile-bar[\s\S]*?\.product-card/.test(css),
  'print stylesheet should hide fixed chrome and keep product cards visible');

if (failures.length) {
  console.error('check-carousel-focus failed:\n' + failures.map(f => ' - ' + f).join('\n'));
  process.exit(1);
}
console.log('check-carousel-focus: ok');
