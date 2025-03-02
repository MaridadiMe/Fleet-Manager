import { BaseRepository } from '../repositories/base.repository';

export class BaseService<T> {
  constructor(protected readonly repository: BaseRepository<T>) {}

  async findAll(): Promise<T[]> {
    return this.repository.find();
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
