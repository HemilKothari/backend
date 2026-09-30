/*
  Warnings:

  - You are about to drop the column `email` on the `Advertiser` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `Advertiser` table. All the data in the column will be lost.
  - Added the required column `phone` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'VIEWER';

-- DropIndex
DROP INDEX "Advertiser_email_key";

-- AlterTable
ALTER TABLE "Advertiser" DROP COLUMN "email",
DROP COLUMN "phone";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "phone" TEXT NOT NULL;
