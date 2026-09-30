/*
  Warnings:

  - You are about to drop the column `url` on the `MediaAsset` table. All the data in the column will be lost.
  - Added the required column `originalFileName` to the `MediaAsset` table without a default value. This is not possible if the table is not empty.
  - Added the required column `publicUrl` to the `MediaAsset` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "MediaAsset" DROP COLUMN "url",
ADD COLUMN     "originalFileName" TEXT NOT NULL,
ADD COLUMN     "publicUrl" TEXT NOT NULL;
