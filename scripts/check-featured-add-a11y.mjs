#!/usr/bin/env node
/**
 * Guards for featured-add accessible names, cart stepper names,
 * base-price contrast, leftover button types, and keyboard focus rings.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const css = readFileSync(join(root, 'css/estilos.css'), 'utf8');
const app = readFileSync(join(root, 'js/app.js'), 'utf8');

const failures = [];
function assert(cond, msg) {
  if (!cond) failures.push(msg);
}

assert(/estilos\.css\?v=38/.test(html), 'index.html should cache-bust estilos.css?v=38');
assert(/app\.js\?v=33/.test(html), 'index.html should cache-bust app.js?v=33');
assert(/extras\.js\?v=21/.test(html), 'this run should not bump extras.js cache');

assert(/class="feature-add"[\s\S]*?aria-label="Adicionar \$\{item\.nome\} ao carrinho"/.test(app),
  'featured add buttons should include the product name in the accessible name');
assert(/aria-label="Diminuir quantidade de \$\{i\.nome\}"/.test(app),
  'cart minus should name the product');
assert(/aria-label="Aumentar quantidade de \$\{i\.nome\}"/.test(app),
  'cart plus should name the product');
assert(!/aria-label="Menos"/.test(app) && !/aria-label="Mais"/.test(app),
  'cart steppers should not keep the generic Menos/Mais labels');

assert(/id="tab-frutas"[^>]*type="button"/.test(html) || /type="button"[^>]*id="tab-frutas"/.test(html),
  'Frutas tab should be type=button');
assert(/id="tab-legumes"[^>]*type="button"/.test(html) || /type="button"[^>]*id="tab-legumes"/.test(html),
  'Legumes tab should be type=button');
assert(/<button type="button" class="mb-item"/.test(html),
  'mobile cart tab should be type=button');
assert(/class="hero-wave"[^>]*aria-hidden="true"/.test(html),
  'decorative hero wave should be hidden from assistive tech');

assert(/\.product-base \{[^}]*color:var\(--text-md\)/.test(css),
  'catalog base-price line should use readable --text-md on white');
assert(!/\.product-base \{[^}]*color:var\(--sage-lt\)/.test(css),
  'catalog base-price line should not keep pale sage-lt on white');
assert(/\.cat-tab:focus-visible/.test(css),
  'category tabs should show a keyboard focus ring');
assert(/\.feature-add:focus-visible/.test(css),
  'featured add should show a keyboard focus ring');
assert(/\.nav-links a:focus-visible/.test(css),
  'header nav links should show a keyboard focus ring');
assert(/\.mb-item:focus-visible/.test(css),
  'mobile bottom-bar items should show a keyboard focus ring');

if (failures.length) {
  console.error('check-featured-add-a11y failed:\n' + failures.map(f => ' - ' + f).join('\n'));
  process.exit(1);
}
console.log('check-featured-add-a11y: ok');
