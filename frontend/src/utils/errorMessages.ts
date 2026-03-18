/**
 * Human-readable error messages for the E-Clearance application
 * No technical jargon, clear reasons, and actionable next steps
 */

export const ERROR_MESSAGES = {
  // Authentication Errors
  AUTH: {
    INVALID_CREDENTIALS: {
      title: "Incorrect email or password",
      message: "Please check your credentials and try again.",
      nextStep: "Double-check your email and password, or contact your administrator if you need help."
    },
    ACCOUNT_LOCKED: {
      title: "Account temporarily locked",
      message: "Too many failed login attempts.",
      nextStep: "Please wait 10 minutes and try again, or contact your administrator."
    },
    ACCOUNT_DISABLED: {
      title: "Account is inactive",
      message: "Your account has been disabled.",
      nextStep: "Please contact your administrator to reactivate your account."
    },
    INSTITUTION_NOT_APPROVED: {
      title: "Institution not yet approved",
      message: "Your institution is still waiting for approval.",
      nextStep: "Check back later or contact your institution administrator."
    },
    INSTITUTION_REJECTED: {
      title: "Institution access denied",
      message: "Your institution's request was not approved.",
      nextStep: "Please contact your institution administrator for assistance."
    },
    INSTITUTION_SUSPENDED: {
      title: "Institution temporarily suspended",
      message: "Your institution's access has been suspended.",
      nextStep: "Please contact your institution administrator."
    },
    EMAIL_NOT_VERIFIED: {
      title: "Email verification required",
      message: "Please verify your email address first.",
      nextStep: "Check your inbox for the verification email and click the verification link."
    },
    SESSION_EXPIRED: {
      title: "Session expired",
      message: "You've been logged out for security.",
      nextStep: "Please sign in again to continue."
    },
    NETWORK_ERROR: {
      title: "Connection problem",
      message: "Can't reach the server right now.",
      nextStep: "Check your internet connection and try again."
    }
  },

  // Permission Errors
  PERMISSION: {
    ACCESS_DENIED: {
      title: "Access denied",
      message: "You don't have permission to view this page.",
      nextStep: "Contact your administrator if you need access to this feature."
    },
    INSUFFICIENT_ROLE: {
      title: "Access level insufficient",
      message: "This feature requires a higher access level.",
      nextStep: "Speak with your administrator about getting the appropriate permissions."
    },
    RESOURCE_NOT_FOUND: {
      title: "Resource not found",
      message: "The item you're looking for doesn't exist or has been removed.",
      nextStep: "Go back to the previous page or search for what you need."
    },
    ACTION_NOT_ALLOWED: {
      title: "Action not permitted",
      message: "You cannot perform this action.",
      nextStep: "Contact your administrator if you believe this is an error."
    }
  },

  // Form Validation Errors
  VALIDATION: {
    REQUIRED_FIELD: {
      title: "Missing information",
      message: "Please fill in all required fields.",
      nextStep: "Look for fields marked with an asterisk (*) and complete them."
    },
    INVALID_EMAIL: {
      title: "Invalid email format",
      message: "Please enter a valid email address.",
      nextStep: "Example: user@institution.edu"
    },
    PASSWORD_TOO_SHORT: {
      title: "Password too short",
      message: "Password must be at least 8 characters long.",
      nextStep: "Choose a stronger password with letters, numbers, and symbols."
    },
    PASSWORDS_DONT_MATCH: {
      title: "Passwords don't match",
      message: "Please make sure both passwords are identical.",
      nextStep: "Re-type both passwords carefully."
    },
    INVALID_FILE_TYPE: {
      title: "Invalid file type",
      message: "This file type is not allowed.",
      nextStep: "Please upload a valid file type (PDF, DOC, DOCX)."
    },
    FILE_TOO_LARGE: {
      title: "File too large",
      message: "File size exceeds the maximum limit.",
      nextStep: "Please compress your file or choose a smaller one (max 5MB)."
    }
  },

  // System Errors
  SYSTEM: {
    SERVER_ERROR: {
      title: "Something went wrong",
      message: "We're having trouble processing your request.",
      nextStep: "Please try again in a few moments, or contact support if the problem continues."
    },
    DATABASE_ERROR: {
      title: "System maintenance",
      message: "Our system is currently under maintenance.",
      nextStep: "Please try again later. We apologize for the inconvenience."
    },
    SAVE_FAILED: {
      title: "Couldn't save changes",
      message: "Your changes couldn't be saved.",
      nextStep: "Please try again or check your internet connection."
    },
    DELETE_FAILED: {
      title: "Couldn't delete item",
      message: "This item couldn't be removed.",
      nextStep: "Please try again or contact your administrator."
    },
    UPLOAD_FAILED: {
      title: "Upload failed",
      message: "Your file couldn't be uploaded.",
      nextStep: "Check your file and try again, or contact support."
    }
  },

  // Business Logic Errors
  BUSINESS: {
    DUPLICATE_REQUEST: {
      title: "Request already exists",
      message: "You've already submitted this request.",
      nextStep: "Check your existing requests or contact support."
    },
    DEADLINE_PASSED: {
      title: "Deadline has passed",
      message: "The deadline for this action has passed.",
      nextStep: "Contact your administrator if you need an extension."
    },
    QUOTA_EXCEEDED: {
      title: "Limit reached",
      message: "You've reached the maximum limit for this action.",
      nextStep: "Contact your administrator to increase your limit."
    },
    DEPENDENCY_BLOCKED: {
      title: "Action blocked",
      message: "This action requires other steps to be completed first.",
      nextStep: "Complete the required steps and try again."
    }
  }
} as const;

