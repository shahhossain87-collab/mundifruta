#!/usr/bin/env node
/**
 * Guards for leftover current-page markers on the existing header
 * nav spy and leftover shop crumb. Complementary to PR #5 (does not
 * add Promoções / Quem Somos to the spy), leftover main-nav landmark
 * (PR #74), leftover shop-crumb links (PR #47), leftover named-add /
 * photo-fallback hiding (PR #91), leftover hamburger expanded
 * (PR #70), leftover 44px / peach-ring shop PRs, leftover JSON-LD.
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
  html.includes('<b id="crumb-cat" aria-current="location">Frutas</b>'),
  'leftover shop crumb should mark the current catalog location; leftover Frutas stays'
);
assert(
  html.includes('<span>Início</span><span class="crumb-sep" aria-hidden="true">›</span>') &&
  html.includes('<span>Loja</span><span class="crumb-sep" aria-hidden="true">›</span>'),
  'must not redo leftover shop-crumb links (PR #47); Início / Loja stay plain text'
);

assert(
  app.includes("link.setAttribute('aria-current', 'page')") &&
  app.includes("l.removeAttribute('aria-current')") &&
  app.includes("l.classList.remove('active')"),
  'leftover nav spy should expose the leftover .active link as aria-current=page'
);
assert(
  app.includes("const map = { produtos:'#produtos', cabazes:'#cabazes', verao:'#verao', avaliacoes:'#avaliacoes', contacto:'#contacto' }"),
  'must not redo leftover nav spy sections (PR #5); Promoções / Quem Somos stay unwatched'
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
  css.includes('.nav-links a.active {') &&
  css.includes('.shop-crumbs b {'),
  'leftover nav active / crumb styles stay'
);
assert(
  dados.includes('nome:"Melancia 1/4"') &&
  dados.includes('nome:"Cabaz Detox"'),
  'must not invent leftover product / cabaz names'
);

if (failures.length) {
  console.error('check-nav-crumb-current failed:\n' + failures.map(f => ' - ' + f).join('\n'));
  process.exit(1);
}
console.log('check-nav-crumb-current: ok');
