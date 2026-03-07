const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";

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

export function resolveGoogleRedirectUri(request: Request): string {
  if (process.env.GOOGLE_REDIRECT_URI) {
    return process.env.GOOGLE_REDIRECT_URI;
  }

  const url = new URL(request.url);
  return `${url.origin}/api/auth/google/callback`;
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
