import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Box, CircularProgress } from '@mui/material';

interface PublicRouteProps {
    children: React.ReactNode;
}

const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (user) {
        // Redirect authenticated users to their respective dashboard
        const dashboardMap: Record<string, string> = {
            student: '/home',
            officer: '/home',
            admin: '/admin',
            super_admin: '/super-admin',
            dean: '/dean',
        };

        return <Navigate to={dashboardMap[user.role] || '/'} replace />;
    }

    return <>{children}</>;
};

export default PublicRoute;
