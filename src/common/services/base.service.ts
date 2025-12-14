import { FindManyOptions, FindOptionsWhere } from 'typeorm';
import { BaseRepository } from '../repositories/base.repository';
import { Page } from '../pagination/page.interface';

export class BaseService<T> {
  constructor(protected readonly repository: BaseRepository<T>) {}

  protected async findAll(): Promise<T[]> {
    return this.repository.find();
  }

  protected async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  protected async findPaged(
    filters: FindOptionsWhere<T>,
    page = 1,
    limit = 10,
    options?: Omit<FindManyOptions<T>, 'where' | 'skip' | 'take'>,
  ): Promise<Page<T>> {
    const skip = (page - 1) * limit;

    const [items, totalItems] = await this.repository.findAndCount({
      where: filters,
      skip,
      take: limit,
      ...options,
    });

    return {
      items,
      meta: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
      },
    };
  }
}
