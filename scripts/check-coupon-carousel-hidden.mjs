#!/usr/bin/env node
/**
 * Guards for leftover decorative coupon / carousel / cross-sell marks.
 * Complementary to PR #87 (badge / cart / toast), PR #86 (close /
 * credits), PR #85 (pagination / tema / optional / scroll-top),
 * PR #84 (ticker / cabaz-ver / social / how-to), PR #83 (Filtros /
 * shop-link / reviews-cta), PR #82 (filter-chip / checkout /
 * welcome-offer), leftover CS ＋ names (PR #4), leftover carousel
 * arrow titles (PR #32), leftover hamburger expanded (PR #70),
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
  html.includes('css/estilos.css?v=64') && html.includes('js/app.js?v=38'),
  'index.html should keep estilos.css?v=64 and app.js?v=38'
);
assert(
  html.includes('js/extras.js?v=22') && html.includes('js/dados.js?v=25'),
  'index.html should cache-bust extras.js?v=22; dados.js stays ?v=25'
);

assert(
  extras.includes('box.innerHTML = `<span aria-hidden="true">🎁 </span><strong>Cupão de ${cupaoConfig.desconto}€ reservado.') &&
  extras.includes('box.innerHTML = `<span aria-hidden="true">🎁 </span>Faltam <strong>${faltam}</strong>') &&
  extras.includes('box.innerHTML = `<span aria-hidden="true">✅ </span>Já atingiu o mínimo!'),
  'leftover coupon progress leading marks should be wrapped aria-hidden'
);
assert(
  extras.includes("prev.innerHTML = '<span aria-hidden=\"true\">‹</span>'") &&
  extras.includes("next.innerHTML = '<span aria-hidden=\"true\">›</span>'") &&
  extras.includes("prev.setAttribute('aria-label', 'Anterior')") &&
  extras.includes("next.setAttribute('aria-label', 'Seguinte')"),
  'leftover carousel arrows should be wrapped aria-hidden; Anterior / Seguinte stay'
);
assert(
  extras.includes('<span class="cs-add" aria-hidden="true">＋</span>'),
  'leftover cross-sell ＋ should be wrapped aria-hidden'
);

assert(
  dados.includes('codigo: "MUNDI10"') &&
  dados.includes('desconto: 10') &&
  dados.includes('minimo: 40') &&
  extras.includes('Cupão de ${cupaoConfig.desconto}€ reservado') &&
  extras.includes('Adicione produtos até ${cupaoConfig.minimo}€') &&
  extras.includes('Já atingiu o mínimo! Desconto de boas-vindas') &&
  extras.includes('Cupão ${cupaoConfig.codigo} confirmado no levantamento na loja'),
  'visible coupon progress copy and dados.js cupão values stay'
);
assert(
  extras.includes('mostrarToast(`🎁 Cupão ${cupaoConfig.codigo} reservado (mín. ${cupaoConfig.minimo}€)`)') &&
  extras.includes("return `\\n\\nCupão ${cupaoConfig.codigo}: -${formatarCentimos(d)}"),
  'must not wrap leftover coupon toast or change leftover WhatsApp coupon text'
);

assert(
  html.includes('>🎁 10€ de desconto na primeira compra acima de 40€<') &&
  app.includes('>👁 Ver o que leva<') &&
  html.includes('class="social-icon"') &&
  html.includes('class="step-num">1<') &&
  !html.includes('class="social-icon" aria-hidden="true"') &&
  !html.includes('class="step-num" aria-hidden="true"'),
  'must not redo leftover ticker / cabaz-ver / social / how-to hiding (PR #84)'
);
assert(
  html.includes('>⚙️ Filtros<') &&
  html.includes('>Ver catálogo completo →<') &&
  html.includes('>Ver todas as frutas →<') &&
  html.includes('>Explorar fruta →<') &&
  html.includes('>Ver todos os legumes →<') &&
  html.includes('>Ver todas as avaliações no Google →<'),
  'must not redo leftover Filtros / shop-link / reviews-cta hiding (PR #83)'
);
assert(
  html.includes('>🏷️ Em promoção<') &&
  html.includes('>✓ Disponíveis<') &&
  html.includes('>📱 Encomendar por WhatsApp<') &&
  html.includes('>🔒 Sem pagamento antecipado. Pague apenas na loja ao levantar.') &&
  html.includes('>← Continuar a comprar<') &&
  html.includes('>🎁 Receber Oferta<'),
  'must not redo leftover filter-chip / checkout / welcome-offer hiding (PR #82)'
);
assert(
  html.includes('>🕗 Aberto Hoje · 8h–20h<') &&
  html.includes('>🌅 Frescura diária<') &&
  html.includes('🛒 Encomendar <span class="cart-badge"'),
  'must not redo leftover hero / qs / nav-order hiding (PR #81)'
);
assert(
  html.includes('class="contact-icon">📍<') &&
  html.includes('class="mb-icon">🛒<') &&
  html.includes('class="fc-icon">🛒<') &&
  html.includes('>🛒 A Sua Encomenda<') &&
  html.includes('>✓ MB WAY<'),
  'must not redo leftover contact / cart / pay icon hiding (PR #80)'
);
assert(
  html.includes('id="search-clear"') &&
  html.includes('aria-label="Limpar pesquisa">✕<') &&
  html.includes('aria-label="Fechar filtros">✕<') &&
  html.includes('title="Voltar ao topo">▲<') &&
  html.includes('+ Hora de levantamento ou nota <span>(opcional)</span>'),
  'must not redo leftover close / credits / pagination / optional / scroll-top hiding (PR #86 / #85)'
);
assert(
  app.includes('${item.badge}</span>') &&
  app.includes('⭐ Mais vendido') &&
  app.includes('🌍 ${item.origem}') &&
  app.includes('${i.emoji} ${i.nome}') &&
  app.includes('aria-label="Remover ${i.nome}">×</button>') &&
  app.includes('t.textContent = msg') &&
  !app.includes('function esconderMarcaInicial'),
  'must not redo leftover badge / origin / cart / toast hiding (PR #87)'
);

assert(
  html.includes("onclick=\"abrirCatalogo('frutas')\">Explorar fruta") &&
  app.includes('function abrirCatalogo') &&
  !app.includes("abrirCatalogo('epoca')"),
  'must not change leftover epoca featured CTA destination (PR #40)'
);

assert(
  /id="product-modal-add"[^>]*>＋<\/button>/.test(html) &&
  html.includes('class="btn-wa cabaz-modal-add" id="cabaz-modal-add">＋</button>') &&
  app.includes("onclick=\"adicionarProduto('${item._id}', produtos_map['${item._id}'])\">＋</button>") &&
  app.includes('>＋ Adicionar</button>') &&
  app.includes('aria-label="Diminuir"') &&
  app.includes('aria-label="Menos"') &&
  !html.includes('aria-expanded="false"') &&
  !html.includes('aria-label="Principal"') &&
  !html.includes('aria-label="Carrinho e contactos"') &&
  !app.includes('aria-label="Ver o que leva no ${item.nome}"') &&
  !app.includes('class="add-btn" type="button" onclick="adicionarProduto(\'${id}\', produtos_map[\'${id}\'])" aria-label=') &&
  !app.includes('class="feature-add" onclick="adicionarProduto(\'${item._id}\', produtos_map[\'${item._id}\'])" aria-label=') &&
  !app.includes('function irParaSeccao') &&
  !app.includes('function atualizarPainelCatalogo') &&
  !html.includes('role="tabpanel"') &&
  !html.includes('for="cust-nome"'),
  'product/cabaz/featured add stay a visible plus; must not redo leftover hamburger, add names, or catalog tabpanel helpers'
);

assert(
  app.includes('t += `• *${i.qtd}x* ${i.nome}') &&
  !app.includes('encodeURIComponent(esconderMarcaInicial'),
  'must not change leftover WhatsApp / email order text'
);

assert(
  !/\.btn-wa \{[^}]*min-height:44px/.test(css) &&
  !/\.btn-prim \{[^}]*min-height:44px/.test(css) &&
  !/\.hamburger \{[^}]*min-(width|height):44px/.test(css) &&
  !/\.nav-order \{[^}]*min-height:44px/.test(css) &&
  !/\.google-badge \{[^}]*min-height:44px/.test(css) &&
  !/\.shop-link \{[^}]*min-height:44px/.test(css) &&
  !/\.reviews-cta \{[^}]*min-height:44px/.test(css) &&
  !/\.filtbtn \{[^}]*min-height:44px/.test(css) &&
  !/\.cabaz-ver \{[^}]*min-height:44px/.test(css) &&
  !/\.social-link \{[^}]*min-height:44px/.test(css) &&
  !/\.scroll-top \{[^}]*min-height:44px/.test(css) &&
  !/\.order-optional-toggle \{[^}]*min-height:44px/.test(css) &&
  !/\.catalog-pagination button \{[^}]*min-height:44px/.test(css) &&
  !/\.search-clear \{[^}]*min-(width|height):44px/.test(css) &&
  !/\.sidebar-close \{[^}]*min-(width|height):44px/.test(css) &&
  !/\.product-modal-close \{[^}]*min-(width|height):44px/.test(css) &&
  !/\.cabaz-modal-close \{[^}]*min-(width|height):44px/.test(css) &&
  !/\.privacy-close \{[^}]*min-(width|height):44px/.test(css) &&
  !/\.cs-pop-close \{[^}]*min-(width|height):44px/.test(css) &&
  !/\.order-remove \{[^}]*min-(width|height):44px/.test(css) &&
  !/\.carousel-nav \{[^}]*min-(width|height):44px/.test(css) &&
  !/\.cabaz-ver \{[^}]*display:\s*none/.test(css) &&
  !/\.btn-wa:focus-visible/.test(css) &&
  !/\.nav-order:focus-visible/.test(css) &&
  !/\.logo:focus-visible/.test(css) &&
  !/\.shop-link:focus-visible/.test(css) &&
  !/\.reviews-cta:focus-visible/.test(css) &&
  !/\.cabaz-ver:focus-visible/.test(css) &&
  !/\.social-link:focus-visible/.test(css) &&
  !/\.scroll-top:focus-visible/.test(css) &&
  !/\.order-optional-toggle:focus-visible/.test(css) &&
  !/\.search-clear:focus-visible/.test(css) &&
  !/\.sidebar-close:focus-visible/.test(css) &&
  !/\.product-modal-close:focus-visible/.test(css) &&
  !/\.cabaz-modal-close:focus-visible/.test(css) &&
  !/\.privacy-close:focus-visible/.test(css) &&
  !/\.cs-pop-close:focus-visible/.test(css) &&
  !/\.reveal-close:focus-visible/.test(css) &&
  !/\.order-remove:focus-visible/.test(css) &&
  !/\.carousel-nav:focus-visible/.test(css),
  'must not redo leftover 44px tap-target, peach-ring, or cabaz-ver hide-under-700px shop PRs'
);

if (failures.length) {
  console.error('check-coupon-carousel-hidden failed:\n' + failures.map(f => ' - ' + f).join('\n'));
  process.exit(1);
}
console.log('check-coupon-carousel-hidden: ok');
