import { nomeVisivel, precoVista, type Product } from "@/lib/shop";
import { cn } from "@/lib/cn";

export function PriceBlock({
  product,
  large = false,
  compact = false,
}: {
  product: Product;
  large?: boolean;
  compact?: boolean;
}) {
  const vista = precoVista(product);
  if (compact) {
    // Continente / Pingo Doce style: price big, per-unit detail right underneath, one tight block.
    const detalhe = [vista.secundario, vista.unidade].filter(Boolean).join(" · ");
    return (
      <div>
        <p className="flex flex-wrap items-baseline gap-x-1.5">
          <span
            className={cn(
              "font-display leading-none whitespace-nowrap text-fruit tabular-nums text-xl",
              vista.consultar && "text-lg",
            )}
          >
            {vista.principal || "—"}
          </span>
          {vista.rasurado ? <s className="text-xs text-muted tabular-nums">{vista.rasurado}</s> : null}
        </p>
        {detalhe ? <p className="mt-0.5 truncate text-[11px] leading-4 text-muted tabular-nums">{detalhe}</p> : null}
      </div>
    );
  }
  return (
    <div>
      {vista.unidade ? <p className="text-xs text-muted">{vista.unidade}</p> : <p className="text-xs">&nbsp;</p>}
      {vista.rasurado ? (
        <p className="text-xs text-muted line-through tabular-nums">{vista.rasurado}</p>
      ) : null}
      <p
        className={cn(
          "font-display leading-none whitespace-nowrap text-fruit tabular-nums",
          large ? "text-4xl" : "text-xl",
          vista.consultar && "text-2xl",
        )}
      >
        {vista.principal || "—"}
      </p>
      <p className="mt-1 min-h-4 text-xs text-muted tabular-nums">{vista.secundario || "\u00a0"}</p>
    </div>
  );
}

export function ProductTitle({ product, className }: { product: Product; className?: string }) {
  return <span className={className}>{nomeVisivel(product)}</span>;
}
