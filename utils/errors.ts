// @utils/errors.ts
export class ErrorWithStatus extends Error {
  public readonly status: number;
  public readonly details?: unknown;
  public readonly code?: string;
  public readonly timestamp: Date;

  constructor(
    message: string,
    status: number = 500,
    options?: {
      code?: string;
      details?: unknown;
      cause?: Error;
    }
  ) {
    super(message, { cause: options?.cause });

    this.name = 'ErrorWithStatus';
    this.status = status;
    this.code = options?.code;
    this.details = options?.details;
    this.timestamp = new Date();

    // Maintenir le stack trace pour le debugging
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ErrorWithStatus);
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      status: this.status,
      code: this.code,
      timestamp: this.timestamp,
      ...(process.env.NODE_ENV !== 'production' && {
        details: this.details,
        stack: this.stack,
        cause: this.cause
      })
    };
  }
}

// Extension optionnelle pour des erreurs spécifiques
export class NotFoundError extends ErrorWithStatus {
  constructor(message: string = 'Resource not found') {
    super(message, 404, { code: 'NOT_FOUND' });
  }
}

export class ValidationError extends ErrorWithStatus {
  constructor(message: string = 'Validation failed', details?: unknown) {
    super(message, 400, {
      code: 'VALIDATION_ERROR',
      details
    });
  }
}