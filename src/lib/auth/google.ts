import crypto from "node:crypto";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";
const GOOGLE_STATE_TTL_SECONDS = 60 * 10;

export type GoogleProfile = {
  sub: string;
  email: string;
  email_verified?: boolean;
};

function requireGoogleEnv(): { clientId: string; clientSecret: string } {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth is not configured.");
  }

  return { clientId, clientSecret };
}

function encodeBase64Url(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function decodeBase64Url(value: string): string | null {
  try {
    return Buffer.from(value, "base64url").toString("utf8");
  } catch {
    return null;
  }
}

function stateSigningSecret(): string {
  const explicitSecret = process.env.GOOGLE_OAUTH_STATE_SECRET;
  if (explicitSecret && explicitSecret.trim()) {
    return explicitSecret.trim();
  }

  const { clientSecret } = requireGoogleEnv();
  return clientSecret;
}

function signStatePayload(payload: string): string {
  return crypto.createHmac("sha256", stateSigningSecret()).update(payload).digest("base64url");
}

export function createSignedGoogleOAuthState(now = Date.now()): string {
  const nonce = crypto.randomBytes(16).toString("hex");
  const issuedAtSeconds = Math.floor(now / 1000);
  const payload = `${nonce}.${issuedAtSeconds}`;
  const encodedPayload = encodeBase64Url(payload);
  const signature = signStatePayload(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function validateSignedGoogleOAuthState(state: string, now = Date.now()): boolean {
  const [encodedPayload, signature] = state.split(".");
  if (!encodedPayload || !signature) {
    return false;
  }

  const expectedSignature = signStatePayload(encodedPayload);
  const providedBuffer = Buffer.from(signature, "utf8");
  const expectedBuffer = Buffer.from(expectedSignature, "utf8");
  if (
    providedBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    return false;
  }

  const payload = decodeBase64Url(encodedPayload);
  if (!payload) {
    return false;
  }

  const [nonce, issuedAtRaw] = payload.split(".");
  if (!nonce || !/^[a-f0-9]{32}$/i.test(nonce) || !issuedAtRaw) {
    return false;
  }

  const issuedAtSeconds = Number(issuedAtRaw);
  if (!Number.isFinite(issuedAtSeconds)) {
    return false;
  }

  const nowSeconds = Math.floor(now / 1000);
  if (issuedAtSeconds > nowSeconds + 60) {
    return false;
  }

  return nowSeconds - issuedAtSeconds <= GOOGLE_STATE_TTL_SECONDS;
}

export function resolvePublicOrigin(request: Request): string {
  const explicitOrigin =
    process.env.APP_ORIGIN ?? process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? process.env.SITE_URL;
  if (explicitOrigin) {
    return explicitOrigin.replace(/\/+$/, "");
  }

  const forwardedProto = request.headers.get("x-forwarded-proto");
  const forwardedHost = request.headers.get("x-forwarded-host");
  if (forwardedProto && forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  return new URL(request.url).origin;
}

export function resolveGoogleRedirectUri(request: Request): string {
  if (process.env.GOOGLE_REDIRECT_URI) {
    return process.env.GOOGLE_REDIRECT_URI;
  }

  return `${resolvePublicOrigin(request)}/api/auth/google/callback`;
}

export function buildGoogleAuthUrl(request: Request, state: string): string {
  const { clientId } = requireGoogleEnv();
  const redirectUri = resolveGoogleRedirectUri(request);

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    include_granted_scopes: "true",
    prompt: "select_account",
    state,
  });

  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export async function exchangeCodeForAccessToken(request: Request, code: string): Promise<string> {
  const { clientId, clientSecret } = requireGoogleEnv();
  const redirectUri = resolveGoogleRedirectUri(request);

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to exchange Google authorization code.");
  }

  const payload = (await response.json()) as { access_token?: string };
  if (!payload.access_token) {
    throw new Error("Google token response did not include an access token.");
  }

  return payload.access_token;
}

export async function fetchGoogleProfile(accessToken: string): Promise<GoogleProfile> {
  const response = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch Google user profile.");
  }

  const payload = (await response.json()) as GoogleProfile;
  if (!payload.sub || !payload.email) {
    throw new Error("Google user profile is missing required fields.");
  }

  return payload;
}
