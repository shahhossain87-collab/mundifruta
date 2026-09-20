#!/usr/bin/env node
/**
 * Guards for leftover decorative qty − / + marks.
 * Complementary to PR #88 (coupon / carousel / CS), PR #87 (badge /
 * cart / toast), PR #86 (close / credits), PR #85 (pagination / tema /
 * optional / scroll-top), leftover catalog qty *names* (PR #67 / #5),
 * leftover cabaz qty *names* (PR #61), leftover product-modal qty
 * *names* (PR #32), leftover cart Menos/Mais (PR #31), leftover
 * hamburger expanded (PR #70), leftover add plus marks, leftover
 * 44px / peach-ring shop PRs.
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
  app.includes('aria-label="Diminuir"><span aria-hidden="true">−</span></button>') &&
  app.includes('aria-label="Aumentar"><span aria-hidden="true">+</span></button>'),
  'leftover catalog qty − / + should be wrapped aria-hidden'
);
assert(
  app.includes('aria-label="Diminuir quantidade de ${item.nome}"><span aria-hidden="true">−</span></button>') &&
  app.includes('aria-label="Aumentar quantidade de ${item.nome}"><span aria-hidden="true">+</span></button>'),
  'leftover cabaz qty − / + should be wrapped aria-hidden; leftover cabaz names stay'
);
assert(
  app.includes('aria-label="Menos"><span aria-hidden="true">−</span></button>') &&
  app.includes('aria-label="Mais"><span aria-hidden="true">+</span></button>'),
  'leftover cart stepper − / + should be wrapped aria-hidden; Menos / Mais stay'
);
assert(
  html.includes('aria-label="Diminuir quantidade"><span aria-hidden="true">−</span></button>') &&
  html.includes('aria-label="Aumentar quantidade"><span aria-hidden="true">+</span></button>'),
  'leftover product-modal qty − / + should be wrapped aria-hidden; leftover names stay'
);

assert(
  app.includes('aria-label="Diminuir"') &&
  app.includes('aria-label="Aumentar"') &&
  app.includes('aria-label="Menos"') &&
  app.includes('aria-label="Mais"') &&
  app.includes('aria-label="Diminuir quantidade de ${item.nome}"') &&
  app.includes('aria-label="Aumentar quantidade de ${item.nome}"') &&
  html.includes('aria-label="Diminuir quantidade"') &&
  html.includes('aria-label="Aumentar quantidade"'),
  'must not redo leftover catalog / cabaz / modal / cart qty names'
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
  extras.includes('box.innerHTML = `🎁 <strong>Cupão de ${cupaoConfig.desconto}€ reservado.') &&
  extras.includes("prev.textContent = '‹'") &&
  extras.includes('<span class="cs-add">＋</span>'),
  'must not redo leftover coupon / carousel / CS hiding (PR #88)'
);
assert(
  app.includes('${item.badge}</span>') &&
  app.includes('⭐ Mais vendido') &&
  app.includes('🌍 ${item.origem}') &&
  app.includes('${i.emoji} ${i.nome}') &&
  app.includes('aria-label="Remover ${i.nome}">×</button>') &&
  app.includes('mostrarToast(`✓ ${item.nome} adicionado`)'),
  'must not redo leftover badge / cart / toast hiding (PR #87)'
);
assert(
  html.includes('aria-label="Limpar pesquisa">✕<') &&
  html.includes('aria-label="Fechar filtros">✕<') &&
  html.includes('title="Voltar ao topo">▲<') &&
  html.includes('+ Hora de levantamento ou nota <span>(opcional)</span>') &&
  html.includes('>⚙️ Filtros<') &&
  html.includes('>Ver catálogo completo →<') &&
  html.includes('>🎁 Receber Oferta<'),
  'must not redo leftover close / Filtros / shop-link / offer hiding'
);
assert(
  html.includes('class="hamburger" onclick="toggleMenu()" aria-label="Menu">') &&
  !html.includes('aria-expanded') &&
  !html.includes('aria-controls="mobile-menu"'),
  'must not redo leftover hamburger expanded (PR #70)'
);
assert(
  dados.includes('codigo: "MUNDI10"') &&
  !css.includes('qty-btn > span') &&
  html.includes('js/dados.js?v=25'),
  'must not change dados.js cupão values or leftover qty CSS'
);

if (failures.length) {
  console.error('check-qty-marks-hidden failed:\n' + failures.map(f => ' - ' + f).join('\n'));
  process.exit(1);
}
console.log('check-qty-marks-hidden: ok');
