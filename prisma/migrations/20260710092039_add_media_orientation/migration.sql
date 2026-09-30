/*
  Warnings:

  - Added the required column `orientation` to the `MediaAsset` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "MediaOrientation" AS ENUM ('UNDEFINED', 'LANDSCAPE', 'PORTRAIT', 'SQUARE');

-- AlterTable
ALTER TABLE "MediaAsset" ADD COLUMN     "orientation" "MediaOrientation" NOT NULL;
