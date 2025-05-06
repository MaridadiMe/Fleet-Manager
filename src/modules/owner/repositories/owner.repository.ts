import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/repositories/base.repository';
import { Owner } from '../entities/owner.entity';
import { InjectDataSource } from '@nestjs/typeorm/dist';
import { DataSource } from 'typeorm';

@Injectable()
export class OwnerRepository extends BaseRepository<Owner> {
  constructor(@InjectDataSource() dataSource: DataSource) {
    super(dataSource, Owner);
  }
}
