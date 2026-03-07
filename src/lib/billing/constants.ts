export const DEFAULT_DONATION_AMOUNTS_CENTS = [500, 1500, 3000] as const;

export const MIN_CUSTOM_DONATION_CENTS = 100;
export const MAX_CUSTOM_DONATION_CENTS = 20000;

export const PRO_ENTITLEMENT_KEY = "pro_access";
export const SUPPORTER_ENTITLEMENT_KEY = "supporter";

export function normalizeDonationAmountCents(amountCents: number): number {
  if (!Number.isFinite(amountCents)) {
    throw new Error("Donation amount is invalid.");
  }

  const rounded = Math.round(amountCents);
  if (rounded < MIN_CUSTOM_DONATION_CENTS || rounded > MAX_CUSTOM_DONATION_CENTS) {
    throw new Error(
      `Donation amount must be between ${MIN_CUSTOM_DONATION_CENTS} and ${MAX_CUSTOM_DONATION_CENTS} cents.`,
    );
  }

  return rounded;
}

export function isActiveSubscriptionStatus(status: string): boolean {
  return status === "active" || status === "trialing";
}
