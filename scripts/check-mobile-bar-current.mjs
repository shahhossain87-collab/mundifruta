#!/usr/bin/env node
/**
 * Guards for leftover current markers on leftover #mobile-bar
 * Promoções / Carrinho and leftover header Encomendar.
 * Complementary to PR #92 (header spy / crumb current), PR #93
 * (menu/footer current), PR #94 (cat-quick current), PR #5
 * (does not add Promoções / Quem Somos to the leftover header spy),
 * leftover #mobile-bar landmark (PR #74), leftover mb-cart name
 * (PR #35), leftover hamburger expanded (PR #70), leftover 44px /
 * peach-ring shop PRs, leftover JSON-LD.
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
  html.includes('class="nav-order" data-bar="encomenda"') &&
  html.includes('class="mb-item" data-bar="encomenda"') &&
  html.includes('class="mb-item" data-bar="promocoes" href="#promocoes"'),
  'leftover header Encomendar and leftover 4-item Carrinho / Promoções should expose data-bar'
);
assert(
  html.includes('id="mb-cart-label">Carrinho</span>') &&
  html.includes('<span class="mb-label">Promoções</span>') &&
  html.includes('<span class="mb-label">WhatsApp</span>') &&
  html.includes('<span class="mb-label">Como Chegar</span>') &&
  html.includes('🛒 Encomendar <span class="cart-badge"'),
  'visible leftover Carrinho / Promoções / WhatsApp / Como Chegar / Encomendar stay'
);
assert(
  !/class="mb-item"[^>]*href="https:\/\/wa\.me[^"]*"[^>]*data-bar/.test(html) &&
  !/class="mb-item"[^>]*href="https:\/\/www\.google\.com\/maps\/dir[^"]*"[^>]*data-bar/.test(html),
  'leftover WhatsApp / Como Chegar stay unmarked (no data-bar)'
);
assert(
  app.includes('function marcarBarraAtual(id)') &&
  app.includes("marcarBarraAtual('encomenda')") &&
  app.includes("marcarBarraAtual('produtos')") &&
  app.includes("promo.addEventListener('click', () => marcarBarraAtual('promocoes'))"),
  'leftover bar / Encomendar current should follow leftover Promoções click and leftover irParaEncomenda / continuarAComprar'
);
assert(
  app.includes("el.setAttribute('aria-current', el.tagName === 'A' ? 'page' : 'true')"),
  'leftover Promoções link uses aria-current=page; leftover Carrinho / Encomendar buttons use true'
);

assert(
  app.includes("const map = { produtos:'#produtos', cabazes:'#cabazes', verao:'#verao', avaliacoes:'#avaliacoes', contacto:'#contacto' }") &&
  !app.includes("link.setAttribute('aria-current', 'page')") &&
  !app.includes("a.setAttribute('aria-current', 'page')") &&
  !html.includes('id="crumb-cat" aria-current'),
  'must not redo leftover header spy / crumb current (PR #92) or leftover menu/footer current (PR #93)'
);
assert(
  !html.includes('data-cat="frutas"') &&
  !html.includes('class="cat-quick-btn" data-cat') &&
  !app.includes('function marcarAtalhoAtual'),
  'must not redo leftover cat-quick current (PR #94)'
);
assert(
  html.includes('<span>Início</span><span class="crumb-sep" aria-hidden="true">›</span>') &&
  html.includes('<span>Loja</span><span class="crumb-sep" aria-hidden="true">›</span>') &&
  html.includes('<b id="crumb-cat">Frutas</b>'),
  'must not redo leftover shop-crumb links (PR #47); Início / Loja stay plain text'
);
assert(
  html.includes('id="main-nav">') &&
  !html.includes('id="main-nav" aria-label') &&
  html.includes('id="mobile-bar">') &&
  !html.includes('id="mobile-bar" aria-label') &&
  html.includes('aria-label="Menu">') &&
  !html.includes('aria-expanded') &&
  !html.includes('aria-controls="mobile-menu"'),
  'must not redo leftover main-nav / mobile-bar landmarks (PR #74) or leftover hamburger expanded (PR #70)'
);
assert(
  html.includes('id="mobile-menu">') &&
  !html.includes('id="mobile-menu" aria-label') &&
  html.includes('<div class="footer-links">') &&
  !html.includes('<nav class="footer-links"'),
  'must not redo leftover mobile-menu / footer-links landmarks (PR #75 / #76)'
);
assert(
  !html.includes('id="mb-cart"') &&
  html.includes('id="mb-cart-label">Carrinho</span>'),
  'must not redo leftover mb-cart name (PR #35)'
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
  !/\.btn-wa \{[^}]*min-height:44px/.test(css) &&
  !/\.mb-item \{[^}]*min-height:44px/.test(css) &&
  !html.includes('role="tabpanel"') &&
  !html.includes('"@type": "OrderAction"'),
  'must not redo leftover 44px tap-target / tabpanel / JSON-LD PRs'
);
assert(
  dados.includes('nome:"Melancia 1/4"') &&
  dados.includes('nome:"Cabaz Detox"'),
  'must not invent leftover product / cabaz names'
);

if (failures.length) {
  console.error('check-mobile-bar-current failed:\n' + failures.map(f => ' - ' + f).join('\n'));
  process.exit(1);
}
console.log('check-mobile-bar-current: ok');
