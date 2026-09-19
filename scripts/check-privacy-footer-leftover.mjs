#!/usr/bin/env node
/**
 * Guards for leftover privacy-dialog / footer-credit tap targets and leftover
 * peach focus rings on those links plus overlay closes, Filtros, and cabaz-ver.
 * Complementary to PR #53 (contact-card / float-cart / offer rings),
 * PR #51 (footer-links 44px), PR #46 (privacy-reset 44px),
 * PR #16 (dialog close 44px), PR #40 (Filtros / sidebar-close 44px),
 * PR #45 (cabaz-ver tap size), PR #8 (info-strip / Morada maps).
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
  html.includes('css/estilos.css?v=57') && html.includes('js/app.js?v=36'),
  'index.html should cache-bust estilos.css?v=57 and keep app.js?v=36'
);
assert(
  html.includes('js/extras.js?v=21'),
  'extras.js cache token should stay ?v=21'
);
assert(
  html.includes('href="https://wa.me/351932699850"') &&
  html.includes('>WhatsApp<') &&
  html.includes('href="mailto:shahhossain87@gmail.com"') &&
  html.includes('>email<'),
  'privacy-dialog WhatsApp and email hrefs and visible words stay unchanged'
);
assert(
  html.includes('href="mailto:shahhossain050187@gmail.com"') &&
  html.includes('>Shah Hossain<'),
  'footer credit href and visible name stay unchanged'
);
assert(
  html.includes('class="privacy-close"') &&
  html.includes('class="cs-pop-close"') &&
  html.includes('class="product-modal-close"') &&
  html.includes('class="cabaz-modal-close"') &&
  html.includes('class="filtbtn"') &&
  html.includes('class="sidebar-close"'),
  'overlay close and filter-drawer controls stay in place'
);

assert(
  /\.privacy-box a \{[^}]*min-height:44px/.test(css),
  'leftover privacy WhatsApp/email should be at least 44px tall'
);
assert(
  /\.footer-credit a \{[^}]*min-height:44px/.test(css),
  'leftover footer-credit link should be at least 44px tall'
);
assert(
  /\.privacy-box a:focus-visible/.test(css) &&
  /\.footer-credit a:focus-visible/.test(css) &&
  /\.privacy-close:focus-visible/.test(css) &&
  /\.cs-pop-close:focus-visible/.test(css) &&
  /\.product-modal-close:focus-visible/.test(css) &&
  /\.cabaz-modal-close:focus-visible/.test(css) &&
  /\.filtbtn:focus-visible/.test(css) &&
  /\.sidebar-close:focus-visible/.test(css) &&
  /\.cabaz-ver:focus-visible/.test(css),
  'leftover privacy / footer / overlay / filter / cabaz-ver should show a keyboard ring'
);

assert(
  !/\.contact-card a \{[^}]*min-height:44px/.test(css) &&
  !/\.float-cart \{[^}]*min-height:44px/.test(css),
  'must not redo PR #53 leftover contact / float-cart taps'
);
assert(
  !/\.footer-links a \{[^}]*min-height:44px/.test(css),
  'must not redo PR #51 leftover footer-link taps'
);
assert(
  !/\.privacy-reset \{[^}]*min-height:44px/.test(css) &&
  !/\.cs-pop-skip \{[^}]*min-height:44px/.test(css),
  'must not redo PR #46 leftover privacy-reset / skip taps'
);
assert(
  !/\.privacy-close \{[^}]*width:44px/.test(css) &&
  !/\.cs-pop-close \{[^}]*width:44px/.test(css) &&
  !/\.product-modal-close \{[^}]*width:44px/.test(css) &&
  !/\.cabaz-modal-close \{[^}]*width:44px/.test(css),
  'must not redo PR #16 leftover dialog-close tap sizes'
);
assert(
  !/\.filtbtn \{[^}]*min-height:44px/.test(css) &&
  !/\.sidebar-close \{[^}]*width:44px/.test(css),
  'must not redo PR #40 leftover Filtros / sidebar-close tap sizes'
);
assert(
  !/\.cabaz-ver \{[^}]*min-height:44px/.test(css),
  'must not redo PR #45 leftover cabaz-ver tap size'
);
assert(
  !html.includes('href="tel:+351932699850"') &&
  html.includes('Av de Portugal, Centro Cívico') &&
  !/<h4>Morada<\/h4>\s*<a[\s\S]*maps\.app\.goo\.gl/.test(html),
  'must not redo PR #7 tel:+351 or PR #8 contact Morada maps URL'
);
assert(
  !/\.logo:focus-visible/.test(css) &&
  !/\.hero-rating:focus-visible/.test(css) &&
  !/\.btn-wa:focus-visible/.test(css) &&
  !/\.contact-card a:focus-visible/.test(css) &&
  !/\.float-cart:focus-visible/.test(css) &&
  !/\.reveal-close:focus-visible/.test(css),
  'must not redo PR #52 / #53 leftover header / contact / offer focus'
);
assert(
  !app.includes('function irParaSeccao') &&
  !app.includes('function atualizarPainelCatalogo'),
  'must not redo leftover catalog-tab / scroll helpers from open PRs'
);

if (failures.length) {
  console.error('check-privacy-footer-leftover failed:\n' + failures.map(f => ' - ' + f).join('\n'));
  process.exit(1);
}
console.log('check-privacy-footer-leftover: ok');
