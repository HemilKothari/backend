-- AlterTable
ALTER TABLE "Device" ADD COLUMN     "lastManifestSyncAt" TIMESTAMP(3),
ADD COLUMN     "lastManifestVersion" TEXT,
ADD COLUMN     "lastTelemetryAt" TIMESTAMP(3);
