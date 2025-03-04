import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateDriverDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  licenceNumber: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  nationalIdNumber: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  userId: string;
}
