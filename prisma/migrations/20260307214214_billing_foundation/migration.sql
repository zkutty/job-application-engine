-- CreateTable
CREATE TABLE "BillingCustomer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "stripeCustomerId" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    CONSTRAINT "BillingCustomer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BillingSubscription" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "stripeSubscriptionId" TEXT NOT NULL,
    "stripePriceId" TEXT,
    "status" TEXT NOT NULL,
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "currentPeriodEnd" DATETIME,
    "customerId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    CONSTRAINT "BillingSubscription_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "BillingCustomer" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BillingSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Entitlement" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "featureKey" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "expiresAt" DATETIME,
    "userId" INTEGER NOT NULL,
    CONSTRAINT "Entitlement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DonationPayment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "stripeCheckoutSessionId" TEXT NOT NULL,
    "stripePaymentIntentId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "customerId" INTEGER,
    "userId" INTEGER NOT NULL,
    CONSTRAINT "DonationPayment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "BillingCustomer" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "DonationPayment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "BillingCustomer_stripeCustomerId_key" ON "BillingCustomer"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "BillingCustomer_userId_key" ON "BillingCustomer"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "BillingSubscription_stripeSubscriptionId_key" ON "BillingSubscription"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "BillingSubscription_customerId_idx" ON "BillingSubscription"("customerId");

-- CreateIndex
CREATE INDEX "BillingSubscription_userId_status_idx" ON "BillingSubscription"("userId", "status");

-- CreateIndex
CREATE INDEX "Entitlement_featureKey_enabled_idx" ON "Entitlement"("featureKey", "enabled");

-- CreateIndex
CREATE UNIQUE INDEX "Entitlement_userId_featureKey_key" ON "Entitlement"("userId", "featureKey");

-- CreateIndex
CREATE UNIQUE INDEX "DonationPayment_stripeCheckoutSessionId_key" ON "DonationPayment"("stripeCheckoutSessionId");

-- CreateIndex
CREATE INDEX "DonationPayment_customerId_idx" ON "DonationPayment"("customerId");

-- CreateIndex
CREATE INDEX "DonationPayment_userId_createdAt_idx" ON "DonationPayment"("userId", "createdAt");
