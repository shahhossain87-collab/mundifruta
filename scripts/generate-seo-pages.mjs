#!/usr/bin/env node
/**
 * Creates crawlable catalog pages from the same JavaScript data used by the shop.
 * Run `npm run build` after editing js/dados.js.
 */
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const siteUrl = 'https://mundifruta.com';
const categories = [
  { slug: 'frutas', label: 'Frutas', description: 'Frutas frescas disponíveis na MUNDIFRUTA em Carnaxide.', image: 'fotos/cabaz_frutas.jpeg', imageAlt: 'Seleção de frutas frescas' },
  { slug: 'legumes', label: 'Legumes', description: 'Legumes frescos disponíveis na MUNDIFRUTA em Carnaxide.', image: 'fotos/cabaz_legumes.jpeg', imageAlt: 'Seleção apenas de legumes frescos' },
  { slug: 'ervas-frescas', label: 'Ervas frescas', description: 'Ervas frescas disponíveis na MUNDIFRUTA em Carnaxide.', image: 'fotos/hortela.jpeg', imageAlt: 'Ervas frescas e aromáticas' },
  { slug: 'frutas-da-epoca', label: 'Frutas da época', description: 'Frutas da época disponíveis na MUNDIFRUTA em Carnaxide.', image: 'fotos/uvas.jpeg', imageAlt: 'Fruta fresca da época' },
  { slug: 'promocoes', label: 'Promoções', description: 'Produtos em promoção na MUNDIFRUTA em Carnaxide.', image: 'fotos/morangos.jpeg', imageAlt: 'Promoções e destaques da semana' },
  { slug: 'cabazes', label: 'Cabazes', description: 'Cabazes de frutas e legumes disponíveis na MUNDIFRUTA em Carnaxide.', image: 'fotos/cabaz_detox.jpeg', imageAlt: 'Cabazes de frutas e legumes' },
];
const herbNames = new Set(['Salsa', 'Coentros', 'Hortelã', 'Agrião']);
const cssVersion = '66';

function esc(value = '') {
  return String(value).replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);
}

function slugify(value) {
  return String(value)
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/&/g, ' e ')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function money(value) {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value);
}

function priceLabel(product) {
  if (product.status === 'Indisponível') return 'Indisponível';
  if (product.venda === 'estimado' && Number.isFinite(product.pricePerKg)) return `${money(product.pricePerKg)}/kg`;
  return product.preco || 'A consultar';
}

function descriptionFor(product) {
  const details = [];
  if (product.peso) details.push(`Unidade de venda: ${product.peso}.`);
  if (product.origem) details.push(`Origem: ${product.origem}.`);
  if (product.status === 'Indisponível') details.push('Produto indisponível neste momento.');
  else if (product.venda === 'estimado') details.push('O valor final pode variar conforme o peso real preparado para a encomenda.');
  return `${product.nome}. ${details.join(' ')}`.trim();
}

// The browser app treats every item without the explicit unavailable status as sellable.
function availabilityFor(product) {
  return product.status === 'Indisponível'
    ? 'https://schema.org/OutOfStock'
    : 'https://schema.org/InStock';
}

function fixedPrice(product) {
  if (!product.preco || product.preco === 'A consultar') return null;
  const value = Number.parseFloat(String(product.preco).replace('.', '').replace(',', '.'));
  return Number.isFinite(value) ? value : null;
}

function offerFor(product, canonical) {
  // The product page currently shows only the unavailable message for these
  // items, so do not emit an Offer from a stale catalog price.
  if (product.status === 'Indisponível') return null;

  const offer = {
    '@type': 'Offer',
    url: canonical,
    availability: availabilityFor(product),
  };
  // These products are sold by estimated physical unit, but the source provides
  // an exact €/kg rate. Keep the active price in UnitPriceSpecification and make
  // the one-kilogram reference quantity explicit; do not invent a unit total.
  if (Number.isFinite(product.pricePerKg)) {
    offer.priceSpecification = {
      '@type': 'UnitPriceSpecification',
      price: product.pricePerKg,
      priceCurrency: 'EUR',
      referenceQuantity: {
        '@type': 'QuantitativeValue',
        value: 1,
        unitCode: 'KGM',
      },
    };
    return offer;
  }
  const price = product.status === 'Indisponível' ? null : fixedPrice(product);
  if (price === null) return null;
  offer.price = price;
  offer.priceCurrency = 'EUR';
  return offer;
}

async function loadCatalog() {
  const source = await readFile(join(root, 'js', 'dados.js'), 'utf8');
  const context = vm.createContext({ console });
  // dados.js is the source of truth for both the browser and generated pages.
  return vm.runInContext(`${source}\n;({ produtos })`, context, { filename: 'js/dados.js' });
}

