import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus
} from "@nestjs/common";

@Catch()
export class GlobalErrorFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // In production, only expose messages from HttpExceptions (validation errors,
    // 401, 404, etc.). Raw Error messages from internal code are hidden so that
    // stack traces and schema details are never sent to clients.
    const isProd = process.env.NODE_ENV === "production";
    const message =
      exception instanceof HttpException
        ? exception.message
        : isProd
          ? "Internal server error"
          : exception instanceof Error
            ? exception.message
            : "Unexpected error";

    response.status(status).json({
      error: {
        message,
        status
      }
    });
  }
}
