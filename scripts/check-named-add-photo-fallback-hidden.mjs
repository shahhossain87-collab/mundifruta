#!/usr/bin/env node
/**
 * Guards for leftover decorative plus marks on named add buttons
 * and leftover photo-fallback emojis.
 * Complementary to PR #90 (howto / avatar / chrome), PR #89 (qty
 * marks), PR #88 (coupon / carousel / CS plus), leftover featured /
 * cabaz-card / product-modal plus-only adds (PR #71 / #66 / #26),
 * leftover Adicionar restore (PR #60), leftover hamburger expanded
 * (PR #70), leftover 44px / peach-ring shop PRs.
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
  html.includes('js/extras.js?v=22') && html.includes('js/dados.js?v=25'),
  'extras.js cache token should be ?v=22; dados.js stays ?v=25'
);

assert(
  app.includes("onclick=\"adicionarProduto('${id}', produtos_map['${id}'])\"><span aria-hidden=\"true\">＋</span> Adicionar</button>"),
  'leftover catalog add plus should be wrapped aria-hidden; leftover Adicionar stays'
);
assert(
  html.includes('class="btn-wa cabaz-modal-add" id="cabaz-modal-add"><span aria-hidden="true">＋</span></button>'),
  'leftover cabaz-modal add plus should be wrapped aria-hidden'
);
assert(
  app.includes("addBtn.setAttribute('aria-label', `Adicionar ${item.nome} ao carrinho`)"),
  'leftover cabaz-modal add name from merged PR #61 stays'
);

assert(
  app.includes('wrap.innerHTML = `<div class="photo-fallback" aria-hidden="true">${img.dataset.emoji}</div>`') &&
  app.includes("fb.setAttribute('aria-hidden', 'true')"),
  'leftover photo-fallback / sc-fallback emojis should be aria-hidden'
);
assert(
  extras.includes("ariaHidden:'true'"),
  'leftover cross-sell emoji fallback should be aria-hidden'
);

assert(
  /id="product-modal-add"[^>]*>＋<\/button>/.test(html) &&
  app.includes("onclick=\"adicionarProduto('${item._id}', produtos_map['${item._id}'])\">＋</button>") &&
  app.includes("onclick=\"adicionarProduto('${id}', produtos_map['${id}'])\">＋</button>"),
  'must not wrap leftover featured / cabaz-card / product-modal plus-only adds'
);
assert(
  extras.includes('<span class="cs-add">＋</span>'),
  'must not redo leftover CS plus hiding (PR #88)'
);
assert(
  app.includes("if (add) add.textContent = '＋';"),
  'must not redo leftover Adicionar restore (PR #60); selected add still becomes a plus'
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
  html.includes('<span class="osm-step"><b>1</b> Escolha os produtos</span>') &&
  html.includes('aria-label="Menu">') &&
  !html.includes('aria-expanded') &&
  !html.includes('aria-controls="mobile-menu"'),
  'must not redo leftover howto-avatar-chrome hiding (PR #90) or leftover hamburger expanded (PR #70)'
);
assert(
  css.includes('.photo-fallback {') &&
  css.includes('.sc-fallback {') &&
  css.includes('.cs-emoji {') &&
  css.includes('.add-btn {') &&
  css.includes('.cabaz-modal-add {'),
  'leftover photo-fallback / add styles stay'
);
assert(
  dados.includes('nome:"Melancia 1/4"') &&
  dados.includes('nome:"Cabaz Detox"') &&
  'must not invent leftover product / cabaz names'
);

if (failures.length) {
  console.error('check-named-add-photo-fallback-hidden failed:\n' + failures.map(f => ' - ' + f).join('\n'));
  process.exit(1);
}
console.log('check-named-add-photo-fallback-hidden: ok');
