import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Minus, Plus } from "lucide-react";
import { PriceBlock } from "@/components/price-block";
import { useCart } from "@/lib/cart";
import { adicionarProduto } from "@/lib/cart";
import {
  badgeProduto,
  disponivel,
  estadoProduto,
  nomeVisivel,
  type Product,
} from "@/lib/shop";
import { cn } from "@/lib/cn";

export function ProductCard({ product, eager = false }: { product: Product; eager?: boolean }) {
  const qtd = useCart((state) => state.qty[product.id] ?? 0);
  const setQty = useCart((state) => state.setQty);
  const [fotoOk, setFotoOk] = useState(true);
  const badge = badgeProduto(product);
  const aberto = disponivel(product);
  const estado = estadoProduto(product);

  return (
    <article className="flex h-full flex-col rounded-lg border border-line bg-card">
      <Link
        to="/produtos/$slug"
        params={{ slug: product.slug }}
        className="relative block aspect-square overflow-hidden rounded-t-lg bg-foam"
      >
        {fotoOk ? (
          <img
            src={product.foto}
            alt={product.alt || nomeVisivel(product)}
            width={480}
            height={480}
            loading={eager ? "eager" : "lazy"}
            decoding="async"
            className={cn("h-full w-full object-contain p-3", !aberto && "opacity-50")}
            onError={() => setFotoOk(false)}
          />
        ) : (
          <span className="flex h-full items-center justify-center px-3 text-center text-sm text-muted">
            {nomeVisivel(product)}
          </span>
        )}
        {badge ? (
          <span
            className={cn(
              "absolute top-2 left-2 rounded-md px-2 py-1 text-xs font-semibold",
              badge === "Esgotado" ? "bg-ink text-paper" : "bg-card text-ink",
            )}
          >
            {badge}
          </span>
        ) : null}
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <h3 className="min-h-10 text-sm leading-5 font-semibold">
          <Link to="/produtos/$slug" params={{ slug: product.slug }} className="line-clamp-2">
            {nomeVisivel(product)}
          </Link>
        </h3>
        <PriceBlock product={product} />
        <p className={cn("text-xs", estado === "Disponível" ? "text-leaf" : "text-warn")}>{estado}</p>
        {aberto ? (
          qtd > 0 ? (
            <div className="mt-auto grid h-11 grid-cols-3 overflow-hidden rounded-lg border border-line">
              <button
                type="button"
                className="text-lg"
                aria-label={`Diminuir ${nomeVisivel(product)}`}
                onClick={() => setQty(product.id, qtd - 1)}
              >
                <Minus className="mx-auto size-4" />
              </button>
              <span className="flex items-center justify-center text-sm font-semibold tabular-nums">{qtd}</span>
              <button
                type="button"
                className="text-lg"
                aria-label={`Aumentar ${nomeVisivel(product)}`}
                onClick={() => setQty(product.id, qtd + 1)}
              >
                <Plus className="mx-auto size-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="mt-auto h-11 rounded-lg bg-leaf text-sm font-semibold text-paper"
              onClick={() => adicionarProduto(product.id)}
            >
              Adicionar
            </button>
          )
        ) : (
          <p className="mt-auto flex h-11 items-center text-sm text-muted">Indisponível</p>
        )}
      </div>
    </article>
  );
}
