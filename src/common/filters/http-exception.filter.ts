import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let errorMessage = exception.message || 'Internal server error';

    if (exception instanceof BadRequestException && exception.getResponse) {
      const exceptionResponse = exception.getResponse();

      if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse['message']
      ) {
        errorMessage = exceptionResponse['message'];
      }
    }

    const errorResponse = {
      status: HttpStatus[status],
      error: {
        timestamp: new Date().getTime(),
        message: errorMessage,
      },
    };

    response.status(status).json(errorResponse);
  }
}
