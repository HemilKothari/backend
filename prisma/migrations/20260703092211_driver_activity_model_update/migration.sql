/*
  Warnings:

  - You are about to drop the column `date` on the `DriverActivity` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "DriverActivity_rickshawId_date_key";

-- AlterTable
ALTER TABLE "DriverActivity" DROP COLUMN "date";
