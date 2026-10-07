import { createFileRoute } from "@tanstack/react-router";
import { categorias, produtos } from "@/lib/shop";

const CABAZES_NO_SITEMAP = ["cabaz-de-legumes", "cabaz-de-verao", "cabaz-detox", "cabaz-familiar"];
const LASTMOD = "2026-10-06";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const origin = new URL(request.url).origin;
        const paths = [
          "/",
          "/produtos",
          "/guia/fruta-da-epoca",
          "/privacidade",
          "/creditos",
          ...categorias.map((categoria) => `/categorias/${categoria.slug}`),
          ...produtos.filter((produto) => produto.grupo !== "cabazes").map((produto) => `/produtos/${produto.slug}`),
          ...CABAZES_NO_SITEMAP.filter((slug) => produtos.some((produto) => produto.slug === slug)).map(
            (slug) => `/produtos/${slug}`,
          ),
        ];
        const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paths.map((path) => `  <url><loc>${origin}${path}</loc><lastmod>${LASTMOD}</lastmod></url>`).join("\n")}
</urlset>`;
        return new Response(body, {
          headers: { "content-type": "application/xml; charset=utf-8" },
        });
      },
    },
  },
});
