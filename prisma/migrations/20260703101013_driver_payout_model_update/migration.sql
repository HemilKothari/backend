/*
  Warnings:

  - A unique constraint covering the columns `[rickshawId,month,year]` on the table `DriverPayout` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `year` to the `DriverPayout` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `month` on the `DriverPayout` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "DriverPayout" ADD COLUMN     "year" INTEGER NOT NULL,
DROP COLUMN "month",
ADD COLUMN     "month" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "DriverPayout_rickshawId_month_year_key" ON "DriverPayout"("rickshawId", "month", "year");
