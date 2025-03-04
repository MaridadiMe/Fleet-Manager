import {
  Injectable,
  InternalServerErrorException,
  Logger,
  RequestMethod,
} from '@nestjs/common';
import { BaseRepository } from 'src/common/repositories/base.repository';
import { Driver } from '../entities/driver.entity';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { User } from 'src/modules/auth/types/user.type';
import { RestclientService } from 'src/modules/restclient/restclient.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DriverRepository extends BaseRepository<Driver> {
  private readonly logger = new Logger(DriverRepository.name);
  constructor(
    @InjectDataSource() dataSource: DataSource,
    private readonly restClient: RestclientService,
    private readonly configService: ConfigService,
  ) {
    super(dataSource, Driver);
  }

  async getUser(userId: string): Promise<User> {
    try {
      const token = `Bearer ${this.configService.get('IAM_TOKEN')}`;
      const iamUrl = this.configService.get('IAM_BASE_URL');

      const { data } = (await this.restClient.request({
        url: `${iamUrl}/users/${userId}`,
        method: RequestMethod.GET,
        headers: { Authorization: token },
      })) as any;
      return data as User;
    } catch (error) {
      this.logger.error(`Error While Fetching User: ${error}`);
      throw new InternalServerErrorException(`Error Fetching User Details`);
    }
  }
}
