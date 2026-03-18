import React from 'react';
import { Box, CircularProgress, useTheme } from '@mui/material';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: 'primary' | 'secondary' | 'inherit';
  thickness?: number;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  color = 'primary',
  thickness = 4,
  className
}) => {
  const theme = useTheme();
  
  const sizeMap = {
    small: 20,
    medium: 24,
    large: 32
  };

  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      className={className}
    >
      <CircularProgress
        size={sizeMap[size]}
        thickness={thickness}
        color={color}
      />
    </Box>
  );
};

// Compact inline spinner for buttons and small actions
export const InlineSpinner: React.FC<{ color?: string }> = ({ color = '#FFFFFF' }) => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2.5"
    strokeLinecap="round"
    style={{ animation: 'spin 0.75s linear infinite' }}
  >
    <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
    <path d="M12 2a10 10 0 0 1 10 10" />
  </svg>
);

// CSS for inline spinner animation
export const spinnerStyles = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
`;
