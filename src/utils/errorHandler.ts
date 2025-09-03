import { toast } from 'sonner';
import { ERROR_MESSAGES } from './constants';

export interface AppError extends Error {
  code?: string;
  status?: number;
  details?: any;
}

export class ErrorHandler {
  static handle(error: AppError | Error, context?: string) {
    console.error(`Error in ${context || 'application'}:`, error);

    // Determine error type and show appropriate message
    let message = ERROR_MESSAGES.server;

    if (error.message.includes('network') || error.message.includes('fetch')) {
      message = ERROR_MESSAGES.network;
    } else if (error.message.includes('unauthorized') || (error as AppError).status === 401) {
      message = ERROR_MESSAGES.unauthorized;
    } else if (error.message.includes('forbidden') || (error as AppError).status === 403) {
      message = ERROR_MESSAGES.forbidden;
    } else if (error.message.includes('not found') || (error as AppError).status === 404) {
      message = ERROR_MESSAGES.notFound;
    } else if (error.message.includes('validation') || (error as AppError).status === 400) {
      message = ERROR_MESSAGES.validation;
    } else if (error.message.includes('timeout')) {
      message = ERROR_MESSAGES.timeout;
    } else if (!navigator.onLine) {
      message = ERROR_MESSAGES.offline;
    }

    toast.error(message);
    
    // Log to external service in production
    if (import.meta.env.PROD) {
      this.logToService(error, context);
    }
  }

  static logToService(error: AppError | Error, context?: string) {
    // In production, you would send this to a logging service like Sentry
    const errorData = {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // Example: Send to logging service
    // fetch('/api/log-error', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(errorData)
    // });

    console.log('Error logged:', errorData);
  }

  static async withErrorHandling<T>(
    operation: () => Promise<T>,
    context?: string
  ): Promise<T | null> {
    try {
      return await operation();
    } catch (error) {
      this.handle(error as AppError, context);
      return null;
    }
  }
}

// Utility function for async operations with error handling
export const safeAsync = <T>(
  operation: () => Promise<T>,
  context?: string
) => ErrorHandler.withErrorHandling(operation, context);