import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Check, Copy, Gift } from "lucide-react";
import { cn } from "@/lib/cn";
import { OFERTA } from "@/lib/shop";

const DESCONTO = `${OFERTA.descontoEur}€`;
const MINIMO = `${OFERTA.minimoEur}€`;
const PEQUENAS_LETRAS = `${OFERTA.exclusivo.replace(/\.$/, "")}, válida na primeira compra a partir de ${MINIMO}. Desconto confirmado pela loja. Levantamento na loja.`;

/** Faixa fina no topo de todas as páginas. */
export function OfferBar() {
  return (
    <div className="bg-fruit text-paper">
      <Link
        to="/"
        hash="oferta"
        className="mx-auto flex min-h-9 max-w-6xl items-center justify-center gap-x-2 px-4 py-1.5 text-center text-xs font-medium leading-snug sm:text-sm"
      >
        <span aria-hidden="true">🎁</span>
        <span className="sm:hidden">
          <strong className="font-semibold">−{DESCONTO}</strong> na 1.ª compra a partir de {MINIMO} · Código{" "}
          <strong className="font-semibold tracking-wide">{OFERTA.codigo}</strong>
        </span>
        <span className="hidden sm:inline">
          <strong className="font-semibold">{DESCONTO} de desconto</strong> na primeira compra a partir de {MINIMO} · Código{" "}
          <strong className="font-semibold tracking-wide">{OFERTA.codigo}</strong>
        </span>
        <span className="hidden whitespace-nowrap underline underline-offset-2 md:inline">Ver oferta</span>
      </Link>
    </div>
  );
}

function CopyCode({ className }: { className?: string }) {
  const [copiado, setCopiado] = useState(false);
  async function copiar() {
    try {
      await navigator.clipboard.writeText(OFERTA.codigo);
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 2000);
    } catch {
      setCopiado(false);
    }
  }
  return (
    <button
      type="button"
      onClick={() => void copiar()}
      className={cn(
        "inline-flex h-9 items-center gap-2 rounded-lg border-2 border-dashed border-foam/70 bg-leaf-deep px-2.5 font-display text-base tracking-widest text-paper",
        className,
      )}
      aria-label={copiado ? `Código ${OFERTA.codigo} copiado` : `Copiar código ${OFERTA.codigo}`}
    >
      {OFERTA.codigo}
      <span className="flex items-center gap-1 font-sans text-xs font-semibold tracking-normal text-foam">
        {copiado ? <Check className="size-4" /> : <Copy className="size-4" />}
        {copiado ? "Copiado" : "Copiar"}
      </span>
    </button>
  );
}

/** Faixa compacta da oferta na página inicial (âncora #oferta usada pela faixa do topo). */
export function OfferCard() {
  return (
    <section id="oferta" className="mx-auto max-w-6xl scroll-mt-20 px-4 pt-4" aria-labelledby="oferta-titulo">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-fruit/30 bg-fruit/10 px-3 py-2.5 text-sm text-ink sm:flex-nowrap">
        <Gift className="size-5 shrink-0 text-fruit" aria-hidden="true" />
        <h2 id="oferta-titulo" className="min-w-0 flex-1 basis-56 leading-snug">
          <strong className="font-semibold">{DESCONTO} de desconto</strong> na 1.ª compra de {MINIMO} ou mais (novos clientes) · código{" "}
          <strong className="font-semibold tracking-wide text-fruit">{OFERTA.codigo}</strong>
          <span className="sr-only">. {PEQUENAS_LETRAS}</span>
        </h2>
        <div className="flex shrink-0 items-center gap-2">
          <CopyCode />
          <Link
            to="/categorias/$categoria"
            params={{ categoria: "frutas" }}
            className="inline-flex h-9 items-center rounded-lg bg-leaf px-3 text-xs font-semibold text-paper hover:bg-leaf-deep"
          >
            Ver frutas
          </Link>
        </div>
      </div>
    </section>
  );
}

/** Linha curta junto do preço / botão de compra. */
export function OfferLine({ className }: { className?: string }) {
  return (
    <p
      className={cn(
        "inline-flex items-start gap-2 rounded-lg border border-fruit/30 bg-fruit/10 px-3 py-2 text-sm text-ink",
        className,
      )}
    >
      <Gift className="mt-0.5 size-4 shrink-0 text-fruit" aria-hidden="true" />
      <span>
        <strong className="font-semibold">Novo cliente?</strong> −{DESCONTO} na primeira compra a partir de {MINIMO} (código{" "}
        <strong className="font-semibold tracking-wide text-fruit">{OFERTA.codigo}</strong>)
      </span>
    </p>
  );
}
