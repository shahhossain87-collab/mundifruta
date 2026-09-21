#!/usr/bin/env node
/**
 * Guards for leftover toast / Voltar ao topo / product+cabaz preview /
 * Filtros drawer / float-cart show motion under prefers-reduced-motion.
 * Complementary to PR #104 (ticker / html scroll-behavior), PR #30
 * (carousel scroll-behavior / float-cart.pop), PR #33 (cs-pop animation),
 * PR #20 (cardIn), PR #16 (.fi), leftover offer-reveal (already on master).
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
const assert = (cond, msg) => { if (!cond) failures.push(msg); };

const reduceBlocks = [...css.matchAll(/@media \(prefers-reduced-motion:\s*reduce\)\s*\{([\s\S]*?)\n\s*\}/g)]
  .map(m => m[1]);
const overlayReduce = reduceBlocks.find(b =>
  b.includes('.toast') &&
  b.includes('.scroll-top') &&
  b.includes('.product-modal') &&
  b.includes('.cabaz-modal') &&
  b.includes('.shop-sidebar') &&
  b.includes('.float-cart')
);

assert(
  html.includes('css/estilos.css?v=65') && html.includes('js/app.js?v=38'),
  'index.html should cache-bust estilos.css?v=65 and keep app.js?v=38'
);
assert(
  html.includes('js/extras.js?v=21') && html.includes('js/dados.js?v=25'),
  'extras.js should stay ?v=21 and dados.js should stay ?v=25'
);
assert(!!overlayReduce, 'leftover overlay reduced-motion rule must list toast / scroll-top / product+cabaz / drawer / float-cart');
assert(
  overlayReduce && /transition:\s*none/.test(overlayReduce),
  'leftover overlay reduced-motion rule must set transition:none'
);
assert(
  overlayReduce &&
  overlayReduce.includes('.product-modal-box') &&
  overlayReduce.includes('.cabaz-modal-box'),
  'leftover product/cabaz inner boxes must also drop their transform transition'
);

const overlayIdx = css.lastIndexOf('@media (prefers-reduced-motion: reduce)');
const toastIdx = css.indexOf('.toast {');
const scrollIdx = css.indexOf('.scroll-top {');
assert(
  overlayIdx > toastIdx && overlayIdx > scrollIdx,
  'leftover overlay reduced-motion rule must sit after leftover desktop toast / scroll-top so it wins'
);

assert(
  !overlayReduce.includes('scroll-behavior') &&
  !overlayReduce.includes('.announcement-track') &&
  !overlayReduce.includes('animation:none') &&
  !overlayReduce.includes('.feature-grid') &&
  !overlayReduce.includes('.float-cart.pop') &&
  !overlayReduce.includes('.cs-pop') &&
  !overlayReduce.includes('.fi') &&
  !overlayReduce.includes('cardIn'),
  'must not redo leftover ticker/html scroll (PR #104), carousel/cart-pop (PR #30), cs-pop (PR #33), .fi (PR #16), or cardIn (PR #20)'
);

assert(
  html.includes('Carrinho') &&
  html.includes('Promoções') &&
  html.includes('WhatsApp') &&
  html.includes('Como Chegar') &&
  html.includes('Melancia 1/4 aprox. 3 kg'),
  'visible 4-item bar labels and leftover ticker Melancia copy stay'
);
assert(
  html.includes('id="toast"') &&
  html.includes('title="Voltar ao topo"') &&
  html.includes('id="product-modal"') &&
  html.includes('id="cabaz-modal"') &&
  html.includes('id="shop-sidebar"') &&
  html.includes('id="float-cart"'),
  'leftover toast / Voltar ao topo / product / cabaz / Filtros / float-cart markup stays'
);
assert(
  !html.includes('aria-expanded') &&
  !html.includes('<main') &&
  !html.includes('class="skip') &&
  !html.includes('aria-current'),
  'must not add leftover skip / <main> / hamburger expanded / current-page'
);
assert(
  !app.includes('function irParaSeccao') &&
  !app.includes('function marcarLogoAtual') &&
  extras.includes("const GOOGLE_ADS_ID = 'AW-16771350041'"),
  'must not redo leftover irParaSeccao / current-page helpers; leftover extras analytics stay'
);

if (failures.length) {
  console.error('check-reduced-motion-overlays failed:\n' + failures.map(f => ' - ' + f).join('\n'));
  process.exit(1);
}
console.log('check-reduced-motion-overlays: ok');
