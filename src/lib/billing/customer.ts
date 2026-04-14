import { prisma } from "@/lib/db/prisma";
import { getStripeClient } from "@/lib/stripe/server";

export async function ensureBillingCustomerForUser(userId: string): Promise<{
  customerId: number;
  stripeCustomerId: string;
}> {
  const existing = await prisma.billingCustomer.findUnique({
    where: { userId },
    select: { id: true, stripeCustomerId: true },
  });

  if (existing) {
    return { customerId: existing.id, stripeCustomerId: existing.stripeCustomerId };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });

  if (!user) {
    throw new Error("User account not found.");
  }

  const stripe = getStripeClient();
  const stripeCustomer = await stripe.customers.create({
    email: user.email,
    metadata: {
      userId: String(userId),
    },
  });

  const created = await prisma.billingCustomer
    .create({
      data: {
        userId,
        stripeCustomerId: stripeCustomer.id,
      },
      select: { id: true, stripeCustomerId: true },
    })
    .catch(async () => {
      const concurrent = await prisma.billingCustomer.findUnique({
        where: { userId },
        select: { id: true, stripeCustomerId: true },
      });

      if (!concurrent) {
        throw new Error("Unable to create billing customer.");
      }

      return concurrent;
    });

  return { customerId: created.id, stripeCustomerId: created.stripeCustomerId };
}
