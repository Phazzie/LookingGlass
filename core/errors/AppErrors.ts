export abstract class AppError extends Error {
  abstract readonly httpStatusCode: number;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class ValidationError extends AppError {
  readonly httpStatusCode = 400;
}

export class NotFoundError extends AppError {
  readonly httpStatusCode = 404;
}

export class RateLimitError extends AppError {
  readonly httpStatusCode = 429;
}

export class ExternalApiError extends AppError {
  readonly httpStatusCode = 502;
}

export class StorageError extends AppError {
  readonly httpStatusCode = 500;
}
