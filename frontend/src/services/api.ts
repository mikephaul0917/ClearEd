import axios from 'axios';

// Create an Axios instance
export const api = axios.create({
    // @ts-ignore
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor: Attach JWT and optionally handle SuperAdmin contextual institution scoping
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('authToken') || localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // Automatic parameter proxying for SuperAdmin isolation pages
        const targetInstitutionId = sessionStorage.getItem('targetInstitutionId');
        if (targetInstitutionId) {
            if (config.method === 'get' || config.method === 'delete') {
                config.params = { ...config.params, institutionId: targetInstitutionId };
            } else if (config.method === 'post' || config.method === 'put' || config.method === 'patch') {
                if (config.data instanceof FormData) {
                    config.data.append('institutionId', targetInstitutionId);
                } else if (config.data) {
                    config.data = { ...config.data, institutionId: targetInstitutionId };
                } else {
                    config.data = { institutionId: targetInstitutionId };
                }
            }
        }

        return config;
    },
    (error) => (Promise as any).reject(error)
);

import Swal from 'sweetalert2';

// Response Interceptor: Handle Global Errors (401, 403, 500)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status;

        const showModal = (title: string, description: string, mode: 'success' | 'denied' | 'error' = 'success', onClose?: () => void) => {
            window.dispatchEvent(new CustomEvent('app:show-modal', {
                detail: { title, description, mode, onClose }
            }));
        };

        if (status === 401) {
            const isLoginRequest = error.config?.url?.includes('/login');
            
            if (!isLoginRequest) {
                console.warn('Unauthorized! Logging out...');
                localStorage.removeItem('token');
                localStorage.removeItem('authToken');

                showModal(
                    'Session Expired', 
                    'Please log in again to continue.', 
                    'error', 
                    () => window.dispatchEvent(new Event('auth:unauthorized'))
                );
            }
        } else if (status === 403) {
            const isAuthRequest = error.config?.url?.includes('/google-auth') || error.config?.url?.includes('/login');
            if (!isAuthRequest) {
                console.error('Forbidden! You do not have permission.');
                showModal(
                    'Access Denied', 
                    'You do not have permission to perform this action.', 
                    'denied'
                );
            }
        } else if (status >= 500) {
            console.error('Server Error:', error);
            showModal(
                'Server Error', 
                'Something went wrong on our end. Please try again later.', 
                'error'
            );
        } else if (!error.response && error.request) {
            console.error('Network Error:', error);
            showModal(
                'Network Error', 
                'Could not reach the server. Please check your connection.', 
                'error'
            );
        }

        return (Promise as any).reject(error);
    }
);

// Legacy helpers (can be removed later if unused)
export const setAuthHeader = (token: string) => {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};

export const clearAuthHeader = () => {
    delete api.defaults.headers.common['Authorization'];
};
