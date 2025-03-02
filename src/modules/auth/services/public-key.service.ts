import {
  Injectable,
  Logger,
  OnModuleInit,
  RequestMethod,
} from '@nestjs/common';
import { RestclientService } from 'src/modules/restclient/restclient.service';

@Injectable()
export class PublicKeyService {
  private publicKey: string;

  private readonly redisClient: any;
  private readonly logger = new Logger(PublicKeyService.name);

  constructor(private readonly restClient: RestclientService) {}

  async getPublicKey(): Promise<string> {
    if (!this.publicKey) {
      this.publicKey = await this.getPublicKeyFromIamServer();
    }
    return this.publicKey;
  }

  async getPublicKeyFromIamServer(): Promise<string> {
    try {
      //   const iamBaseUrl = 'http://localhost:4000';
      return (await this.restClient.request({
        url: 'http://localhost:4000/api/v1/iam/auth/public-key',
        method: RequestMethod.GET,
      })) as string;
    } catch (error) {
      this.logger.error(`Error fetching public key: ${error}`);
    }
  }
}
