import { nomeVisivel, precoVista, type Product } from "@/lib/shop";
import { cn } from "@/lib/cn";

export function PriceBlock({ product, large = false }: { product: Product; large?: boolean }) {
  const vista = precoVista(product);
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
