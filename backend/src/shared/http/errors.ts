export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly field: string | null;

  constructor(statusCode: number, code: string, message: string, field: string | null = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.field = field;
  }
}

export interface ErrorResponseBody {
  error: {
    code: string;
    message: string;
    field: string | null;
  };
}

export function toErrorResponseBody(error: AppError): ErrorResponseBody {
  return {
    error: {
      code: error.code,
      message: error.message,
      field: error.field,
    },
  };
}
