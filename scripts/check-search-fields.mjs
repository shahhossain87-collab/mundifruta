/**
 * Static + data checks: catalog search matches visible card fields.
 * Run: node scripts/check-search-fields.mjs
 */
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import vm from 'node:vm';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const app = readFileSync(new URL('../js/app.js', import.meta.url), 'utf8');
const extras = readFileSync(new URL('../js/extras.js', import.meta.url), 'utf8');
const dadosSrc = readFileSync(new URL('../js/dados.js', import.meta.url), 'utf8');
const css = readFileSync(new URL('../css/estilos.css', import.meta.url), 'utf8');
const failures = [];

function assert(cond, msg) {
  if (!cond) failures.push(msg);
}

assert(/function textoPesquisa\(item\)/.test(app), 'textoPesquisa() is defined');
assert(app.includes('textoPesquisa(item).includes(termo)'), 'aplicarCatalogo() uses textoPesquisa()');
assert(
  !/item\.nome\.toLocaleLowerCase\('pt'\)\.includes\(termo\)/.test(app),
  'name-only includes() was replaced'
);
assert(app.includes('item.origem'), 'search haystack includes origem');
assert(app.includes('item.peso'), 'search haystack includes peso');
assert(app.includes('item.badge'), 'search haystack includes badge');
assert(app.includes('item.baseLinha'), 'search haystack includes baseLinha');
assert(
  app.includes('item.nome.toLocaleLowerCase(\'pt\').includes(termo)') === false,
  'old name-only filter is gone'
);

const fnMatch = app.match(/function textoPesquisa\(item\) \{[\s\S]*?\n  \}/);
assert(fnMatch, 'textoPesquisa() body could be extracted');

const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(`${dadosSrc}\nthis.produtos = produtos;`, sandbox);
const textoPesquisa = vm.runInContext(`${fnMatch[0]}\ntextoPesquisa;`, sandbox);

const all = [...sandbox.produtos.frutas, ...sandbox.produtos.legumes];
function hits(q) {
  const termo = q.toLocaleLowerCase('pt').trim();
  return all.filter(item => textoPesquisa(item).includes(termo));
}

const morango = hits('morango');
assert(morango.some(i => i.nome === 'Morangos'), 'morango still finds Morangos by name');

const bio = hits('bio');
assert(bio.length >= 4, `bio matches badge text (got ${bio.length})`);
assert(bio.every(i => /bio/i.test(String(i.badge || ''))), 'bio hits all have Bio in badge');
assert(!bio.some(i => i.nome.toLocaleLowerCase('pt').includes('bio')), 'bio matches are not name-only');

const molho = hits('molho');
assert(molho.length >= 3, `molho matches peso (got ${molho.length})`);
assert(molho.every(i => /molho/i.test(String(i.peso || ''))), 'molho hits all have Molho in peso');

const algarve = hits('algarve');
assert(algarve.some(i => i.nome.includes('Algarve')), 'algarve still finds Laranja Algarve by name');
assert(algarve.some(i => i.origem === 'Algarve' && !i.nome.includes('Algarve')), 'algarve also finds origem-only items');

const empty = hits('');
assert(empty.length === all.length, 'empty query keeps the full catalog');

assert(/app\.js\?v=33/.test(html), 'app.js cache query was bumped to v=33');
assert(/estilos\.css\?v=38/.test(html), 'estilos.css cache query was bumped to v=38');
assert(/name="color-scheme" content="light"/.test(html), 'color-scheme light meta is present');
assert(/color-scheme:\s*light/.test(css), 'CSS color-scheme is light');
assert(
  html.includes('announcement-track" aria-hidden="true"') || html.includes("announcement-track\" aria-hidden=\"true\""),
  'ticker track is hidden from assistive tech'
);
assert(!/announcement-bar" aria-live="polite"/.test(html), 'ticker is not a live region');
assert(
  /social-link:hover,\s*\n\s*\.social-link:focus-visible/.test(css),
  'social dock expands on keyboard focus'
);

for (const [file, source] of [['app.js', app], ['extras.js', extras], ['dados.js', dadosSrc]]) {
  const check = spawnSync(process.execPath, ['--check'], { input: source, encoding: 'utf8' });
  assert(check.status === 0, `${file} parses (${(check.stderr || '').trim() || 'ok'})`);
}

if (failures.length) {
  console.error('check-search-fields failed:');
  failures.forEach(f => console.error(' -', f));
  process.exit(1);
}

console.log('check-search-fields: ok');
console.log(` - ${all.length} catalog items; bio=${bio.length} molho=${molho.length} algarve=${algarve.length}`);
console.log(' - announcement ticker is decorative; color-scheme light; social :focus-visible');
console.log(' - app.js / extras.js / dados.js parse');
