#!/usr/bin/env node
/**
 * Guards for leftover dialog close names and leftover nav landmarks.
 * Complementary to PR #73 (cabaz/CS dialog roles, not close labels),
 * PR #32 (consent aria-modal / product-modal box, not these closes),
 * PR #33 (cabaz close *type* / overlay aria-hidden, not the name),
 * PR #8 (focus trap), PR #16 (dialog close *size*), PR #54 (close rings),
 * PR #34 (desktop social-dock landmark, not main-nav / mobile-bar),
 * PR #70 / #71 / #72 (add / qty names, not closes).
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const app = readFileSync(join(root, 'js/app.js'), 'utf8');

const failures = [];
const assert = (cond, msg) => { if (!cond) failures.push(msg); };

assert(
  html.includes('css/estilos.css?v=64') && html.includes('js/app.js?v=39'),
  'index.html should cache-bust estilos.css?v=64 and app.js?v=39'
);
assert(
  html.includes('js/extras.js?v=21') && html.includes('js/dados.js?v=25'),
  'extras.js / dados.js cache tokens should stay ?v=21 / ?v=25'
);
assert(
  /<nav id="main-nav" aria-label="Principal">/.test(html),
  'leftover #main-nav should be named Principal'
);
assert(
  /<nav class="mobile-bar" id="mobile-bar" aria-label="Carrinho e contactos">/.test(html),
  'leftover #mobile-bar should be named from the existing Carrinho / contact items'
);
assert(
  html.includes('aria-label="Fechar sugestões"'),
  'leftover CS close should reuse the existing Sugestões dialog name'
);
assert(
  html.includes('aria-label="Fechar política de privacidade"'),
  'leftover privacy close should reuse the existing Política de Privacidade title'
);
assert(
  app.includes('closeBtn.setAttribute(\'aria-label\', `Fechar ${item.nome}`)') &&
  app.includes("document.getElementById('product-modal').querySelector('.product-modal-close')") &&
  app.includes("document.getElementById('cabaz-modal').querySelector('.cabaz-modal-close')"),
  'leftover product/cabaz close should name the open item'
);
assert(
  /id="product-modal-add"[^>]*>＋<\/button>/.test(html) &&
  html.includes('class="btn-wa cabaz-modal-add" id="cabaz-modal-add">＋</button>'),
  'product/cabaz modal add buttons stay a visible plus (PR #2 / #26)'
);
assert(
  (html.match(/aria-label="Fechar"/g) || []).length === 2,
  'leftover HTML Fechar fallback stays only on product/cabaz close (names are set in JS)'
);
assert(
  /<button class="hamburger" onclick="toggleMenu\(\)" aria-label="Menu">/.test(html) &&
  !html.includes('aria-expanded="false"'),
  'must not redo leftover hamburger expanded (PR #70)'
);
assert(
  app.includes('aria-label="Diminuir"') &&
  app.includes('aria-label="Aumentar"') &&
  app.includes('aria-label="Menos"') &&
  app.includes('aria-label="Mais"'),
  'must not redo leftover catalog qty labels (PR #5 / #67) or cart stepper names (PR #31)'
);
assert(
  /<button class="nav-order" onclick="irParaEncomenda\(\)">/.test(html),
  'must not redo leftover Encomendar type (PR #25)'
);
assert(
  html.includes('role="dialog" aria-label="Sugestões de produtos">') &&
  !html.includes('id="cs-pop" hidden role="dialog" aria-modal="true"'),
  'must not redo leftover CS aria-modal (PR #73)'
);
assert(
  html.includes('<button class="cabaz-modal-close" onclick="fecharCabaz()" aria-label="Fechar">✕</button>'),
  'leftover cabaz close keeps the HTML Fechar fallback (name is set in abrirCabaz)'
);
assert(
  html.includes('<button class="product-modal-close" type="button" onclick="fecharProduto()" aria-label="Fechar">✕</button>'),
  'leftover product-modal close keeps the HTML Fechar fallback (name is set in abrirProduto)'
);

if (failures.length) {
  console.error('check-dialog-close-nav-landmarks failed:\n' + failures.map(f => ' - ' + f).join('\n'));
  process.exit(1);
}
console.log('check-dialog-close-nav-landmarks: ok');
