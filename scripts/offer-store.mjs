/**
 * Server-only storage for MUNDI10 usage (Vercel Blob, private store).
 *
 * One blob per phone: `mundi10/<hmac>.json` = { last3, usedAt }.
 * <hmac> is HMAC-SHA-256(OFFER_PHONE_SALT, normalized phone) — the full number
 * is never stored. Without OFFER_PHONE_SALT or BLOB_READ_WRITE_TOKEN the store
 * reports "not configured" and callers fail open (offer behaves as before).
 *
 * Used by src/routes/api/oferta.ts and scripts/offer-list.mjs / offer-unmark.mjs.
 */
import { createHmac } from "node:crypto";
import { BlobNotFoundError, del, get, head, list, put } from "@vercel/blob";
import { lastThree } from "./offer-phone.mjs";

export const OFFER_PREFIX = "mundi10/";

/** @param {Record<string, string | undefined>} [env] */
export function offerStoreConfig(env = process.env) {
  const salt = env.OFFER_PHONE_SALT?.trim();
  const token = env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!salt || !token) return null;
  return { salt, token };
}

/**
 * @param {string} normalized
 * @param {string} salt
 */
export function phoneHash(normalized, salt) {
  return createHmac("sha256", salt).update(normalized).digest("hex");
}

/**
 * @param {string} normalized
 * @param {{ salt: string }} cfg
 */
export function offerPath(normalized, cfg) {
  return `${OFFER_PREFIX}${phoneHash(normalized, cfg.salt)}.json`;
}

/**
 * @param {string} normalized
 * @param {{ salt: string, token: string }} cfg
 * @param {AbortSignal} [abortSignal]
 * @returns {Promise<boolean>}
 */
export async function isOfferUsed(normalized, cfg, abortSignal) {
  try {
    await head(offerPath(normalized, cfg), { token: cfg.token, abortSignal });
    return true;
  } catch (err) {
    if (err instanceof BlobNotFoundError) return false;
    throw err;
  }
}

/**
 * @param {string} normalized
 * @param {{ salt: string, token: string }} cfg
 * @param {AbortSignal} [abortSignal]
 */
export async function markOfferUsed(normalized, cfg, abortSignal) {
  const body = JSON.stringify({ last3: lastThree(normalized), usedAt: new Date().toISOString() });
  await put(offerPath(normalized, cfg), body, {
    access: "private",
    token: cfg.token,
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
    abortSignal,
  });
}

/**
 * @param {string} normalized
 * @param {{ salt: string, token: string }} cfg
 * @returns {Promise<boolean>} whether an entry existed
 */
export async function unmarkOffer(normalized, cfg) {
  const existed = await isOfferUsed(normalized, cfg);
  if (existed) await del(offerPath(normalized, cfg), { token: cfg.token });
  return existed;
}

/**
 * @param {{ token: string }} cfg
 * @returns {Promise<Array<{ pathname: string, last3: string, usedAt: string }>>}
 */
export async function listOfferEntries(cfg) {
  /** @type {Array<{ pathname: string, last3: string, usedAt: string }>} */
  const out = [];
  /** @type {string | undefined} */
  let cursor;
  do {
    /** @type {import("@vercel/blob").ListBlobResult} */
    const page = await list({ prefix: OFFER_PREFIX, cursor, token: cfg.token });
    for (const blob of page.blobs) {
      let last3 = "???";
      let usedAt = blob.uploadedAt.toISOString();
      try {
        const res = await get(blob.pathname, { access: "private", token: cfg.token });
        if (res && res.stream) {
          const data = JSON.parse(await new Response(res.stream).text());
          last3 = String(data.last3 ?? last3);
          usedAt = String(data.usedAt ?? usedAt);
        }
      } catch {
        // keep defaults
      }
      out.push({ pathname: blob.pathname, last3, usedAt });
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return out.sort((a, b) => a.usedAt.localeCompare(b.usedAt));
}
