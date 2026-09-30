import { Module } from '@nestjs/common';
import { DriverDocumentsService } from './driver-documents.service';
import { DriverDocumentsController } from './driver-documents.controller';

@Module({
  providers: [DriverDocumentsService],
  controllers: [DriverDocumentsController]
})
export class DriverDocumentsModule {}
