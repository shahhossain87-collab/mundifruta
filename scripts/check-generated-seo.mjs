#!/usr/bin/env node
import { access, readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const domain = 'https://mundifruta.com';
const categorySlugs = ['frutas', 'legumes', 'ervas-frescas', 'frutas-da-epoca', 'promocoes', 'cabazes'];
const categoryLabels = {
  frutas: 'Frutas',
  legumes: 'Legumes',
  'ervas-frescas': 'Ervas frescas',
  'frutas-da-epoca': 'Frutas da época',
  promocoes: 'Promoções',
  cabazes: 'Cabazes',
};
const slugify = value => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/&/g, ' e ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const fixedPrice = product => {
  if (!product.preco || product.preco === 'A consultar') return null;
  const value = Number.parseFloat(String(product.preco).replace('.', '').replace(',', '.'));
  return Number.isFinite(value) ? value : null;
};
const hasCurrentPrice = product => product.status !== 'Indisponível'
  && (Number.isFinite(product.pricePerKg) || fixedPrice(product) !== null);
const herbNames = new Set(['Salsa', 'Coentros', 'Hortelã', 'Agrião']);
const source = await readFile(join(root, 'js', 'dados.js'), 'utf8');
const { produtos } = vm.runInNewContext(`${source}\n;({ produtos })`, { console }, { filename: 'js/dados.js' });
const products = [...produtos.frutas, ...produtos.legumes, ...produtos.cabazes];
const categoryItems = {
  frutas: produtos.frutas,
  legumes: produtos.legumes.filter(item => !herbNames.has(item.nome)),
  'ervas-frescas': produtos.legumes.filter(item => herbNames.has(item.nome)),
  'frutas-da-epoca': produtos.frutas.filter(item => item.epoca === true || /(é|e)poca/i.test(String(item.badge || ''))),
  promocoes: [...produtos.frutas, ...produtos.legumes].filter(item => item.promo),
  cabazes: produtos.cabazes,
};
const failures = [];
const expect = (condition, message) => { if (!condition) failures.push(message); };
const parseJsonLd = html => {
  const match = html.match(/<script type="application\/ld\+json">([^<]+)<\/script>/);
  return JSON.parse(match?.[1] || 'null');
};

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
  const items = categoryItems[category] || [];
  try {
    const jsonLd = parseJsonLd(html);
    expect(jsonLd?.['@type'] === 'ItemList', `Category ItemList JSON-LD missing: ${category}`);
    expect(jsonLd?.name === categoryLabels[category], `Wrong ItemList name in category: ${category}`);
    expect(jsonLd?.url === canonical, `Wrong ItemList url in category: ${category}`);
    expect(jsonLd?.numberOfItems === items.length, `Wrong ItemList numberOfItems in category: ${category}`);
    expect(Array.isArray(jsonLd?.itemListElement) && jsonLd.itemListElement.length === items.length,
      `Wrong ItemList length in category: ${category}`);
    items.forEach((product, index) => {
      const entry = jsonLd.itemListElement[index];
      const productUrl = `${domain}/produtos/${slugify(product.nome)}/`;
      expect(entry?.['@type'] === 'ListItem', `ListItem type missing at ${index} in ${category}`);
      expect(entry?.position === index + 1, `Wrong ListItem position at ${index} in ${category}`);
      expect(entry?.url === productUrl, `Wrong ListItem url at ${index} in ${category}`);
      expect(entry?.name === product.nome, `Wrong ListItem name at ${index} in ${category}`);
      expect(!entry?.offers && !entry?.item?.offers, `Category ItemList must not duplicate product Offers: ${category}`);
    });
  } catch {
    failures.push(`Invalid category JSON-LD: ${category}`);
  }
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
  expect(!html.includes('"@type":"ItemList"'), `Product page must not use ItemList JSON-LD: ${slug}`);
  try {
    const jsonLd = parseJsonLd(html);
    const offer = jsonLd?.offers;
    if (offer) {
      const expectedAvailability = 'https://schema.org/InStock';
      expect(offer.availability === expectedAvailability, `Wrong availability in product JSON-LD: ${slug}`);
      expect(Number.isFinite(offer.price) || Number.isFinite(offer.priceSpecification?.price), `Offer missing price: ${slug}`);
      if (Number.isFinite(product.pricePerKg)) {
        const specification = offer.priceSpecification;
        expect(specification?.['@type'] === 'UnitPriceSpecification', `Missing unit price specification: ${slug}`);
        expect(specification?.price === product.pricePerKg, `Wrong unit price in JSON-LD: ${slug}`);
        expect(specification?.referenceQuantity?.value === 1 && specification?.referenceQuantity?.unitCode === 'KGM', `Wrong kilogram reference quantity: ${slug}`);
      }
    } else {
      expect(!hasCurrentPrice(product), `Missing Offer for priced product: ${slug}`);
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
