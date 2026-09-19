#!/usr/bin/env node
/**
 * Guards for leftover header / hero tap targets (logo, Encomendar, Google
 * rating) and leftover peach focus rings on those controls plus the WhatsApp
 * checkout CTA.
 * Complementary to PR #51 (nav-links / footer / carousel 44px), PR #31
 * (Encomendar / hamburger / nav-link focus), PR #7 (hamburger 44px),
 * PR #25 (Encomendar type=button), PR #32 (hero stars aria-hidden / Comprar
 * Agora focus), PR #38 (hero dock gutter).
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
  html.includes('css/estilos.css?v=55') && html.includes('js/app.js?v=36'),
  'index.html should cache-bust estilos.css?v=55 and keep app.js?v=36'
);
assert(
  html.includes('js/extras.js?v=21'),
  'extras.js cache token should stay ?v=21'
);
assert(
  html.includes('class="logo"') && html.includes('href="#inicio"'),
  'header wordmark should keep the existing #inicio hash'
);
assert(
  html.includes('class="nav-order"') && html.includes('irParaEncomenda()'),
  'header Encomendar control and handler stay unchanged'
);
assert(
  /class="hero-rating"[^>]*href="https:\/\/maps\.app\.goo\.gl\/1gHGqMac4ahTtfxf8/.test(html),
  'hero rating must keep the existing Google Maps reviews URL'
);
assert(
  html.includes('class="btn-wa"') && html.includes('Encomendar por WhatsApp'),
  'WhatsApp checkout CTA copy stays unchanged'
);

assert(
  /\.logo \{[^}]*min-height:44px/.test(css),
  'leftover header wordmark should be at least 44px tall'
);
assert(
  /\.nav-order \{[^}]*min-height:44px/.test(css),
  'leftover header Encomendar should be at least 44px tall'
);
assert(
  /\.hero-rating \{[^}]*min-height:44px/.test(css),
  'leftover hero Google rating should be at least 44px tall'
);
assert(
  /\.logo:focus-visible/.test(css) &&
  /\.hero-rating:focus-visible/.test(css) &&
  /\.btn-wa:focus-visible/.test(css),
  'leftover logo / hero rating / WhatsApp CTA should show a keyboard ring'
);

assert(
  !/\.nav-links a \{[^}]*min-height:44px/.test(css),
  'must not redo PR #51 leftover header nav-link taps'
);
assert(
  !/\.footer-links a \{[^}]*min-height:44px/.test(css),
  'must not redo PR #51 leftover footer taps'
);
assert(
  !/\.carousel-nav \{[^}]*width:44px/.test(css),
  'must not redo PR #51 leftover carousel taps'
);
assert(
  !/\.nav-order:focus-visible/.test(css) &&
  !/\.hamburger:focus-visible/.test(css),
  'must not redo PR #31 Encomendar / hamburger focus rings'
);
assert(
  !/\.hamburger \{[^}]*min-height:44px/.test(css) &&
  !/\.hamburger \{[^}]*width:44px/.test(css),
  'must not redo PR #7 hamburger tap size'
);
assert(
  !/\.hero-content \{[^}]*margin-right:200px/.test(css),
  'must not redo PR #38 hero dock gutter'
);
assert(
  !app.includes('function atualizarPainelCatalogo') &&
  !app.includes('function irParaSeccao') &&
  !app.includes('function ligarInicioFimCatalogo'),
  'must not redo leftover catalog-tab / scroll helpers from open PRs'
);

if (failures.length) {
  console.error('check-header-hero-taps failed:\n' + failures.map(f => ' - ' + f).join('\n'));
  process.exit(1);
}
console.log('check-header-hero-taps: ok');
