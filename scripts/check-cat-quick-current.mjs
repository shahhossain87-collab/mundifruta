#!/usr/bin/env node
/**
 * Guards for leftover current-category markers on leftover .cat-quick
 * shortcut tiles. Complementary to PR #92 (header nav spy aria-current /
 * leftover crumb location), PR #93 (leftover mobile-menu / footer
 * current-page), PR #5 (does not add Promoções / Quem Somos to the spy),
 * leftover cat-quick landmark (PR #75), leftover shortcut types / alts
 * (PR #25), leftover shop-crumb links (PR #47), leftover hamburger
 * expanded (PR #70), leftover 44px / peach-ring shop PRs, leftover
 * JSON-LD.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const app = readFileSync(join(root, 'js/app.js'), 'utf8');
const extras = readFileSync(join(root, 'js/extras.js'), 'utf8');
const css = readFileSync(join(root, 'css/estilos.css'), 'utf8');
const dados = readFileSync(join(root, 'js/dados.js'), 'utf8');

const failures = [];
const assert = (cond, msg) => { if (!cond) failures.push(msg); };

assert(
  html.includes('css/estilos.css?v=64') && html.includes('js/app.js?v=39'),
  'index.html should cache-bust app.js?v=39; estilos.css stays ?v=64'
);
assert(
  html.includes('js/extras.js?v=21') && html.includes('js/dados.js?v=25'),
  'extras.js cache token should stay ?v=21; dados.js stays ?v=25'
);

assert(
  /<button class="cat-quick-btn" data-cat="frutas" aria-current="true" onclick="abrirCatalogo\('frutas'\)">/.test(html) &&
  /<button class="cat-quick-btn" data-cat="legumes" onclick="abrirCatalogo\('legumes'\)">/.test(html) &&
  /<button class="cat-quick-btn" data-cat="ervas" onclick="abrirCatalogo\('ervas'\)">/.test(html) &&
  /<button class="cat-quick-btn" data-cat="epoca" onclick="abrirCatalogo\('epoca'\)">/.test(html) &&
  /<button class="cat-quick-btn" data-cat="promocoes" onclick="abrirCatalogo\('promocoes'\)">/.test(html) &&
  /<button class="cat-quick-btn" data-cat="cabazes" onclick="abrirCabazes\(\)">/.test(html),
  'leftover category shortcut tiles should carry data-cat; leftover Frutas starts as aria-current=true'
);
assert(
  html.includes('class="cat-quick-btn cq-order" onclick="document.getElementById(\'encomenda\').scrollIntoView({behavior:\'smooth\'})"') &&
  !/cq-order"[^>]*data-cat/.test(html) &&
  !/cq-order"[^>]*aria-current/.test(html),
  'leftover Carrinho tile stays unmarked (encomenda is not a leftover catalog filter)'
);
assert(
  app.includes("document.querySelectorAll('.cat-quick-btn[data-cat]')") &&
  app.includes("btn.setAttribute('aria-current', 'true')") &&
  app.includes("btn.removeAttribute('aria-current')") &&
  app.includes('marcarAtalhoAtual(cat);') &&
  app.includes("marcarAtalhoAtual('cabazes')") &&
  app.includes('marcarAtalhoAtual(catalogo.categoria);'),
  'leftover cat-quick tiles should follow leftover mostrarCategoria / abrirCabazes / init'
);

assert(
  !app.includes("link.setAttribute('aria-current', 'page')") &&
  !app.includes("document.querySelectorAll('#mobile-menu a, .footer-links a')") &&
  !html.includes('id="crumb-cat" aria-current'),
  'must not redo leftover header nav spy / crumb current (PR #92) or leftover menu/footer current (PR #93)'
);
assert(
  app.includes("const map = { produtos:'#produtos', cabazes:'#cabazes', verao:'#verao', avaliacoes:'#avaliacoes', contacto:'#contacto' }"),
  'must not redo leftover nav spy sections (PR #5); Promoções / Quem Somos stay unwatched'
);
assert(
  html.includes('<span>Início</span><span class="crumb-sep" aria-hidden="true">›</span>') &&
  html.includes('<span>Loja</span><span class="crumb-sep" aria-hidden="true">›</span>') &&
  html.includes('<b id="crumb-cat">Frutas</b>'),
  'must not redo leftover shop-crumb links (PR #47); Início / Loja stay plain text'
);

assert(
  html.includes('<div class="cat-quick">') &&
  !html.includes('<nav class="cat-quick"') &&
  html.includes('alt="Seleção de frutas frescas"') &&
  !html.includes('type="button" class="cat-quick-btn"') &&
  !html.includes('class="cat-quick-btn" type="button"'),
  'must not redo leftover cat-quick landmark (PR #75) or leftover shortcut types / alts (PR #25)'
);
assert(
  html.includes('id="main-nav">') &&
  !html.includes('id="main-nav" aria-label') &&
  html.includes('aria-label="Menu">') &&
  !html.includes('aria-expanded') &&
  !html.includes('aria-controls="mobile-menu"'),
  'must not redo leftover main-nav landmark (PR #74) or leftover hamburger expanded (PR #70)'
);

assert(
  app.includes("onclick=\"adicionarProduto('${id}', produtos_map['${id}'])\">＋ Adicionar</button>") &&
  html.includes('class="btn-wa cabaz-modal-add" id="cabaz-modal-add">＋</button>') &&
  /id="product-modal-add"[^>]*>＋<\/button>/.test(html),
  'must not redo leftover named-add / photo-fallback hiding (PR #91); leftover plus-only adds stay unwrapped'
);
assert(
  app.includes('aria-label="Diminuir">−</button>') &&
  app.includes('aria-label="Aumentar">+</button>') &&
  app.includes('aria-label="Menos">−</button>') &&
  app.includes('aria-label="Mais">+</button>'),
  'must not redo leftover qty-mark hiding (PR #89)'
);
assert(
  extras.includes('box.innerHTML = `🎁 <strong>Cupão de ${cupaoConfig.desconto}€ reservado.') &&
  extras.includes("prev.textContent = '‹'"),
  'must not redo leftover coupon / carousel hiding (PR #88)'
);
assert(
  app.includes('<div class="top-badge">⭐ Mais vendido</div>') &&
  app.includes('<span class="product-origem">🌍 ${item.origem}</span>'),
  'must not redo leftover badge / origin hiding (PR #87)'
);
assert(
  html.includes('id="search-clear" onclick="limparPesquisa()" aria-label="Limpar pesquisa">✕</button>') &&
  html.includes('class="scroll-top" id="scroll-top"') &&
  html.includes('title="Voltar ao topo">▲</button>'),
  'must not redo leftover close / scroll-top hiding (PR #86 / #85)'
);
assert(
  html.includes('<span>🎁 10€ de desconto na primeira compra acima de 40€</span>'),
  'must not redo leftover ticker-mark hiding (PR #84)'
);

assert(
  css.includes('.cat-quick-btn {') &&
  css.includes('.cq-label'),
  'leftover category shortcut styles stay'
);
assert(
  dados.includes('nome:"Melancia 1/4"') &&
  dados.includes('nome:"Cabaz Detox"'),
  'must not invent leftover product / cabaz names'
);

if (failures.length) {
  console.error('check-cat-quick-current failed:\n' + failures.map(f => ' - ' + f).join('\n'));
  process.exit(1);
}
console.log('check-cat-quick-current: ok');