function categoryItems(catalog) {
  const fruits = catalog.frutas;
  const vegetables = catalog.legumes.filter(item => !herbNames.has(item.nome));
  const herbs = catalog.legumes.filter(item => herbNames.has(item.nome));
  const seasonal = fruits.filter(item => item.epoca === true || /(é|e)poca/i.test(String(item.badge || '')));
  const promotions = [...catalog.frutas, ...catalog.legumes].filter(item => item.promo);
  return {
    frutas: fruits,
    legumes: vegetables,
    'ervas-frescas': herbs,
    'frutas-da-epoca': seasonal,
    promocoes: promotions,
    cabazes: catalog.cabazes,
  };
}

function primaryCategory(product, catalog) {
  if (catalog.cabazes.includes(product)) return 'cabazes';
  if (catalog.frutas.includes(product)) return 'frutas';
  return herbNames.has(product.nome) ? 'ervas-frescas' : 'legumes';
}

function seoNav(homePath, currentSlug) {
  const links = [
    { href: homePath, label: 'Início', slug: 'inicio' },
    ...categories.map(category => ({
      href: `${homePath}categorias/${category.slug}/`,
      label: category.label,
      slug: category.slug,
    })),
  ];
  return `<nav class="seo-nav" aria-label="Navegação principal">${links.map(link => {
    const current = link.slug === currentSlug ? ' aria-current="page"' : '';
    return `<a href="${link.href}"${current}>${esc(link.label)}</a>`;
  }).join('')}</nav>`;
}

function shareTags({ title, description, image, imageAlt }) {
  const imageUrl = image ? `${siteUrl}/${image}` : `${siteUrl}/fotos/cabaz_mix.jpeg`;
  const alt = imageAlt || title;
  return `<meta property="og:image" content="${esc(imageUrl)}"/>
  <meta property="og:image:alt" content="${esc(alt)}"/>
  <meta name="twitter:card" content="summary_large_image"/>
  <meta name="twitter:title" content="${esc(title)}"/>
  <meta name="twitter:description" content="${esc(description)}"/>
  <meta name="twitter:image" content="${esc(imageUrl)}"/>`;
}

function layout({ title, description, canonical, cssPath, homePath, body, structuredData, image, imageAlt, currentSlug }) {
  return `<!DOCTYPE html>
<html lang="pt-PT">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <meta name="description" content="${esc(description)}"/>
  <title>${esc(title)}</title>
  <link rel="canonical" href="${canonical}"/>
  <link rel="alternate" hreflang="pt-PT" href="${canonical}"/>
  <link rel="alternate" hreflang="x-default" href="${canonical}"/>
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🍓</text></svg>"/>
  <meta property="og:type" content="website"/>
  <meta property="og:site_name" content="MUNDIFRUTA"/>
  <meta property="og:title" content="${esc(title)}"/>
  <meta property="og:description" content="${esc(description)}"/>
  <meta property="og:url" content="${canonical}"/>
  <meta property="og:locale" content="pt_PT"/>
  ${shareTags({ title, description, image, imageAlt })}
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=Poppins:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="${cssPath}"/>
  ${structuredData ? `<script type="application/ld+json">${JSON.stringify(structuredData)}</script>` : ''}
</head>
<body class="seo-page">
  <header class="seo-header">
    <a class="logo" href="${homePath}">MUNDI<span class="logo-accent">FRUTA</span></a>
    ${seoNav(homePath, currentSlug)}
  </header>
  <main>${body}</main>
  <footer class="seo-footer">
    <p><a href="${homePath}">MUNDIFRUTA</a> · Frutas e legumes frescos em Carnaxide.</p>
    <nav class="seo-footer-contact" aria-label="Contactos">
      <a href="https://wa.me/351932699850">WhatsApp</a>
      <a href="tel:932699850">932 699 850</a>
      <a href="mailto:shahhossain87@gmail.com">Email</a>
    </nav>
  </footer>
</body>
</html>`;
}

function productCard(product, categorySlug) {
  const slug = slugify(product.nome);
  const productPath = `../../produtos/${slug}/`;
  return `<article class="seo-product-card">
    <a href="${productPath}" class="seo-product-image"><img src="../../${esc(product.foto)}" alt="${esc(product.alt || product.nome)}" loading="lazy" decoding="async"></a>
    <div class="seo-product-card-body">
      <h3><a href="${productPath}">${esc(product.nome)}</a></h3>
      <p>${esc(product.peso || 'Unidade de venda não indicada')}</p>
      <p class="seo-product-price">${esc(priceLabel(product))}</p>
      <a class="seo-text-link" href="${productPath}">Ver produto</a>
    </div>
  </article>`;
}

function categoryPage(category, products) {
  const body = `<section class="seo-hero"><div>
    <nav class="seo-breadcrumbs" aria-label="Breadcrumb"><a href="../..">Início</a><span>›</span><span>${esc(category.label)}</span></nav>
    <h1>${esc(category.label)}</h1><p>${esc(category.description)}</p>
  </div></section>
  <section class="seo-catalog"><h2>Produtos</h2><div class="seo-product-grid">${products.map(product => productCard(product, category.slug)).join('\n')}</div></section>`;
  return layout({
    title: `${category.label} em Carnaxide | MUNDIFRUTA`,
    description: category.description,
    canonical: `${siteUrl}/categorias/${category.slug}/`,
    cssPath: `../../css/estilos.css?v=${cssVersion}`,
    homePath: '../../',
    body,
    image: category.image,
    imageAlt: category.imageAlt,
    currentSlug: category.slug,
  });
}

