#!/usr/bin/env node
/**
 * Guards for leftover checkout taps (cart stepper / remove / consent "Saber mais")
 * and Home/End on the Phase A vertical category tablist.
 * Complementary to PR #12 (44px only under 600px), PR #46 (consent-no/yes),
 * PR #49 (ArrowUp/Down), and PR #27 (Left/Right).
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const css = readFileSync(join(root, 'css/estilos.css'), 'utf8');
const app = readFileSync(join(root, 'js/app.js'), 'utf8');

const failures = [];
const assert = (cond, msg) => { if (!cond) failures.push(msg); };

assert(
  html.includes('css/estilos.css?v=53') && html.includes('js/app.js?v=43'),
  'index.html should cache-bust estilos.css?v=53 and app.js?v=43'
);
assert(
  html.includes('js/extras.js?v=21'),
  'extras.js cache token should stay ?v=21'
);
assert(
  /id="tab-frutas"[^>]*aria-controls="grid-catalog"/.test(html) &&
    /id="tab-legumes"[^>]*aria-controls="grid-catalog"/.test(html) &&
    /id="tab-ervas"[^>]*aria-controls="grid-catalog"/.test(html) &&
    /id="tab-epoca"[^>]*aria-controls="grid-catalog"/.test(html) &&
    /id="tab-promocoes"[^>]*aria-controls="grid-catalog"/.test(html),
  'catalog category tabs should point aria-controls at #grid-catalog'
);
assert(
  /id="tab-cabazes"[^>]*onclick="abrirCabazes\(\)"/.test(html) &&
    !/id="tab-cabazes"[^>]*aria-controls=/.test(html),
  'Cabazes tab is a section jump and must not claim the catalog grid'
);

assert(
  app.includes('function ligarInicioFimCatalogo') &&
    app.includes("e.key !== 'Home'") &&
    app.includes("e.key !== 'End'") &&
    app.includes('ligarInicioFimCatalogo();'),
  'vertical sidebar tabs should move with Home/End'
);
assert(
  !app.includes('function ligarSetasVerticaisCatalogo') &&
    !app.includes('function ligarSetasCategorias') &&
    !app.includes('function irParaSeccao'),
  'must not redo PR #49 ArrowUp/Down, PR #27 Left/Right, or PR #29 scroll helpers'
);

assert(
  /\.oi-stepper button \{[^}]*width:44px/.test(css) &&
    /\.oi-stepper button \{[^}]*height:44px/.test(css) &&
    /\.oi-stepper button \{[^}]*flex:0 0 44px/.test(css),
  'leftover cart quantity buttons should be 44×44 at all breakpoints'
);
assert(
  /\.order-remove \{[^}]*width:44px/.test(css) &&
    /\.order-remove \{[^}]*height:44px/.test(css) &&
    /\.order-remove \{[^}]*flex:0 0 44px/.test(css),
  'leftover cart remove control should be 44×44 at all breakpoints'
);
assert(
  !/@media \(max-width:600px\)\{[^}]*\.oi-stepper button \{ width:44px/.test(css),
  'must not redo PR #12 mobile-only cart tap rule'
);
assert(
  /\.consent-link \{[^}]*min-height:44px/.test(css),
  'leftover consent “Saber mais” control should be at least 44px tall'
);
assert(
  !/\.consent-no \{[^}]*min-height:44px/.test(css) &&
    !/\.consent-yes \{[^}]*min-height:44px/.test(css),
  'must not redo PR #46 consent-no/yes tap sizes'
);

if (failures.length) {
  console.error('check-checkout-home-leftover failed:\n' + failures.map(f => ' - ' + f).join('\n'));
  process.exit(1);
}
console.log('check-checkout-home-leftover: ok');
