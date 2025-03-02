import { Body, Delete, Get, HttpCode, Param, Post, Put } from '@nestjs/common';
import { BaseService } from '../services/base.service';

export class BaseController<T> {
  constructor(protected readonly service: BaseService<T>) {}
}