function productPage(product, category) {
  const slug = slugify(product.nome);
  const canonical = `${siteUrl}/produtos/${slug}/`;
  const image = `${siteUrl}/${product.foto}`;
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.nome,
    description: descriptionFor(product),
    image,
    url: canonical,
  };
  const offer = offerFor(product, canonical);
  if (offer) structuredData.offers = offer;
  const actionHref = `/?produto=${encodeURIComponent(slug)}#produtos`;
  const body = `<article class="seo-product-detail">
    <nav class="seo-breadcrumbs" aria-label="Breadcrumb"><a href="../..">Início</a><span>›</span><a href="../../categorias/${category.slug}/">${esc(category.label)}</a><span>›</span><span>${esc(product.nome)}</span></nav>
    <div class="seo-product-layout">
      <div class="seo-product-detail-image"><img src="../../${esc(product.foto)}" alt="${esc(product.alt || product.nome)}"></div>
      <div class="seo-product-copy"><p class="eyebrow">${esc(category.label)}</p><h1>${esc(product.nome)}</h1>
        <p class="seo-product-detail-price">${esc(priceLabel(product))}</p>
        <p>${esc(descriptionFor(product))}</p>
        ${product.baseLinha ? `<p>${esc(product.baseLinha)}</p>` : ''}
        ${product.status === 'Indisponível'
          ? '<p class="seo-status">Indisponível neste momento.</p>'
          : `<a class="btn-prim seo-order-link" href="${actionHref}">Ver no catálogo e encomendar</a>`}
      </div>
    </div>
  </article>`;
  return layout({
    title: `${product.nome} | MUNDIFRUTA Carnaxide`,
    description: descriptionFor(product),
    canonical,
    cssPath: `../../css/estilos.css?v=${cssVersion}`,
    homePath: '../../',
    body,
    structuredData,
    image: product.foto,
    imageAlt: product.alt || product.nome,
    currentSlug: category.slug,
  });
}

function homeLinks() {
  return `<section class="seo-crawl-links" aria-labelledby="seo-crawl-title">
  <div class="product-container"><h2 id="seo-crawl-title">Explorar o catálogo</h2><p>Veja produtos por categoria e consulte cada produto antes de encomendar.</p>
  <nav aria-label="Categorias do catálogo">${categories.map(category => `<a href="categorias/${category.slug}/">${esc(category.label)}</a>`).join('')}</nav></div>
</section>`;
}

async function writeGenerated(path, content) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content, 'utf8');
}

async function main() {
  const { produtos: catalog } = await loadCatalog();
  const groups = categoryItems(catalog);
  const allProducts = [...catalog.frutas, ...catalog.legumes, ...catalog.cabazes];
  const slugs = new Set();
  for (const product of allProducts) {
    const slug = slugify(product.nome);
    if (!slug || slugs.has(slug)) throw new Error(`Duplicate or empty product slug: ${product.nome}`);
    slugs.add(slug);
  }

  await rm(join(root, 'produtos'), { recursive: true, force: true });
  await rm(join(root, 'categorias'), { recursive: true, force: true });
  for (const category of categories) {
    const path = join(root, 'categorias', category.slug, 'index.html');
    await writeGenerated(path, categoryPage(category, groups[category.slug]));
  }
  for (const product of allProducts) {
    const category = categories.find(item => item.slug === primaryCategory(product, catalog));
    await writeGenerated(join(root, 'produtos', slugify(product.nome), 'index.html'), productPage(product, category));
  }

  const indexPath = join(root, 'index.html');
  const index = await readFile(indexPath, 'utf8');
  const start = '<!-- SEO-CATALOG-LINKS:START -->';
  const end = '<!-- SEO-CATALOG-LINKS:END -->';
  const startIndex = index.indexOf(start);
  const endIndex = index.indexOf(end);
  if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) throw new Error('Homepage SEO link markers are missing.');
  const updatedIndex = `${index.slice(0, startIndex + start.length)}\n${homeLinks()}\n${index.slice(endIndex)}`;
  await writeGenerated(indexPath, updatedIndex);

  const urls = [
    `${siteUrl}/`,
    `${siteUrl}/creditos.html`,
    ...categories.map(category => `${siteUrl}/categorias/${category.slug}/`),
    ...allProducts.map(product => `${siteUrl}/produtos/${slugify(product.nome)}/`),
  ];
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(url => `  <url><loc>${url}</loc></url>`).join('\n')}\n</urlset>\n`;
  await writeGenerated(join(root, 'sitemap.xml'), sitemap);
  console.log(`Generated ${allProducts.length} product pages, ${categories.length} category pages, and sitemap.xml.`);
}

await main();
