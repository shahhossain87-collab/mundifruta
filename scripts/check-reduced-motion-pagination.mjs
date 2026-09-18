#!/usr/bin/env node
/**
 * Guards for reduced-motion scroll helpers, catalog pagination status,
 * featured shop CTA tap size, and scroll-top pointer-events.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const css = readFileSync(join(root, 'css/estilos.css'), 'utf8');
const app = readFileSync(join(root, 'js/app.js'), 'utf8');
const extras = readFileSync(join(root, 'js/extras.js'), 'utf8');

const failures = [];
function assert(cond, msg) {
  if (!cond) failures.push(msg);
}

assert(/estilos\.css\?v=38/.test(html), 'index.html should cache-bust estilos.css?v=38');
assert(/app\.js\?v=33/.test(html), 'index.html should cache-bust app.js?v=33');
assert(/extras\.js\?v=22/.test(html), 'index.html should cache-bust extras.js?v=22');

assert(/id="grid-frutas" aria-label="Frutas"/.test(html), 'frutas grid needs an accessible name');
assert(/id="grid-legumes" aria-label="Legumes"/.test(html), 'legumes grid needs an accessible name');
assert(/id="grid-cabazes" aria-label="Cabazes"/.test(html), 'cabazes grid needs an accessible name');
assert(/onclick="irParaSeccao\('cabazes'\)"/.test(html), 'cabazes shortcut should use irParaSeccao');
assert(/onclick="irParaSeccao\('promocoes'\)"/.test(html), 'promo shortcut should use irParaSeccao');
assert(/onclick="irParaTopo\(\)"/.test(html), 'scroll-top should use irParaTopo');
assert(/type="button" class="shop-link"/.test(html), 'featured shop CTAs should be type=button');
assert(!/scrollIntoView\(\{behavior:'smooth'/.test(html), 'index.html should not hard-code smooth scrollIntoView');

assert(/function irParaSeccao\(/.test(app), 'app.js should define irParaSeccao');
assert(/function comportamentoScroll\(/.test(app), 'app.js should pick scroll behavior from reduced motion');
assert(/role="status">Página \$\{estado\.pagina\}/.test(app), 'pagination should expose a status live region');
assert(/grid\.focus\(\{ preventScroll: true \}\)/.test(app), 'pagination should move focus to the catalog grid');
assert(!/scrollIntoView\(\{ behavior:'smooth'/.test(app), 'app.js should not hard-code smooth scrollIntoView');

assert(/const scrollAnim = reduzir \? 'auto' : 'smooth'/.test(extras),
  'featured carousels should skip smooth scrolling under reduced motion');

assert(/\.shop-link \{[\s\S]*?min-height:44px/.test(css), 'shop-link should keep a 44px tap target');
assert(/\.catalog-pagination button \{[\s\S]*?min-height:44px/.test(css),
  'pagination buttons should be at least 44px tall');
assert(/\.scroll-top\.visible \{[^}]*pointer-events:auto/.test(css),
  'visible scroll-top should use pointer-events:auto');
assert(!/\.scroll-top\.visible \{[^}]*pointer-events:all/.test(css),
  'scroll-top should not use non-standard pointer-events:all');

if (failures.length) {
  console.error('check-reduced-motion-pagination failed:\n' + failures.map(f => ' - ' + f).join('\n'));
  process.exit(1);
}
console.log('check-reduced-motion-pagination: ok');
