#!/usr/bin/env node
/**
 * List numbers that already used MUNDI10 (only last 3 digits + date/time).
 *
 *   vercel env pull .env.offer --environment development
 *   node --env-file=.env.offer scripts/offer-list.mjs
 *   rm .env.offer
 */
import { listOfferEntries, offerStoreConfig } from "./offer-store.mjs";

const cfg = offerStoreConfig();
if (!cfg) {
  console.error("Faltam BLOB_READ_WRITE_TOKEN e/ou OFFER_PHONE_SALT no ambiente.");
  process.exit(2);
}
const entries = await listOfferEntries(cfg);
if (!entries.length) console.log("Nenhum número registado.");
for (const entry of entries) {
  const when = new Date(entry.usedAt).toLocaleString("pt-PT", { timeZone: "Europe/Lisbon" });
  console.log(`…${entry.last3}\t${when}`);
}
console.log(`Total: ${entries.length}`);
