#!/usr/bin/env node
/**
 * Static checks for leftover review/dialog a11y (complementary to PRs #2–#32).
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const app = readFileSync(join(root, 'js/app.js'), 'utf8');
const extras = readFileSync(join(root, 'js/extras.js'), 'utf8');
const css = readFileSync(join(root, 'css/estilos.css'), 'utf8');

const checks = [];
function ok(name, pass, detail = '') {
  checks.push({ name, pass, detail });
  const mark = pass ? 'PASS' : 'FAIL';
  console.log(`${mark}  ${name}${detail ? ` — ${detail}` : ''}`);
}

ok(
  'twitter description escapes ampersand',
  /twitter:description" content="Fresh fruit &amp; vegetables/.test(html)
);
ok(
  'footer privacy is a button, not href="#"',
  /<button type="button" class="footer-privacy" onclick="abrirPrivacidade\(\)">Privacidade<\/button>/.test(html)
  && !/href="#" onclick="abrirPrivacidade/.test(html)
);
ok(
  'closed product modal is aria-hidden',
  /id="product-modal"[^>]*aria-hidden="true"/.test(html)
);
ok(
  'closed cabaz modal is aria-hidden',
  /id="cabaz-modal"[^>]*aria-hidden="true"/.test(html)
);
ok(
  'cabaz close has type=button',
  /class="cabaz-modal-close" type="button"/.test(html)
);
ok(
  'cache-bust CSS/JS',
  html.includes('estilos.css?v=38') && html.includes('app.js?v=33') && html.includes('extras.js?v=22')
);
ok(
  'review stars are decorative with numeric sr-only rating',
  app.includes('class="review-stars" aria-hidden="true"')
  && app.includes('${a.estrelas} de 5 estrelas')
);
ok(
  'product/cabaz open and close toggle aria-hidden',
  app.includes("modal.setAttribute('aria-hidden', 'false')")
  && app.includes("modal.setAttribute('aria-hidden', 'true')")
);
ok(
  'Escape closes cross-sell via fecharCrossSell',
  /if \(typeof window\.fecharCrossSell === 'function'\) window\.fecharCrossSell\(\)/.test(app)
);
ok(
  'cross-sell thumbnails are decorative',
  /<img src="\$\{urlFoto\(item\.foto\)\}" alt=""/.test(extras)
);
ok(
  'fecharCrossSell clears auto-hide timer',
  extras.includes('clearTimeout(csTimer)')
  && extras.includes('csTimer = setTimeout(fecharCrossSell, 9000)')
);
ok(
  'reduced-motion disables cross-sell pop animation',
  /prefers-reduced-motion:\s*reduce[\s\S]{0,80}\.cs-pop\s*\{\s*animation:\s*none/.test(css)
);
ok(
  'footer privacy has a keyboard focus ring',
  css.includes('.footer-links .footer-privacy:focus-visible')
);

const failed = checks.filter(c => !c.pass);
if (failed.length) {
  console.error(`\n${failed.length} check(s) failed.`);
  process.exit(1);
}
console.log(`\nAll ${checks.length} checks passed.`);
