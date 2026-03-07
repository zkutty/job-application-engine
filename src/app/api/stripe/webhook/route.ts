import { NextResponse } from "next/server";
import Stripe from "stripe";

import { isActiveSubscriptionStatus, PRO_ENTITLEMENT_KEY, SUPPORTER_ENTITLEMENT_KEY } from "@/lib/billing/constants";
import { prisma } from "@/lib/db/prisma";
import { getStripeClient, getWebhookSecret } from "@/lib/stripe/server";

function toDateFromUnix(timestampSeconds: number | null | undefined): Date | null {
  if (!timestampSeconds) {
    return null;
  }

  return new Date(timestampSeconds * 1000);
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session): Promise<void> {
  if (session.mode !== "payment") {
    return;
  }

  const sessionId = session.id;
  const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : null;

  await prisma.donationPayment.updateMany({
    where: { stripeCheckoutSessionId: sessionId },
    data: {
      status: "succeeded",
      stripePaymentIntentId: paymentIntentId,
    },
  });

  const userIdFromMetadata = Number(session.metadata?.userId ?? NaN);
  if (Number.isInteger(userIdFromMetadata) && userIdFromMetadata > 0) {
    await prisma.entitlement.upsert({
      where: {
        userId_featureKey: {
          userId: userIdFromMetadata,
          featureKey: SUPPORTER_ENTITLEMENT_KEY,
        },
      },
      update: {
        enabled: true,
        source: "donation",
      },
      create: {
        userId: userIdFromMetadata,
        featureKey: SUPPORTER_ENTITLEMENT_KEY,
        enabled: true,
        source: "donation",
      },
    });
  }
}

async function handleSubscriptionEvent(subscription: Stripe.Subscription): Promise<void> {
  const stripeCustomerId =
    typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;

  const billingCustomer = await prisma.billingCustomer.findUnique({
    where: { stripeCustomerId },
    select: { id: true, userId: true },
  });

  if (!billingCustomer) {
    return;
  }

  const primaryItem = subscription.items.data[0];
  const stripePriceId = primaryItem?.price?.id ?? null;
  const status = subscription.status;
  const currentPeriodEnd = toDateFromUnix(primaryItem?.current_period_end);
  const cancelAtPeriodEnd = subscription.cancel_at_period_end;

  await prisma.billingSubscription.upsert({
    where: { stripeSubscriptionId: subscription.id },
    update: {
      stripePriceId,
      status,
      currentPeriodEnd,
      cancelAtPeriodEnd,
      customerId: billingCustomer.id,
      userId: billingCustomer.userId,
    },
    create: {
      stripeSubscriptionId: subscription.id,
      stripePriceId,
      status,
      currentPeriodEnd,
      cancelAtPeriodEnd,
      customerId: billingCustomer.id,
      userId: billingCustomer.userId,
    },
  });

  await prisma.entitlement.upsert({
    where: {
      userId_featureKey: {
        userId: billingCustomer.userId,
        featureKey: PRO_ENTITLEMENT_KEY,
      },
    },
    update: {
      enabled: isActiveSubscriptionStatus(status),
      source: "subscription",
      expiresAt: currentPeriodEnd,
    },
    create: {
      userId: billingCustomer.userId,
      featureKey: PRO_ENTITLEMENT_KEY,
      enabled: isActiveSubscriptionStatus(status),
      source: "subscription",
      expiresAt: currentPeriodEnd,
    },
  });
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature header." }, { status: 400 });
  }

  const body = await request.text();

  try {
    const stripe = getStripeClient();
    const event = stripe.webhooks.constructEvent(body, signature, getWebhookSecret());

    switch (event.type) {
      case "checkout.session.completed": {
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        await handleSubscriptionEvent(event.data.object as Stripe.Subscription);
        break;
      }
      default:
        break;
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Stripe webhook processing failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
