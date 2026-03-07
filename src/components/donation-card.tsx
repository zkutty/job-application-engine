"use client";

import { useMemo, useState } from "react";

import { DEFAULT_DONATION_AMOUNTS_CENTS } from "@/lib/billing/constants";

type DonationResponse = {
  checkoutUrl?: string;
  error?: string;
};

type PortalResponse = {
  portalUrl?: string;
  error?: string;
};

function formatUsd(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function DonationCard() {
  const directTestCheckoutUrl = process.env.NEXT_PUBLIC_STRIPE_DONATION_TEST_LINK?.trim() || null;
  const [isRedirectingAmount, setIsRedirectingAmount] = useState<number | null>(null);
  const [customAmountInput, setCustomAmountInput] = useState("10");
  const [isOpeningPortal, setIsOpeningPortal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const customAmountCents = useMemo(() => {
    const dollars = Number(customAmountInput);
    if (!Number.isFinite(dollars) || dollars <= 0) {
      return null;
    }

    return Math.round(dollars * 100);
  }, [customAmountInput]);

  async function startDonation(amountCents: number) {
    setError(null);
    setIsRedirectingAmount(amountCents);

    try {
      const response = await fetch("/api/billing/donate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amountCents }),
      });
      const payload = (await response.json()) as DonationResponse;

      if (!response.ok || !payload.checkoutUrl) {
        throw new Error(payload.error ?? "Unable to start donation checkout.");
      }

      window.location.href = payload.checkoutUrl;
    } catch (checkoutError) {
      const message = checkoutError instanceof Error ? checkoutError.message : "Unable to start donation checkout.";
      setError(message);
      setIsRedirectingAmount(null);
    }
  }

  async function openBillingPortal() {
    setError(null);
    setIsOpeningPortal(true);

    try {
      const response = await fetch("/api/billing/portal", {
        method: "POST",
      });
      const payload = (await response.json()) as PortalResponse;

      if (!response.ok || !payload.portalUrl) {
        throw new Error(payload.error ?? "Unable to open billing portal.");
      }

      window.location.href = payload.portalUrl;
    } catch (portalError) {
      const message = portalError instanceof Error ? portalError.message : "Unable to open billing portal.";
      setError(message);
      setIsOpeningPortal(false);
    }
  }

  return (
    <section className="card stack">
      <h2>Support Development</h2>
      <p className="small">
        One-time donations help fund maintenance while core generation stays free. Billing is Stripe-hosted.
      </p>
      {directTestCheckoutUrl ? (
        <>
          <p className="small">
            Test mode is enabled. Use the direct Stripe Checkout link to validate the donation flow quickly.
          </p>
          <button
            type="button"
            onClick={() => {
              window.location.href = directTestCheckoutUrl;
            }}
            disabled={isRedirectingAmount !== null || isOpeningPortal}
          >
            Donate $5 (Test Link)
          </button>
        </>
      ) : null}
      <div className="buttonRow">
        {DEFAULT_DONATION_AMOUNTS_CENTS.map((amount) => (
          <button
            key={amount}
            type="button"
            onClick={() => void startDonation(amount)}
            disabled={isRedirectingAmount !== null || isOpeningPortal}
          >
            {isRedirectingAmount === amount ? "Redirecting..." : `Donate ${formatUsd(amount)}`}
          </button>
        ))}
      </div>
      <label htmlFor="customDonationAmount">Custom donation (USD)</label>
      <div className="buttonRow">
        <input
          id="customDonationAmount"
          value={customAmountInput}
          onChange={(event) => setCustomAmountInput(event.target.value)}
          inputMode="decimal"
          placeholder="10"
        />
        <button
          type="button"
          onClick={() => {
            if (!customAmountCents) return;
            void startDonation(customAmountCents);
          }}
          disabled={customAmountCents === null || isRedirectingAmount !== null || isOpeningPortal}
        >
          {isRedirectingAmount !== null && customAmountCents === isRedirectingAmount
            ? "Redirecting..."
            : "Donate Custom"}
        </button>
      </div>
      <p className="small">Future subscriptions can be managed in Stripe Customer Portal after launch.</p>
      <button type="button" onClick={() => void openBillingPortal()} disabled={isOpeningPortal || isRedirectingAmount !== null}>
        {isOpeningPortal ? "Opening Portal..." : "Manage Billing"}
      </button>
      {error ? <p className="error">{error}</p> : null}
    </section>
  );
}
