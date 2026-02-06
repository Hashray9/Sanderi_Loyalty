-- CreateEnum
CREATE TYPE "StaffRole" AS ENUM ('ADMIN', 'EMPLOYEE');

-- CreateEnum
CREATE TYPE "CardStatus" AS ENUM ('UNASSIGNED', 'ACTIVE', 'BLOCKED');

-- CreateEnum
CREATE TYPE "BlockReason" AS ENUM ('LOST', 'STOLEN', 'FRAUD', 'OTHER');

-- CreateEnum
CREATE TYPE "PointCategory" AS ENUM ('HARDWARE', 'PLYWOOD');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('CREDIT', 'DEBIT', 'EXPIRY', 'VOID', 'TRANSFER');

-- CreateTable
CREATE TABLE "Franchisee" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Franchisee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Store" (
    "id" TEXT NOT NULL,
    "franchiseeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "hardwareConversionRate" INTEGER NOT NULL DEFAULT 100,
    "plywoodConversionRate" INTEGER NOT NULL DEFAULT 100,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Store_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Staff" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mobileNumber" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "StaffRole" NOT NULL DEFAULT 'EMPLOYEE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Card" (
    "cardUid" TEXT NOT NULL,
    "franchiseeId" TEXT NOT NULL,
    "status" "CardStatus" NOT NULL DEFAULT 'UNASSIGNED',
    "hardwarePoints" INTEGER NOT NULL DEFAULT 0,
    "plywoodPoints" INTEGER NOT NULL DEFAULT 0,
    "issuedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Card_pkey" PRIMARY KEY ("cardUid")
);

-- CreateTable
CREATE TABLE "CardHolder" (
    "id" TEXT NOT NULL,
    "cardUid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mobileNumber" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CardHolder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CardBlock" (
    "id" TEXT NOT NULL,
    "cardUid" TEXT NOT NULL,
    "reason" "BlockReason" NOT NULL,
    "blockedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CardBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PointEntry" (
    "id" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "cardUid" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "category" "PointCategory" NOT NULL,
    "transactionType" "TransactionType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "pointsDelta" INTEGER NOT NULL,
    "pointsRemaining" INTEGER,
    "expiresAt" TIMESTAMP(3),
    "voidedAt" TIMESTAMP(3),
    "voidedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PointEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MobileLookup" (
    "id" TEXT NOT NULL,
    "cardUid" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MobileLookup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcessedEntry" (
    "entryId" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProcessedEntry_pkey" PRIMARY KEY ("entryId")
);

-- CreateIndex
CREATE INDEX "Store_franchiseeId_idx" ON "Store"("franchiseeId");

-- CreateIndex
CREATE UNIQUE INDEX "Staff_mobileNumber_key" ON "Staff"("mobileNumber");

-- CreateIndex
CREATE INDEX "Staff_storeId_idx" ON "Staff"("storeId");

-- CreateIndex
CREATE INDEX "Staff_mobileNumber_idx" ON "Staff"("mobileNumber");

-- CreateIndex
CREATE INDEX "Card_franchiseeId_idx" ON "Card"("franchiseeId");

-- CreateIndex
CREATE INDEX "Card_status_idx" ON "Card"("status");

-- CreateIndex
CREATE UNIQUE INDEX "CardHolder_cardUid_key" ON "CardHolder"("cardUid");

-- CreateIndex
CREATE UNIQUE INDEX "CardHolder_mobileNumber_key" ON "CardHolder"("mobileNumber");

-- CreateIndex
CREATE INDEX "CardHolder_mobileNumber_idx" ON "CardHolder"("mobileNumber");

-- CreateIndex
CREATE INDEX "CardBlock_cardUid_idx" ON "CardBlock"("cardUid");

-- CreateIndex
CREATE UNIQUE INDEX "PointEntry_entryId_key" ON "PointEntry"("entryId");

-- CreateIndex
CREATE INDEX "PointEntry_cardUid_category_idx" ON "PointEntry"("cardUid", "category");

-- CreateIndex
CREATE INDEX "PointEntry_cardUid_expiresAt_idx" ON "PointEntry"("cardUid", "expiresAt");

-- CreateIndex
CREATE INDEX "PointEntry_entryId_idx" ON "PointEntry"("entryId");

-- CreateIndex
CREATE INDEX "PointEntry_createdAt_idx" ON "PointEntry"("createdAt");

-- CreateIndex
CREATE INDEX "MobileLookup_cardUid_month_idx" ON "MobileLookup"("cardUid", "month");

-- CreateIndex
CREATE INDEX "ProcessedEntry_processedAt_idx" ON "ProcessedEntry"("processedAt");

-- AddForeignKey
ALTER TABLE "Store" ADD CONSTRAINT "Store_franchiseeId_fkey" FOREIGN KEY ("franchiseeId") REFERENCES "Franchisee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Staff" ADD CONSTRAINT "Staff_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Card" ADD CONSTRAINT "Card_franchiseeId_fkey" FOREIGN KEY ("franchiseeId") REFERENCES "Franchisee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Card" ADD CONSTRAINT "Card_issuedById_fkey" FOREIGN KEY ("issuedById") REFERENCES "Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CardHolder" ADD CONSTRAINT "CardHolder_cardUid_fkey" FOREIGN KEY ("cardUid") REFERENCES "Card"("cardUid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointEntry" ADD CONSTRAINT "PointEntry_cardUid_fkey" FOREIGN KEY ("cardUid") REFERENCES "Card"("cardUid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointEntry" ADD CONSTRAINT "PointEntry_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointEntry" ADD CONSTRAINT "PointEntry_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MobileLookup" ADD CONSTRAINT "MobileLookup_cardUid_fkey" FOREIGN KEY ("cardUid") REFERENCES "Card"("cardUid") ON DELETE RESTRICT ON UPDATE CASCADE;
