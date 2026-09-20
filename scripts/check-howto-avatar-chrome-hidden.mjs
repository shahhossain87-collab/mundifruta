#!/usr/bin/env node
/**
 * Guards for leftover decorative mini how-to numbers, review avatars,
 * hamburger bars, and category overlays.
 * Complementary to PR #89 (qty marks), PR #88 (coupon / carousel / CS),
 * PR #87 (badge / cart / toast), PR #86 (close / credits), PR #85
 * (pagination / tema / optional / scroll-top), PR #84 (ticker / cabaz-ver
 * / social / full how-to), PR #79 (info-strip / mini-arrow hiding),
 * leftover hamburger expanded (PR #70), leftover add plus marks,
 * leftover 44px / peach-ring shop PRs.
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
  html.includes('<span class="osm-step"><b aria-hidden="true">1</b> Escolha os produtos</span>') &&
  html.includes('<span class="osm-step"><b aria-hidden="true">2</b> Adicione ao carrinho</span>') &&
  html.includes('<span class="osm-step"><b aria-hidden="true">3</b> Confirme o subtotal</span>') &&
  html.includes('<span class="osm-step"><b aria-hidden="true">4</b> Envie por WhatsApp</span>') &&
  html.includes('<span class="osm-step"><b aria-hidden="true">5</b> Levante na loja</span>'),
  'leftover mini how-to numbers should be wrapped aria-hidden; leftover step copy stays'
);
assert(
  html.includes('<span class="osm-arrow">→</span>'),
  'must not redo leftover mini-arrow hiding (PR #79)'
);
assert(
  html.includes('<div class="step-num">1</div>') &&
  html.includes('<div class="step-icon">1</div>'),
  'must not redo leftover full how-to step marks (PR #84)'
);

assert(
  app.includes('<span class="review-avatar" aria-hidden="true">${(a.nome[0]||\'?\').replace(\'[\',\'C\')}</span>${a.nome}'),
  'leftover review-avatar initials should be aria-hidden; leftover names stay'
);
assert(
  app.includes('review-stars') &&
  !app.includes('review-stars" aria-hidden'),
  'must not redo leftover review-star hiding (PR #33)'
);

assert(
  html.includes('aria-label="Menu">') &&
  html.includes('<span aria-hidden="true"></span><span aria-hidden="true"></span><span aria-hidden="true"></span>'),
  'leftover hamburger bars should be aria-hidden; leftover Menu label stays'
);
assert(
  !html.includes('aria-expanded') &&
  !html.includes('aria-controls="mobile-menu"'),
  'must not redo leftover hamburger expanded (PR #70)'
);

assert(
  (html.match(/<span class="cq-overlay" aria-hidden="true"><\/span>/g) || []).length === 7,
  'leftover category overlays should be aria-hidden'
);
assert(
  html.includes('data-count-label="frutas">Frutas</span>') &&
  html.includes('data-count-label="legumes">Legumes</span>') &&
  html.includes('data-count-label="ervas">Ervas frescas</span>') &&
  html.includes('data-count-label="epoca">Fruta da Época</span>') &&
  html.includes('data-count-label="promocoes">Promoções</span>') &&
  html.includes('data-count-label="cabazes">Cabazes</span>') &&
  html.includes('cq-label">Carrinho <b id="quick-cart-count">0</b></span>'),
  'leftover category / cart shortcut labels stay'
);

assert(
  /id="product-modal-add"[^>]*>＋<\/button>/.test(html) &&
  html.includes('class="btn-wa cabaz-modal-add" id="cabaz-modal-add">＋</button>') &&
  app.includes("onclick=\"adicionarProduto('${item._id}', produtos_map['${item._id}'])\">＋</button>") &&
  app.includes("onclick=\"adicionarProduto('${id}', produtos_map['${id}'])\">＋</button>") &&
  app.includes('>＋ Adicionar</button>'),
  'must not wrap leftover featured / cabaz / modal / catalog add plus marks'
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
  extras.includes("prev.textContent = '‹'") &&
  extras.includes('<span class="cs-add">＋</span>'),
  'must not redo leftover coupon / carousel / CS hiding (PR #88)'
);
assert(
  app.includes('<span class="top-badge">⭐ Mais vendido</span>') &&
  app.includes('<span class="product-origem">🌍 ${item.origem}</span>'),
  'must not redo leftover badge / origin hiding (PR #87)'
);
assert(
  html.includes('id="search-clear" onclick="limparPesquisa()" aria-label="Limpar pesquisa">✕</button>') &&
  html.includes('class="sidebar-close" type="button" onclick="toggleFiltros()" aria-label="Fechar filtros">✕</button>'),
  'must not redo leftover close-mark hiding (PR #86)'
);
assert(
  html.includes('class="scroll-top" id="scroll-top"') &&
  html.includes('title="Voltar ao topo">▲</button>'),
  'must not redo leftover scroll-top hiding (PR #85)'
);
assert(
  html.includes('<span>🎁 10€ de desconto na primeira compra acima de 40€</span>'),
  'must not redo leftover ticker-mark hiding (PR #84)'
);
assert(
  css.includes('.order-steps-mini .osm-step b {') &&
  css.includes('.hamburger span {') &&
  css.includes('.cq-overlay {') &&
  css.includes('.review-avatar {'),
  'leftover mini-step / hamburger / overlay / avatar styles stay'
);
assert(
  dados.includes('nome:"Ana Pinto"') &&
  dados.includes('nome:"Pedro Martins"') &&
  dados.includes('nome:"Eugene Nevezhin"'),
  'must not invent leftover review names'
);

if (failures.length) {
  console.error('check-howto-avatar-chrome-hidden failed:\n' + failures.map(f => ' - ' + f).join('\n'));
  process.exit(1);
}
console.log('check-howto-avatar-chrome-hidden: ok');
