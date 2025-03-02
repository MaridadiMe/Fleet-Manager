import {
  ArgumentsHost,
  BadRequestException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { HttpExceptionFilter } from './http-exception.filter';

describe('HttpExceptionFilter', () => {
  let httpExceptionFilter: HttpExceptionFilter;
  let mockResponse: Partial<Response>;
  let mockHost: ArgumentsHost;

  beforeEach(() => {
    httpExceptionFilter = new HttpExceptionFilter();
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: () => mockResponse,
      }),
    } as unknown as ArgumentsHost;
  });

  it('should handle HttpException and format the response correctly', () => {
    const exception = new HttpException(
      'Custom error message',
      HttpStatus.BAD_REQUEST,
    );
    const expectedStatus = HttpStatus.BAD_REQUEST;
    const expectedError = {
      status: 'BAD_REQUEST',
      error: {
        timestamp: expect.any(Number),
        message: 'Custom error message',
      },
    };

    httpExceptionFilter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(expectedStatus);
    expect(mockResponse.json).toHaveBeenCalledWith(expectedError);
  });

  it('should handle BadRequestException and return validation errors', () => {
    const validationMessage = [
      'id must be an integer',
      'name should not be empty',
    ];
    const exception = new BadRequestException({
      message: validationMessage,
    });

    const expectedStatus = HttpStatus.BAD_REQUEST;
    const expectedError = {
      status: 'BAD_REQUEST',
      error: {
        timestamp: expect.any(Number),
        message: validationMessage, // Expecting validation error messages array
      },
    };

    httpExceptionFilter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(expectedStatus);
    expect(mockResponse.json).toHaveBeenCalledWith(expectedError);
  });

  it('should handle generic errors and return INTERNAL_SERVER_ERROR', () => {
    const exception = new Error('Something went wrong');
    const expectedStatus = HttpStatus.INTERNAL_SERVER_ERROR;
    const expectedError = {
      status: 'INTERNAL_SERVER_ERROR',
      error: {
        timestamp: expect.any(Number),
        message: 'Something went wrong',
      },
    };

    httpExceptionFilter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(expectedStatus);
    expect(mockResponse.json).toHaveBeenCalledWith(expectedError);
  });

  it('should return "Internal server error" if exception message is undefined', () => {
    const exception = { message: undefined };
    const expectedStatus = HttpStatus.INTERNAL_SERVER_ERROR;
    const expectedError = {
      status: 'INTERNAL_SERVER_ERROR',
      error: {
        timestamp: expect.any(Number),
        message: 'Internal server error',
      },
    };

    httpExceptionFilter.catch(exception as any, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(expectedStatus);
    expect(mockResponse.json).toHaveBeenCalledWith(expectedError);
  });
});
