#!/usr/bin/env node
/**
 * Guards for leftover Avaliações Google maps hrefs.
 * Complementary to leftover hero Google-rating
 * `https://maps.app.goo.gl/1gHGqMac4ahTtfxf8?g_st=ac`; does not redo
 * leftover info-strip tel: (PR #232), leftover mobile-menu Ervas /
 * Época (PR #231), leftover footer Ervas / Época (PR #230), leftover
 * footer Cabazes / Promoções / Avaliações (PR #229), leftover
 * wrapping-nav Ervas / Época / Cabazes (PR #218), leftover Época
 * featured shop-link destination (PR #220), leftover tappable Morada
 * (PR #8), leftover reviews-cta forest ring (PR #187), leftover
 * Google-badge forest ring (PR #186), leftover hero Google-rating
 * forest ring (PR #185), leftover-ring drafts #141–#190, leftover
 * catalog SEO drafts #195–#199, leftover wrapping-nav / breadcrumb /
 * Ver produto / crawl-link / title / photo / footer forest rings
 * (#208–#214), leftover catalog og:image / Twitter share tags (#215),
 * leftover ticker/html/JS/carousel reduced-motion drafts
 * #200/#202–#204, leftover credits-page favicon (draft #201), leftover
 * hero-eyebrow pulse (PR #207), leftover floating-fruit CSS, leftover
 * homepage category-tile rings from #194, leftover shop-backdrop
 * forest ring (PR #228).
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const css = readFileSync(join(root, 'css/estilos.css'), 'utf8');
const app = readFileSync(join(root, 'js/app.js'), 'utf8');
const dados = readFileSync(join(root, 'js/dados.js'), 'utf8');
const creditos = readFileSync(join(root, 'creditos.html'), 'utf8');
const generate = readFileSync(join(root, 'scripts/generate-seo-pages.mjs'), 'utf8');

const failures = [];
const assert = (cond, msg) => { if (!cond) failures.push(msg); };

const mapsHref = 'https://maps.app.goo.gl/1gHGqMac4ahTtfxf8?g_st=ac';

assert(
  html.includes('css/estilos.css?v=66') &&
  html.includes('js/app.js?v=40') &&
  html.includes('js/extras.js?v=21') &&
  html.includes('js/dados.js?v=26'),
  'homepage cache stays estilos.css?v=66, app.js?v=40, extras.js?v=21, dados.js?v=26'
);
assert(
  creditos.includes('css/estilos.css?v=64'),
  'creditos.html cache stays estilos.css?v=64'
);
assert(
  generate.includes("cssPath: '../../css/estilos.css?v=65'"),
  'generated catalog CSS stays estilos.css?v=65'
);

assert(
  html.includes(`<a class="google-badge fi" id="google-badge" href="${mapsHref}" target="_blank" rel="noopener">`),
  'leftover Google-badge should ship leftover maps href in leftover HTML'
);
assert(
  html.includes(`<a class="reviews-cta fi" id="reviews-cta" href="${mapsHref}" target="_blank" rel="noopener">Ver todas as avaliações no Google →</a>`),
  'leftover reviews-cta should ship leftover maps href and leftover Ver todas as avaliações no Google copy'
);
assert(
  html.includes(`<a class="hero-rating" href="${mapsHref}" target="_blank" rel="noopener" title="Ver avaliações no Google">`),
  'leftover hero Google-rating stays leftover maps href'
);
assert(
  dados.includes(`link: "${mapsHref}"`),
  'leftover avaliacoesInfo.link stays leftover maps href'
);
assert(
  app.includes("document.getElementById('google-badge').href = avaliacoesInfo.link") &&
  app.includes("document.getElementById('reviews-cta').href = avaliacoesInfo.link"),
  'leftover renderAvaliacoes still assigns leftover avaliacoesInfo.link'
);

const googleBadgeHash = html.match(/id="google-badge"[^>]*href="#"/);
const reviewsCtaHash = html.match(/id="reviews-cta"[^>]*href="#"/);
assert(!googleBadgeHash, 'leftover Google-badge must not keep leftover href="#"');
assert(!reviewsCtaHash, 'leftover reviews-cta must not keep leftover href="#"');

assert(
  html.includes('<a href="#" onclick="abrirPrivacidade();return false;">Privacidade</a>'),
  'leftover footer Privacidade stays leftover href="#"'
);
assert(
  html.includes('<div class="info-item"><span>📞</span> 932 699 850</div>'),
  'must not redo leftover info-strip tel: (PR #232)'
);
assert(
  html.includes('<a href="tel:932699850">932 699 850</a>'),
  'leftover Encontre-nos Telefone / WhatsApp stays leftover tel:932699850'
);
assert(
  html.includes('<h4>Morada</h4>\n      <p>Av de Portugal, Centro Cívico<br>Loja 24-C, 2790-129 Carnaxide</p>'),
  'must not redo leftover tappable Morada (PR #8)'
);
assert(
  html.includes('<div class="info-item"><span>📍</span> Av de Portugal, Centro Cívico, Carnaxide</div>'),
  'leftover info-strip address stays leftover plain text'
);

const menuMatch = html.match(/<div class="mobile-menu" id="mobile-menu">([\s\S]*?)<\/div>/);
assert(menuMatch, 'leftover homepage mobile-menu block should stay');
const menu = menuMatch ? menuMatch[1] : '';
assert(
  menu.includes("onclick=\"abrirCatalogo('frutas');toggleMenu()\">Frutas") &&
  menu.includes("onclick=\"abrirCatalogo('legumes');toggleMenu()\">Legumes") &&
  menu.includes('href="#promocoes"') &&
  menu.includes('>Promoções<') &&
  menu.includes('href="#cabazes"') &&
  menu.includes('>Cabazes<') &&
  menu.includes('href="#avaliacoes"') &&
  menu.includes('>Avaliações<') &&
  menu.includes('href="#contacto"') &&
  menu.includes('>Contacto<'),
  'leftover mobile-menu existing shop-links stay'
);
assert(
  !menu.includes("abrirCatalogo('ervas')") &&
  !menu.includes("abrirCatalogo('epoca')") &&
  !menu.includes('>Ervas<') &&
  !menu.includes('>Época<'),
  'must not combine leftover mobile-menu Ervas / Época (PR #231)'
);

const navMatch = html.match(/<div class="nav-links">([\s\S]*?)<\/div>/);
assert(navMatch, 'leftover wrapping-nav block should stay');
const nav = navMatch ? navMatch[1] : '';
assert(
  nav.includes('href="#produtos">Produtos') &&
  nav.includes("onclick=\"abrirCatalogo('frutas')\">Frutas") &&
  nav.includes("onclick=\"abrirCatalogo('legumes')\">Legumes") &&
  nav.includes('href="#cabazes">Cabazes') &&
  nav.includes('href="#promocoes">Promoções') &&
  nav.includes('href="#avaliacoes">Avaliações') &&
  nav.includes('href="#contacto">Contacto'),
  'leftover wrapping-nav existing shop-links stay'
);
assert(
  !nav.includes("abrirCatalogo('ervas')") &&
  !nav.includes("abrirCatalogo('epoca')") &&
  !nav.includes('>Ervas<') &&
  !nav.includes('>Época<'),
  'must not combine leftover wrapping-nav Ervas / Época (PR #218)'
);

const footerMatch = html.match(/<div class="footer-links">([\s\S]*?)<\/div>/);
assert(footerMatch, 'leftover homepage footer-links block should stay');
const footer = footerMatch ? footerMatch[1] : '';
assert(
  footer.includes('href="#produtos">Produtos') &&
  footer.includes("onclick=\"abrirCatalogo('frutas')\">Frutas") &&
  footer.includes("onclick=\"abrirCatalogo('legumes')\">Legumes") &&
  footer.includes('href="#quem-somos">Quem Somos') &&
  footer.includes('href="#encomenda">Encomendar') &&
  footer.includes('href="#contacto">Contacto') &&
  footer.includes('onclick="abrirPrivacidade();return false;">Privacidade') &&
  footer.includes('href="creditos.html">Créditos das fotos'),
  'leftover footer existing shop-links stay'
);
assert(
  !footer.includes("abrirCatalogo('ervas')") &&
  !footer.includes("abrirCatalogo('epoca')") &&
  !footer.includes('href="#cabazes">Cabazes') &&
  !footer.includes('href="#promocoes">Promoções') &&
  !footer.includes('href="#avaliacoes">Avaliações'),
  'must not redo leftover footer Ervas / Época (PR #230) or leftover footer Cabazes / Promoções / Avaliações (PR #229)'
);

assert(
  html.includes('id="tab-ervas"') &&
  html.includes('id="tab-epoca"') &&
  html.includes("onclick=\"mostrarCategoria('ervas',this)\">Ervas frescas") &&
  html.includes("onclick=\"mostrarCategoria('epoca',this)\">Frutas da Época") &&
  html.includes("onclick=\"abrirCatalogo('ervas')\"") &&
  html.includes("onclick=\"abrirCatalogo('epoca')\""),
  'leftover Ervas / Época catalog tabs and leftover category-tile jumps stay'
);

assert(
  !/\.reviews-cta:focus-visible/.test(css) &&
  !/\.google-badge:focus-visible/.test(css) &&
  !/\.hero-rating:focus-visible/.test(css) &&
  !/\.info-item:focus-visible/.test(css) &&
  !/\.footer-links a:focus-visible/.test(css) &&
  !/\.nav-links a:focus-visible/.test(css) &&
  !/#mobile-menu a:focus-visible/.test(css),
  'must not add leftover forest rings in this leftover maps-href run'
);
if (failures.length) {
  console.error('check-reviews-maps-href failed:\n' + failures.map(f => ' - ' + f).join('\n'));
  process.exit(1);
}
console.log('check-reviews-maps-href: ok');
