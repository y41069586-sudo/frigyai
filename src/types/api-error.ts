/**
 * Standardized API error response format
 * All Supabase functions should return errors in this format
 */
export interface ApiError {
  code: string; // Machine-readable error code
  message: string; // German user-facing message
  details?: Record<string, any>; // Optional additional details for debugging
  status?: number; // HTTP status code
}

/**
 * Known error codes
 */
export const ERROR_CODES = {
  // Auth errors
  AUTH_REQUIRED: 'auth_required',
  INVALID_TOKEN: 'invalid_token',
  SESSION_EXPIRED: 'session_expired',
  
  // Quota errors
  PLAN_LIMIT_EXCEEDED: 'plan_limit_exceeded',
  SCAN_LIMIT_EXCEEDED: 'scan_limit_exceeded',
  RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
  
  // Input errors
  INVALID_INPUT: 'invalid_input',
  INVALID_EMAIL: 'invalid_email',
  INVALID_PASSWORD: 'invalid_password',
  FILE_TOO_LARGE: 'file_too_large',
  
  // Server errors
  AI_SERVICE_ERROR: 'ai_service_error',
  DATABASE_ERROR: 'database_error',
  STORAGE_ERROR: 'storage_error',
  PAYMENT_ERROR: 'payment_error',
  
  // Generic
  UNKNOWN_ERROR: 'unknown_error',
  TIMEOUT: 'timeout',
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];

/**
 * Error message mapping - German
 */
export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  [ERROR_CODES.AUTH_REQUIRED]: 'Authentifizierung erforderlich',
  [ERROR_CODES.INVALID_TOKEN]: 'Deine Session ist ungültig',
  [ERROR_CODES.SESSION_EXPIRED]: 'Deine Session ist abgelaufen. Bitte melde dich neu an.',
  
  [ERROR_CODES.PLAN_LIMIT_EXCEEDED]: 'Du hast dein wöchentliches Limit erreicht. Upgrade auf Premium für unbegrenzte Nutzung!',
  [ERROR_CODES.SCAN_LIMIT_EXCEEDED]: 'Du hast dein wöchentliches Scan-Limit erreicht. Warte bis nächste Woche oder upgrade auf Premium.',
  [ERROR_CODES.RATE_LIMIT_EXCEEDED]: 'Zu viele Anfragen. Warte bitte kurz und versuche es erneut.',
  
  [ERROR_CODES.INVALID_INPUT]: 'Ungültige Eingabe. Bitte überprüfe deine Daten.',
  [ERROR_CODES.INVALID_EMAIL]: 'Ungültige E-Mail-Adresse.',
  [ERROR_CODES.INVALID_PASSWORD]: 'Passwort muss mindestens 8 Zeichen lang sein.',
  [ERROR_CODES.FILE_TOO_LARGE]: 'Datei ist zu groß. Maximal 5MB erlaubt.',
  
  [ERROR_CODES.AI_SERVICE_ERROR]: 'KI-Service ist derzeit nicht verfügbar. Versuche es später erneut.',
  [ERROR_CODES.DATABASE_ERROR]: 'Datenbankfehler. Versuche es später erneut.',
  [ERROR_CODES.STORAGE_ERROR]: 'Speicherfehler. Versuche es später erneut.',
  [ERROR_CODES.PAYMENT_ERROR]: 'Zahlungsfehler. Bitte überprüfe deine Zahlungsinformationen.',
  
  [ERROR_CODES.UNKNOWN_ERROR]: 'Ein Fehler ist aufgetreten. Versuche es später erneut.',
  [ERROR_CODES.TIMEOUT]: 'Anfrage hat zu lange gedauert. Versuche es erneut.',
};
