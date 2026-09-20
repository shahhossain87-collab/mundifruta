#!/usr/bin/env node
/**
 * Guards for leftover current-page marker on leftover header .logo
 * when leftover #inicio is the destination.
 * Complementary to PR #92 (header spy / crumb current), PR #93
 * (menu/footer current), PR #94 (cat-quick current), PR #95
 * (mobile-bar / Encomendar current), PR #5 (does not add
 * Promoções / Quem Somos to the leftover header spy), leftover
 * #main-nav landmark (PR #74), leftover hamburger expanded
 * (PR #70), leftover shop-crumb links (PR #47), leftover 44px /
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
  html.includes('href="#inicio" class="logo" aria-current="page"') &&
  html.includes('MUNDI<span class="logo-accent">FRUTA</span>'),
  'leftover header wordmark should start current on leftover #inicio'
);
assert(
  app.includes('function marcarLogoAtual') &&
  app.includes("querySelector('#main-nav .logo')") &&
  app.includes("getElementById('inicio')") &&
  app.includes("setAttribute('aria-current', 'page')") &&
  app.includes("rootMargin:'0px 0px -40% 0px'"),
  'leftover #inicio spy should mark leftover .logo current and clear it when the leftover hero leaves'
);
assert(
  !app.includes("produtos:'#produtos', cabazes:'#cabazes', verao:'#verao', avaliacoes:'#avaliacoes', contacto:'#contacto', inicio:") &&
  !app.includes("map.inicio") &&
  app.includes("const map = { produtos:'#produtos', cabazes:'#cabazes', verao:'#verao', avaliacoes:'#avaliacoes', contacto:'#contacto' }"),
  'must not add leftover #inicio / Promoções / Quem Somos to the leftover header spy (PR #5 / #92)'
);
assert(
  html.includes('<span>Início</span>') &&
  html.includes('<span>Loja</span>') &&
  html.includes('id="crumb-cat">Frutas</b>') &&
  !html.includes('href="#inicio">Início</a>') &&
  !html.includes('href="#produtos">Loja</a>'),
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
  html.includes('<span class="mb-label" id="mb-cart-label">Carrinho</span>') &&
  html.includes('<span class="mb-label">Promoções</span>') &&
  html.includes('<span class="mb-label">WhatsApp</span>') &&
  html.includes('<span class="mb-label">Como Chegar</span>') &&
  !html.includes('data-bar='),
  'must not redo leftover mobile-bar / Encomendar current (PR #95) or leftover mb-cart name (PR #35)'
);
assert(
  html.includes('class="nav-order" onclick="irParaEncomenda()"') &&
  !html.includes('class="nav-order" data-bar') &&
  html.includes('🛒 Encomendar <span class="cart-badge"'),
  'leftover header Encomendar copy stays; leftover bar current stays for PR #95'
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
  app.includes('⭐ Mais vendido') &&
  app.includes('🌍 ${item.origem}'),
  'must not redo leftover badge / origin hiding (PR #87)'
);
assert(
  html.includes('id="search-clear" onclick="limparPesquisa()" aria-label="Limpar pesquisa">✕</button>') &&
  html.includes('class="scroll-top" id="scroll-top"') &&
  html.includes('title="Voltar ao topo">▲</button>'),
  'must not redo leftover close / scroll-top hiding (PR #86 / #85)'
);
assert(
  html.includes('🎁 10€ de desconto na primeira compra acima de 40€') &&
  !html.includes('role="main"') &&
  !html.includes('<main'),
  'must not redo leftover ticker-mark hiding (PR #84) or invent a leftover <main> landmark'
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
  console.error('check-logo-inicio-current failed:\n' + failures.map(f => ' - ' + f).join('\n'));
  process.exit(1);
}
console.log('check-logo-inicio-current: ok');
