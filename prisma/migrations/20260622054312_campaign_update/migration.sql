/*
  Warnings:

  - Made the column `durationSeconds` on table `Campaign` required. This step will fail if there are existing NULL values in that column.
  - Made the column `fileUrl` on table `Campaign` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Campaign" ALTER COLUMN "durationSeconds" SET NOT NULL,
ALTER COLUMN "durationSeconds" SET DEFAULT 1,
ALTER COLUMN "fileUrl" SET NOT NULL;
