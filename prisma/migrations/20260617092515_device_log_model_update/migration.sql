/*
  Warnings:

  - The primary key for the `DeviceLog` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "DeviceLog" DROP CONSTRAINT "DeviceLog_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "DeviceLog_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "DeviceLog_id_seq";
