import { Module } from '@nestjs/common';
import { RickshawsService } from './rickshaws.service';
import { RickshawsController } from './rickshaws.controller';

@Module({
  providers: [RickshawsService],
  controllers: [RickshawsController]
})
export class RickshawModule {}
