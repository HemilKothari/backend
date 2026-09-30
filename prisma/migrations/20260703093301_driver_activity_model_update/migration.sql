/*
  Warnings:

  - Made the column `startTime` on table `DriverActivity` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "DriverActivity" ALTER COLUMN "startTime" SET NOT NULL;
