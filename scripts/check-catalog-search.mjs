/**
 * Static checks for the catalog-search pairing and related a11y/SEO tweaks.
 * Run: node scripts/check-catalog-search.mjs
 */
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../css/estilos.css', import.meta.url), 'utf8');
const failures = [];

function assert(cond, msg) {
  if (!cond) failures.push(msg);
}

const produtosStart = html.indexOf('id="produtos"');
const produtosClose = html.indexOf('<!-- ═══════════ HERO');
const produtosBlock = html.slice(produtosStart, produtosClose);
assert(produtosStart !== -1, 'Missing #produtos');
assert(produtosBlock.includes('id="search-input"'), 'Search input must live inside #produtos');
assert(!html.slice(0, produtosStart).includes('id="search-input"'), 'Search must not appear before #produtos');
assert(html.includes('class="skip-link"') && html.includes('href="#search-input"'), 'Skip link must target search');
assert(html.includes('for="search-input"'), 'Search must have an associated label');
assert(html.includes('name="nome"') && html.includes('name="telemovel"'), 'Order form required fields need name attributes');
assert(html.includes('name="levantamento"') && html.includes('name="notas"'), 'Optional order fields need name attributes');
assert(html.includes('estilos.css?v=38'), 'CSS cache-bust should be v=38');

const ldMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
assert(ldMatch, 'Missing JSON-LD block');
let ld;
try {
  ld = JSON.parse(ldMatch[1]);
} catch (err) {
  failures.push(`JSON-LD is not valid JSON: ${err.message}`);
}
if (ld) {
  assert(ld.logo === 'https://mundifruta.com/fotos/cabaz_mix.jpeg', 'JSON-LD logo must reuse the existing store image');
  assert(ld.contactPoint?.telephone === '+351932699850', 'JSON-LD contactPoint must use the existing phone');
  assert(ld.contactPoint?.email === 'shahhossain87@gmail.com', 'JSON-LD contactPoint must use the existing email');
  assert(ld.telephone === '+351932699850', 'Top-level JSON-LD telephone must stay unchanged');
}

assert(/\.homepage-search\s*\{[^}]*position:\s*sticky/s.test(css), 'Search bar must be sticky under the header');
assert(css.includes('overflow-x: clip'), 'overflow-x:clip is required so sticky search works');
assert(css.includes('scroll-padding-top'), 'Anchor jumps must clear the fixed header');
assert(/prefers-reduced-motion:reduce[\s\S]*\.announcement-track \{ animation:none; \}/.test(css), 'Ticker must stop under reduced motion');
assert(/--nav-height:\s*52px/.test(css), 'Mobile nav-height must match the slim header so sticky search has no gap');

for (const file of ['js/app.js', 'js/extras.js', 'js/dados.js']) {
  const result = spawnSync('node', ['--check', file], { encoding: 'utf8' });
  if (result.status !== 0) failures.push(`${file} failed syntax check:\n${result.stderr}`);
}

if (failures.length) {
  console.error('FAIL');
  failures.forEach((f) => console.error(' -', f));
  process.exit(1);
}
console.log('OK: catalog search pairing, JSON-LD, form names, reduced-motion ticker, JS syntax');
