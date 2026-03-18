import React from 'react';
import {
  Alert,
  AlertTitle,
  Box,
  Typography,
  Button,
  Paper,
  IconButton
} from '@mui/material';
import {
  Close as CloseIcon,
  Refresh as RefreshIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { formatErrorForDisplay } from '../../utils/errorMessages';

interface ErrorDisplayProps {
  error: any;
  fallbackMessage?: string;
  onRetry?: () => void;
  onGoBack?: () => void;
  onClose?: () => void;
  variant?: 'alert' | 'card' | 'full';
  severity?: 'error' | 'warning' | 'info';
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  fallbackMessage,
  onRetry,
  onGoBack,
  onClose,
  variant = 'alert',
  severity = 'error'
}) => {
  const errorInfo = formatErrorForDisplay(error, fallbackMessage);

  if (variant === 'alert') {
    return (
      <Alert 
        severity={severity}
        action={
          (onRetry || onClose) && (
            <Box display="flex" gap={1}>
              {onRetry && (
                <IconButton size="small" onClick={onRetry}>
                  <RefreshIcon />
                </IconButton>
              )}
              {onClose && (
                <IconButton size="small" onClick={onClose}>
                  <CloseIcon />
                </IconButton>
              )}
            </Box>
          )
        }
      >
        <AlertTitle>{errorInfo.title}</AlertTitle>
        <Typography variant="body2">{errorInfo.message}</Typography>
        {errorInfo.nextStep && (
          <Typography variant="caption" display="block" sx={{ mt: 1, opacity: 0.8 }}>
            💡 {errorInfo.nextStep}
          </Typography>
        )}
      </Alert>
    );
  }

  if (variant === 'card') {
    return (
      <Paper 
        sx={{ 
          p: 3, 
          border: `1px solid ${severity === 'error' ? '#FCA5A5' : '#FED7AA'}`,
          backgroundColor: severity === 'error' ? '#FEF2F2' : '#FFF7ED'
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: severity === 'error' ? '#DC2626' : '#EA580C' }}>
            {errorInfo.title}
          </Typography>
          {onClose && (
            <IconButton size="small" onClick={onClose}>
              <CloseIcon />
            </IconButton>
          )}
        </Box>
        
        <Typography sx={{ mb: 2, color: '#64748B' }}>
          {errorInfo.message}
        </Typography>
        
        {errorInfo.nextStep && (
          <Box sx={{ 
            p: 2, 
            backgroundColor: '#F8FAFC', 
            borderRadius: 1, 
            mb: 2,
            border: '1px solid #E2E8F0'
          }}>
            <Typography variant="body2" sx={{ color: '#475569' }}>
              <strong>What to do:</strong> {errorInfo.nextStep}
            </Typography>
          </Box>
        )}

        {(onRetry || onGoBack) && (
          <Box display="flex" gap={2} flexWrap="wrap">
            {onRetry && (
              <Button 
                variant="contained" 
                startIcon={<RefreshIcon />}
                onClick={onRetry}
              >
                Try Again
              </Button>
            )}
            {onGoBack && (
              <Button 
                variant="outlined" 
                startIcon={<ArrowBackIcon />}
                onClick={onGoBack}
              >
                Go Back
              </Button>
            )}
          </Box>
        )}
      </Paper>
    );
  }

  // Full page error
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        p: 3,
        backgroundColor: '#FAFAFA'
      }}
    >
      <Paper
        sx={{
          p: 4,
          maxWidth: 600,
          width: '100%',
          textAlign: 'center',
          borderRadius: 2,
          border: '1px solid #E2E8F0'
        }}
      >
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            backgroundColor: severity === 'error' ? '#FEE2E2' : '#FED7AA',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 3
          }}
        >
          {severity === 'error' ? (
            <Typography variant="h4" sx={{ color: '#DC2626' }}>⚠️</Typography>
          ) : (
            <Typography variant="h4" sx={{ color: '#EA580C' }}>⚡</Typography>
          )}
        </Box>

        <Typography variant="h5" sx={{ fontWeight: 600, mb: 2, color: '#1E293B' }}>
          {errorInfo.title}
        </Typography>

        <Typography sx={{ mb: 3, color: '#64748B', lineHeight: 1.6 }}>
          {errorInfo.message}
        </Typography>

        {errorInfo.nextStep && (
          <Box
            sx={{
              p: 3,
              backgroundColor: '#F8FAFC',
              borderRadius: 2,
              mb: 3,
              border: '1px solid #E2E8F0',
              textAlign: 'left'
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: '#374151' }}>
              💡 Next Steps
            </Typography>
            <Typography variant="body2" sx={{ color: '#6B7280' }}>
              {errorInfo.nextStep}
            </Typography>
          </Box>
        )}

        {(onRetry || onGoBack) && (
          <Box display="flex" gap={2} justifyContent="center" flexWrap="wrap">
            {onRetry && (
              <Button
                variant="contained"
                size="large"
                startIcon={<RefreshIcon />}
                onClick={onRetry}
              >
                Try Again
              </Button>
            )}
            {onGoBack && (
              <Button
                variant="outlined"
                size="large"
                startIcon={<ArrowBackIcon />}
                onClick={onGoBack}
              >
                Go Back
              </Button>
            )}
          </Box>
        )}
      </Paper>
    </Box>
  );
};

// Hook for displaying user-friendly errors
export const useErrorDisplay = () => {
  const showError = (error: any, options?: Partial<ErrorDisplayProps>) => {
    return <ErrorDisplay error={error} {...options} />;
  };

  const getErrorMessage = (error: any, fallbackMessage?: string) => {
    return formatErrorForDisplay(error, fallbackMessage);
  };

  return { showError, getErrorMessage };
};
