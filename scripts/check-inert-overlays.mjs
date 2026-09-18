#!/usr/bin/env node
/**
 * Guards for ticker pacing, inert floating controls, legumes CTA placement,
 * search mobile typing attrs, and order-notes resize.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const css = readFileSync(join(root, 'css/estilos.css'), 'utf8');

const failures = [];
function assert(cond, msg) {
  if (!cond) failures.push(msg);
}

assert(/estilos\.css\?v=38/.test(html), 'index.html should cache-bust estilos.css?v=38');
assert(/spellcheck="false"/.test(html) && /autocapitalize="none"/.test(html),
  'search input should disable spellcheck and autocapitalize');
assert(/class="veg-suggestion" type="button"/.test(html),
  'legumes continue CTA should be type=button');
assert(/id="scroll-top"[^>]*aria-label="Voltar ao topo"/.test(html),
  'scroll-top should have an accessible name');

assert(/animation:\s*ticker 48s linear infinite/.test(css),
  'announcement ticker should run at 48s so prices stay readable');
assert(/\.float-cart \{[\s\S]*?visibility:hidden/.test(css),
  'float-cart should be visibility:hidden while empty');
assert(/\.float-cart\.visible \{[^}]*visibility:visible/.test(css),
  'float-cart.visible should restore visibility');
assert(/\.scroll-top \{[\s\S]*?visibility:hidden/.test(css),
  'scroll-top should be visibility:hidden until shown');
assert(/\.scroll-top\.visible \{[^}]*visibility:visible/.test(css),
  'scroll-top.visible should restore visibility');
assert(/\.veg-suggestion \{[\s\S]*?position:relative/.test(css),
  'veg-suggestion should not be position:sticky');
assert(!/\.veg-suggestion \{[\s\S]*?position:sticky/.test(css),
  'veg-suggestion sticky positioning should be removed');
assert(/\.order-form textarea \{[^}]*resize:vertical/.test(css),
  'order notes should allow vertical resize');

if (failures.length) {
  console.error('check-inert-overlays failed:\n' + failures.map(f => ' - ' + f).join('\n'));
  process.exit(1);
}
console.log('check-inert-overlays: ok');
