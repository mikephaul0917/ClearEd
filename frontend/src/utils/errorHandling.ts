/**
 * Error handling utilities for the E-Clearance application
 * Provides consistent error handling patterns across the app
 */

import { formatErrorForDisplay } from './errorMessages';

/**
 * Standard error handler for API calls
 * Returns user-friendly error message and logs technical details
 */
export const handleApiError = (error: any, context?: string) => {
  // Log technical details for debugging
  console.error(`API Error${context ? ` in ${context}` : ''}:`, {
    message: error.message,
    status: error.response?.status,
    data: error.response?.data,
    config: error.config
  });

  // Return user-friendly error
  return formatErrorForDisplay(error);
};

/**
 * Error boundary fallback component message
 */
export const getErrorBoundaryMessage = () => {
  return {
    title: "Something unexpected happened",
    message: "The application encountered an error and couldn't continue.",
    nextStep: "Please refresh the page. If the problem continues, contact support.",
    technical: "Check browser console for technical details."
  };
};

/**
 * Network error detection
 */
export const isNetworkError = (error: any) => {
  return !error.response && (
    error.message?.includes('Network Error') ||
    error.message?.includes('ERR_INTERNET_DISCONNECTED') ||
    error.code === 'NETWORK_ERROR'
  );
};

/**
 * Authentication error detection
 */
export const isAuthError = (error: any) => {
  const status = error.response?.status;
  return status === 401 || status === 403;
};

/**
 * Server error detection
 */
export const isServerError = (error: any) => {
  const status = error.response?.status;
  return status >= 500;
};

/**
 * Validation error detection
 */
export const isValidationError = (error: any) => {
  const status = error.response?.status;
  return status === 400 || status === 422;
};

/**
 * Retry configuration for different error types
 */
export const getRetryConfig = (error: any) => {
  if (isNetworkError(error)) {
    return { shouldRetry: true, maxRetries: 3, delay: 1000 };
  }
  
  if (isServerError(error)) {
    return { shouldRetry: true, maxRetries: 2, delay: 2000 };
  }
  
  return { shouldRetry: false, maxRetries: 0, delay: 0 };
};

/**
 * Enhanced error logging for monitoring
 */
export const logErrorForMonitoring = (error: any, context: string, userId?: string) => {
  const errorData = {
    timestamp: new Date().toISOString(),
    context,
    userId,
    error: {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url,
      method: error.config?.method
    },
    userAgent: navigator.userAgent,
    url: window.location.href
  };

  // In production, send to monitoring service
  if (import.meta.env.PROD) {
    // TODO: Implement monitoring service integration
    console.warn('Error monitoring:', errorData);
  } else {
    console.error('Development error:', errorData);
  }
};

/**
 * User action error tracking
 */
export const trackUserActionError = (action: string, error: any, context?: any) => {
  const trackingData = {
    action,
    error: {
      message: error.message,
      type: error.constructor.name,
      stack: error.stack
    },
    context,
    timestamp: new Date().toISOString()
  };

  console.warn('User action error:', trackingData);
  
  // TODO: Send to analytics service
};
