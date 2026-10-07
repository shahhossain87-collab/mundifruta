import { createFileRoute, notFound } from "@tanstack/react-router";
import { ShopView } from "@/components/shop-view";
import {
  categoriaPorSlug,
  parseShopSearch,
  produtosDaCategoria,
  queryFromSearch,
  searchFromQuery,
  type ShopSearch,
} from "@/lib/shop";
import { canonicalLink } from "@/lib/seo";

export const Route = createFileRoute("/categorias/$categoria")({
  validateSearch: (search: Record<string, unknown>): ShopSearch => parseShopSearch(search),
  loader: ({ params }) => {
    const categoria = categoriaPorSlug(params.categoria);
    if (!categoria) throw notFound();
    return categoria;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.titulo ?? "Categoria"} em Carnaxide | MUNDIFRUTA` },
      { name: "description", content: loaderData?.intro ?? "Produtos frescos na MUNDIFRUTA, Carnaxide." },
    ],
    links: loaderData ? [canonicalLink(`/categorias/${loaderData.slug}`)] : [],
  }),
  component: CategoriaPage,
  notFoundComponent: () => (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <h1 className="font-display text-4xl">Categoria não encontrada</h1>
    </div>
  ),
});

function CategoriaPage() {
  const categoria = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const query = queryFromSearch(search);
  return (
    <ShopView
      title={categoria.titulo}
      intro={categoria.intro}
      categoriaSlug={categoria.slug}
      items={produtosDaCategoria(categoria.slug)}
      query={query}
      onChange={(next) => {
        void navigate({ search: searchFromQuery(next), resetScroll: false });
      }}
    />
  );
}
