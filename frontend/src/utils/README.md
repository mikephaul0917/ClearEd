# Error Handling & User Feedback System

This directory contains utilities for providing human-readable, user-friendly error messages and feedback throughout the E-Clearance application.

## Overview

The error handling system ensures that:
- **No technical jargon** is exposed to users
- **Clear reasons** are provided for what went wrong
- **Actionable next steps** guide users on what to do
- **Backend details** are never exposed to the frontend

## Components

### 1. Error Messages (`errorMessages.ts`)

Centralized repository of user-friendly error messages organized by category:

#### Authentication Errors
- Invalid credentials
- Account locked/disabled
- Institution not approved
- Email verification required
- Session expired

#### Permission Errors
- Access denied
- Insufficient role
- Resource not found
- Action not allowed

#### Validation Errors
- Missing required fields
- Invalid email format
- Password requirements
- File type/size issues

#### System Errors
- Server problems
- Database issues
- Save/delete failures
- Upload problems

#### Business Logic Errors
- Duplicate requests
- Deadline passed
- Quota exceeded
- Dependency blocks

### 2. Error Display (`ErrorDisplay.tsx`)

React components for displaying errors in different contexts:

- **Alert**: Inline error messages with actions
- **Card**: Standalone error cards for sections
- **Full**: Full-page error layouts

### 3. Error Handling (`errorHandling.ts`)

Utilities for consistent error processing:

- API error handling
- Network error detection
- Error logging and monitoring
- User action tracking

## Usage Examples

### Basic Error Display
```tsx
import { ErrorDisplay } from '../components/ui';

<ErrorDisplay 
  error={error}
  variant="alert"
  onRetry={() => refetch()}
  onClose={() => setError(null)}
/>
```

### Form Validation
```tsx
import { ERROR_MESSAGES } from '../utils/errorMessages';

if (!email) {
  const validationError = ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD;
  showError(validationError.title, validationError.message);
}
```

### API Error Handling
```tsx
import { handleApiError } from '../utils/errorHandling';

try {
  await api.post('/data', payload);
} catch (error) {
  const userError = handleApiError(error, 'Create Data');
  showNotification(userError.message, 'error');
}
```

### Permission Denied
```tsx
import { ERROR_MESSAGES } from '../utils/errorMessages';

const permissionError = ERROR_MESSAGES.PERMISSION.ACCESS_DENIED;
return (
  <ErrorDisplay 
    error={permissionError}
    variant="card"
    onGoBack={() => navigate('/dashboard')}
  />
);
```

## Error Message Structure

Each error message follows this structure:

```typescript
{
  title: "Clear, non-technical title",
  message: "Simple explanation of what happened",
  nextStep: "Actionable guidance on what to do"
}
```

### Example Transformations

**Before (Technical):**
```
"Authentication Failed: User not found in institution"
```

**After (User-Friendly):**
```
Title: "Account not found"
Message: "We couldn't find your account in this institution."
Next Step: "Please check your email or contact your administrator."
```

**Before (Backend Exposure):**
```
Error: 500 Internal Server Error - MongoDB connection timeout
```

**After (User-Friendly):**
```
Title: "System maintenance"
Message: "Our system is currently under maintenance."
Next Step: "Please try again later. We apologize for the inconvenience."
```

## Integration Guidelines

### 1. Never Expose Backend Details
❌ **Wrong:**
```tsx
catch (error) {
  alert(error.response?.data?.message || error.message);
}
```

✅ **Right:**
```tsx
catch (error) {
  const errorInfo = formatErrorForDisplay(error);
  alert(errorInfo.message);
}
```

### 2. Always Provide Next Steps
❌ **Wrong:**
```tsx
showError("Login failed");
```

✅ **Right:**
```tsx
const errorInfo = formatErrorForDisplay(error);
showError(errorInfo.message, errorInfo.nextStep);
```

### 3. Use Appropriate Error Types
❌ **Wrong:**
```tsx
// Using system error for validation
showError("Something went wrong"); // For missing email
```

✅ **Right:**
```tsx
const validationError = ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD;
showError(validationError.title, validationError.message);
```

## Error Type Detection

The system automatically detects error types:

```typescript
import { isNetworkError, isAuthError, isServerError } from '../utils/errorHandling';

if (isNetworkError(error)) {
  // Show connection problem message
}

if (isAuthError(error)) {
  // Show login required message
}

if (isServerError(error)) {
  // Show maintenance message
}
```

## Monitoring & Logging

### Development
- Detailed error logging to console
- Stack traces and technical details preserved
- Context information included

### Production
- User-friendly messages only
- Technical details sent to monitoring service
- Error tracking for analytics

```typescript
import { logErrorForMonitoring } from '../utils/errorHandling';

try {
  await criticalOperation();
} catch (error) {
  logErrorForMonitoring(error, 'Critical Operation', userId);
  const userError = formatErrorForDisplay(error);
  showUserError(userError);
}
```

## Testing Error Scenarios

### 1. Network Errors
- Disconnect network
- Test offline behavior
- Verify retry mechanisms

### 2. Authentication Errors
- Invalid credentials
- Expired sessions
- Permission denied

### 3. Validation Errors
- Missing required fields
- Invalid formats
- File size/type issues

### 4. System Errors
- Server unavailable
- Database errors
- Timeouts

## Best Practices

### 1. Consistent Language
- Use simple, everyday words
- Avoid technical terms
- Maintain consistent tone

### 2. Actionable Guidance
- Always tell users what to do next
- Provide specific steps when possible
- Include contact information when needed

### 3. Context Awareness
- Consider user role and permissions
- Adapt messages to current context
- Provide relevant options

### 4. Error Recovery
- Offer retry options when appropriate
- Provide alternative actions
- Include escape routes

## Migration Guide

### Step 1: Replace Direct Error Exposure
```tsx
// Old
catch (error) {
  alert(error.response?.data?.message);
}

// New
catch (error) {
  const errorInfo = formatErrorForDisplay(error);
  alert(errorInfo.message);
}
```

### Step 2: Add Next Steps
```tsx
// Old
showError("Login failed");

// New
const errorInfo = formatErrorForDisplay(error);
showError(errorInfo.message, errorInfo.nextStep);
```

### Step 3: Use Error Components
```tsx
// Old
<div className="error">{error}</div>

// New
<ErrorDisplay error={error} variant="alert" />
```

### Step 4: Add Error Logging
```tsx
// Old
catch (error) {
  showError(error.message);
}

// New
catch (error) {
  logErrorForMonitoring(error, 'User Action');
  const userError = formatErrorForDisplay(error);
  showError(userError.message);
}
```

## Support

For questions about error handling:
1. Check this documentation
2. Review existing error message patterns
3. Test error scenarios in development
4. Monitor error logs in production

Remember: Good error handling is about user experience, not just error prevention.
