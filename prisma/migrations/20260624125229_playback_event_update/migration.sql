-- AlterTable
ALTER TABLE "PlaybackEvent" ADD COLUMN     "playlistItemId" TEXT;

-- AddForeignKey
ALTER TABLE "PlaybackEvent" ADD CONSTRAINT "PlaybackEvent_playlistItemId_fkey" FOREIGN KEY ("playlistItemId") REFERENCES "PlaylistItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
