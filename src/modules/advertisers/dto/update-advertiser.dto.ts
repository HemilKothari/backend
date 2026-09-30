// src/modules/advertisers/dto/update-advertiser.dto.ts

import { PartialType } from '@nestjs/mapped-types';
import { CreateAdvertiserDto } from './create-advertiser.dto';

export class UpdateAdvertiserDto extends PartialType(
  CreateAdvertiserDto,
) {}