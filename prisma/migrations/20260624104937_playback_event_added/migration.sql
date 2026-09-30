-- CreateTable
CREATE TABLE "PlaybackEvent" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "playlistId" TEXT,
    "playedAt" TIMESTAMP(3) NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlaybackEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlaybackEvent_campaignId_idx" ON "PlaybackEvent"("campaignId");

-- CreateIndex
CREATE INDEX "PlaybackEvent_deviceId_idx" ON "PlaybackEvent"("deviceId");

-- CreateIndex
CREATE INDEX "PlaybackEvent_playedAt_idx" ON "PlaybackEvent"("playedAt");

-- AddForeignKey
ALTER TABLE "PlaybackEvent" ADD CONSTRAINT "PlaybackEvent_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaybackEvent" ADD CONSTRAINT "PlaybackEvent_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaybackEvent" ADD CONSTRAINT "PlaybackEvent_playlistId_fkey" FOREIGN KEY ("playlistId") REFERENCES "Playlist"("id") ON DELETE SET NULL ON UPDATE CASCADE;
