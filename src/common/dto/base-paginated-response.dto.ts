import { HttpStatus } from '@nestjs/common';

export class BasePaginatedResponseDto<T> {
  data: T;
  meta: any;

  constructor(data: any, meta: any) {
    this.data = data;
    this.meta = meta;
  }
}
