/**
 * Static checks for hash restore after promoverCatalogo().
 * Run: node scripts/check-hash-restore.mjs
 */
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const app = readFileSync(new URL('../js/app.js', import.meta.url), 'utf8');
const extras = readFileSync(new URL('../js/extras.js', import.meta.url), 'utf8');
const dados = readFileSync(new URL('../js/dados.js', import.meta.url), 'utf8');
const failures = [];

function assert(cond, msg) {
  if (!cond) failures.push(msg);
}

assert(app.includes('function promoverCatalogo('), 'promoverCatalogo() is still present');
assert(app.includes('function restaurarAncoraAposLayout('), 'restaurarAncoraAposLayout() is defined');
assert(app.includes('function acompanharAncoraInicial('), 'acompanharAncoraInicial() is defined');
assert(
  app.includes('window.scrollTo(0, Math.max(0, Math.round(top)))'),
  'hash restore uses instant window.scrollTo (avoids html { scroll-behavior:smooth })'
);
assert(
  app.includes("window.addEventListener('wheel', cancelar"),
  'hash follow-up stops if the customer scrolls'
);
assert(app.includes('acompanharAncoraInicial();'), 'INIT starts the hash follow-up');

const initIdx = app.indexOf('promoverCatalogo();');
const followIdx = app.indexOf('acompanharAncoraInicial();');
assert(initIdx !== -1 && followIdx > initIdx, 'hash follow-up runs after promoverCatalogo() in INIT');

const navBlock = html.match(/<div class="nav-links">([\s\S]*?)<\/div>/)?.[1] || '';
const navHrefs = navBlock.match(/href="(#[^"]+)"/g)?.map(h => h.slice(6, -1)) || [];
assert(navHrefs.length >= 6, 'desktop nav still has section links');
for (const href of navHrefs) {
  const id = href.slice(1);
  assert(html.includes(`id="${id}"`), `nav target ${href} exists in HTML`);
}

for (const id of ['produtos', 'inicio', 'encomenda', 'contacto', 'cabazes', 'promocoes']) {
  assert(new RegExp(`id="${id}"`).test(html), `#${id} is still in the document`);
}

assert(/app\.js\?v=33/.test(html), 'app.js cache query was bumped to v=33');
assert(
  !app.includes('innerHTML') || app.includes('getElementById(id)'),
  'hash id is resolved with getElementById (not innerHTML)'
);

for (const [file, source] of [['app.js', app], ['extras.js', extras], ['dados.js', dados]]) {
  const check = spawnSync(process.execPath, ['--check'], { input: source, encoding: 'utf8' });
  assert(check.status === 0, `${file} parses (${(check.stderr || '').trim() || 'ok'})`);
}

if (failures.length) {
  console.error('check-hash-restore failed:');
  failures.forEach(f => console.error(' -', f));
  process.exit(1);
}

console.log('check-hash-restore: ok');
console.log(' - acompanharAncoraInicial after promoverCatalogo (retries, cancels on user scroll)');
console.log(' - nav hashes resolve to existing ids:', navHrefs.join(', '));
console.log(' - app.js / extras.js / dados.js parse');
