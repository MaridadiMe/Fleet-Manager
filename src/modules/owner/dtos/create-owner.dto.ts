import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateOwnerDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  nationalIdNumber: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  userId: string;
}
