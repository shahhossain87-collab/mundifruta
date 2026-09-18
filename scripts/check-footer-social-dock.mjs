#!/usr/bin/env node
/**
 * Static checks: desktop social dock must not cover footer links.
 * Complementary to PRs #2–#33 (does not restyle chips — PR #24 is focus-only).
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const css = readFileSync(join(root, 'css/estilos.css'), 'utf8');

const checks = [];
function ok(name, pass, detail = '') {
  checks.push({ name, pass, detail });
  const mark = pass ? 'PASS' : 'FAIL';
  console.log(`${mark}  ${name}${detail ? ` — ${detail}` : ''}`);
}

ok(
  'social dock is a named navigation landmark',
  /<nav class="social-panel" aria-label="Contactos rápidos">/.test(html)
  && html.includes('</nav>\n\n<!-- ═══════════ MOBILE BOTTOM BAR')
);
ok(
  'social chip labels and URLs are unchanged',
  html.includes('>Fale Connosco<')
  && html.includes('>Avalie-nos<')
  && html.includes('>Como Chegar<')
  && html.includes('title="Encomendar via WhatsApp"')
  && html.includes('https://wa.me/351932699850?text=Ol%C3%A1%20MUNDIFRUTA!')
);
ok(
  'footer still lists Produtos, Quem Somos, Encomendar, Contacto, Privacidade',
  /<div class="footer-links">[\s\S]*href="#produtos">Produtos<\/a>[\s\S]*Privacidade/.test(html)
);
ok(
  'desktop footer links clear the social dock',
  /@media \(min-width:769px\) \{\s*footer \{ position:relative; z-index:901; \}\s*\.footer-links \{ margin-right:180px; \}/.test(css)
);
ok(
  'mobile still hides the social dock',
  css.includes('.social-panel { display:none !important; }')
);
ok(
  'cache-bust CSS',
  html.includes('estilos.css?v=38') && html.includes('app.js?v=32') && html.includes('extras.js?v=21')
);
ok(
  'does not convert footer Privacidade (PR #33) or restyle social :focus-visible (PR #24)',
  /href="#" onclick="abrirPrivacidade\(\);return false;">Privacidade<\/a>/.test(html)
  && !css.includes('.social-link:focus-visible')
);

const failed = checks.filter(c => !c.pass);
if (failed.length) {
  console.error(`\n${failed.length} check(s) failed.`);
  process.exit(1);
}
console.log(`\nAll ${checks.length} checks passed.`);
