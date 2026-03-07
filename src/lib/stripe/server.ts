import Stripe from "stripe";

let stripeClient: Stripe | null = null;

function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function getStripeClient(): Stripe {
  if (stripeClient) {
    return stripeClient;
  }

  stripeClient = new Stripe(getRequiredEnv("STRIPE_SECRET_KEY"));
  return stripeClient;
}

export function getWebhookSecret(): string {
  return getRequiredEnv("STRIPE_WEBHOOK_SECRET");
}

export function getAppOrigin(): string {
  const explicitOrigin = process.env.APP_ORIGIN?.trim();
  if (explicitOrigin) {
    return explicitOrigin;
  }

  if (process.env.NODE_ENV !== "production") {
    return "http://localhost:3000";
  }

  throw new Error("APP_ORIGIN is required in production.");
}
