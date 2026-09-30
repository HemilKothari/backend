/*
  Warnings:

  - A unique constraint covering the columns `[checksum]` on the table `MediaAsset` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "MediaAsset_checksum_key" ON "MediaAsset"("checksum");
