import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();

    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;

    let message: string | string[] = 'Internal server error';

    // ==========================================
    // NESTJS HTTP EXCEPTIONS
    // ==========================================

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();

      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const responseBody = exceptionResponse as {
          message?: string | string[];
        };

        message = responseBody.message ?? 'Request failed';
      }
    }

    // ==========================================
    // PRISMA KNOWN ERRORS
    // ==========================================
    else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2002':
          statusCode = HttpStatus.CONFLICT;
          message = 'A record with this value already exists';
          break;

        case 'P2025':
          statusCode = HttpStatus.NOT_FOUND;
          message = 'Requested record was not found';
          break;

        case 'P2003':
          statusCode = HttpStatus.BAD_REQUEST;
          message = 'This operation violates an existing relationship';
          break;

        default:
          statusCode = HttpStatus.BAD_REQUEST;
          message = 'Database operation failed';
      }

      this.logger.error(
        `${request.method} ${request.path} - Prisma error ${exception.code}`,
        exception.stack,
      );
    }

    // ==========================================
    // UNKNOWN ERRORS
    // ==========================================
    else {
      this.logger.error(
        `${request.method} ${request.path} - ${
          exception instanceof Error ? exception.message : 'Unknown exception'
        }`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    // ==========================================
    // SANITIZED RESPONSE
    // ==========================================

    response.status(statusCode).json({
      success: false,
      statusCode,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
