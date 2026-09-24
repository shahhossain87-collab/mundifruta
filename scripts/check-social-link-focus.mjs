#!/usr/bin/env node
/**
 * Guards for leftover social-dock keyboard rings.
 * Complementary to #2–#188 (does not move catalog/search, restyle the nav,
 * change the 4-item mobile bar, fold search accents, add a cabaz hint,
 * jump-to-catalog, rewrite modal visible CTAs, or change JSON-LD).
 *
 * Not a redo of:
 * - PR #188 leftover Encontre-nos contact-link forest rings
 * - PR #187 leftover reviews-cta forest rings
 * - PR #186 leftover Google-badge forest rings
 * - PR #185 leftover hero Google-rating forest rings
 * - PR #184 leftover mobile-menu link forest rings
 * - PR #183 leftover desktop nav-link forest rings
 * - PR #182 leftover shop-feature catalog-link forest rings
 * - PR #181 leftover footer shop-link forest rings
 * - PR #180 leftover header Encomendar forest rings
 * - PR #179 leftover mobile-menu close accessible name
 * - PR #178 leftover Continuar a comprar forest rings
 * - PR #177 leftover email CTA forest rings
 * - PR #176 leftover WhatsApp CTA forest rings
 * - PR #175 leftover primary CTA forest rings
 * - PR #174 leftover header wordmark forest rings
 * - PR #173 leftover mobile-menu close forest rings
 * - PR #172 leftover hamburger forest rings
 * - PR #171 leftover catalog search-clear forest rings
 * - PR #170 leftover privacy Repor consentimento forest rings
 * - PR #169 leftover consent Saber mais forest rings
 * - PR #168 leftover consent Só essenciais / Aceitar tudo forest rings
 * - PR #167 leftover checkout × Remover forest rings
 * - PR #166 leftover checkout − / + forest rings
 * - PR #165 leftover privacy-dialog close forest rings
 * - PR #164 leftover welcome-offer CTA forest rings
 * - PR #163 leftover welcome-offer later forest rings
 * - PR #162 leftover welcome-offer close forest rings
 * - PR #161 leftover Combina bem close forest rings
 * - PR #160 leftover Combina bem skip forest rings
 * - PR #159 leftover cabaz-composition add forest rings
 * - PR #158 leftover cabaz-composition close forest rings
 * - PR #157 leftover product-preview add forest rings
 * - PR #156 leftover product-preview close forest rings
 * - PR #155 leftover product-preview qty forest rings
 * - PR #154 leftover Filtros / drawer-close forest rings
 * - PR #147 leftover hamburger menu hover peach on touch
 * - PR #138 leftover Encontre-nos contact-link hover forest on touch
 * - PR #118 leftover Encontre-nos contact-card hover lift on touch
 * - PR #111 leftover cookie banner above the 4-item bar
 * - PR #109 leftover cookie / privacy keyboard trap
 * - PR #96 leftover header wordmark current-page mark
 * - PR #70 leftover hamburger aria-expanded
 * - PR #54 leftover peach overlay-close / cabaz-ver / footer-credit rings
 *   (this uses leftover catalog forest ring on leftover .social-link,
 *   not a new peach)
 * - PR #52 leftover peach logo / hero-rating / btn-wa rings
 * - PR #25 leftover shortcut focus rings
 * - PR #61 leftover catalog-sort :focus-visible forest ring
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const css = readFileSync(join(root, 'css/estilos.css'), 'utf8');
const creditos = readFileSync(join(root, 'creditos.html'), 'utf8');
const extras = readFileSync(join(root, 'js/extras.js'), 'utf8');
const app = readFileSync(join(root, 'js/app.js'), 'utf8');
const dados = readFileSync(join(root, 'js/dados.js'), 'utf8');

const failures = [];
const assert = (cond, msg) => { if (!cond) failures.push(msg); };

assert(
  html.includes('css/estilos.css?v=65'),
  'index.html should cache-bust estilos.css?v=65'
);
assert(
  creditos.includes('css/estilos.css?v=65'),
  'creditos.html should match leftover estilos.css?v=65'
);
assert(
  html.includes('js/app.js?v=38') &&
  html.includes('js/extras.js?v=21') &&
  html.includes('js/dados.js?v=25'),
  'app.js stays ?v=38, extras.js stays ?v=21, dados.js stays ?v=25'
);

assert(
  html.includes('class="social-panel"') &&
  html.includes('class="social-link social-wa"') &&
  html.includes('class="social-link social-goog"') &&
  html.includes('class="social-link social-map"'),
  'leftover social dock stays in leftover .social-panel'
);
assert(
  /<span class="social-label">Fale Connosco<\/span>/.test(html) &&
  html.includes('title="Fale connosco no WhatsApp"') &&
  html.includes('https://wa.me/351932699850?text=Ol%C3%A1%20MUNDIFRUTA!%20Gostaria%20de%20fazer%20uma%20pergunta.'),
  'leftover Fale Connosco stays leftover WhatsApp ask link'
);
assert(
  /<span class="social-label">Avalie-nos<\/span>/.test(html) &&
  html.includes('title="Google Reviews"') &&
  html.includes('https://maps.app.goo.gl/1gHGqMac4ahTtfxf8?g_st=ac'),
  'leftover Avalie-nos stays leftover maps.app reviews link'
);
assert(
  /<span class="social-label">Como Chegar<\/span>/.test(html) &&
  html.includes('title="Como chegar à loja"') &&
  html.includes('https://www.google.com/maps/dir/?api=1&destination=Mundifruta-Carnaxide%2C+Av.+de+Portugal%2C+Centro+C%C3%ADvico%2C+Loja+24-C%2C+2790-129+Carnaxide'),
  'leftover social Como Chegar stays leftover Google Maps dir link'
);
assert(
  /<span class="social-label">Encomendar<\/span>/.test(html) &&
  html.includes('title="Encomendar via WhatsApp"') &&
  html.includes('href="https://wa.me/351932699850" target="_blank" class="social-link social-wa" title="Encomendar via WhatsApp"'),
  'leftover social Encomendar stays leftover wa.me/351932699850'
);

assert(
  /@media \(max-width:768px\) \{[\s\S]*?\.social-panel \{ display:none/.test(css),
  'leftover mobile still hides leftover social dock (4-item bar sits below)'
);

assert(
  html.includes('id="contacto"') &&
  /<h4>Telefone \/ WhatsApp<\/h4>\s*<a href="tel:932699850">932 699 850<\/a>/.test(html) &&
  /<h4>Email<\/h4>\s*<a href="mailto:shahhossain87@gmail.com">shahhossain87@gmail.com<\/a>/.test(html),
  'leftover Encontre-nos phone / email stay (no ring in this run)'
);

assert(
  html.includes('class="reviews-cta fi"') &&
  /<a class="reviews-cta fi" id="reviews-cta" href="#" target="_blank" rel="noopener">Ver todas as avaliações no Google →<\/a>/.test(html),
  'leftover reviews-cta stays Ver todas as avaliações no Google with leftover href="#" (no ring in this run)'
);
assert(
  dados.includes('nota: "4,9"') &&
  dados.includes('total: 107,') &&
  dados.includes('link: "https://maps.app.goo.gl/1gHGqMac4ahTtfxf8?g_st=ac"'),
  'leftover avaliacoesInfo still has leftover 4,9 / 107 / maps.app reviews link'
);
assert(
  app.includes("document.getElementById('reviews-cta').href = avaliacoesInfo.link"),
  'leftover renderAvaliacoes still points leftover reviews-cta at leftover avaliacoesInfo.link'
);

assert(
  html.includes('class="google-badge fi"') &&
  html.includes('id="gb-nota">4,9</span>') &&
  html.includes('id="gb-total">107 avaliações no Google</span>'),
  'leftover visible 4,9 / 107 avaliações no Google stay (no ring in this run)'
);
assert(
  html.includes('class="hero-rating"') &&
  html.includes('class="hr-score">4,9</span>') &&
  html.includes('class="hr-count">107+ Google</span>'),
  'leftover visible hero 4,9 / 107+ Google stay (no ring in this run)'
);

assert(
  html.includes('id="mobile-menu"') &&
  /<a href="#promocoes"\s+onclick="toggleMenu\(\)">Promoções<\/a>/.test(html) &&
  /<a href="#contacto"\s+onclick="toggleMenu\(\)">Contacto<\/a>/.test(html),
  'leftover mobile-menu links stay Promoções … Contacto (no ring in this run)'
);
assert(
  /<div class="nav-links">\s*<a href="#produtos">Produtos<\/a>/.test(html) &&
  /<a href="#contacto">Contacto<\/a>\s*<\/div>/.test(html),
  'leftover desktop nav links stay Produtos … Contacto (no ring in this run)'
);
assert(
  /@media \(max-width:768px\) \{[\s\S]*?\.nav-links, \.nav-order \{ display:none/.test(css),
  'leftover mobile still hides leftover desktop nav links (4-item bar sits below)'
);

assert(
  /<button class="shop-link" onclick="document.getElementById\('produtos'\)\.scrollIntoView\(\{behavior:'smooth'\}\)">Ver catálogo completo →<\/button>/.test(html) &&
  /<button class="shop-link" onclick="abrirCatalogo\('frutas'\)">Ver todas as frutas →<\/button>/.test(html) &&
  /<button class="shop-link" onclick="abrirCatalogo\('legumes'\)">Ver todos os legumes →<\/button>/.test(html),
  'leftover shop-feature catalog links stay (no ring in this run)'
);
assert(
  /<a href="#produtos">Produtos<\/a>/.test(html) &&
  /<a href="#" onclick="abrirPrivacidade\(\);return false;">Privacidade<\/a>/.test(html) &&
  /<a href="creditos.html">Créditos das fotos<\/a>/.test(html),
  'leftover footer shop links stay Produtos / Privacidade / Créditos das fotos (no ring in this run)'
);
assert(
  extras.includes('window.abrirPrivacidade') &&
  extras.includes("document.getElementById('privacy-modal').hidden = false"),
  'leftover footer Privacidade still opens leftover privacy via leftover abrirPrivacidade'
);

assert(
  /<button class="nav-order" onclick="irParaEncomenda\(\)">/.test(html) &&
  html.includes('🛒 Encomendar'),
  'leftover header Encomendar stays .nav-order and still calls leftover irParaEncomenda (no ring in this run)'
);
assert(
  app.includes('function irParaEncomenda()') &&
  app.includes("document.getElementById('encomenda')") &&
  app.includes("enc.scrollIntoView({ behavior:'smooth', block:'start' })"),
  'leftover irParaEncomenda still scrolls leftover #encomenda'
);

assert(
  /<button type="button" class="btn-continuar" onclick="continuarAComprar\(\)">← Continuar a comprar<\/button>/.test(html),
  'leftover Continuar a comprar stays type=button (no ring in this run)'
);
assert(
  /<button type="submit" class="btn-wa">📱 Encomendar por WhatsApp<\/button>/.test(html),
  'leftover WhatsApp CTA stays type=submit (no ring in this run)'
);
assert(
  /<button type="button" class="btn-em" onclick="enviarEmail\(\)">ou encomende por email<\/button>/.test(html),
  'leftover email CTA stays type=button (no ring in this run)'
);
assert(
  /<a href="#produtos" class="btn-prim">Comprar Agora<\/a>/.test(html),
  'leftover primary CTA stays Comprar Agora (no ring in this run)'
);
assert(
  /<a href="#inicio" class="logo">MUNDI<span class="logo-accent">FRUTA<\/span><\/a>/.test(html),
  'leftover header wordmark stays (no ring in this run)'
);
assert(
  /<button class="hamburger" onclick="toggleMenu\(\)" aria-label="Menu">/.test(html) &&
  !html.includes('aria-expanded'),
  'leftover hamburger stays named Menu without aria-expanded'
);
assert(
  /<button class="mobile-close" onclick="toggleMenu\(\)">✕<\/button>/.test(html),
  'leftover mobile-close stays a visible ✕ without aria-label in this run'
);
assert(
  html.includes('class="consent-link"') &&
  html.includes('Saber mais') &&
  html.includes('Só essenciais') &&
  html.includes('Aceitar tudo') &&
  html.includes('Repor consentimento'),
  'leftover consent / privacy controls stay (no ring in this run)'
);
assert(
  extras.includes('window.definirConsentimento') &&
  extras.includes("localStorage.setItem('mf_consent', aceitarTudo ? 'all' : 'essential')") &&
  extras.includes("document.getElementById('consent').hidden = true"),
  'leftover Só essenciais / Aceitar tudo still hide leftover consent'
);
assert(
  extras.includes('window.abrirPrivacidade') &&
  extras.includes('window.fecharPrivacidade') &&
  extras.includes('window.reporConsentimento'),
  'leftover privacy open / close / reset behavior stays'
);

assert(
  html.includes('class="reveal-cta"') &&
  html.includes('Receber Oferta'),
  'leftover welcome-offer CTA stays "Receber Oferta" (PR #164)'
);
assert(
  html.includes('class="btn-wa cabaz-modal-add" id="cabaz-modal-add">＋'),
  'leftover cabaz-modal add stays a visible plus (PR #2 / #26 / #61)'
);
assert(
  /id="product-modal-add"[^>]*>＋<\/button>/.test(html) &&
  html.includes('onclick="adicionarDoModal()"'),
  'leftover product-modal add stays a visible plus (PR #2 / #26)'
);
assert(
  app.includes('class="order-remove"') &&
  app.includes('aria-label="Remover ${i.nome}"') &&
  app.includes('>×'),
  'leftover checkout × Remover stays named Remover ${nome} (PR #167)'
);
assert(
  app.includes('class="oi-stepper"') &&
  app.includes('aria-label="Menos">−') &&
  app.includes('aria-label="Mais">+'),
  'leftover checkout − / + stay named Menos / Mais (PR #166)'
);

assert(
  /\.social-link:focus-visible/.test(css),
  'leftover social dock should join the leftover forest :focus-visible ring'
);
assert(
  css.includes('.social-link:focus-visible') &&
  css.includes('outline:3px solid var(--forest)'),
  'leftover social dock must use the leftover catalog forest ring (not a new color)'
);
assert(
  css.includes('.qty-btn:focus-visible') &&
  css.includes('.add-btn:focus-visible') &&
  css.includes('.photo-wrap:focus-visible'),
  'leftover catalog qty / Adicionar / photo forest rings stay'
);
assert(
  !css.includes('outline:3px solid var(--peach)'),
  'must not redo PR #54 leftover peach overlay rings'
);
assert(
  !/\.hamburger \{[^}]*min-(width|height):44px/.test(css),
  'must not redo leftover hamburger 44px tap-target PRs'
);
assert(
  !/\.btn-prim \{[^}]*min-height:44px/.test(css) &&
  !/\.btn-wa \{[^}]*min-height:44px/.test(css),
  'must not redo leftover primary / WhatsApp 44px tap-target PRs'
);
assert(
  !/\.social-link \{[^}]*min-(width|height):44px/.test(css),
  'must not redo leftover social-dock 44px tap-target PRs'
);

assert(
  html.includes('id="mobile-bar"') &&
  html.includes('id="mb-cart-label">Carrinho') &&
  html.includes('mb-label">Promoções') &&
  html.includes('mb-label">WhatsApp') &&
  html.includes('mb-label">Como Chegar'),
  'leftover 4-item bar labels stay Carrinho / Promoções / WhatsApp / Como Chegar'
);
assert(
  html.includes('id="produtos"') &&
  html.indexOf('id="produtos"') < html.indexOf('id="inicio"'),
  'catalog still starts above leftover #inicio in leftover HTML'
);

assert(
  !/\.contact-card a:focus-visible/.test(css),
  'must not redo PR #188 leftover Encontre-nos contact-link forest rings'
);
assert(
  !/\.reviews-cta:focus-visible/.test(css),
  'must not redo PR #187 leftover reviews-cta forest rings'
);
assert(
  !/\.google-badge:focus-visible/.test(css),
  'must not redo PR #186 leftover Google-badge forest rings'
);
assert(
  !/\.hero-rating:focus-visible/.test(css),
  'must not redo PR #185 leftover hero Google-rating forest rings'
);
assert(
  !/#mobile-menu a:focus-visible/.test(css),
  'must not redo PR #184 leftover mobile-menu link forest rings'
);
assert(
  !/\.nav-links a:focus-visible/.test(css),
  'must not redo PR #183 leftover desktop nav-link forest rings'
);
assert(
  !/\.shop-link:focus-visible/.test(css),
  'must not redo PR #182 leftover shop-feature catalog-link forest rings'
);
assert(
  !/\.footer-links a:focus-visible/.test(css),
  'must not redo PR #181 leftover footer shop-link forest rings'
);
assert(
  !/\.nav-order:focus-visible/.test(css),
  'must not redo PR #180 leftover header Encomendar forest rings'
);
assert(
  !/\.btn-continuar:focus-visible/.test(css),
  'must not redo PR #178 leftover Continuar a comprar forest rings'
);
assert(
  !/\.btn-em:focus-visible/.test(css),
  'must not redo PR #177 leftover email CTA forest rings'
);
assert(
  !/\.btn-wa:focus-visible/.test(css),
  'must not redo PR #176 leftover WhatsApp CTA forest rings'
);
assert(
  !/\.btn-prim:focus-visible/.test(css),
  'must not redo PR #175 leftover primary CTA forest rings'
);
assert(
  !/\.logo:focus-visible/.test(css),
  'must not redo PR #174 leftover header wordmark forest rings'
);
assert(
  !/\.mobile-close:focus-visible/.test(css),
  'must not redo PR #173 leftover mobile-menu close forest rings'
);
assert(
  !/\.hamburger:focus-visible/.test(css),
  'must not redo PR #172 leftover hamburger forest rings'
);
assert(
  !/\.search-clear:focus-visible/.test(css),
  'must not redo PR #171 leftover catalog search-clear forest rings'
);
assert(
  !/\.privacy-reset:focus-visible/.test(css),
  'must not redo PR #170 leftover privacy Repor consentimento forest rings'
);
assert(
  !/\.consent-link:focus-visible/.test(css),
  'must not redo PR #169 leftover consent Saber mais forest rings'
);
assert(
  !/\.consent-no:focus-visible/.test(css) &&
  !/\.consent-yes:focus-visible/.test(css),
  'must not redo PR #168 leftover consent Só essenciais / Aceitar tudo forest rings'
);
assert(
  !/\.order-remove:focus-visible/.test(css),
  'must not redo PR #167 leftover checkout remove forest rings'
);
assert(
  !/\.oi-stepper button:focus-visible/.test(css),
  'must not redo PR #166 leftover checkout stepper forest rings'
);
assert(
  !/\.privacy-close:focus-visible/.test(css),
  'must not redo PR #165 leftover privacy-dialog close forest rings'
);
assert(
  !/\.reveal-cta:focus-visible/.test(css),
  'must not redo PR #164 leftover welcome-offer CTA forest rings'
);
assert(
  !/\.reveal-later:focus-visible/.test(css),
  'must not redo PR #163 leftover welcome-offer later forest rings'
);
assert(
  !/\.reveal-close:focus-visible/.test(css),
  'must not redo PR #162 leftover welcome-offer close forest rings'
);
assert(
  !/\.cs-pop-close:focus-visible/.test(css),
  'must not redo PR #161 leftover Combina bem close forest rings'
);
assert(
  !/\.cs-pop-skip:focus-visible/.test(css),
  'must not redo PR #160 leftover Combina bem skip forest rings'
);
assert(
  !/\.cabaz-modal-add:focus-visible/.test(css),
  'must not redo PR #159 leftover cabaz-composition add forest rings'
);
assert(
  !/\.cabaz-modal-close:focus-visible/.test(css),
  'must not redo PR #158 leftover cabaz-composition close forest rings'
);
assert(
  !/\.product-modal-add:focus-visible/.test(css),
  'must not redo PR #157 leftover product-preview add forest rings'
);
assert(
  !/\.product-modal-close:focus-visible/.test(css),
  'must not redo PR #156 leftover product-preview close forest rings'
);
assert(
  !/\.product-modal-qty button:focus-visible/.test(css),
  'must not redo PR #155 leftover product-preview qty forest rings'
);
assert(
  !/\.filtbtn:focus-visible/.test(css) &&
  !/\.sidebar-close:focus-visible/.test(css),
  'must not redo PR #154 leftover Filtros / drawer-close forest rings'
);
assert(
  !/\.privacy-box a:focus-visible/.test(css) &&
  !/\.footer-credit a:focus-visible/.test(css) &&
  !/\.cabaz-ver:focus-visible/.test(css),
  'must not redo PR #54 leftover peach privacy-link / footer-credit / cabaz-ver rings'
);
assert(
  !/\.cat-quick-btn:focus-visible/.test(css),
  'must not redo PR #25 leftover shortcut focus rings'
);
assert(
  !/\.mb-item:focus-visible/.test(css) &&
  !/\.scroll-top:focus-visible/.test(css) &&
  !/\.float-cart:focus-visible/.test(css) &&
  !/\.order-optional-toggle:focus-visible/.test(css),
  'must not combine leftover mobile-bar / scroll-top / float-cart / Hora toggle rings'
);
assert(
  !html.includes('aria-label="Fechar"') ||
  !/class="mobile-close"[^>]*aria-label="Fechar"/.test(html),
  'must not combine leftover mobile-close accessible name in this run'
);
assert(
  !/@media \(hover:\s*none\) \{[\s\S]*?\.contact-card a:hover \{ color:inherit/.test(css) &&
  !/@media \(hover:\s*none\) \{[\s\S]*?\.contact-card:hover \{ transform:none/.test(css),
  'must not redo PR #138 leftover contact-link hover or PR #118 leftover contact-card hover lift'
);
assert(
  !/@media \(hover:\s*none\) \{[\s\S]*?\.mobile-menu a:hover \{ color:inherit/.test(css) &&
  !/@media \(hover:\s*none\) \{[\s\S]*?\.mobile-menu a:hover \{ color:#fff/.test(css),
  'must not redo PR #147 leftover hamburger menu hover peach on touch'
);
assert(
  !/@media \(hover:\s*none\) \{[\s\S]*?\.cat-quick-btn:hover \{ transform:none/.test(css),
  'must not redo PR #112 leftover category-tile hover'
);
assert(
  app.includes('aria-label="Diminuir"') &&
  app.includes('aria-label="Aumentar"') &&
  !html.includes('for="cust-nome"') &&
  !html.includes('role="tabpanel"'),
  'must not redo leftover catalog qty labels, order labels, or catalog tabpanel'
);

if (failures.length) {
  console.error('check-social-link-focus failed:\n' + failures.map(f => ' - ' + f).join('\n'));
  process.exit(1);
}
console.log('check-social-link-focus: ok');
