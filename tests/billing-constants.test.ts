import assert from "node:assert/strict";
import test from "node:test";

import {
  isActiveSubscriptionStatus,
  normalizeDonationAmountCents,
} from "../src/lib/billing/constants.ts";

test("normalizeDonationAmountCents allows valid rounded values", () => {
  assert.equal(normalizeDonationAmountCents(499.6), 500);
  assert.equal(normalizeDonationAmountCents(20000), 20000);
});

test("normalizeDonationAmountCents rejects out-of-range values", () => {
  assert.throws(() => normalizeDonationAmountCents(99), /between/);
  assert.throws(() => normalizeDonationAmountCents(20001), /between/);
});

test("isActiveSubscriptionStatus returns true only for active-like states", () => {
  assert.equal(isActiveSubscriptionStatus("active"), true);
  assert.equal(isActiveSubscriptionStatus("trialing"), true);
  assert.equal(isActiveSubscriptionStatus("canceled"), false);
  assert.equal(isActiveSubscriptionStatus("past_due"), false);
});
