/*
  Warnings:

  - Added the required column `lastPlayback` to the `CampaignReport` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CampaignReport" ADD COLUMN     "lastPlayback" TIMESTAMP(3) NOT NULL;
