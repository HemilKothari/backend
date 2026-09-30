import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateDeviceDto {
  @ApiPropertyOptional({
    example: 'HW-SN-123456',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  serialNumber?: string;

  @ApiPropertyOptional({
    example: '919876543210',
  })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  simNumber?: string;
}