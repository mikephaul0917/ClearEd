import React from 'react';
import { Box, Typography } from '@mui/material';

interface EmptyStateProps {
    icon?: React.ReactNode;
    title: string;
    description?: string;
    action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action }) => {
    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                py: 8,
                px: 2,
                borderRadius: 2,
                bgcolor: 'background.paper',
                boxShadow: 1,
            }}
        >
            {icon && (
                <Box sx={{ mb: 2, color: 'text.secondary', '& > svg': { fontSize: 64 } }}>
                    {icon}
                </Box>
            )}
            <Typography variant="h6" gutterBottom color="text.primary" fontWeight="bold">
                {title}
            </Typography>
            {description && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 400 }}>
                    {description}
                </Typography>
            )}
            {action && (
                <Box>
                    {action}
                </Box>
            )}
        </Box>
    );
};
