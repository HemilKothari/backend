/*
  Warnings:

  - You are about to drop the column `fullName` on the `Driver` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `Driver` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Driver_phone_key";

-- AlterTable
ALTER TABLE "Driver" DROP COLUMN "fullName",
DROP COLUMN "phone";
