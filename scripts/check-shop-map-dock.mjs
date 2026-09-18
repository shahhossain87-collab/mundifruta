#!/usr/bin/env node
/**
 * Static checks: desktop social dock must not cover shop CTAs / map zoom,
 * and the mobile cart tab must keep an accessible name when it shows a total.
 * Complementary to PRs #2–#34 (does not redo footer-social-gutter / social-nav-landmark).
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const css = readFileSync(join(root, 'css/estilos.css'), 'utf8');
const app = readFileSync(join(root, 'js/app.js'), 'utf8');

const checks = [];
function ok(name, pass, detail = '') {
  checks.push({ name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
}

ok(
  'mobile cart control has a stable id and default name',
  /<button class="mb-item" id="mb-cart" onclick="irParaEncomenda\(\)" aria-label="Carrinho">/.test(html)
  && html.includes('id="mb-cart-label">Carrinho<')
);
ok(
  'cart badge updater names the mobile tab and floating chip',
  app.includes("mbCart.setAttribute('aria-label', `Carrinho: ${n} ${artigos}, ${subtotalText}`)")
  && app.includes("mbCart.setAttribute('aria-label', 'Carrinho')")
  && app.includes("fc.setAttribute('aria-label', fc.title)")
);
ok(
  'carousel wrap is sized to the featured grid',
  css.includes('.carousel-wrap { position:relative; max-width:1180px; margin-left:auto; margin-right:auto; }')
);
ok(
  'desktop shop head and carousel wrap clear the social dock',
  /@media \(min-width:769px\) \{\s*\.shop-feature-head,\s*\.carousel-wrap \{\s*max-width: min\(1180px, calc\(100% - 180px\)\);\s*margin-right: 180px;/.test(css)
);
ok(
  'desktop contact grid and map clear the social dock',
  /#contacto \.contact-grid,\s*#contacto \.map-wrap \{\s*max-width: min\(1100px, calc\(100% - 180px\)\);\s*margin-right: 180px;/.test(css)
);
ok(
  'mobile still hides the social dock',
  css.includes('.social-panel { display:none !important; }')
);
ok(
  'does not restyle footer gutter (PR #34) or social :focus-visible (PR #24)',
  !css.includes('footer { position:relative; z-index:901; }')
  && !css.includes('.social-link:focus-visible')
);
ok(
  'does not convert footer Privacidade (PR #33) or add a fifth mobile-bar item (PR #15)',
  /href="#" onclick="abrirPrivacidade\(\);return false;">Privacidade<\/a>/.test(html)
  && (html.match(/class="mb-item"/g) || []).length === 4
);
ok(
  'cache-bust CSS and app.js; extras.js unchanged',
  html.includes('estilos.css?v=38') && html.includes('app.js?v=33') && html.includes('extras.js?v=21')
);
ok(
  'chip labels, map iframe title, and WhatsApp URLs are unchanged',
  html.includes('>Fale Connosco<')
  && html.includes('title="Localização MUNDIFRUTA"')
  && html.includes('https://wa.me/351932699850?text=Ol%C3%A1%20MUNDIFRUTA!')
);

const failed = checks.filter(c => !c.pass);
if (failed.length) {
  console.error(`\n${failed.length} check(s) failed.`);
  process.exit(1);
}
console.log(`\nAll ${checks.length} checks passed.`);
