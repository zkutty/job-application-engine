import { NextResponse } from "next/server";
import { z } from "zod";

import { requireUserId } from "@/lib/auth/requireUser";
import { ensureBillingCustomerForUser } from "@/lib/billing/customer";
import { normalizeDonationAmountCents } from "@/lib/billing/constants";
import { prisma } from "@/lib/db/prisma";
import { getAppOrigin, getStripeClient } from "@/lib/stripe/server";

const DonateRequestSchema = z.object({
  amountCents: z.number().int().positive(),
});

export async function POST(request: Request) {
  const auth = await requireUserId(request);
  if (!auth.ok) return auth.response;

  try {
    const body = (await request.json()) as unknown;
    const parsed = DonateRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid donation request." },
        { status: 400 },
      );
    }

    const amountCents = normalizeDonationAmountCents(parsed.data.amountCents);
    const { customerId, stripeCustomerId } = await ensureBillingCustomerForUser(auth.userId);
    const stripe = getStripeClient();

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer: stripeCustomerId,
      submit_type: "donate",
      metadata: {
        kind: "donation",
        userId: String(auth.userId),
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: amountCents,
            product_data: {
              name: process.env.STRIPE_SUPPORT_DONATION_PRODUCT_NAME?.trim() || "Support Job Application Engine",
              description: "One-time donation to support ongoing development.",
            },
          },
        },
      ],
      success_url: `${getAppOrigin()}/engine?donation=success`,
      cancel_url: `${getAppOrigin()}/engine?donation=cancel`,
    });
    if (!session.url) {
      throw new Error("Stripe checkout did not return a redirect URL.");
    }

    await prisma.donationPayment.create({
      data: {
        userId: auth.userId,
        customerId,
        amountCents,
        currency: "usd",
        stripeCheckoutSessionId: session.id,
        status: "pending",
      },
    });

    return NextResponse.json({ checkoutUrl: session.url }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to start donation checkout.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
