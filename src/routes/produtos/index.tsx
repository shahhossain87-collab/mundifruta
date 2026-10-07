import { createFileRoute } from "@tanstack/react-router";
import { ShopView } from "@/components/shop-view";
import { parseShopSearch, queryFromSearch, searchFromQuery, todosProdutos, type ShopSearch } from "@/lib/shop";
import { canonicalLink } from "@/lib/seo";

export const Route = createFileRoute("/produtos/")({
  validateSearch: (search: Record<string, unknown>): ShopSearch => parseShopSearch(search),
  head: () => ({
    meta: [
      { title: "Produtos | MUNDIFRUTA Carnaxide" },
      {
        name: "description",
        content:
          "Catálogo de frutas, legumes e ervas da MUNDIFRUTA em Carnaxide. Preços, unidades e encomenda por WhatsApp.",
      },
    ],
    links: [canonicalLink("/produtos")],
  }),
  component: ProdutosPage,
});

function ProdutosPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const query = queryFromSearch(search);
  return (
    <ShopView
      title="Produtos"
      intro="Frutas, legumes e ervas da loja. Escolha, adicione ao carrinho e envie a encomenda por WhatsApp para levantamento em Carnaxide."
      categoriaSlug={null}
      items={todosProdutos()}
      query={query}
      onChange={(next) => {
        void navigate({ search: searchFromQuery(next), resetScroll: false });
      }}
    />
  );
}
