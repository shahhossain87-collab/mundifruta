#!/usr/bin/env node
/**
 * Guards for leftover decorative marks on leftover announcement-ticker
 * emojis, leftover cabaz-ver 👁, leftover social-icon SVGs, and leftover
 * how-to step duplicate numbers. Complementary to PR #83 (Filtros /
 * shop-link / reviews-cta marks), PR #82 (filter-chip / checkout /
 * welcome-offer marks), PR #81 (hero / qs / nav-order / Google-badge
 * marks), PR #80 (contact / cart / pay / order-title icons), PR #79
 * (info-strip emojis / mini arrows), leftover cabaz-ver name (PR #64),
 * leftover cabaz-ver hide-under-700px (PR #18), leftover social-dock
 * landmark (PR #34), leftover how-to landmark (PR #76), leftover
 * hamburger expanded (PR #70), leftover 44px / peach-ring shop PRs.
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
  html.includes('<span aria-hidden="true">🎁</span> 10€ de desconto na primeira compra acima de 40€') &&
  html.includes('<span aria-hidden="true">🛒</span> Encomende por WhatsApp e levante na loja') &&
  html.includes('<span aria-hidden="true">🍉</span> Melancia 1/4 aprox. 3 kg') &&
  html.includes('<span aria-hidden="true">🍋</span> Limão biológico 1,99€/kg') &&
  html.includes('<span aria-hidden="true">🍅</span> Tomate salada biológico 1,99€/kg') &&
  html.includes('<span aria-hidden="true">🥒</span> Curgete biológica 2,49€/kg') &&
  html.includes('<span aria-hidden="true">🚚</span> Entregas rápidas para Carnaxide e Oeiras') &&
  html.includes('<span aria-hidden="true">🎉</span> Produtos frescos, selecionados todos os dias') &&
  (html.match(/<span aria-hidden="true">🎁<\/span> 10€ de desconto/g) || []).length === 2,
  'leftover announcement-ticker emojis should be aria-hidden; visible ticker copy stays'
);
assert(
  /\.announcement-track > span \{/.test(css) &&
  !/\.announcement-track span \{/.test(css),
  'leftover ticker item selector should stay child-only so wrapped emojis do not become flex items'
);

assert(
  app.includes('class="cabaz-ver"') &&
  app.includes('<span aria-hidden="true">👁</span> Ver o que leva') &&
  !app.includes('aria-label="Ver o que leva no ${item.nome}"') &&
  !app.includes('aria-label="Ver o que leva no'),
  'leftover cabaz-ver eye should be aria-hidden; visible Ver o que leva stays; must not redo leftover cabaz-ver name (PR #64)'
);

assert(
  (html.match(/class="social-icon"[^>]*aria-hidden="true"/g) || []).length === 4 &&
  html.includes('>Fale Connosco</span>') &&
  html.includes('>Avalie-nos</span>') &&
  html.includes('>Como Chegar</span>') &&
  html.includes('class="social-label">Encomendar</span>') &&
  !html.includes('aria-label="Contactos rápidos"'),
  'leftover social-icon SVGs should be aria-hidden; visible dock labels stay; must not redo leftover social-dock landmark (PR #34)'
);

assert(
  (html.match(/class="step-num" aria-hidden="true"/g) || []).length === 5 &&
  (html.match(/class="step-icon" aria-hidden="true"/g) || []).length === 5 &&
  html.includes('>Escolha os Produtos<') &&
  html.includes('>Adicione ao Carrinho<') &&
  html.includes('>Confirme o Subtotal<') &&
  html.includes('>Envie por WhatsApp<') &&
  html.includes('>Levante na Loja<') &&
  !html.includes('aria-label="Como Encomendar"'),
  'leftover how-to step numbers should be aria-hidden; visible step titles stay; must not redo leftover how-to landmark (PR #76)'
);

assert(
  html.includes('class="filtbtn"') &&
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
  /<div class="hero" id="inicio">/.test(html) &&
  /<div class="section shop-feature alt" id="populares">/.test(html) &&
  !html.includes('aria-label="Fruta & Legumes Frescos Todos os Dias"') &&
  !html.includes('aria-label="Frutas Populares"'),
  'must not redo leftover hero / featured landmarks (PR #78)'
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
  !html.includes('aria-label="Carrinho e contactos"'),
  'product/cabaz/featured add stay a visible plus; must not redo leftover hamburger expanded or nav landmarks'
);

assert(
  !html.includes('for="cust-nome"') &&
  !html.includes('id="cust-nome-label"') &&
  !app.includes('function irParaSeccao') &&
  !app.includes('function atualizarPainelCatalogo') &&
  !html.includes('role="tabpanel"'),
  'must not redo leftover order labels or catalog tabpanel helpers'
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
  !/\.cabaz-ver \{[^}]*display:\s*none/.test(css) &&
  !/\.btn-wa:focus-visible/.test(css) &&
  !/\.nav-order:focus-visible/.test(css) &&
  !/\.logo:focus-visible/.test(css) &&
  !/\.shop-link:focus-visible/.test(css) &&
  !/\.reviews-cta:focus-visible/.test(css) &&
  !/\.cabaz-ver:focus-visible/.test(css) &&
  !/\.social-link:focus-visible/.test(css),
  'must not redo leftover 44px tap-target, peach-ring, or cabaz-ver hide-under-700px shop PRs'
);

if (failures.length) {
  console.error('check-ticker-cabaz-social-howto-hidden failed:\n' + failures.map(f => ' - ' + f).join('\n'));
  process.exit(1);
}
console.log('check-ticker-cabaz-social-howto-hidden: ok');
