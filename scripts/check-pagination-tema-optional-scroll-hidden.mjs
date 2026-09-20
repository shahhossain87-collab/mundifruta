#!/usr/bin/env node
/**
 * Guards for leftover decorative marks on leftover catalog pagination
 * arrows, leftover review tema-chip ✓, leftover order-optional +, and
 * leftover scroll-top ▲. Complementary to PR #84 (ticker / cabaz-ver /
 * social / how-to marks), PR #83 (Filtros / shop-link / reviews-cta),
 * PR #82 (filter-chip / checkout / welcome-offer), PR #81 (hero / qs /
 * nav-order / Google-badge), PR #80 (contact / cart / pay icons),
 * leftover pagination 44px / status (PR #49 / #29), leftover optional
 * disclosure (PR #27 / #16), leftover scroll-top name / hide (PR #28),
 * leftover hamburger expanded (PR #70), leftover 44px / peach-ring
 * shop PRs.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const app = readFileSync(join(root, 'js/app.js'), 'utf8');
const css = readFileSync(join(root, 'css/estilos.css'), 'utf8');

const failures = [];
const assert = (cond, msg) => { if (!cond) failures.push(msg); };

assert(
  html.includes('css/estilos.css?v=65') && html.includes('js/app.js?v=39'),
  'index.html should cache-bust estilos.css?v=65 and app.js?v=39'
);
assert(
  html.includes('js/extras.js?v=21') && html.includes('js/dados.js?v=25'),
  'extras.js / dados.js cache tokens should stay ?v=21 / ?v=25'
);

assert(
  app.includes('aria-label="Página anterior"><span aria-hidden="true">←</span> Anterior') &&
  app.includes('aria-label="Página seguinte">Seguinte <span aria-hidden="true">→</span>') &&
  app.includes('<span>Página ${catalogo.pagina} de ${paginas}</span>'),
  'leftover pagination arrows should be aria-hidden; visible Anterior / Seguinte stay'
);
assert(
  /\.catalog-pagination > span \{/.test(css) &&
  !/\.catalog-pagination span \{/.test(css),
  'leftover pagination page-status selector should stay child-only so wrapped arrows do not become muted flex items'
);

assert(
  app.includes('<span class="tema-chip"><span aria-hidden="true">✓</span> ${t}</span>') &&
  !app.includes('class="tema-chip">✓ ${t}'),
  'leftover review tema-chip check should be aria-hidden; visible theme names stay'
);

assert(
  html.includes('<span aria-hidden="true">+</span> Hora de levantamento ou nota <span>(opcional)</span>') &&
  html.includes('id="order-optional-toggle"') &&
  /\.order-optional-toggle > span:not\(\[aria-hidden\]\) \{/.test(css) &&
  !/\.order-optional-toggle span \{/.test(css),
  'leftover order-optional plus should be aria-hidden; visible Hora de levantamento copy and (opcional) fade stay'
);

assert(
  html.includes('id="scroll-top"') &&
  html.includes('title="Voltar ao topo"><span aria-hidden="true">▲</span></button>') &&
  !html.includes('aria-label="Voltar ao topo"'),
  'leftover scroll-top triangle should be aria-hidden; title Voltar ao topo stays; must not redo leftover scroll-top name (PR #28)'
);

assert(
  html.includes('>🎁 10€ de desconto na primeira compra acima de 40€<') &&
  app.includes('>👁 Ver o que leva<') &&
  html.includes('class="social-icon"') &&
  html.includes('class="step-num">1</div>') &&
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
  html.includes('🛒 Encomendar <span class="cart-badge"') &&
  html.includes('class="gb-logo">G</span>'),
  'must not redo leftover hero / qs / nav-order / Google-badge hiding (PR #81)'
);

assert(
  html.includes('class="contact-icon">📍</div>') &&
  html.includes('class="mb-icon">🛒</span>') &&
  html.includes('class="fc-icon">🛒</span>') &&
  html.includes('>🛒 A Sua Encomenda<') &&
  html.includes('>✓ MB WAY<'),
  'must not redo leftover contact / cart / pay icon hiding (PR #80)'
);

assert(
  html.includes('class="info-item"><span>🕗</span>') &&
  html.includes('class="osm-arrow">→</span>') &&
  !html.includes('aria-label="Levantamento na Loja"'),
  'must not redo leftover info-strip / order-steps-mini landmarks or emoji hiding (PR #79)'
);

assert(
  html.includes("onclick=\"abrirCatalogo('frutas')\">Explorar fruta") &&
  app.includes("function abrirCatalogo") &&
  !app.includes("abrirCatalogo('epoca')"),
  'must not change leftover epoca featured CTA destination (PR #40)'
);

assert(
  /id="product-modal-add"[^>]*>＋<\/button>/.test(html) &&
  html.includes('class="btn-wa cabaz-modal-add" id="cabaz-modal-add">＋</button>') &&
  app.includes('onclick="adicionarProduto(\'${item._id}\', produtos_map[\'${item._id}\'])">＋</button>') &&
  app.includes('aria-label="Diminuir"') &&
  app.includes('aria-label="Menos"') &&
  !html.includes('aria-expanded="false"') &&
  !html.includes('aria-label="Principal"') &&
  !html.includes('aria-label="Carrinho e contactos"') &&
  !app.includes('aria-label="Ver o que leva no ${item.nome}"') &&
  !app.includes('function irParaSeccao') &&
  !app.includes('function atualizarPainelCatalogo') &&
  !html.includes('role="tabpanel"') &&
  !html.includes('for="cust-nome"') &&
  !html.includes('id="cust-nome-label"'),
  'product/cabaz/featured add stay a visible plus; must not redo leftover hamburger, nav landmarks, cabaz-ver name, or catalog tabpanel helpers'
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
  !/\.cabaz-ver \{[^}]*display:\s*none/.test(css) &&
  !/\.btn-wa:focus-visible/.test(css) &&
  !/\.nav-order:focus-visible/.test(css) &&
  !/\.logo:focus-visible/.test(css) &&
  !/\.shop-link:focus-visible/.test(css) &&
  !/\.reviews-cta:focus-visible/.test(css) &&
  !/\.cabaz-ver:focus-visible/.test(css) &&
  !/\.social-link:focus-visible/.test(css) &&
  !/\.scroll-top:focus-visible/.test(css) &&
  !/\.order-optional-toggle:focus-visible/.test(css),
  'must not redo leftover 44px tap-target, peach-ring, or cabaz-ver hide-under-700px shop PRs'
);

if (failures.length) {
  console.error('check-pagination-tema-optional-scroll-hidden failed:\n' + failures.map(f => ' - ' + f).join('\n'));
  process.exit(1);
}
console.log('check-pagination-tema-optional-scroll-hidden: ok');
