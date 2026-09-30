import {
  IsEnum,
  IsNotEmpty,
  IsString,
  ValidateIf,
} from 'class-validator';

import { VerificationStatus } from '@prisma/client';

export class VerifyDriverDocumentDto {
  @IsEnum(VerificationStatus)
  verificationStatus!: VerificationStatus;

  @ValidateIf(
    (o) =>
      o.verificationStatus === VerificationStatus.REJECTED,
  )
  @IsString()
  @IsNotEmpty()
  rejectionReason?: string;
}