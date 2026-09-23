#!/usr/bin/env node
/**
 * Guards for leftover mobile-menu link hover peach.
 * Complementary to PR #112 (category-tile hover), PR #113 (catalog-card
 * hover), PR #114 (featured-photo hover), PR #115 (Quem Somos photo
 * hover), PR #116 (cross-sell card hover), PR #117 (how-to step-card
 * hover), PR #118 (contact-card hover), PR #119 (hero-rating hover),
 * PR #120 (google-badge hover), PR #121 (btn-prim hover),
 * PR #122 (nav-order hover), PR #123 (btn-wa hover),
 * PR #124 (scroll-top hover), PR #125 (social-wa hover),
 * PR #126 (social-link hover), PR #127 (float-cart hover),
 * PR #128 (reveal-cta hover), PR #129 (btn-continuar hover),
 * PR #130 (btn-em hover), PR #131 (order-optional-toggle hover),
 * PR #132 (shop-link hover), PR #133 (reviews-cta hover),
 * PR #134 (footer-links hover), PR #135 (footer-credit hover),
 * PR #136 (qty-btn hover), PR #137 (add-btn hover),
 * PR #138 (contact-card a hover), PR #139 (oi-stepper hover),
 * PR #140 (order-remove hover), PR #141 (filter-chip hover),
 * PR #142 (subcat-chip hover), PR #143 (cabaz-ver hover),
 * PR #144 (filter-tag hover), PR #145 (cabaz-modal-close hover),
 * PR #146 (reveal-close hover),
 * PR #104 (ticker / html scroll),
 * PR #107 (scroll-top vs 4-item bar), PR #108 (toast vs bar),
 * and PR #110 (overlay transition:none).
 * This leftover only stops the leftover mobile-menu peach
 * on touch and under reduced motion.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const credits = readFileSync(join(root, 'creditos.html'), 'utf8');
const css = readFileSync(join(root, 'css/estilos.css'), 'utf8');
const app = readFileSync(join(root, 'js/app.js'), 'utf8');
const extras = readFileSync(join(root, 'js/extras.js'), 'utf8');
const dados = readFileSync(join(root, 'js/dados.js'), 'utf8');

const failures = [];
const assert = (cond, msg) => { if (!cond) failures.push(msg); };

assert(
  html.includes('css/estilos.css?v=65') && credits.includes('css/estilos.css?v=65'),
  'index.html and creditos.html should cache-bust estilos.css?v=65'
);
assert(
  html.includes('js/app.js?v=38') &&
  html.includes('js/extras.js?v=21') &&
  html.includes('js/dados.js?v=25'),
  'app.js stays ?v=38; extras.js stays ?v=21; dados.js stays ?v=25'
);

assert(
  css.includes('.mobile-menu a:hover { color:var(--peach); }'),
  'leftover desktop mobile-menu hover peach stays for pointer hover'
);
assert(
  /@media \(hover: none\) \{\s*\.mobile-menu a:hover \{ color:#fff; \}/.test(css),
  'leftover mobile-menu must not turn peach on leftover hover:none (touch)'
);
assert(
  /@media \(prefers-reduced-motion: reduce\) \{\s*\.mobile-menu a \{ transition: none; \}\s*\.mobile-menu a:hover \{ color:#fff; \}/.test(css),
  'leftover mobile-menu must not animate under leftover reduced-motion'
);
assert(
  css.indexOf('.mobile-menu a:hover { color:var(--peach); }') <
  css.lastIndexOf('@media (hover: none)'),
  'leftover hover:none rules must follow leftover mobile-menu hover so they win the cascade'
);
assert(
  css.lastIndexOf('@media (hover: none)') <
  css.lastIndexOf('@media (prefers-reduced-motion: reduce) {\n      .mobile-menu a { transition: none; }'),
  'leftover reduced-motion mobile-menu rules must follow leftover hover:none'
);

assert(
  css.includes('.reveal-close:hover { background:rgba(255,255,255,.22); }') &&
  !/@media \(hover: none\) \{\s*\.reveal-close:hover/.test(css),
  'must not redo leftover welcome-offer reveal-close hover (PR #146); leftover wash stays'
);
assert(
  css.includes('.cabaz-modal-close:hover { background:var(--cream-3); }') &&
  !/@media \(hover: none\) \{\s*\.cabaz-modal-close:hover/.test(css),
  'must not redo leftover cabaz-modal-close hover (PR #145); leftover cream-3 stays'
);
assert(
  css.includes('.filter-tag:hover { border-color:var(--sage); }') &&
  !/@media \(hover: none\) \{\s*\.filter-tag:hover/.test(css),
  'must not redo leftover catalog filter-tag hover (PR #144); leftover sage stays'
);
assert(
  css.includes('.cabaz-ver:hover { background:rgba(82,183,136,0.16); border-color:var(--sage); }') &&
  !/@media \(hover: none\) \{\s*\.cabaz-ver:hover/.test(css),
  'must not redo leftover cabaz Ver o que leva hover (PR #143); leftover sage wash stays'
);
assert(
  css.includes('.subcat-chip:hover { border-color:var(--sage); color:var(--forest); }') &&
  !/@media \(hover: none\) \{\s*\.subcat-chip:hover/.test(css),
  'must not redo leftover catalog subcat-chip hover (PR #142); leftover sage/forest stays'
);
assert(
  css.includes('.filter-chip:hover { border-color:var(--sage); color:var(--forest); }') &&
  !/@media \(hover: none\) \{\s*\.filter-chip:hover/.test(css),
  'must not redo leftover catalog filter-chip hover (PR #141); leftover sage/forest stays'
);
assert(
  css.includes('.order-remove:hover { background:var(--cherry); color:#fff; }') &&
  !/@media \(hover: none\) \{\s*\.order-remove:hover/.test(css),
  'must not redo leftover checkout order-remove hover (PR #140); leftover cherry stays'
);
assert(
  css.includes('.oi-stepper button:hover { background:var(--sage); border-color:var(--sage); }') &&
  !/@media \(hover: none\) \{\s*\.oi-stepper button:hover/.test(css),
  'must not redo leftover checkout oi-stepper hover (PR #139); leftover sage stays'
);
assert(
  css.includes('.contact-card a:hover { color:var(--forest); }') &&
  !/@media \(hover: none\) \{\s*\.contact-card a:hover/.test(css),
  'must not redo leftover Encontre-nos contact-link hover (PR #138); leftover forest stays'
);
assert(
  css.includes('.add-btn:hover { background:var(--forest-2); }') &&
  !/@media \(hover: none\) \{\s*\.add-btn:hover/.test(css),
  'must not redo leftover catalog Adicionar hover (PR #137); leftover forest-2 stays'
);
assert(
  css.includes('.qty-btn:hover { background:var(--forest); color:#fff; border-color:var(--forest); }') &&
  !/@media \(hover: none\) \{\s*\.qty-btn:hover/.test(css),
  'must not redo leftover catalog qty-btn hover (PR #136); leftover forest fill stays'
);
assert(
  css.includes('.footer-credit a:hover { color:var(--sage); }') &&
  !/@media \(hover: none\) \{\s*\.footer-credit a:hover/.test(css),
  'must not redo leftover footer-credit hover (PR #135); leftover sage stays'
);
assert(
  css.includes('.footer-links a:hover { color:var(--peach); }') &&
  !/@media \(hover: none\) \{\s*\.footer-links a:hover/.test(css),
  'must not redo leftover footer-links hover (PR #134); leftover peach stays'
);
assert(
  css.includes('.reviews-cta:hover { color:var(--peach); }') &&
  !/@media \(hover: none\) \{\s*\.reviews-cta:hover/.test(css),
  'must not redo leftover Avaliações reviews-cta hover (PR #133); leftover peach stays'
);
assert(
  css.includes('.shop-link:hover { color:var(--peach); }') &&
  !/@media \(hover: none\) \{\s*\.shop-link:hover/.test(css),
  'must not redo leftover featured shop-link hover (PR #132); leftover peach stays'
);
assert(
  css.includes('.order-optional-toggle:hover { color:#fff; }') &&
  !/@media \(hover: none\) \{\s*\.order-optional-toggle:hover/.test(css),
  'must not redo leftover Hora de levantamento toggle hover (PR #131); leftover whitening stays'
);
assert(
  css.includes('.btn-em:hover { color:#fff; background:none; }') &&
  !/@media \(hover: none\) \{\s*\.btn-em:hover/.test(css),
  'must not redo leftover ou encomende por email hover (PR #130); leftover whitening stays'
);
assert(
  css.includes('.btn-continuar:hover { background:rgba(255,255,255,0.2); }') &&
  !/@media \(hover: none\) \{\s*\.btn-continuar:hover/.test(css),
  'must not redo leftover Continuar a comprar hover (PR #129); leftover brightness stays'
);
assert(
  css.includes('.reveal-cta:hover { filter:brightness(1.07); }') &&
  !/@media \(hover: none\) \{\s*\.reveal-cta:hover/.test(css),
  'must not redo leftover Receber Oferta hover (PR #128); leftover brightness(1.07) stays'
);
assert(
  css.includes('.float-cart:hover { filter:brightness(1.08); }') &&
  !/@media \(hover: none\) \{\s*\.float-cart:hover/.test(css),
  'must not redo leftover Ver a sua encomenda hover (PR #127); leftover brightness(1.08) stays'
);
assert(
  css.includes('.social-link:hover { transform:translateX(0); }') &&
  !/@media \(hover: none\) \{\s*\.social-link:not\(\.social-wa\):hover/.test(css),
  'must not redo leftover Google / Maps dock hover (PR #126); leftover translateX(0) stays'
);
assert(
  css.includes('.social-wa:hover { transform:translateX(0) scale(1.03); }') &&
  !/@media \(hover: none\) \{\s*\.social-wa:hover/.test(css),
  'must not redo leftover WhatsApp dock hover (PR #125); leftover scale(1.03) stays'
);
assert(
  css.includes('.scroll-top:hover   { background:var(--forest-2); transform:translateY(-3px); }') &&
  !/@media \(hover: none\) \{\s*\.scroll-top:hover/.test(css),
  'must not redo leftover Voltar ao topo hover (PR #124); leftover translateY(-3px) stays'
);
assert(
  css.includes('.btn-wa:hover { background:#1ebe5d; transform:translateY(-1px); box-shadow:0 8px 22px rgba(37,211,102,0.42); }') &&
  !/@media \(hover: none\) \{\s*\.btn-wa:hover/.test(css),
  'must not redo leftover Encomendar por WhatsApp hover (PR #123); leftover translateY(-1px) stays'
);
assert(
  css.includes('.nav-order:hover { background:var(--peach-lt); transform:translateY(-1px); box-shadow:0 6px 20px rgba(224,123,57,0.4); }') &&
  !/@media \(hover: none\) \{\s*\.nav-order:hover/.test(css),
  'must not redo leftover header Encomendar hover (PR #122); leftover translateY(-1px) stays'
);
assert(
  css.includes('.btn-prim:hover { background:var(--peach-lt); transform:translateY(-3px); box-shadow:0 16px 40px rgba(224,123,57,0.5); }') &&
  !/@media \(hover: none\) \{\s*\.btn-prim:hover/.test(css),
  'must not redo leftover Comprar Agora hover (PR #121); leftover translateY(-3px) stays'
);
assert(
  css.includes('.hero-rating:hover { transform:translateY(-2px); }') &&
  !/@media \(hover: none\) \{\s*\.hero-rating:hover/.test(css),
  'must not redo leftover hero-rating hover (PR #119); leftover translateY(-2px) stays'
);
assert(
  css.includes('.contact-card:hover { transform:translateY(-6px); box-shadow:var(--sh-lg); }') &&
  !/@media \(hover: none\) \{\s*\.contact-card:hover/.test(css),
  'must not redo leftover contact-card hover (PR #118); leftover translateY(-6px) stays'
);
assert(
  css.includes('.google-badge:hover { transform:translateY(-2px); box-shadow:var(--sh-lg); }') &&
  !/@media \(hover: none\) \{\s*\.google-badge:hover/.test(css),
  'must not redo leftover Avaliações google-badge hover (PR #120); leftover translateY(-2px) stays'
);
assert(
  css.includes('.step-card:hover { transform:translateY(-10px); box-shadow:var(--sh-lg); }') &&
  !/@media \(hover: none\) \{\s*\.step-card:hover/.test(css),
  'must not redo leftover how-to card hover (PR #117); leftover translateY(-10px) stays'
);
assert(
  css.includes('.cs-card:hover { transform:translateY(-3px); box-shadow:var(--sh); }') &&
  !/@media \(hover: none\) \{\s*\.cs-card:hover/.test(css),
  'must not redo leftover cross-sell card hover (PR #116); leftover translateY(-3px) stays'
);
assert(
  css.includes('.qs-photo:hover img { transform:scale(1.06); }') &&
  !/@media \(hover: none\) \{\s*\.qs-photo:hover/.test(css),
  'must not redo leftover Quem Somos photo hover (PR #115); leftover scale(1.06) stays'
);
assert(
  css.includes('.feature-photo:hover img { transform:scale(1.045); }') &&
  !/@media \(hover: none\) \{\s*\.feature-photo:hover/.test(css),
  'must not redo leftover featured-photo hover (PR #114); leftover scale(1.045) stays'
);
assert(
  css.includes('.product-card:hover { transform:translateY(-4px); box-shadow:var(--sh-hover); }') &&
  css.includes('.product-card:hover .photo-wrap img { transform:scale(1.09); }') &&
  !/@media \(hover: none\) \{\s*\.product-card:hover/.test(css),
  'must not redo leftover catalog-card hover (PR #113); leftover card lift/zoom stays'
);
assert(
  css.includes('.cat-quick-btn:hover { transform:translateY(-4px); box-shadow:var(--sh-lg); border-color:var(--sage); }') &&
  css.includes('.cat-quick-btn:hover img { transform:scale(1.055); }') &&
  !/@media \(hover: none\) \{\s*\.cat-quick-btn:hover/.test(css),
  'must not redo leftover category-tile hover (PR #112); leftover shortcut lift/zoom stays'
);
assert(
  css.includes('.oo-step:hover { transform:translateY(-4px); box-shadow:var(--sh-lg); }') &&
  !/@media \(hover: none\) \{\s*\.oo-step:hover/.test(css),
  'must not redo leftover unused online-order step hover; leftover translateY(-4px) stays for a later pass'
);
assert(
  css.includes('.btn-sec:hover { background:var(--forest-2); color:#fff; }') &&
  !/@media \(hover: none\) \{\s*\.btn-sec:hover/.test(css),
  'must not redo leftover unused online-order btn-sec hover; leftover forest-2 stays for a later pass'
);

assert(
  html.includes('class="footer-credit"') &&
  html.includes('Desenvolvido por') &&
  html.includes('href="mailto:shahhossain050187@gmail.com">Shah Hossain'),
  'visible leftover footer-credit Desenvolvido por Shah Hossain stays'
);
assert(
  html.includes('class="footer-links"') &&
  html.includes('href="#produtos">Produtos') &&
  html.includes('href="#quem-somos">Quem Somos') &&
  html.includes('href="#encomenda">Encomendar') &&
  html.includes('href="#contacto">Contacto') &&
  html.includes('onclick="abrirPrivacidade();return false;">Privacidade') &&
  html.includes('href="creditos.html">Créditos das fotos'),
  'visible leftover footer Produtos / Quem Somos / Encomendar / Contacto / Privacidade / Créditos stay'
);
assert(
  html.includes('class="reviews-cta fi" id="reviews-cta"') &&
  html.includes('Ver todas as avaliações no Google →') &&
  html.includes('id="avaliacoes"') &&
  app.includes("document.getElementById('reviews-cta').href = avaliacoesInfo.link"),
  'visible leftover Ver todas as avaliações no Google stays'
);
assert(
  html.includes('class="reveal-cta"') &&
  html.includes('🎁 Receber Oferta') &&
  html.includes('id="offer-pop"') &&
  html.includes('Agora não'),
  'visible leftover Receber Oferta / Agora não stay'
);
assert(
  html.includes('class="reveal-close"') &&
  html.includes('onclick="fecharOferta()"') &&
  html.includes('aria-label="Fechar oferta">✕') &&
  html.includes('id="offer-pop"'),
  'visible leftover reveal-close ✕ stays'
);
assert(
  html.includes('class="float-cart" id="float-cart"') &&
  html.includes('title="Ver a sua encomenda"') &&
  html.includes('class="fc-icon">🛒') &&
  html.includes('id="float-cart-text">0 · 0,00'),
  'visible leftover Ver a sua encomenda float-cart stays'
);
assert(
  html.includes('class="btn-wa">📱 Encomendar por WhatsApp') &&
  html.includes('class="btn-wa cabaz-modal-add" id="cabaz-modal-add">＋'),
  'visible leftover Encomendar por WhatsApp / cabaz plus-only add stay'
);
assert(
  html.includes('class="hero-rating"') &&
  html.includes('hr-score">4,9') &&
  html.includes('hr-count">107+ Google') &&
  html.includes('Aberto Hoje · 8h–20h') &&
  html.includes('Encomendas WhatsApp') &&
  html.includes('Levantamento na Loja') &&
  html.includes('class="btn-prim">Comprar Agora'),
  'visible leftover hero rating / trust chips / Comprar Agora stay'
);
assert(
  html.includes('class="btn-em"') &&
  html.includes('ou encomende por email') &&
  html.includes('onclick="enviarEmail()"') &&
  html.includes('class="btn-continuar"') &&
  html.includes('← Continuar a comprar') &&
  html.includes('onclick="continuarAComprar()"') &&
  html.includes('class="order-optional-toggle"') &&
  html.includes('+ Hora de levantamento ou nota') &&
  html.includes('(opcional)'),
  'visible leftover Continuar a comprar / email / Hora de levantamento toggle stay'
);
assert(
  app.includes('function enviarEmail()') &&
  app.includes('function continuarAComprar()') &&
  app.includes("window.scrollTo({ top: alvo, behavior:'smooth' });"),
  'leftover email checkout still sends leftover mailto without JS rewrite'
);

assert(
  css.includes('@keyframes cardIn { to { opacity:1; transform:translateY(0); } }') &&
  css.includes('.product-card.visible {\n      animation:cardIn 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards;'),
  'must not redo leftover cardIn (PR #20)'
);
assert(
  css.includes('.fi { opacity:0; transform:translateY(22px); transition:opacity 0.6s ease, transform 0.6s ease; }'),
  'must not redo leftover .fi (PR #16)'
);
assert(
  app.includes("onclick=\"adicionarProduto('${id}', produtos_map['${id}'])\">＋ Adicionar</button>"),
  'visible leftover catalog Adicionar stays'
);
assert(
  app.includes('class="qty-btn"') &&
  app.includes('aria-label="Diminuir quantidade de ${item.nome}"') &&
  app.includes('aria-label="Aumentar quantidade de ${item.nome}"') &&
  app.includes("onclick=\"alterarQtd('${id}',-1,event)\"") &&
  app.includes("onclick=\"alterarQtd('${id}',1,event)\""),
  'visible leftover catalog qty +/− stepper stays'
);
assert(
  app.includes('class="oi-stepper"') &&
  app.includes('aria-label="Menos"') &&
  app.includes('aria-label="Mais"') &&
  app.includes("onclick=\"alterarQtdCarrinho('${i._id}',-1)\"") &&
  app.includes("onclick=\"alterarQtdCarrinho('${i._id}',1)\""),
  'visible leftover checkout oi-stepper +/− stays'
);
assert(
  app.includes('class="order-remove"') &&
  app.includes('aria-label="Remover ${i.nome}"') &&
  app.includes("onclick=\"removerProduto('${i._id}')\"") &&
  app.includes('function removerProduto(id)'),
  'visible leftover checkout order-remove × stays'
);
assert(
  html.includes('class="btn-wa cabaz-modal-add" id="cabaz-modal-add">＋') &&
  /id="product-modal-add"[^>]*>＋<\/button>/.test(html) &&
  app.includes("onclick=\"adicionarProduto('${item._id}', produtos_map['${item._id}'])\">＋"),
  'must not rewrite leftover modal / featured visible CTAs; leftover plus-only adds stay'
);

assert(
  css.includes('html { scroll-behavior: smooth; }'),
  'leftover html scroll-behavior:smooth stays (reduced-motion stop stays in PR #21 / #104)'
);
assert(
  !css.includes('--nav-height: 52px') &&
  !css.includes('overflow-x: clip') &&
  !css.includes('scroll-behavior: auto'),
  'must not redo leftover mobile --nav-height / overflow-x:clip / reduced-motion scroll (PR #12 / #18 / #21 / #104)'
);
assert(
  !css.includes('overscroll-behavior:contain') &&
  !css.includes('overscroll-behavior: contain') &&
  !css.includes('overscroll-behavior:none'),
  'must not redo leftover overscroll containment (PR #27 / #98–#102)'
);
assert(
  css.includes('.mobile-menu {\n      display:none; position:fixed; inset:0; z-index:999;'),
  'must not redo leftover menu-bar stacking (PR #103)'
);
assert(
  css.includes('.cs-pop { bottom:74px; }'),
  'must not redo leftover cs-pop vs bar (PR #106)'
);
assert(
  css.includes('.scroll-top { bottom:78px; }'),
  'must not redo leftover scroll-top vs bar (PR #107)'
);
assert(
  css.includes('.toast {\n      position:fixed; bottom:32px;') &&
  css.includes('.consent {') &&
  css.includes('bottom:12px'),
  'must not redo leftover consent/toast overlay vs bar (PR #4 / #108 / #111)'
);
assert(
  !/html \{[\s\S]*?scroll-padding-bottom:/.test(css) &&
  !/html \{[\s\S]*?scroll-padding-top:/.test(css),
  'must not redo leftover html scroll-padding (PR #97 / #105)'
);
assert(
  css.includes('.mobile-menu a { transition: none; }') &&
  !css.includes('.reveal-close { transition: none; }') &&
  !css.includes('.cabaz-modal-close { transition: none; }') &&
  !css.includes('.filter-tag { transition: none; }') &&
  !css.includes('.cabaz-ver { transition: none; }') &&
  !css.includes('.subcat-chip { transition: none; }') &&
  !css.includes('.filter-chip { transition: none; }') &&
  !css.includes('.order-remove { transition: none; }') &&
  !css.includes('.oi-stepper button { transition: none; }') &&
  !css.includes('.qty-btn { transition: none; }') &&
  !css.includes('.add-btn { transition: none; }') &&
  !css.includes('.contact-card a { transition: none; }') &&
  !css.includes('.footer-credit a { transition: none; }') &&
  !css.includes('.footer-links a { transition: none; }') &&
  !css.includes('.reviews-cta { transition: none; }') &&
  !css.includes('.shop-link { transition: none; }') &&
  !css.includes('.order-optional-toggle { transition: none; }') &&
  !css.includes('.btn-em { transition: none; }') &&
  !css.includes('.btn-continuar { transition: none; }') &&
  !css.includes('.reveal-cta { transition: none; }') &&
  !css.includes('.float-cart { transition: none; }') &&
  !css.includes('.scroll-top { transition: none; }') &&
  !css.includes('.btn-wa { transition: none; }') &&
  !css.includes('.nav-order { transition: none; }') &&
  !css.includes('.btn-prim { transition: none; }') &&
  !css.includes('.hero-rating { transition: none; }') &&
  !css.includes('.contact-card { transition: none; }') &&
  !css.includes('.google-badge { transition: none; }') &&
  !css.includes('.step-card { transition: none; }') &&
  !css.includes('.cs-card { transition: none; }') &&
  !css.includes('.qs-photo img { transition: none; }') &&
  !css.includes('.feature-photo img { transition: none; }') &&
  !css.includes('.toast { transition:none') &&
  !css.includes('.product-modal { transition:none') &&
  !css.includes('.shop-sidebar { transition:none') &&
  !css.includes('.cat-quick-btn,\n      .cat-quick-btn img { transition: none; }') &&
  !css.includes('.product-card,\n      .product-card .photo-wrap img { transition: none; }'),
  'leftover reduced-motion transition:none is only leftover mobile-menu a (PR #110 overlay / PR #112–#146 stay)'
);

assert(
  !html.includes('skip-link') &&
  !html.includes('Saltar para') &&
  !html.includes('href="#search-input"') &&
  !html.includes('id="conteudo"') &&
  !html.includes('<main'),
  'must not redo leftover skip-to-search (PR #21) or leftover skip / main landmark from PR #2'
);
assert(
  !app.includes('function irParaSeccao') &&
  !app.includes('function comportamentoScroll') &&
  !app.includes('behavior: comportamentoScroll()'),
  'must not redo leftover JS reduced-motion scroll helpers (PR #29)'
);
assert(
  html.includes('id="mb-cart-label">Carrinho') &&
  html.includes('>Promoções') &&
  html.includes('>WhatsApp') &&
  html.includes('>Como Chegar'),
  'visible leftover 4-item bar labels stay'
);
assert(
  html.includes('>Início') &&
  html.includes('>Loja') &&
  html.includes('id="crumb-cat">Frutas'),
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
  !html.includes('aria-current') &&
  !app.includes('aria-current') &&
  !html.includes('data-bar=') &&
  !app.includes('function marcarBarraAtual') &&
  !app.includes('function marcarLogoAtual'),
  'must not redo leftover current-page markers (PR #92–#96)'
);
assert(
  html.includes('id="mobile-menu">') &&
  !html.includes('id="mobile-menu" aria-label') &&
  html.includes('onclick="toggleMenu()">Promoções') &&
  html.includes('onclick="toggleMenu()">Cabazes') &&
  html.includes('onclick="toggleMenu()">Como Funciona') &&
  html.includes('onclick="toggleMenu()">Produtos') &&
  html.includes('onclick="toggleMenu()">Quem Somos') &&
  html.includes('onclick="toggleMenu()">Avaliações') &&
  html.includes('onclick="toggleMenu()">Encomendar') &&
  html.includes('onclick="toggleMenu()">Contacto') &&
  html.includes('data-count-label="frutas">Frutas') &&
  html.includes('data-count-label="legumes">Legumes') &&
  html.includes('Carrinho <b id="quick-cart-count">0</b>'),
  'visible leftover mobile-menu Promoções / Cabazes / Como Funciona / Produtos / Quem Somos / Avaliações / Encomendar / Contacto stay'
);
assert(
  html.includes('Ver todas as frutas →') &&
  html.includes('Explorar fruta →') &&
  html.includes('Ver todos os legumes →') &&
  html.includes('Ver catálogo completo →'),
  'visible leftover featured shop links stay'
);
assert(
  html.includes('🎁 10€ de desconto na primeira compra acima de 40€'),
  'must not redo leftover ticker-mark hiding (PR #84) or leftover ticker copy'
);
assert(
  !/\.btn-wa \{[^}]*min-height:44px/.test(css) &&
  !/\.mb-item \{[^}]*min-height:44px/.test(css) &&
  !html.includes('role="tabpanel"') &&
  !html.includes('"@type": "OrderAction"'),
  'must not redo leftover 44px tap-target / tabpanel / JSON-LD PRs'
);
assert(
  extras.includes('box.innerHTML = `🎁 <strong>Cupão de ${cupaoConfig.desconto}€ reservado.'),
  'must not redo leftover coupon / carousel hiding (PR #88)'
);
assert(
  dados.includes('nome:"Melancia 1/4"') &&
  dados.includes('nome:"Cabaz Detox"'),
  'must not invent leftover product / cabaz names'
);
assert(
  !css.includes('right:200px') &&
  !css.includes('animation-name:cs-up-dock'),
  'must not redo leftover cs-pop desktop dock gutter (PR #39)'
);
assert(
  css.includes('.hero-slide { animation:none; transition:none; }') &&
  css.includes('.offer-reveal,.wm-l,.wm-r,.reveal-amount,.reveal-copy { animation:none !important; }'),
  'leftover hero-slide / welcome-offer reduced-motion stays on leftover master'
);
assert(
  extras.includes("prev.onclick = () => grid.scrollBy({ left: -passo() * 2, behavior: 'smooth' });"),
  'must not redo leftover carousel arrow reduced-motion (PR #29 / #30)'
);
assert(
  html.includes('id="produtos"') &&
  html.includes('id="inicio"') &&
  app.includes('function promoverCatalogo()'),
  'must not move leftover catalog/search; leftover promoverCatalogo stays'
);
assert(
  css.includes('.nav-links, .nav-order { display:none; }'),
  'leftover ≤768px still hides leftover .nav-order (hamburger stays)'
);
assert(
  app.includes('function toggleMenu()') &&
  app.includes("document.getElementById('mobile-menu').classList.toggle('open')") &&
  html.includes('class="hamburger" onclick="toggleMenu()"') &&
  html.includes('class="mobile-close" onclick="toggleMenu()"'),
  'leftover hamburger / close still toggle leftover mobile-menu without JS rewrite'
);
assert(
  extras.includes("const cta = pop.querySelector('.reveal-cta');") &&
  extras.includes('window.aceitarOferta = function ()') &&
  extras.includes('window.fecharOferta = function ()') &&
  html.includes('onclick="aceitarOferta()"') &&
  html.includes('onclick="fecharOferta()"'),
  'leftover Receber Oferta / Fechar oferta still work leftover welcome offer without JS rewrite'
);
assert(
  css.includes('.float-cart.pop { animation:fc-pop 0.42s ease; }'),
  'leftover float-cart pop animation stays for a later pass'
);
assert(
  html.includes('id="filter-promo"') &&
  html.includes('Em promoção') &&
  html.includes('id="filter-disp"') &&
  html.includes('Disponíveis') &&
  app.includes('function alternarFiltro(tipo, btn)') &&
  app.includes("btn.classList.toggle('active', catalogo.filtros[tipo])"),
  'visible leftover Em promoção / Disponíveis filter-chips stay'
);
assert(
  html.includes('id="active-filters"') &&
  html.includes('aria-label="Filtros ativos"') &&
  app.includes("txt:'Em promoção'") &&
  app.includes("txt:'Disponíveis'") &&
  app.includes('class="filter-tag"') &&
  app.includes('class="filter-tag clear-all"') &&
  app.includes('Limpar tudo') &&
  app.includes('function renderFiltrosAtivos()') &&
  app.includes('function removerFiltro(tipo)'),
  'visible leftover Em promoção / Disponíveis / Limpar tudo filter-tags stay'
);
assert(
  html.includes('id="subcat-row"') &&
  html.includes('id="subcat-panel"') &&
  html.includes('Subcategorias') &&
  app.includes("label:'Banana, maçã e pera'") &&
  app.includes("label:'Frutos vermelhos'") &&
  app.includes("label:'Tomates'") &&
  app.includes('function selecionarSubcat(key)') &&
  app.includes('class="subcat-chip') &&
  app.includes('>Todas</button>`'),
  'visible leftover Todas / Banana, maçã e pera / Frutos vermelhos / Tomates subcat-chips stay'
);
assert(
  html.includes('id="encomenda"') &&
  html.includes('id="order-list"') &&
  app.includes('function alterarQtdCarrinho') &&
  app.includes('function atualizarResumo()'),
  'leftover checkout list / qty still updates without JS rewrite'
);
assert(
  html.includes('id="cabazes"') &&
  html.includes('id="grid-cabazes"') &&
  html.includes('Os Nossos Cabazes') &&
  app.includes('class="cabaz-ver"') &&
  app.includes('👁 Ver o que leva') &&
  app.includes('function abrirCabaz(id)') &&
  app.includes('function fecharCabaz()') &&
  app.includes('function renderCabazes()'),
  'visible leftover cabaz Ver o que leva stays'
);
assert(
  html.includes('class="cabaz-modal-close"') &&
  html.includes('onclick="fecharCabaz()"') &&
  html.includes('aria-label="Fechar">✕') &&
  html.includes('id="cabaz-modal"'),
  'visible leftover cabaz-modal-close ✕ stays'
);

if (failures.length) {
  console.error('check-mobile-menu-a-hover failed:\n' + failures.map(f => ' - ' + f).join('\n'));
  process.exit(1);
}
console.log('check-mobile-menu-a-hover: ok');
