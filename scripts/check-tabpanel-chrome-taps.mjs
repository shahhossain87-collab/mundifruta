#!/usr/bin/env node
/**
 * Guards for leftover catalog tabpanel semantics and leftover chrome taps
 * (nav links, footer links, featured carousel arrows) plus leftover
 * checkout/consent focus rings.
 * Complementary to PR #50 (aria-controls / Home/End / checkout 44px),
 * PR #49 (grid aria-label / pagination), PR #34/#32 (footer gutter / focus),
 * PR #31 (nav focus), PR #15 (touch carousel 44px).
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
  html.includes('css/estilos.css?v=54') && html.includes('js/app.js?v=44'),
  'index.html should cache-bust estilos.css?v=54 and app.js?v=44'
);
assert(
  html.includes('js/extras.js?v=21'),
  'extras.js cache token should stay ?v=21'
);
assert(
  /id="grid-catalog"[^>]*role="tabpanel"/.test(html) &&
    /id="grid-catalog"[^>]*aria-labelledby="tab-frutas"/.test(html) &&
    /id="grid-catalog"[^>]*tabindex="-1"/.test(html),
  'catalog grid should be a focusable tabpanel labelled by the Frutas tab'
);
assert(
  !/id="grid-cabazes"[^>]*role="tabpanel"/.test(html) &&
    !/id="tab-cabazes"[^>]*aria-controls=/.test(html),
  'Cabazes stays a section jump and must not become a tabpanel'
);
assert(
  !/id="tab-frutas"[^>]*aria-controls=/.test(html),
  'must not redo PR #50 catalog-tab aria-controls'
);

assert(
  app.includes('function atualizarPainelCatalogo') &&
    app.includes('aria-labelledby') &&
    app.includes('atualizarPainelCatalogo();'),
  'catalog panel labelledby should follow the selected category'
);
assert(
  !app.includes('function ligarInicioFimCatalogo') &&
    !app.includes('function ligarSetasVerticaisCatalogo') &&
    !app.includes('function ligarSetasCategorias') &&
    !app.includes('function irParaSeccao'),
  'must not redo PR #50 Home/End, PR #49 ArrowUp/Down, PR #27 Left/Right, or PR #29 scroll helpers'
);

assert(
  /\.carousel-nav \{[^}]*width:44px/.test(css) &&
    /\.carousel-nav \{[^}]*height:44px/.test(css),
  'leftover featured carousel arrows should be 44×44'
);
assert(
  !/@media \(hover:none\) \{ \.carousel-nav \{[^}]*width:44px/.test(css),
  'must not redo PR #15 touch-only carousel arrow rule'
);
assert(
  /\.nav-links a \{[^}]*min-height:44px/.test(css),
  'leftover header nav links should be at least 44px tall'
);
assert(
  /\.footer-links a \{[^}]*min-height:44px/.test(css),
  'leftover footer shop links should be at least 44px tall'
);
assert(
  !/\.footer-links \{[^}]*margin-right:180px/.test(css),
  'must not redo PR #34 footer dock gutter'
);
assert(
  /\.oi-stepper button:focus-visible/.test(css) &&
    /\.order-remove:focus-visible/.test(css) &&
    /\.consent-link:focus-visible/.test(css),
  'leftover checkout / Saber mais controls should show a keyboard ring'
);
assert(
  !/\.oi-stepper button \{[^}]*width:44px/.test(css) &&
    !/\.consent-link \{[^}]*min-height:44px/.test(css),
  'must not redo PR #50 leftover checkout / Saber mais tap sizes'
);

if (failures.length) {
  console.error('check-tabpanel-chrome-taps failed:\n' + failures.map(f => ' - ' + f).join('\n'));
  process.exit(1);
}
console.log('check-tabpanel-chrome-taps: ok');
