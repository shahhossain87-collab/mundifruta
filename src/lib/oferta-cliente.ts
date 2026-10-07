import { normalizePhone } from "../../scripts/offer-phone.mjs";

/** Result of the server-side MUNDI10 check. "desconhecido" = fail open. */
export type EstadoOferta = "livre" | "usada" | "registada" | "sem-oferta" | "invalido" | "desconhecido" | "limite";

export const normalizarTelefone = normalizePhone;

const CHAVE_SESSAO = "mf_oferta_registada";

/** Numbers this browser tab already registered: a re-send keeps the offer. */
export function registadoNesteDispositivo(telefone: string): boolean {
  try {
    const lista = JSON.parse(sessionStorage.getItem(CHAVE_SESSAO) || "[]") as string[];
    return lista.includes(telefone);
  } catch {
    return false;
  }
}

function marcarRegistado(telefone: string) {
  try {
    const lista = JSON.parse(sessionStorage.getItem(CHAVE_SESSAO) || "[]") as string[];
    if (!lista.includes(telefone)) lista.push(telefone);
    sessionStorage.setItem(CHAVE_SESSAO, JSON.stringify(lista.slice(-10)));
  } catch {
    // ignore
  }
}

async function pedir(corpo: Record<string, unknown>, timeoutMs: number): Promise<EstadoOferta> {
  try {
    const res = await fetch("/api/oferta", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(corpo),
      signal: AbortSignal.timeout(timeoutMs),
    });
    const data = (await res.json()) as { estado?: EstadoOferta };
    return data.estado ?? "desconhecido";
  } catch {
    return "desconhecido";
  }
}

/** Ask whether this phone already used MUNDI10. Never throws. */
export async function verificarOferta(telefone: string): Promise<EstadoOferta> {
  const normalizado = normalizePhone(telefone);
  if (!normalizado) return "invalido";
  if (registadoNesteDispositivo(normalizado)) return "livre";
  return pedir({ acao: "verificar", telefone: normalizado }, 5000);
}

/** Record the offer for this phone (server re-checks the ≥40€ cart). Never throws. */
export async function registarOferta(
  telefone: string,
  qty: Record<string, number>,
  timeoutMs = 5000,
): Promise<EstadoOferta> {
  const normalizado = normalizePhone(telefone);
  if (!normalizado) return "invalido";
  if (registadoNesteDispositivo(normalizado)) return "registada";
  const estado = await pedir({ acao: "registar", telefone: normalizado, qty }, timeoutMs);
  if (estado === "registada") marcarRegistado(normalizado);
  return estado;
}
