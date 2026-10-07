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
