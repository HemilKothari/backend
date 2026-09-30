/*
  Warnings:

  - Added the required column `deductionAmount` to the `DriverPayout` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "DriverPayout" ADD COLUMN     "deductionAmount" DOUBLE PRECISION NOT NULL;
