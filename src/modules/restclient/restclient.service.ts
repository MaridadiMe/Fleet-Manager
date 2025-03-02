import { HttpService } from '@nestjs/axios';
import {
  Injectable,
  InternalServerErrorException,
  Logger,
  RequestMethod,
} from '@nestjs/common';
import { AxiosError } from 'axios';
import { catchError, firstValueFrom, throwError } from 'rxjs';

@Injectable()
export class RestclientService {
  private readonly logger = new Logger(RestclientService.name);
  constructor(private readonly httpService: HttpService) {}

  async request({
    url,
    method,
    payload,
    headers,
    logPayload = true,
    params,
  }: {
    url: string;
    method: RequestMethod;
    payload?: Record<string | number, any>;
    headers?: Record<string, any>;
    logPayload?: boolean;
    params?: any;
  }): Promise<unknown> {
    const now = Date.now();
    const getClient = () => {
      if (method === RequestMethod.POST) {
        return this.httpService.post(url, payload, { headers, params });
      }
      if (method === RequestMethod.PUT) {
        return this.httpService.put(url, payload, { headers, params });
      }
      if (method === RequestMethod.PATCH) {
        return this.httpService.patch(url, payload, { headers, params });
      }
      if (method === RequestMethod.DELETE) {
        return this.httpService.delete(url);
      }
      return this.httpService.get(url, { headers, params });
    };
    let stringifiedPayload = '';

    if (payload && logPayload === true) {
      stringifiedPayload = JSON.stringify({
        ...payload,
      });
    }
    this.logger.debug(
      `[36mOutgoingRequestUrl = [37m ${method} ${url} [36mPayload = [37m${stringifiedPayload}`,
    );
    const { data }: any = await firstValueFrom(
      getClient().pipe(
        catchError((error: AxiosError) => this.handleHttpError(error)),
      ),
    );
    this.logger.debug(`[36mResponse = [37m${JSON.stringify(data)}`);
    this.logger.debug(
      `finished executing request [36mResponseTime = [37m${Date.now() - now}ms`,
    );
    return data;
  }

  private handleHttpError(error: AxiosError) {
    const apiResponse = error.response?.data;
    this.logger.error(`${error.message} : \n ${JSON.stringify(apiResponse)}`);
    return throwError(
      () => new InternalServerErrorException(`${error.message}`),
    );
  }
}
