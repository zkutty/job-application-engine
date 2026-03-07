import test from "node:test";
import assert from "node:assert/strict";

import { createSignedGoogleOAuthState, validateSignedGoogleOAuthState } from "../src/lib/auth/google.ts";

const originalStateSecret = process.env.GOOGLE_OAUTH_STATE_SECRET;
const originalClientId = process.env.GOOGLE_CLIENT_ID;
const originalClientSecret = process.env.GOOGLE_CLIENT_SECRET;

test("signed Google OAuth state validates within ttl", () => {
  process.env.GOOGLE_OAUTH_STATE_SECRET = "test-oauth-state-secret";

  const now = Date.now();
  const state = createSignedGoogleOAuthState(now);

  assert.equal(validateSignedGoogleOAuthState(state, now + 30_000), true);
});

test("signed Google OAuth state rejects tampering and expiry", () => {
  process.env.GOOGLE_OAUTH_STATE_SECRET = "test-oauth-state-secret";

  const now = Date.now();
  const state = createSignedGoogleOAuthState(now);
  const tampered = `${state.slice(0, -1)}${state.endsWith("A") ? "B" : "A"}`;

  assert.equal(validateSignedGoogleOAuthState(tampered, now + 30_000), false);
  assert.equal(validateSignedGoogleOAuthState(state, now + 11 * 60_000), false);
});

test("signed Google OAuth state can fall back to GOOGLE_CLIENT_SECRET", () => {
  delete process.env.GOOGLE_OAUTH_STATE_SECRET;
  process.env.GOOGLE_CLIENT_ID = "client-id";
  process.env.GOOGLE_CLIENT_SECRET = "client-secret";

  const now = Date.now();
  const state = createSignedGoogleOAuthState(now);

  assert.equal(validateSignedGoogleOAuthState(state, now + 10_000), true);
});

test.after(() => {
  if (originalStateSecret === undefined) {
    delete process.env.GOOGLE_OAUTH_STATE_SECRET;
  } else {
    process.env.GOOGLE_OAUTH_STATE_SECRET = originalStateSecret;
  }

  if (originalClientId === undefined) {
    delete process.env.GOOGLE_CLIENT_ID;
  } else {
    process.env.GOOGLE_CLIENT_ID = originalClientId;
  }

  if (originalClientSecret === undefined) {
    delete process.env.GOOGLE_CLIENT_SECRET;
  } else {
    process.env.GOOGLE_CLIENT_SECRET = originalClientSecret;
  }
});
