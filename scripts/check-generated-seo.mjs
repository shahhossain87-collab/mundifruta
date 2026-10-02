#!/usr/bin/env node
import { access, readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const domain = 'https://mundifruta.com';
const categorySlugs = ['frutas', 'legumes', 'ervas-frescas', 'frutas-da-epoca', 'promocoes', 'cabazes'];
const slugify = value => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/&/g, ' e ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const source = await readFile(join(root, 'js', 'dados.js'), 'utf8');
const { produtos } = vm.runInNewContext(`${source}\n;({ produtos })`, { console }, { filename: 'js/dados.js' });
const products = [...produtos.frutas, ...produtos.legumes, ...produtos.cabazes];
const failures = [];
const expect = (condition, message) => { if (!condition) failures.push(message); };

const sitemap = await readFile(join(root, 'sitemap.xml'), 'utf8');
expect(sitemap.includes(`${domain}/`), 'sitemap lacks homepage canonical URL');
expect(sitemap.includes(`${domain}/creditos.html`), 'sitemap lacks credits canonical URL');
for (const category of categorySlugs) {
  const canonical = `${domain}/categorias/${category}/`;
  const file = join(root, 'categorias', category, 'index.html');
  try { await access(file); } catch { failures.push(`Missing category page: ${category}`); continue; }
  const html = await readFile(file, 'utf8');
  expect(html.includes(`rel="canonical" href="${canonical}"`), `Wrong canonical in category: ${category}`);
  expect(sitemap.includes(`<loc>${canonical}</loc>`), `Sitemap lacks category: ${category}`);
}
for (const product of products) {
  const slug = slugify(product.nome);
  const canonical = `${domain}/produtos/${slug}/`;
  const file = join(root, 'produtos', slug, 'index.html');
  try { await access(file); } catch { failures.push(`Missing product page: ${slug}`); continue; }
  const html = await readFile(file, 'utf8');
  expect(html.includes(`<h1>${product.nome}</h1>`), `Product name missing from initial HTML: ${slug}`);
  expect(html.includes(`rel="canonical" href="${canonical}"`), `Wrong canonical in product: ${slug}`);
  expect(html.includes('"@type":"Product"'), `Product JSON-LD missing: ${slug}`);
  const jsonLdMatch = html.match(/<script type="application\/ld\+json">([^<]+)<\/script>/);
  try {
    const jsonLd = JSON.parse(jsonLdMatch?.[1] || 'null');
    const expectedAvailability = product.status === 'Indisponível'
      ? 'https://schema.org/OutOfStock'
      : 'https://schema.org/InStock';
    expect(jsonLd?.offers?.availability === expectedAvailability, `Wrong availability in product JSON-LD: ${slug}`);
    if (Number.isFinite(product.pricePerKg)) {
      const specification = jsonLd?.offers?.priceSpecification;
      expect(specification?.['@type'] === 'UnitPriceSpecification', `Missing unit price specification: ${slug}`);
      expect(specification?.price === product.pricePerKg, `Wrong unit price in JSON-LD: ${slug}`);
      expect(specification?.referenceQuantity?.value === 1 && specification?.referenceQuantity?.unitCode === 'KGM', `Wrong kilogram reference quantity: ${slug}`);
    }
  } catch {
    failures.push(`Invalid product JSON-LD: ${slug}`);
  }
  expect(sitemap.includes(`<loc>${canonical}</loc>`), `Sitemap lacks product: ${slug}`);
}
const sitemapUrls = [...sitemap.matchAll(/<loc>(https:\/\/mundifruta\.com\/[^<]*)<\/loc>/g)].map(match => match[1]);
const expectedUrls = new Set([
  `${domain}/`,
  `${domain}/creditos.html`,
  ...categorySlugs.map(category => `${domain}/categorias/${category}/`),
  ...products.map(product => `${domain}/produtos/${slugify(product.nome)}/`),
]);
expect(sitemapUrls.length === expectedUrls.size, `Sitemap URL count should be ${expectedUrls.size}, got ${sitemapUrls.length}`);
expect(sitemapUrls.every(url => expectedUrls.has(url)), 'Sitemap contains an unexpected URL');
expect(sitemapUrls.length === new Set(sitemapUrls).size, 'Sitemap contains duplicate URLs');
expect(sitemapUrls.every(url => url.startsWith(domain)), 'Sitemap contains a non-canonical domain');
const robots = await readFile(join(root, 'robots.txt'), 'utf8');
expect(robots.includes(`Sitemap: ${domain}/sitemap.xml`), 'robots.txt must point to the canonical sitemap');
const index = await readFile(join(root, 'index.html'), 'utf8');
expect(index.includes('seo-crawl-links'), 'Homepage lacks crawlable category links');
if (failures.length) { console.error('check-generated-seo failed:\n' + failures.map(item => ` - ${item}`).join('\n')); process.exit(1); }
console.log(`check-generated-seo: ok (${products.length} products, ${categorySlugs.length} categories, ${sitemapUrls.length} URLs)`);
