import { useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ProductCard } from "@/components/product-card";
import { PriceBlock } from "@/components/price-block";
import { adicionarProduto, useCart } from "@/lib/cart";
import {
  biologico,
  categoriaDe,
  descricaoProduto,
  disponivel,
  estadoProduto,
  formatarCentimos,
  LOJA,
  nomeVisivel,
  NOTA_PESO,
  pesoMedio,
  porSlug,
  precoCentimos,
  precoLinhaCentimos,
  relacionados,
  sobConfirmacao,
} from "@/lib/shop";

export const Route = createFileRoute("/produtos/$slug")({
  loader: ({ params }) => {
    const produto = porSlug(params.slug);
    if (!produto) throw notFound();
    return produto;
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${nomeVisivel(loaderData)} | MUNDIFRUTA Carnaxide` },
          { name: "description", content: descricaoProduto(loaderData) },
        ]
      : [],
  }),
  component: ProdutoPage,
  notFoundComponent: () => (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <h1 className="font-display text-4xl">Produto não encontrado</h1>
      <Link to="/produtos" className="mt-4 inline-block font-semibold text-leaf">
        Ver produtos
      </Link>
    </div>
  ),
});

function ProdutoPage() {
  const produto = Route.useLoaderData();
  const categoria = categoriaDe(produto);
  const [qtd, setQtd] = useState(1);
  const noCarrinho = useCart((state) => state.qty[produto.id] ?? 0);
  const aberto = disponivel(produto);
  const centimos = precoLinhaCentimos(produto);
  const precoNumero = pesoMedio(produto) ? produto.pricePerKg : centimos !== null ? centimos / 100 : null;
  const disponibilidade = !aberto
    ? "https://schema.org/OutOfStock"
    : sobConfirmacao(produto)
      ? "https://schema.org/LimitedAvailability"
      : "https://schema.org/InStock";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: nomeVisivel(produto),
    description: descricaoProduto(produto),
    image: produto.foto,
    sku: produto.id,
    brand: { "@type": "Brand", name: "MUNDIFRUTA" },
    offers:
      precoNumero !== null && precoNumero !== undefined
        ? {
            "@type": "Offer",
            priceCurrency: "EUR",
            price: precoNumero.toFixed(2),
            availability: disponibilidade,
            seller: { "@type": "GroceryStore", name: "MUNDIFRUTA", address: "Carnaxide" },
          }
        : undefined,
  };

  return (
    <article className="mx-auto max-w-6xl px-4 py-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav className="mb-4 text-sm text-muted" aria-label="Percurso">
        <Link to="/">Início</Link>
        <span aria-hidden="true"> / </span>
        <Link to="/categorias/$categoria" params={{ categoria: categoria.slug }}>
          {categoria.label}
        </Link>
        <span aria-hidden="true"> / </span>
        <span>{nomeVisivel(produto)}</span>
      </nav>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="aspect-square overflow-hidden rounded-lg bg-foam">
          <img
            src={produto.foto}
            alt={produto.alt || nomeVisivel(produto)}
            width={800}
            height={800}
            className="h-full w-full object-contain p-6"
          />
        </div>
        <div>
          <p className="text-sm font-semibold text-leaf">{categoria.label}</p>
          <h1 className="font-display text-4xl">{nomeVisivel(produto)}</h1>
          <p className="mt-2 text-sm">{estadoProduto(produto)}</p>
          <div className="mt-4">
            <PriceBlock product={produto} large />
          </div>
          {pesoMedio(produto) ? <p className="mt-2 text-sm text-muted">{NOTA_PESO}</p> : null}
          {produto.origem ? <p className="mt-2 text-sm">Origem: {produto.origem}</p> : null}
          {biologico(produto) ? <p className="mt-1 text-sm">Marcado como biológico no catálogo da loja.</p> : null}
          {precoCentimos(produto.preco) === null ? <p className="mt-1 text-sm">Preço a confirmar com a loja.</p> : null}
          {aberto ? (
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <div className="grid h-11 w-32 grid-cols-3 overflow-hidden rounded-lg border border-line bg-card">
                <button type="button" aria-label="Diminuir quantidade" onClick={() => setQtd((value) => Math.max(1, value - 1))}>
                  −
                </button>
                <span className="flex items-center justify-center tabular-nums">{qtd}</span>
                <button type="button" aria-label="Aumentar quantidade" onClick={() => setQtd((value) => value + 1)}>
                  +
                </button>
              </div>
              <button
                type="button"
                className="h-11 rounded-lg bg-leaf px-4 text-sm font-semibold text-paper"
                onClick={() => adicionarProduto(produto.id, qtd)}
              >
                Adicionar ao carrinho
              </button>
            </div>
          ) : (
            <p className="mt-5 text-sm">Este produto está esgotado e não pode ser adicionado.</p>
          )}
          {noCarrinho > 0 ? <p className="mt-2 text-sm text-muted">{noCarrinho} no carrinho.</p> : null}
          {centimos !== null && pesoMedio(produto) ? (
            <p className="mt-2 text-xs text-muted">
              Estimativa por unidade: {formatarCentimos(centimos)}. O total do carrinho usa este peso médio.
            </p>
          ) : null}
          <div className="mt-6 rounded-lg border border-line bg-card p-4 text-sm">
            <p className="font-semibold">Levantamento na loja</p>
            <p className="mt-1">
              {LOJA.morada}, {LOJA.cp}. {LOJA.horarioLongo}.
            </p>
            <p className="mt-1">Encomenda por WhatsApp. Pagamento na loja, sem pagamento antecipado. Sem entrega.</p>
          </div>
          <p className="mt-4 text-sm">{descricaoProduto(produto)}</p>
          {nomeVisivel(produto) !== produto.nome ? (
            <p className="mt-2 text-xs text-muted">No catálogo da loja: {produto.nome}.</p>
          ) : null}
          <p className="mt-3 text-xs text-muted">
            Algumas fotografias são de catálogo.{" "}
            <Link to="/creditos" className="underline">
              Créditos
            </Link>
          </p>
        </div>
      </div>
      <section className="mt-10" aria-labelledby="relacionados">
        <h2 id="relacionados" className="font-display text-3xl">
          Também na loja
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {relacionados(produto).map((item) => (
            <ProductCard key={item.id} product={item} />
          ))}
        </div>
      </section>
    </article>
  );
}
