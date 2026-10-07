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
        "inline-flex h-11 items-center gap-2 rounded-lg border-2 border-dashed border-foam/70 bg-leaf-deep px-3 font-display text-lg tracking-widest text-paper",
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

/** Cartão compacto da oferta na página inicial. */
export function OfferCard() {
  return (
    <section id="oferta" className="mx-auto max-w-6xl scroll-mt-20 px-4 pt-4" aria-labelledby="oferta-titulo">
      <div className="rounded-xl bg-leaf text-paper shadow-sm">
        <div className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-3 p-4 lg:grid-cols-[auto_1fr_auto] lg:gap-x-6">
          <p
            className="grid size-[4.5rem] shrink-0 place-items-center rounded-full bg-fruit text-center font-display leading-none shadow-md ring-4 ring-paper/20 sm:size-24"
            aria-hidden="true"
          >
            <span>
              <span className="block text-2xl sm:text-4xl">−{DESCONTO}</span>
              <span className="mt-0.5 block font-sans text-[0.55rem] font-semibold uppercase tracking-[0.12em] sm:text-[0.65rem]">
                desconto
              </span>
            </span>
          </p>
          <div className="min-w-0">
            <h2 id="oferta-titulo" className="font-display text-xl leading-tight sm:text-3xl">
              {OFERTA.titulo}
            </h2>
            <p className="mt-0.5 text-sm font-semibold sm:mt-1 sm:text-lg">
              {DESCONTO} de desconto na sua primeira compra de {MINIMO} ou mais
            </p>
            <p className="mt-1 hidden text-xs text-foam sm:block">{PEQUENAS_LETRAS}</p>
          </div>
          <div className="col-span-2 flex flex-wrap items-center gap-2 lg:col-span-1 lg:grid lg:w-72 lg:grid-cols-2">
            <CopyCode className="lg:col-span-2 lg:justify-between" />
            <Link
              to="/categorias/$categoria"
              params={{ categoria: "frutas" }}
              className="inline-flex h-11 items-center justify-center rounded-lg bg-paper px-4 text-sm font-semibold text-leaf-deep hover:bg-card"
            >
              Ver frutas
            </Link>
            <Link
              to="/produtos"
              className="hidden h-11 items-center justify-center rounded-lg border border-paper/60 px-3 text-sm font-semibold whitespace-nowrap text-paper hover:bg-leaf-deep sm:inline-flex"
            >
              Fazer encomenda
            </Link>
          </div>
          <p className="col-span-2 text-xs text-foam sm:hidden">{PEQUENAS_LETRAS}</p>
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
