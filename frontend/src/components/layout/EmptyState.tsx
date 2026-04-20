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
                py: { xs: 6, sm: 10, md: 12 },
                px: { xs: 3, sm: 4 },
                borderRadius: '16px',
                border: '1.5px dashed #CBD5E1',
                bgcolor: 'transparent',
                my: 4,
                width: '100%',
                boxSizing: 'border-box'
            }}
        >
            {icon && (
                <Box sx={{ mb: 2, color: '#94A3B8', '& > svg': { fontSize: { xs: 40, sm: 48 } } }}>
                    {icon}
                </Box>
            )}
            <Typography sx={{ 
                fontWeight: 700, 
                color: "#1E293B", 
                fontSize: { xs: "1.125rem", sm: "1.25rem" }, 
                mb: 1,
                lineHeight: 1.2
            }}>
                {title}
            </Typography>
            {description && (
                <Typography sx={{ 
                    color: "#64748B", 
                    fontSize: { xs: "0.875rem", sm: "1rem" }, 
                    maxWidth: 440, 
                    mb: 3, 
                    lineHeight: 1.5 
                }}>
                    {description}
                </Typography>
            )}
            {action && (
                <Box sx={{ width: { xs: '100%', sm: 'auto' } }}>
                    {action}
                </Box>
            )}
        </Box>
    );
};
