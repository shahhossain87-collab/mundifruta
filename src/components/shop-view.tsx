import { useState, type ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Link } from "@tanstack/react-router";
import { SlidersHorizontal } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { cn } from "@/lib/cn";
import {
  categorias,
  categoriaPorSlug,
  filtrarProdutos,
  searchFromQuery,
  subcategorias,
  type Product,
  type ShopQuery,
} from "@/lib/shop";

const ORDENS: { id: ShopQuery["ordem"]; label: string }[] = [
  { id: "relevancia", label: "Relevância" },
  { id: "preco-asc", label: "Preço: menor" },
  { id: "preco-desc", label: "Preço: maior" },
  { id: "az", label: "Nome A–Z" },
  { id: "za", label: "Nome Z–A" },
];

const BANDAS: { id: ShopQuery["preco"]; label: string }[] = [
  { id: "", label: "Todos os preços" },
  { id: "ate2", label: "Até 2 €" },
  { id: "2a5", label: "2 € a 5 €" },
  { id: "mais5", label: "Mais de 5 €" },
];

export function ShopView({
  title,
  intro,
  categoriaSlug,
  items,
  query,
  onChange,
}: {
  title: string;
  intro: string;
  categoriaSlug: string | null;
  items: Product[];
  query: ShopQuery;
  onChange: (query: ShopQuery) => void;
}) {
  const [filtros, setFiltros] = useState(false);
  const [ordenar, setOrdenar] = useState(false);
  const categoria = categoriaSlug ? categoriaPorSlug(categoriaSlug) : undefined;
  const subs = categoria ? (subcategorias[categoria.key] ?? []) : [];
  const lista = filtrarProdutos(items, query, categoriaSlug);
  const ativos = Boolean(query.q || query.sub || query.disp || query.promo || query.preco);

  function patch(partial: Partial<ShopQuery>) {
    onChange({ ...query, ...partial });
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6">
      <nav className="mb-3 text-sm text-muted" aria-label="Percurso">
        <Link to="/" className="hover:text-ink">
          Início
        </Link>
        <span aria-hidden="true"> / </span>
        <span>{title}</span>
      </nav>
      <h1 className="font-display text-4xl">{title}</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">{intro}</p>

      {subs.length ? (
        <div className="mt-4 flex flex-nowrap gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            aria-pressed={query.sub === ""}
            className={cn(
              "h-11 shrink-0 rounded-full border px-4 text-sm",
              query.sub === "" ? "border-leaf bg-leaf text-paper" : "border-line bg-card",
            )}
            onClick={() => patch({ sub: "" })}
          >
            Tudo
          </button>
          {subs.map((sub) => (
            <button
              key={sub.key}
              type="button"
              aria-pressed={query.sub === sub.key}
              className={cn(
                "h-11 shrink-0 rounded-full border px-4 text-sm",
                query.sub === sub.key ? "border-leaf bg-leaf text-paper" : "border-line bg-card",
              )}
              onClick={() => patch({ sub: query.sub === sub.key ? "" : sub.key })}
            >
              {sub.label}
            </button>
          ))}
        </div>
      ) : null}

      <div className="mt-5 grid gap-8 lg:grid-cols-[220px_1fr]">
        <aside className="hidden lg:block">
          <Filters categoriaSlug={categoriaSlug} query={query} onChange={patch} group="desk" />
        </aside>
        <div className="min-w-0">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <form
              className="flex-1"
              role="search"
              onSubmit={(event) => {
                event.preventDefault();
                const data = new FormData(event.currentTarget);
                patch({ q: String(data.get("q") || "") });
              }}
            >
              <label className="sr-only" htmlFor="catalogo-q">
                Pesquisar nesta lista
              </label>
              <input
                id="catalogo-q"
                name="q"
                defaultValue={query.q}
                key={query.q}
                placeholder="Pesquisar"
                className="h-11 w-full rounded-lg border border-line bg-card px-3"
              />
            </form>
            <p className="text-sm text-muted" aria-live="polite">
              {lista.length} {lista.length === 1 ? "produto" : "produtos"}
            </p>
            <label className="hidden items-center gap-2 text-sm lg:flex">
              <span className="sr-only">Ordenar</span>
              <select
                value={query.ordem}
                onChange={(event) => patch({ ordem: event.target.value as ShopQuery["ordem"] })}
                className="h-11 rounded-lg border border-line bg-card px-3"
              >
                {ORDENS.map((ordem) => (
                  <option key={ordem.id} value={ordem.id}>
                    {ordem.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 lg:hidden">
            <button
              type="button"
              className="h-11 rounded-lg border border-line bg-card text-sm font-semibold"
              onClick={() => setFiltros(true)}
            >
              <SlidersHorizontal className="mr-2 inline size-4" />
              Filtrar
            </button>
            <button
              type="button"
              className="h-11 rounded-lg border border-line bg-card text-sm font-semibold"
              onClick={() => setOrdenar(true)}
            >
              Ordenar
            </button>
          </div>
          {ativos ? (
            <button type="button" className="mt-3 text-sm font-semibold text-leaf" onClick={() => onChange({ ...query, q: "", sub: "", disp: false, promo: false, preco: "" })}>
              Limpar filtros
            </button>
          ) : null}
          {lista.length ? (
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
              {lista.map((produto, index) => (
                <ProductCard key={produto.id} product={produto} eager={index < 4} />
              ))}
            </div>
          ) : (
            <p className="mt-8 text-sm">Nenhum produto com estes filtros.</p>
          )}
        </div>
      </div>

      <Sheet open={filtros} onOpenChange={setFiltros} title="Filtrar">
        <Filters categoriaSlug={categoriaSlug} query={query} onChange={patch} group="mob" />
        <button type="button" className="mt-4 h-11 w-full rounded-lg bg-leaf text-sm font-semibold text-paper" onClick={() => setFiltros(false)}>
          Ver {lista.length} produtos
        </button>
      </Sheet>
      <Sheet open={ordenar} onOpenChange={setOrdenar} title="Ordenar">
        <fieldset className="space-y-2">
          {ORDENS.map((ordem) => (
            <label key={ordem.id} className="flex h-11 items-center gap-3 text-sm">
              <input
                type="radio"
                name="ordem"
                checked={query.ordem === ordem.id}
                onChange={() => {
                  patch({ ordem: ordem.id });
                  setOrdenar(false);
                }}
              />
              {ordem.label}
            </label>
          ))}
        </fieldset>
      </Sheet>
    </div>
  );
}

function Filters({
  categoriaSlug,
  query,
  onChange,
  group,
}: {
  categoriaSlug: string | null;
  query: ShopQuery;
  onChange: (partial: Partial<ShopQuery>) => void;
  group: string;
}) {
  return (
    <div className="space-y-6 text-sm">
      <fieldset>
        <legend className="mb-2 font-semibold">Categoria</legend>
        <ul className="space-y-1">
          <li>
            <Link
              to="/produtos"
              search={searchFromQuery({ ...query, sub: "" })}
              className={cn("flex h-11 items-center rounded-lg px-2", !categoriaSlug && "bg-foam font-semibold")}
            >
              Todos
            </Link>
          </li>
          {categorias.map((categoria) => (
            <li key={categoria.slug}>
              <Link
                to="/categorias/$categoria"
                params={{ categoria: categoria.slug }}
                search={searchFromQuery({ ...query, sub: "" })}
                className={cn(
                  "flex h-11 items-center rounded-lg px-2",
                  categoria.slug === categoriaSlug && "bg-foam font-semibold",
                )}
              >
                {categoria.label}
              </Link>
            </li>
          ))}
        </ul>
      </fieldset>
      <fieldset className="space-y-1">
        <legend className="mb-2 font-semibold">Disponibilidade</legend>
        <label className="flex h-11 items-center gap-3">
          <input type="checkbox" checked={query.disp} onChange={(event) => onChange({ disp: event.target.checked })} />
          Disponível
        </label>
        <label className="flex h-11 items-center gap-3">
          <input type="checkbox" checked={query.promo} onChange={(event) => onChange({ promo: event.target.checked })} />
          Em promoção
        </label>
      </fieldset>
      <fieldset>
        <legend className="mb-2 font-semibold">Preço</legend>
        {BANDAS.map((banda) => (
          <label key={banda.id || "todos"} className="flex h-11 items-center gap-3">
            <input
              type="radio"
              name={`preco-${group}`}
              checked={query.preco === banda.id}
              onChange={() => onChange({ preco: banda.id })}
            />
            {banda.label}
          </label>
        ))}
      </fieldset>
    </div>
  );
}

function Sheet({
  open,
  onOpenChange,
  title,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/40" />
        <Dialog.Content className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-auto rounded-t-2xl bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <Dialog.Title className="font-display text-2xl">{title}</Dialog.Title>
            <Dialog.Close className="h-11 px-2 text-sm">Fechar</Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
