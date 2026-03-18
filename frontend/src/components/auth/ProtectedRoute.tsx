import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Box, CircularProgress, Typography, Paper } from '@mui/material';
import { ERROR_MESSAGES } from '../../utils/errorMessages';

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    // Debug logging for troubleshooting
    console.log('[ProtectedRoute Debug]', {
        path: location.pathname,
        user: user ? { id: user.id, role: user.role, email: user.email } : null,
        loading,
        allowedRoles
    });

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!user) {
        console.log('[ProtectedRoute] No user found, redirecting to login');
        // Redirect to login but save the current location to redirect back after login
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        console.log('[ProtectedRoute] Access denied - redirecting to home', {
            userRole: user.role,
            allowedRoles,
            path: location.pathname
        });
        // Silent redirect to home page instead of showing error message
        return <Navigate to="/home" replace />;
    }

    console.log('[ProtectedRoute] Access granted');
    return <>{children}</>;
};

export default ProtectedRoute;
