import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizePhone } from "./offer-phone.mjs";

test("Portuguese formats normalize to the same number", () => {
  for (const v of ["932 699 850", "932-699-850", "(932) 699 850", "+351932699850", "+351 932 699 850", "00351 932699850", "351932699850"]) {
    assert.equal(normalizePhone(v), "+351932699850", v);
  }
});

test("other country codes are kept as given", () => {
  assert.equal(normalizePhone("+44 7700 900123"), "+447700900123");
  assert.equal(normalizePhone("0044 7700 900123"), "+447700900123");
  assert.equal(normalizePhone("+55 11 91234-5678"), "+5511912345678");
});

test("invalid input is rejected", () => {
  for (const v of ["", "abc", "1234", "93269985", "+1234567890123456", "x".repeat(50), null, 123]) {
    assert.equal(normalizePhone(v), null, String(v));
  }
});
