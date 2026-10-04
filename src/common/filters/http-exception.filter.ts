import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'خطای غیرمنتظره در سرور رخ داده است.';
    let errors: any = null;

    let extraFields: Record<string, any> = {};

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        message = (res as any).message || message;
        errors = (res as any).errors || null;
        const { message: _m, errors: _e, statusCode: _s, ...rest } = res as any;
        extraFields = rest;
      }
    } else if (exception instanceof Error) {
      this.logger.error('Unhandled request error.', exception.stack);
    }

    response.status(status).json({
      statusCode: status,
      message,
      errors,
      ...extraFields,
      timestamp: new Date().toISOString(),
    });
  }
}
