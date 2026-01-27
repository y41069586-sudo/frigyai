import { ApiError, ERROR_CODES, ERROR_MESSAGES, ErrorCode } from '@/types/api-error';

/**
 * Type guard to check if error is an object with code property
 */
const isApiErrorObject = (error: unknown): error is Record<string, unknown> & { code: unknown } => {
  return error !== null && typeof error === 'object' && 'code' in error;
};

/**
 * Parse error response from Supabase function
 */
export const parseApiError = (error: unknown): ApiError => {
  // If it's already an ApiError object
  if (error && typeof error === 'object' && 'code' in error) {
    return {
      code: error.code,
      message: error.message || ERROR_MESSAGES[error.code as ErrorCode] || ERROR_MESSAGES[ERROR_CODES.UNKNOWN_ERROR],
      details: error.details,
      status: error.status,
    };
  }

  // If it's a string message
  if (typeof error === 'string') {
    return {
      code: ERROR_CODES.UNKNOWN_ERROR,
      message: error,
    };
  }

  // If it's an Error object
  if (error instanceof Error) {
    return {
      code: ERROR_CODES.UNKNOWN_ERROR,
      message: error.message || ERROR_MESSAGES[ERROR_CODES.UNKNOWN_ERROR],
    };
  }

  // Check for Supabase function error format
  if (error && typeof error === 'object') {
    const code = (error as any).code || (error as any).errorCode;
    const message = (error as any).message || (error as any).msg;
    
    if (code) {
      return {
        code,
        message: message || ERROR_MESSAGES[code as ErrorCode] || ERROR_MESSAGES[ERROR_CODES.UNKNOWN_ERROR],
        details: (error as any).details,
        status: (error as any).status,
      };
    }
  }

  // Fallback
  return {
    code: ERROR_CODES.UNKNOWN_ERROR,
    message: ERROR_MESSAGES[ERROR_CODES.UNKNOWN_ERROR],
  };
};

/**
 * Get user-friendly error message
 */
export const getErrorMessage = (error: any): string => {
  const parsed = parseApiError(error);
  return parsed.message;
};

/**
 * Get error code
 */
export const getErrorCode = (error: any): ErrorCode => {
  const parsed = parseApiError(error);
  return parsed.code as ErrorCode;
};

/**
 * Check if error is due to quota/limit exceeded
 */
export const isQuotaError = (error: any): boolean => {
  const code = getErrorCode(error);
  return code === ERROR_CODES.PLAN_LIMIT_EXCEEDED || 
         code === ERROR_CODES.SCAN_LIMIT_EXCEEDED ||
         code === ERROR_CODES.RATE_LIMIT_EXCEEDED;
};

/**
 * Check if error is due to auth
 */
export const isAuthError = (error: any): boolean => {
  const code = getErrorCode(error);
  return code === ERROR_CODES.AUTH_REQUIRED || 
         code === ERROR_CODES.INVALID_TOKEN ||
         code === ERROR_CODES.SESSION_EXPIRED;
};

/**
 * Handle function invoke error and return parsed ApiError
 */
export const handleFunctionError = (
  error: any,
  defaultMessage: string = ERROR_MESSAGES[ERROR_CODES.UNKNOWN_ERROR]
): ApiError => {
  // Supabase function error structure
  if (error && typeof error === 'object' && 'error' in error) {
    const innerError = (error as any).error;
    
    // If inner error is already an ApiError
    if (innerError && typeof innerError === 'object' && 'code' in innerError) {
      return parseApiError(innerError);
    }
    
    // If inner error is a string
    if (typeof innerError === 'string') {
      try {
        const parsed = JSON.parse(innerError);
        return parseApiError(parsed);
      } catch {
        return parseApiError(innerError);
      }
    }
    
    return parseApiError(innerError);
  }

  return parseApiError(error);
};
