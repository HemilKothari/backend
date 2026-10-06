import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength
} from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

export class CreateAdvertiserDto {
  @ApiProperty({
    example: 'AdOnTheGo',
  })
  @IsString()
  @IsNotEmpty()
  companyName!: string;

  @ApiProperty({
    example: 'Hemil Kothari',
  })
  @IsString()
  @IsNotEmpty()
  contactName!: string;

  @ApiProperty({
    example: 'Hemil Kothari',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    example: 'hemil@example.com',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: '9876543210',
  })
  @IsString()
  @IsNotEmpty()
  phone!: string;

  @ApiProperty({
    example: 'StrongPassword123!',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password!: string;
}