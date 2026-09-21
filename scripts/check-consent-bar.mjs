#!/usr/bin/env node
/**
 * Guards for leftover cookie-banner clearance above the leftover 4-item
 * mobile bar. Complementary to PR #108 (toast vs bar), PR #107 (scroll-top
 * vs bar), PR #106 (cs-pop vs bar), PR #105 (html scroll-padding-bottom),
 * and PR #4 (consent+toast vs bar + toast-under-header). This leftover
 * only lifts #consent where leftover #mobile-bar is shown.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const credits = readFileSync(join(root, 'creditos.html'), 'utf8');
const css = readFileSync(join(root, 'css/estilos.css'), 'utf8');
const app = readFileSync(join(root, 'js/app.js'), 'utf8');
const extras = readFileSync(join(root, 'js/extras.js'), 'utf8');

const failures = [];
const assert = (cond, msg) => { if (!cond) failures.push(msg); };

assert(
  html.includes('css/estilos.css?v=65') && credits.includes('css/estilos.css?v=65'),
  'index.html and creditos.html should cache-bust estilos.css?v=65'
);
assert(
  html.includes('js/app.js?v=38') &&
  html.includes('js/extras.js?v=21') &&
  html.includes('js/dados.js?v=25'),
  'app.js stays ?v=38, extras.js stays ?v=21, dados.js stays ?v=25'
);

assert(
  /@media \(max-width:768px\) \{\s*\.consent \{ bottom: calc\(84px \+ env\(safe-area-inset-bottom, 0px\)\); \}/.test(css),
  'leftover consent should clear leftover 4-item bar at ≤768px'
);
assert(
  /@media \(max-width:700px\) \{\s*\.consent \{ bottom: calc\(92px \+ env\(safe-area-inset-bottom, 0px\)\); \}/.test(css),
  'leftover consent should match leftover denser bar at ≤700px'
);
assert(
  css.includes('.consent {\n      position:fixed; left:12px; right:12px; bottom:12px; z-index:1500;'),
  'leftover desktop consent stays at bottom:12px'
);
assert(
  css.indexOf('position:fixed; left:12px; right:12px; bottom:12px; z-index:1500;') <
    css.indexOf('@media (max-width:768px) {\n      .consent { bottom: calc(84px + env(safe-area-inset-bottom, 0px)); }'),
  'leftover mobile consent clearance must follow leftover desktop bottom:12px so it wins the cascade'
);
assert(
  html.includes('id="consent"') &&
  html.includes('Só essenciais') &&
  html.includes('Aceitar tudo') &&
  html.includes('Saber mais') &&
  html.includes('Preferências de privacidade'),
  'visible leftover cookie copy stays'
);
assert(
  html.includes('Carrinho') &&
  html.includes('Promoções') &&
  html.includes('WhatsApp') &&
  html.includes('Como Chegar') &&
  /class="mobile-bar" id="mobile-bar"/.test(html),
  'leftover 4-item bar labels stay'
);

assert(
  css.includes('.toast {\n      position:fixed; bottom:32px; left:50%; transform:translateX(-50%) translateY(20px);') &&
  !/@media \(max-width:768px\) \{\s*\.toast \{ bottom: calc\(84px/.test(css),
  'must not redo leftover toast-bar (PR #108)'
);
assert(
  css.includes('.scroll-top {\n      position:fixed; bottom:28px; left:28px;') &&
  !/@media \(max-width:768px\) \{\s*\.scroll-top \{ bottom: calc\(84px/.test(css),
  'must not redo leftover scroll-top-bar (PR #107)'
);
assert(
  css.includes('.cs-pop {\n      position:fixed; left:50%; bottom:84px;') &&
  css.includes('.cs-pop { bottom:74px; }') &&
  !/@media \(max-width:768px\) \{\s*\.cs-pop \{ bottom: calc\(84px/.test(css),
  'must not redo leftover cs-pop-bar (PR #106)'
);
assert(
  !/html\s*\{[^}]*scroll-padding-bottom/.test(css) &&
  !/html\s*\{[^}]*scroll-padding-top/.test(css),
  'must not redo leftover scroll-padding (PR #97 / #105)'
);
assert(
  !html.includes('class="skip-link') &&
  !html.includes('<main') &&
  !html.includes('aria-expanded') &&
  !app.includes("setAttribute('aria-current'") &&
  !app.includes('aria-current="page"'),
  'must not add leftover skip / <main> / hamburger expanded / current-page'
);
assert(
  !html.includes('for="cust-nome"') &&
  !html.includes('id="cust-nome-label"') &&
  !app.includes('function irParaSeccao') &&
  html.includes('onclick="irParaEncomenda()"') &&
  html.includes('class="hamburger" onclick="toggleMenu()" aria-label="Menu"'),
  'must not redo leftover order labels, irParaSeccao, or hamburger expanded'
);
assert(
  extras.includes("document.getElementById('consent').hidden = false") &&
  extras.includes('function initConsent') &&
  extras.includes("localStorage.getItem('mf_consent')"),
  'leftover cookie show/hide stays in extras.js'
);

if (failures.length) {
  console.error('check-consent-bar failed:\n' + failures.map(f => ' - ' + f).join('\n'));
  process.exit(1);
}
console.log('check-consent-bar: ok');
