import { NextResponse } from "next/server";

import { requireUserId } from "@/lib/auth/requireUser";
import { ensureBillingCustomerForUser } from "@/lib/billing/customer";
import { getAppOrigin, getStripeClient } from "@/lib/stripe/server";

export async function POST(request: Request) {
  const auth = await requireUserId(request);
  if (!auth.ok) return auth.response;

  try {
    const { stripeCustomerId } = await ensureBillingCustomerForUser(auth.userId);
    const stripe = getStripeClient();

    const portal = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${getAppOrigin()}/engine`,
    });

    return NextResponse.json({ portalUrl: portal.url }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to open billing portal.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
