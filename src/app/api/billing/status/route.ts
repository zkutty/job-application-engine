import { NextResponse } from "next/server";

import { requireUserId } from "@/lib/auth/requireUser";
import { SUPPORTER_ENTITLEMENT_KEY, PRO_ENTITLEMENT_KEY } from "@/lib/billing/constants";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: Request) {
  const auth = await requireUserId(request);
  if (!auth.ok) return auth.response;

  try {
    const [entitlements, lastDonation, totalDonated, succeededCount, pendingCount] = await Promise.all([
      prisma.entitlement.findMany({
        where: {
          userId: auth.userId,
          enabled: true,
          featureKey: {
            in: [SUPPORTER_ENTITLEMENT_KEY, PRO_ENTITLEMENT_KEY],
          },
        },
        select: {
          featureKey: true,
          expiresAt: true,
        },
      }),
      prisma.donationPayment.findFirst({
        where: {
          userId: auth.userId,
          status: "succeeded",
        },
        orderBy: {
          updatedAt: "desc",
        },
        select: {
          amountCents: true,
          currency: true,
          updatedAt: true,
        },
      }),
      prisma.donationPayment.aggregate({
        where: {
          userId: auth.userId,
          status: "succeeded",
        },
        _sum: {
          amountCents: true,
        },
      }),
      prisma.donationPayment.count({
        where: {
          userId: auth.userId,
          status: "succeeded",
        },
      }),
      prisma.donationPayment.count({
        where: {
          userId: auth.userId,
          status: "pending",
        },
      }),
    ]);

    const supporter = entitlements.some((item) => item.featureKey === SUPPORTER_ENTITLEMENT_KEY);
    const proAccess = entitlements.find((item) => item.featureKey === PRO_ENTITLEMENT_KEY);

    return NextResponse.json(
      {
        supporter,
        proAccess: Boolean(proAccess),
        proAccessExpiresAt: proAccess?.expiresAt ?? null,
        donation: {
          lifetimeDonatedCents: totalDonated._sum.amountCents ?? 0,
          successfulDonationCount: succeededCount,
          pendingDonationCount: pendingCount,
          lastDonation,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load billing status.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
