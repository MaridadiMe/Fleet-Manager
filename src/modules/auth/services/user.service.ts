import {
  Injectable,
  InternalServerErrorException,
  Logger,
  RequestMethod,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RestclientService } from 'src/modules/restclient/restclient.service';
import { User } from '../types/user.type';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  constructor(
    private readonly restClient: RestclientService,
    private readonly configService: ConfigService,
  ) {}

  async getUserById(userId: string): Promise<User> {
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
