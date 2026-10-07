import { createFileRoute } from "@tanstack/react-router";

/**
 * MUNDI10 first-purchase check (POST only, JSON).
 *
 *   { acao: "verificar", telefone }        -> { estado: "livre" | "usada" | ... }
 *   { acao: "registar", telefone, qty }    -> { estado: "registada" | "usada" | "sem-oferta" | ... }
 *
 * "desconhecido" means storage is not configured / unreachable: the client
 * then keeps the old behaviour (offer indicated, confirmed in the shop).
 */
type Estado = "livre" | "usada" | "registada" | "sem-oferta" | "invalido" | "desconhecido" | "limite";

const JANELA_MS = 10 * 60 * 1000;
const MAX_POR_JANELA = 30;
const pedidos = new Map<string, { inicio: number; n: number }>();

function limitar(ip: string): boolean {
  const agora = Date.now();
  if (pedidos.size > 5000) {
    for (const [chave, valor] of pedidos) if (agora - valor.inicio > JANELA_MS) pedidos.delete(chave);
  }
  const atual = pedidos.get(ip);
  if (!atual || agora - atual.inicio > JANELA_MS) {
    pedidos.set(ip, { inicio: agora, n: 1 });
    return false;
  }
  atual.n += 1;
  return atual.n > MAX_POR_JANELA;
}

function responder(estado: Estado, status = 200) {
  return new Response(JSON.stringify({ estado }), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-robots-tag": "noindex",
    },
  });
}

function lerQty(valor: unknown): Record<string, number> | null {
  if (!valor || typeof valor !== "object" || Array.isArray(valor)) return null;
  const entradas = Object.entries(valor as Record<string, unknown>);
  if (entradas.length > 200) return null;
  const qty: Record<string, number> = {};
  for (const [id, n] of entradas) {
    if (id.length > 64 || typeof n !== "number" || !Number.isInteger(n) || n < 1 || n > 999) return null;
    qty[id] = n;
  }
  return qty;
}

export const Route = createFileRoute("/api/oferta")({
  server: {
    handlers: {
      GET: async () => responder("invalido", 405),
      POST: async ({ request }) => {
        const ip =
          request.headers.get("x-real-ip") ||
          request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
          "local";
        if (limitar(ip)) return responder("limite", 429);

        const texto = await request.text();
        if (texto.length > 8000) return responder("invalido", 413);
        let corpo: { acao?: unknown; telefone?: unknown; qty?: unknown };
        try {
          corpo = JSON.parse(texto);
        } catch {
          return responder("invalido", 400);
        }

        const { normalizePhone } = await import("../../../scripts/offer-phone.mjs");
        const telefone = normalizePhone(corpo.telefone);
        if (!telefone) return responder("invalido", 400);
        if (corpo.acao !== "verificar" && corpo.acao !== "registar") return responder("invalido", 400);

        let qty: Record<string, number> | null = null;
        if (corpo.acao === "registar") {
          qty = lerQty(corpo.qty);
          if (!qty) return responder("invalido", 400);
          const { porId, totaisDe } = await import("@/lib/shop");
          const linhas = Object.entries(qty)
            .map(([id, qtd]) => {
              const produto = porId(id);
              return produto ? { produto, qtd } : null;
            })
            .filter((linha): linha is NonNullable<typeof linha> => Boolean(linha));
          if (!totaisDe(linhas).oferta) return responder("sem-oferta");
        }

        const store = await import("../../../scripts/offer-store.mjs");
        const cfg = store.offerStoreConfig();
        if (!cfg) return responder("desconhecido");
        const abortSignal = AbortSignal.timeout(4000);
        try {
          const usada = await store.isOfferUsed(telefone, cfg, abortSignal);
          if (usada) return responder("usada");
          if (corpo.acao === "verificar") return responder("livre");
          await store.markOfferUsed(telefone, cfg, abortSignal);
          return responder("registada");
        } catch (err) {
          console.error("[oferta] storage error", err instanceof Error ? err.name : err);
          return responder("desconhecido");
        }
      },
    },
  },
});
