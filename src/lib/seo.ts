/** Canonical origin for SEO tags (canonical, og:url, absolute JSON-LD URLs). */
export const SITE_URL = "https://mundifruta.com";

/** Absolute canonical URL for a path, without trailing slash (homepage = SITE_URL + "/"). */
export function canonicalUrl(path: string): string {
  const clean = ("/" + path.replace(/^\/+/, "")).replace(/\/+$/, "");
  return clean === "" ? `${SITE_URL}/` : `${SITE_URL}${clean}`;
}

/** Make a site-relative URL absolute; leaves absolute URLs untouched. */
export function absoluteUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  return `${SITE_URL}/${url.replace(/^\/+/, "")}`;
}

export function canonicalLink(path: string) {
  return { rel: "canonical", href: canonicalUrl(path) };
}

export const LOJA_MORADA_SCHEMA = {
  "@type": "PostalAddress",
  streetAddress: "Av. de Portugal, Centro Cívico, Loja 24-C",
  postalCode: "2790-129",
  addressLocality: "Carnaxide",
  addressRegion: "Oeiras",
  addressCountry: "PT",
} as const;

/** Vendedor (loja física) usado no schema Product > Offer. */
export const LOJA_SCHEMA_VENDEDOR = {
  "@type": "GroceryStore",
  "@id": `${SITE_URL}/#loja`,
  name: "MUNDIFRUTA",
  url: `${SITE_URL}/`,
  telephone: "+351932699850",
  address: LOJA_MORADA_SCHEMA,
} as const;