/**
 * Get user-friendly error message based on error type
 */
export const getErrorMessage = (error: any, fallbackMessage?: string) => {
  // Try to extract error type from backend response
  const errorType = error?.response?.data?.type || error?.code || 'UNKNOWN';
  const statusCode = error?.response?.status;

  // Network errors
  if (!error.response && error.message?.includes('Network Error')) {
    return ERROR_MESSAGES.AUTH.NETWORK_ERROR;
  }

  // HTTP Status Code mapping
  if (statusCode) {
    switch (statusCode) {
      case 401:
        return ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS;
      case 403:
        return ERROR_MESSAGES.PERMISSION.ACCESS_DENIED;
      case 404:
        return ERROR_MESSAGES.PERMISSION.RESOURCE_NOT_FOUND;
      case 429:
        return ERROR_MESSAGES.AUTH.ACCOUNT_LOCKED;
      case 500:
        return ERROR_MESSAGES.SYSTEM.SERVER_ERROR;
      case 503:
        return ERROR_MESSAGES.SYSTEM.DATABASE_ERROR;
    }
  }

  // Backend error type mapping
  if (errorType) {
    // Authentication errors
    if (errorType.includes('ACCOUNT_LOCKED') || errorType.includes('TOO_MANY_ATTEMPTS')) {
      return ERROR_MESSAGES.AUTH.ACCOUNT_LOCKED;
    }
    if (errorType.includes('ACCOUNT_DISABLED') || errorType.includes('USER_DISABLED')) {
      return ERROR_MESSAGES.AUTH.ACCOUNT_DISABLED;
    }
    if (errorType.includes('INSTITUTION_NOT_APPROVED') || errorType.includes('INSTITUTION_PENDING')) {
      return ERROR_MESSAGES.AUTH.INSTITUTION_NOT_APPROVED;
    }
    if (errorType.includes('INSTITUTION_REJECTED')) {
      return ERROR_MESSAGES.AUTH.INSTITUTION_REJECTED;
    }
    if (errorType.includes('INSTITUTION_SUSPENDED')) {
      return ERROR_MESSAGES.AUTH.INSTITUTION_SUSPENDED;
    }
    if (errorType.includes('EMAIL_NOT_VERIFIED')) {
      return ERROR_MESSAGES.AUTH.EMAIL_NOT_VERIFIED;
    }
    if (errorType.includes('SESSION_EXPIRED') || errorType.includes('TOKEN_EXPIRED')) {
      return ERROR_MESSAGES.AUTH.SESSION_EXPIRED;
    }

    // Permission errors
    if (errorType.includes('ACCESS_DENIED') || errorType.includes('FORBIDDEN')) {
      return ERROR_MESSAGES.PERMISSION.ACCESS_DENIED;
    }
    if (errorType.includes('INSUFFICIENT_ROLE') || errorType.includes('ROLE_REQUIRED')) {
      return ERROR_MESSAGES.PERMISSION.INSUFFICIENT_ROLE;
    }

    // Validation errors
    if (errorType.includes('VALIDATION') || errorType.includes('REQUIRED')) {
      return ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD;
    }
    if (errorType.includes('INVALID_EMAIL')) {
      return ERROR_MESSAGES.VALIDATION.INVALID_EMAIL;
    }
    if (errorType.includes('PASSWORD')) {
      return ERROR_MESSAGES.VALIDATION.PASSWORD_TOO_SHORT;
    }

    // System errors
    if (errorType.includes('SAVE') || errorType.includes('CREATE')) {
      return ERROR_MESSAGES.SYSTEM.SAVE_FAILED;
    }
    if (errorType.includes('DELETE') || errorType.includes('REMOVE')) {
      return ERROR_MESSAGES.SYSTEM.DELETE_FAILED;
    }
    if (errorType.includes('UPLOAD')) {
      return ERROR_MESSAGES.SYSTEM.UPLOAD_FAILED;
    }

    // Business logic errors
    if (errorType.includes('DUPLICATE') || errorType.includes('EXISTS')) {
      return ERROR_MESSAGES.BUSINESS.DUPLICATE_REQUEST;
    }
    if (errorType.includes('DEADLINE') || errorType.includes('LATE')) {
      return ERROR_MESSAGES.BUSINESS.DEADLINE_PASSED;
    }
    if (errorType.includes('QUOTA') || errorType.includes('LIMIT')) {
      return ERROR_MESSAGES.BUSINESS.QUOTA_EXCEEDED;
    }
  }

  // Fallback to generic system error
  return fallbackMessage ? {
    title: "Something went wrong",
    message: fallbackMessage,
    nextStep: "Please try again or contact support if the problem continues."
  } : ERROR_MESSAGES.SYSTEM.SERVER_ERROR;
};

/**
 * Format error for display in UI components
 */
export const formatErrorForDisplay = (error: any, fallbackMessage?: string) => {
  const errorInfo = getErrorMessage(error, fallbackMessage);
  
  return {
    title: errorInfo.title,
    message: errorInfo.message,
    nextStep: errorInfo.nextStep,
    fullMessage: `${errorInfo.title}: ${errorInfo.message}. ${errorInfo.nextStep}`
  };
};
