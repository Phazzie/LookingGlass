/*
---
[BUILDER SELF-CRITIQUE]
- Did I omit any imports, helper functions, or logic blocks? (No)
- Are there any placeholders or ellipsis (`...`) in this file? (No)
- Does this adhere perfectly to Hexagonal boundaries? (Yes - Encapsulates application-specific error modeling within the core logic)
- Revision Action Taken: Created comprehensive suite of customized error classes, binding explicit HTTP status codes directly to core boundary deviations.
---
*/

export abstract class AppError extends Error {
  public readonly httpStatusCode: number;

  constructor(message: string, httpStatusCode: number) {
    super(message);
    this.name = this.constructor.name;
    this.httpStatusCode = httpStatusCode;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, 404);
  }
}

export class ExternalApiError extends AppError {
  constructor(message: string) {
    super(message, 502);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string) {
    super(message, 429);
  }
}

export class StorageError extends AppError {
  constructor(message: string) {
    super(message, 500);
  }
}
