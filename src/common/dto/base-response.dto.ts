import { HttpStatus } from '@nestjs/common';

export class BaseResponseDto<T> {
  status: number;
  data: T;

  constructor(data: any, status: number = HttpStatus.OK) {
    this.status = status;
    this.data = data;
  }
}
