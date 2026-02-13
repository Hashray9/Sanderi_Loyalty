-- AlterTable: Add column as nullable first
ALTER TABLE "CardHolder" ADD COLUMN "aadhaarNumber" TEXT;

-- Backfill existing rows with unique placeholder values
UPDATE "CardHolder" SET "aadhaarNumber" = 'LEGACY_' || "id" WHERE "aadhaarNumber" IS NULL;

-- Now make it NOT NULL
ALTER TABLE "CardHolder" ALTER COLUMN "aadhaarNumber" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "CardHolder_aadhaarNumber_key" ON "CardHolder"("aadhaarNumber");

-- CreateIndex
CREATE INDEX "CardHolder_aadhaarNumber_idx" ON "CardHolder"("aadhaarNumber" ASC);
