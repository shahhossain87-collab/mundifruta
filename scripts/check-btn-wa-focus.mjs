#!/usr/bin/env node
/**
 * Guards for leftover WhatsApp CTA keyboard rings.
 * Complementary to #2–#175 (does not move catalog/search, restyle the nav,
 * change the 4-item mobile bar, fold search accents, add a cabaz hint,
 * jump-to-catalog, rewrite modal visible CTAs, or change JSON-LD).
 *
 * Not a redo of:
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
 * - PR #111 leftover cookie banner above the 4-item bar
 * - PR #109 leftover cookie / privacy keyboard trap
 * - PR #96 leftover header wordmark current-page mark
 * - PR #70 leftover hamburger aria-expanded
 * - PR #54 leftover peach overlay-close / cabaz-ver rings (this uses
 *   leftover catalog forest ring on leftover .btn-wa,
 *   not a new peach)
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
  /<button type="submit" class="btn-wa">📱 Encomendar por WhatsApp<\/button>/.test(html),
  'leftover WhatsApp CTA stays Encomendar por WhatsApp'
);
assert(
  html.includes('onsubmit="enviarWhatsApp(event)"') &&
  html.includes('id="order-form"'),
  'leftover WhatsApp CTA still submits leftover #order-form via leftover enviarWhatsApp'
);

assert(
  html.includes('class="btn-prim"') &&
  html.includes('Comprar Agora') &&
  /<a href="#produtos" class="btn-prim">Comprar Agora<\/a>/.test(html),
  'leftover primary CTA stays Comprar Agora and still points at leftover #produtos'
);
assert(
  /@media \(max-width:700px\) \{[\s\S]*?\.hero-ctas \{ display:none/.test(css),
  'leftover mobile still hides leftover hero Comprar Agora (category tiles sit below)'
);

assert(
  html.includes('class="logo"') &&
  html.includes('href="#inicio"') &&
  /<a href="#inicio" class="logo">MUNDI<span class="logo-accent">FRUTA<\/span><\/a>/.test(html),
  'leftover header wordmark stays MUNDIFRUTA and still points at leftover #inicio'
);

assert(
  html.includes('class="hamburger"') &&
  html.includes('onclick="toggleMenu()"') &&
  html.includes('aria-label="Menu"') &&
  !html.includes('aria-expanded'),
  'leftover hamburger stays named Menu without expanded (PR #70)'
);
assert(
  app.includes("function toggleMenu() { document.getElementById('mobile-menu').classList.toggle('open'); }"),
  'leftover toggleMenu still only toggles leftover mobile-menu.open'
);
assert(
  html.includes('class="mobile-close"') &&
  html.includes('id="mobile-menu"') &&
  /class="mobile-close"[^>]*>✕<\/button>/.test(html),
  'leftover mobile-menu close stays a visible ✕'
);
assert(
  html.includes('href="#promocoes"') &&
  html.includes('href="#cabazes"') &&
  html.includes('href="#como-funciona"') &&
  html.includes('href="#produtos"') &&
  html.includes('href="#quem-somos"') &&
  html.includes('href="#avaliacoes"') &&
  html.includes('href="#encomenda"') &&
  html.includes('href="#contacto"'),
  'leftover Promoções / Cabazes / Como Funciona / Produtos / Quem Somos / Avaliações / Encomendar / Contacto stay'
);

assert(
  html.includes('class="search-clear"') &&
  html.includes('id="search-clear"') &&
  html.includes('onclick="limparPesquisa()"') &&
  html.includes('aria-label="Limpar pesquisa"'),
  'leftover catalog search-clear stays named Limpar pesquisa (no ring in this run)'
);
assert(
  html.includes('id="search-input"') &&
  html.includes('oninput="pesquisar()"') &&
  html.includes('Pesquisar produto… (ex: morangos, tomate, banana)'),
  'leftover catalog search input stays'
);
assert(
  app.includes('function limparPesquisa()') &&
  app.includes("document.getElementById('search-input').value = ''") &&
  app.includes("document.getElementById('search-clear').classList.remove('visible')") &&
  app.includes("document.getElementById('search-clear').classList.toggle('visible', q.length > 0)"),
  'leftover search-clear still appears after typing and limparPesquisa still clears leftover search'
);

assert(
  html.includes('class="privacy-reset"') &&
  html.includes('onclick="reporConsentimento()"') &&
  html.includes('Repor consentimento'),
  'leftover privacy Repor consentimento stays (no ring in this run)'
);
assert(
  html.includes('class="privacy-close"') &&
  html.includes('onclick="fecharPrivacidade()"') &&
  html.includes('aria-label="Fechar"'),
  'leftover privacy-dialog ✕ Fechar stays (no ring in this run)'
);
assert(
  html.includes('class="consent-link"') &&
  html.includes('onclick="abrirPrivacidade()"') &&
  html.includes('Saber mais'),
  'leftover consent Saber mais stays (no ring in this run)'
);
assert(
  html.includes('class="consent-no"') &&
  html.includes('onclick="definirConsentimento(false)"') &&
  html.includes('Só essenciais'),
  'leftover consent Só essenciais stays (no ring in this run)'
);
assert(
  html.includes('class="consent-yes"') &&
  html.includes('onclick="definirConsentimento(true)"') &&
  html.includes('Aceitar tudo'),
  'leftover consent Aceitar tudo stays (no ring in this run)'
);
assert(
  html.includes('id="consent"') &&
  html.includes('Preferências de privacidade'),
  'leftover consent dialog stays'
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
  extras.includes("document.getElementById('privacy-modal')") &&
  extras.includes('window.reporConsentimento') &&
  extras.includes("localStorage.removeItem('mf_consent')") &&
  extras.includes("document.getElementById('consent').hidden = false"),
  'leftover privacy open / close / reset behavior stays'
);
assert(
  extras.includes("document.getElementById('privacy-modal').hidden = false") &&
  extras.includes("document.getElementById('privacy-modal').hidden = true"),
  'leftover Saber mais still opens leftover privacy without hiding leftover consent'
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
  html.includes('class="btn-em"') &&
  html.includes('ou encomende por email'),
  'leftover email CTA stays "ou encomende por email" (no ring in this run)'
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
  /\.btn-wa:focus-visible/.test(css),
  'leftover WhatsApp CTA should join the leftover forest :focus-visible ring'
);
assert(
  css.includes('.btn-wa:focus-visible') &&
  css.includes('outline:3px solid var(--forest)'),
  'leftover WhatsApp CTA must use the leftover catalog forest ring (not a new color)'
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
  !/\.btn-em:focus-visible/.test(css),
  'must not redo leftover email CTA rings'
);
assert(
  !/@media \(hover:\s*none\) \{[\s\S]*?\.mobile-menu a:hover \{ color:inherit/.test(css) &&
  !/@media \(hover:\s*none\) \{[\s\S]*?\.mobile-menu a:hover \{ color:#fff/.test(css),
  'must not redo PR #147 leftover hamburger menu hover peach on touch'
);
assert(
  !/@media \(hover:\s*none\) \{[\s\S]*?\.order-remove:hover \{ background:rgba\(255,255,255,0\.1\)/.test(css),
  'must not redo PR #140 leftover checkout remove hover cherry on touch'
);
assert(
  !/@media \(hover:\s*none\) \{[\s\S]*?\.oi-stepper button:hover \{ background:rgba\(255,255,255,0\.08\)/.test(css),
  'must not redo PR #139 leftover checkout stepper hover sage on touch'
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
  console.error('check-btn-wa-focus failed:\n' + failures.map(f => ' - ' + f).join('\n'));
  process.exit(1);
}
console.log('check-btn-wa-focus: ok');
