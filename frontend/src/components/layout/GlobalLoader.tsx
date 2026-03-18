import React from 'react';
import { Backdrop, CircularProgress } from '@mui/material';
import { useLoading } from '../../contexts/LoadingContext';

export const GlobalLoader: React.FC = () => {
    const { isLoading } = useLoading();

    return (
        <Backdrop
            sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 999 }}
            open={isLoading}
        >
            <CircularProgress color="inherit" />
        </Backdrop>
    );
};
