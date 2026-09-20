#!/usr/bin/env node
/**
 * Guards for leftover decorative close ✕ marks and leftover credits ←.
 * Complementary to PR #85 (pagination / tema / optional / scroll-top),
 * PR #84 (ticker / cabaz-ver / social / how-to), PR #83 (Filtros /
 * shop-link / reviews-cta), PR #82 (filter-chip / checkout / offer),
 * leftover mobile-close name / type (PR #63), leftover dialog-close
 * names (PR #74), leftover credits back 44px / peach rings (PR #72),
 * leftover credits citation noopener (PR #73), leftover hamburger
 * expanded (PR #70), leftover 44px / peach-ring shop PRs.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const credits = readFileSync(join(root, 'creditos.html'), 'utf8');
const app = readFileSync(join(root, 'js/app.js'), 'utf8');
const css = readFileSync(join(root, 'css/estilos.css'), 'utf8');

const failures = [];
const assert = (cond, msg) => { if (!cond) failures.push(msg); };

assert(
  html.includes('css/estilos.css?v=64') && html.includes('js/app.js?v=38'),
  'index.html cache tokens should stay estilos.css?v=64 and app.js?v=38'
);
assert(
  html.includes('js/extras.js?v=21') && html.includes('js/dados.js?v=25'),
  'extras.js / dados.js cache tokens should stay ?v=21 / ?v=25'
);
assert(
  credits.includes('css/estilos.css?v=64'),
  'creditos.html cache token should stay estilos.css?v=64'
);

assert(
  html.includes('id="search-clear"') &&
  html.includes('aria-label="Limpar pesquisa"><span aria-hidden="true">✕</span></button>') &&
  !html.includes('aria-label="Limpar pesquisa">✕</button>'),
  'leftover search-clear mark should be aria-hidden; Limpar pesquisa stays'
);
assert(
  html.includes('class="sidebar-close"') &&
  html.includes('aria-label="Fechar filtros"><span aria-hidden="true">✕</span></button>') &&
  !html.includes('aria-label="Fechar filtros">✕</button>'),
  'leftover sidebar-close mark should be aria-hidden; Fechar filtros stays'
);
assert(
  html.includes('class="cs-pop-close"') &&
  html.includes('onclick="fecharCrossSell()" aria-label="Fechar"><span aria-hidden="true">✕</span></button>') &&
  html.includes('class="privacy-close"') &&
  html.includes('onclick="fecharPrivacidade()" aria-label="Fechar"><span aria-hidden="true">✕</span></button>') &&
  html.includes('class="product-modal-close"') &&
  html.includes('onclick="fecharProduto()" aria-label="Fechar"><span aria-hidden="true">✕</span></button>') &&
  html.includes('class="cabaz-modal-close"') &&
  html.includes('onclick="fecharCabaz()" aria-label="Fechar"><span aria-hidden="true">✕</span></button>') &&
  html.includes('class="reveal-close"') &&
  html.includes('aria-label="Fechar oferta"><span aria-hidden="true">✕</span></button>'),
  'leftover dialog-close marks should be aria-hidden; HTML Fechar / Fechar oferta fallbacks stay'
);
assert(
  credits.includes('class="credits-back" href="index.html"><span aria-hidden="true">←</span> Voltar à loja</a>') &&
  !credits.includes('>← Voltar à loja<') &&
  credits.includes('href="index.html"'),
  'leftover credits back arrow should be aria-hidden; visible Voltar à loja and same-tab index.html stay'
);

assert(
  html.includes('class="mobile-close" onclick="toggleMenu()">✕</button>') &&
  !html.includes('aria-label="Fechar menu"') &&
  !html.includes('class="mobile-close" type="button"'),
  'must not wrap leftover mobile-close or add Fechar menu / type (PR #63)'
);
assert(
  !html.includes('aria-label="Fechar sugestões"') &&
  !html.includes('aria-label="Fechar política de privacidade"') &&
  !app.includes('aria-label="Fechar ${') &&
  !app.includes('Fechar ${item.nome}') &&
  !app.includes('Fechar ${p.nome}'),
  'must not redo leftover dialog-close names (PR #74)'
);
assert(
  !/\.credits-back \{[^}]*min-height:44px/.test(css) &&
  !/\.credits-back:focus-visible/.test(css) &&
  !credits.includes('rel="noopener noreferrer"'),
  'must not redo leftover credits back 44px / peach rings (PR #72) or citation noopener (PR #73)'
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
  app.includes('aria-label="Página anterior">← Anterior') &&
  app.includes('aria-label="Página seguinte">Seguinte →') &&
  html.includes('title="Voltar ao topo">▲</button>') &&
  html.includes('+ Hora de levantamento ou nota <span>(opcional)</span>'),
  'must not redo leftover pagination / optional / scroll-top hiding (PR #85)'
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
  !/\.search-clear \{[^}]*min-(width|height):44px/.test(css) &&
  !/\.sidebar-close \{[^}]*min-(width|height):44px/.test(css) &&
  !/\.product-modal-close \{[^}]*min-(width|height):44px/.test(css) &&
  !/\.cabaz-modal-close \{[^}]*min-(width|height):44px/.test(css) &&
  !/\.privacy-close \{[^}]*min-(width|height):44px/.test(css) &&
  !/\.cs-pop-close \{[^}]*min-(width|height):44px/.test(css) &&
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
  !/\.reveal-close:focus-visible/.test(css),
  'must not redo leftover 44px tap-target, peach-ring, or cabaz-ver hide-under-700px shop PRs'
);

if (failures.length) {
  console.error('check-close-credits-hidden failed:\n' + failures.map(f => ' - ' + f).join('\n'));
  process.exit(1);
}
console.log('check-close-credits-hidden: ok');
