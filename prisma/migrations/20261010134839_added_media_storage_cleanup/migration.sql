-- CreateEnum
CREATE TYPE "MediaCleanupStatus" AS ENUM ('PENDING', 'COMPLETED');

-- CreateTable
CREATE TABLE "MediaStorageCleanup" (
    "id" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "requestedByUserId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "MediaCleanupStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "MediaStorageCleanup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MediaStorageCleanup_storageKey_key" ON "MediaStorageCleanup"("storageKey");

-- CreateIndex
CREATE INDEX "MediaStorageCleanup_status_createdAt_idx" ON "MediaStorageCleanup"("status", "createdAt");
