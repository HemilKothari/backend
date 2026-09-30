/*
  Warnings:

  - You are about to drop the column `name` on the `Driver` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[phone]` on the table `Driver` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `fullName` to the `Driver` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Driver` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Driver" DROP COLUMN "name",
ADD COLUMN     "aadhaarNumber" TEXT,
ADD COLUMN     "address" TEXT,
ADD COLUMN     "dateOfBirth" TIMESTAMP(3),
ADD COLUMN     "emergencyContact" TEXT,
ADD COLUMN     "fullName" TEXT NOT NULL,
ADD COLUMN     "gender" TEXT,
ADD COLUMN     "licenceExpiry" TIMESTAMP(3),
ADD COLUMN     "licenceNumber" TEXT,
ADD COLUMN     "panNumber" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Driver_phone_key" ON "Driver"("phone");
