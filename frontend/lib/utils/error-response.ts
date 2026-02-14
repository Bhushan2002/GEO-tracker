import { NextResponse } from "next/server";



// TYPE DEFINITIONS


export interface ErrorResponse {
  error: {
    message: string;
    code?: string;
    details?: any;
    statusCode: number;
    timestamp?: string;
    path?: string;
  };
}


export interface ErrorOptions {
  code?: string;
  details?: any;
  includeTimestamp?: boolean;
  includePath?: boolean;
  path?: string;
}


// HTTP STATUS CODES

export const HttpStatus = {
  // Success
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,

  // Client Errors
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,

  // Server Errors
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;

// ============================================================================
// ERROR CODE CONSTANTS
// ============================================================================

export const ErrorCode = {
  // Validation
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INVALID_INPUT: "INVALID_INPUT",
  MISSING_FIELD: "MISSING_FIELD",

  // Authentication & Authorization
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",

  // Resource Errors
  NOT_FOUND: "NOT_FOUND",
  ALREADY_EXISTS: "ALREADY_EXISTS",
  CONFLICT: "CONFLICT",

  // Business Logic
  OPERATION_FAILED: "OPERATION_FAILED",
  INVALID_ACTION: "INVALID_ACTION",
  QUOTA_EXCEEDED: "QUOTA_EXCEEDED",

  // System Errors
  INTERNAL_ERROR: "INTERNAL_ERROR",
  DATABASE_ERROR: "DATABASE_ERROR",
  EXTERNAL_API_ERROR: "EXTERNAL_API_ERROR",
  TIMEOUT: "TIMEOUT",
} as const;

// ============================================================================
// CORE ERROR RESPONSE FUNCTIONS
// ============================================================================

/**
 * Creates a standardized error response
 * 
 * @param message - Human-readable error message
 * @param statusCode - HTTP status code
 * @param options - Additional error options
 * @returns NextResponse with standardized error format
 * 
 * @example
 * ```typescript
 * return errorResponse("User not found", HttpStatus.NOT_FOUND, {
 *   code: ErrorCode.NOT_FOUND,
 *   details: { userId: "123" }
 * });
 * ```
 */
export function errorResponse(
  message: string,
  statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR,
  options: ErrorOptions = {}
): NextResponse<ErrorResponse> {
  const errorBody: ErrorResponse = {
    error: {
      message,
      statusCode,
      ...(options.code && { code: options.code }),
      ...(options.details && { details: options.details }),
      ...(options.includeTimestamp && { timestamp: new Date().toISOString() }),
      ...(options.includePath && options.path && { path: options.path }),
    },
  };

  return NextResponse.json(errorBody, { status: statusCode });
}

// ============================================================================
// CONVENIENCE ERROR FUNCTIONS
// ============================================================================

/**
 * 400 Bad Request - Invalid request data
 */
export function badRequest(
  message: string = "Bad request",
  options: Omit<ErrorOptions, "code"> = {}
): NextResponse<ErrorResponse> {
  return errorResponse(message, HttpStatus.BAD_REQUEST, {
    code: ErrorCode.INVALID_INPUT,
    ...options,
  });
}

/**
 * 401 Unauthorized - Authentication required
 */
export function unauthorized(
  message: string = "Authentication required",
  options: Omit<ErrorOptions, "code"> = {}
): NextResponse<ErrorResponse> {
  return errorResponse(message, HttpStatus.UNAUTHORIZED, {
    code: ErrorCode.UNAUTHORIZED,
    ...options,
  });
}

/**
 * 403 Forbidden - Insufficient permissions
 */
export function forbidden(
  message: string = "Insufficient permissions",
  options: Omit<ErrorOptions, "code"> = {}
): NextResponse<ErrorResponse> {
  return errorResponse(message, HttpStatus.FORBIDDEN, {
    code: ErrorCode.FORBIDDEN,
    ...options,
  });
}

/**
 * 404 Not Found - Resource doesn't exist
 */
export function notFound(
  message: string = "Resource not found",
  options: Omit<ErrorOptions, "code"> = {}
): NextResponse<ErrorResponse> {
  return errorResponse(message, HttpStatus.NOT_FOUND, {
    code: ErrorCode.NOT_FOUND,
    ...options,
  });
}

/**
 * 409 Conflict - Resource already exists or conflicts with another
 */
export function conflict(
  message: string = "Resource already exists",
  options: Omit<ErrorOptions, "code"> = {}
): NextResponse<ErrorResponse> {
  return errorResponse(message, HttpStatus.CONFLICT, {
    code: ErrorCode.ALREADY_EXISTS,
    ...options,
  });
}

/**
 * 422 Unprocessable Entity - Validation failed
 */
export function validationError(
  message: string = "Validation failed",
  details?: any
): NextResponse<ErrorResponse> {
  return errorResponse(message, HttpStatus.UNPROCESSABLE_ENTITY, {
    code: ErrorCode.VALIDATION_ERROR,
    details,
  });
}

/**
 * 500 Internal Server Error - Unexpected server error
 */
export function internalError(
  message: string = "Internal server error",
  details?: any
): NextResponse<ErrorResponse> {
  // In production, don't expose internal error details
  const safeDetails =
    process.env.NODE_ENV === "development" ? details : undefined;

  return errorResponse(message, HttpStatus.INTERNAL_SERVER_ERROR, {
    code: ErrorCode.INTERNAL_ERROR,
    details: safeDetails,
  });
}

/**
 * 503 Service Unavailable - Service temporarily unavailable
 */
export function serviceUnavailable(
  message: string = "Service temporarily unavailable",
  options: Omit<ErrorOptions, "code"> = {}
): NextResponse<ErrorResponse> {
  return errorResponse(message, HttpStatus.SERVICE_UNAVAILABLE, {
    code: ErrorCode.OPERATION_FAILED,
    ...options,
  });
}

// ============================================================================
// ZOD VALIDATION ERROR HANDLER
// ============================================================================

/**
 * Handles Zod validation errors with detailed field-level errors
 * 
 * @param zodError - Zod validation error object (from validateRequestBody)
 * @returns NextResponse with formatted validation errors
 * 
 * @example
 * ```typescript
 * const validation = validateRequestBody(schema, body);
 * if (!validation.success) {
 *   return handleValidationError(validation.error);
 * }
 * ```
 */
export function handleValidationError(
  zodError: { message: string; details?: any }
): NextResponse<ErrorResponse> {
  return validationError(zodError.message, zodError.details);
}

// ============================================================================
// WORKSPACE ERROR HANDLER
// ============================================================================

/**
 * Standard workspace context error
 * Used when workspace ID is missing from request cookies
 */
export function workspaceError(): NextResponse<ErrorResponse> {
  return forbidden("Workspace context not found", {
    details: {
      message:
        "No workspace ID found in request. Please select a workspace first.",
    },
  });
}

// ============================================================================
// DATABASE ERROR HANDLER
// ============================================================================

/**
 * Handles database-related errors with appropriate messages
 * 
 * @param error - Database error object
 * @param operation - Description of the database operation (e.g., "fetch users")
 * @returns NextResponse with formatted error
 */
export function databaseError(
  error: any,
  operation: string = "database operation"
): NextResponse<ErrorResponse> {
  console.error(`Database error during ${operation}:`, error);

  // Check for common MongoDB errors
  if (error.code === 11000) {
    return conflict("Resource already exists", {
      details:
        process.env.NODE_ENV === "development"
          ? { duplicateKey: error.keyValue }
          : undefined,
    });
  }

  if (error.name === "CastError") {
    return badRequest("Invalid ID format", {
      details:
        process.env.NODE_ENV === "development"
          ? { field: error.path, value: error.value }
          : undefined,
    });
  }

  if (error.name === "ValidationError") {
    return validationError("Database validation failed", {
      errors:
        process.env.NODE_ENV === "development" ? error.errors : undefined,
    });
  }

  // Generic database error
  return internalError(`Failed to ${operation}`, error);
}

// ============================================================================
// EXTERNAL API ERROR HANDLER
// ============================================================================

/**
 * Handles errors from external APIs (Google Analytics, Search Console, etc.)
 * 
 * @param error - External API error
 * @param service - Name of the external service
 * @returns NextResponse with formatted error
 */
export function externalApiError(
  error: any,
  service: string = "external service"
): NextResponse<ErrorResponse> {
  console.error(`External API error from ${service}:`, error);

  // Handle specific API error codes
  if (error.code === 401 || error.code === 403) {
    return unauthorized(`${service} authentication failed`, {
      details: {
        message:
          "Please reconnect your account or refresh your access token.",
      },
    });
  }

  if (error.code === 404) {
    return notFound(`Resource not found in ${service}`);
  }

  if (error.code === 429) {
    return errorResponse(
      `Rate limit exceeded for ${service}`,
      HttpStatus.TOO_MANY_REQUESTS,
      {
        code: ErrorCode.QUOTA_EXCEEDED,
        details: { message: "Please try again later." },
      }
    );
  }

  // Generic external API error
  return internalError(`Failed to communicate with ${service}`, {
    message:
      process.env.NODE_ENV === "development" ? error.message : undefined,
  });
}

// ============================================================================
// CATCH-ALL ERROR HANDLER
// ============================================================================

/**
 * Generic error handler for try-catch blocks
 * Determines the appropriate error response based on the error type
 * 
 * @param error - Any error object
 * @param context - Context description (e.g., "fetching brands")
 * @returns NextResponse with formatted error
 * 
 * @example
 * ```typescript
 * try {
 *   // API logic
 * } catch (error) {
 *   return handleError(error, "fetching brands");
 * }
 * ```
 */
export function handleError(
  error: any,
  context: string = "processing request"
): NextResponse<ErrorResponse> {
  console.error(`Error during ${context}:`, error);

  // If it's already an ErrorResponse, return it
  if (error instanceof NextResponse) {
    return error;
  }

  // Handle known error types
  if (error.name === "MongoError" || error.name === "MongoServerError") {
    return databaseError(error, context);
  }

  if (error.response?.status) {
    // External API error with HTTP response
    return externalApiError(error, context);
  }

  // Default to internal server error
  return internalError(`Failed to ${context}`, {
    message:
      process.env.NODE_ENV === "development"
        ? error.message || error.toString()
        : undefined,
  });
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Core functions
  errorResponse,
  handleError,
  handleValidationError,

  // HTTP errors
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  validationError,
  internalError,
  serviceUnavailable,

  // Specialized handlers
  workspaceError,
  databaseError,
  externalApiError,

  // Constants
  HttpStatus,
  ErrorCode,
};
