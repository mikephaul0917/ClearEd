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
                py: 12,
                px: 4,
                borderRadius: '16px',
                border: '1.5px dashed #CBD5E1',
                bgcolor: 'transparent',
                my: 4
            }}
        >
            {icon && (
                <Box sx={{ mb: 2, color: '#94A3B8', '& > svg': { fontSize: 48 } }}>
                    {icon}
                </Box>
            )}
            <Typography sx={{ fontWeight: 700, color: "#1E293B", fontSize: "1.25rem", mb: 1 }}>
                {title}
            </Typography>
            {description && (
                <Typography sx={{ color: "#64748B", fontSize: "1rem", maxWidth: 440, mb: 3, lineHeight: 1.5 }}>
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
