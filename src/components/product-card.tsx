import { useState } from "react";
import { imgResponsiva } from "@/lib/img";
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
    <article className="flex h-full flex-col overflow-hidden rounded-lg border border-line bg-white">
      <Link
        to="/produtos/$slug"
        params={{ slug: product.slug }}
        className="relative block aspect-[4/3] overflow-hidden bg-white"
      >
        {fotoOk ? (
          <img
            {...imgResponsiva(product.foto, "(min-width: 1024px) 240px, (min-width: 640px) 33vw, 50vw")}
            alt={product.alt || nomeVisivel(product)}
            width={480}
            height={480}
            loading={eager ? "eager" : "lazy"}
            decoding="async"
            className={cn("h-full w-full object-contain p-1.5 sm:p-2", !aberto && "opacity-50")}
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
      <div className="flex flex-1 flex-col gap-1 px-2 pt-1 pb-2 sm:px-3 sm:pb-3">
        <h3 className="min-h-8 text-[13px] leading-4 font-semibold sm:min-h-10 sm:text-sm sm:leading-5">
          <Link to="/produtos/$slug" params={{ slug: product.slug }} className="line-clamp-2">
            {nomeVisivel(product)}
          </Link>
        </h3>
        <PriceBlock product={product} compact />
        {estado !== "Disponível" ? <p className="text-xs text-warn">{estado}</p> : null}
        {aberto ? (
          qtd > 0 ? (
            <div className="mt-auto grid h-10 grid-cols-3 overflow-hidden rounded-lg border border-line">
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
              className="mt-auto inline-flex h-10 w-full items-center justify-center rounded-lg bg-leaf px-3 text-sm font-semibold text-paper"
              onClick={() => adicionarProduto(product.id)}
            >
              Adicionar
            </button>
          )
        ) : (
          <p className="mt-auto flex h-10 items-center text-sm text-muted">Indisponível</p>
        )}
      </div>
    </article>
  );
}
