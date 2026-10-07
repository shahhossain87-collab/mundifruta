#!/usr/bin/env node
/**
 * Remove a phone number from the MUNDI10 "already used" list, so it can use
 * the first-purchase offer again (e.g. an order that was never picked up).
 *
 *   vercel env pull .env.offer --environment development   # BLOB_READ_WRITE_TOKEN + OFFER_PHONE_SALT
 *   node --env-file=.env.offer scripts/offer-unmark.mjs "932 699 850"
 *   rm .env.offer
 */
import { normalizePhone } from "./offer-phone.mjs";
import { offerStoreConfig, unmarkOffer } from "./offer-store.mjs";

const input = process.argv.slice(2).join(" ");
const normalized = normalizePhone(input);
if (!normalized) {
  console.error(`Número inválido: "${input}"`);
  console.error('Uso: node --env-file=.env.offer scripts/offer-unmark.mjs "<telemóvel>"');
  process.exit(2);
}
const cfg = offerStoreConfig();
if (!cfg) {
  console.error("Faltam BLOB_READ_WRITE_TOKEN e/ou OFFER_PHONE_SALT no ambiente.");
  process.exit(2);
}
const existed = await unmarkOffer(normalized, cfg);
console.log(
  existed
    ? `Removido: …${normalized.slice(-3)} pode voltar a usar a oferta.`
    : `Não havia registo para …${normalized.slice(-3)}.`,
);
