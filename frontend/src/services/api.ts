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

        if (status === 401) {
            const isLoginRequest = error.config?.url?.includes('/login');
            
            if (!isLoginRequest) {
                console.warn('Unauthorized! Logging out...');
                // Clear token to prevent loops
                localStorage.removeItem('token');
                localStorage.removeItem('authToken');

                Swal.fire({
                    icon: 'error',
                    title: 'Session Expired',
                    text: 'Please log in again to continue.',
                    confirmButtonColor: '#3085d6',
                }).then(() => {
                    window.dispatchEvent(new Event('auth:unauthorized'));
                });
            }
        } else if (status === 403) {
            console.error('Forbidden! You do not have permission.');
            Swal.fire({
                icon: 'warning',
                title: 'Access Denied',
                text: 'You do not have permission to perform this action.',
                confirmButtonColor: '#f8bb86',
            });
        } else if (status >= 500) {
            console.error('Server Error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Server Error',
                text: 'Something went wrong on our end. Please try again later.',
                confirmButtonColor: '#d33',
            });
        } else if (!error.response && error.request) {
            // Network errors or CORS issues (no response)
            console.error('Network Error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Network Error',
                text: 'Could not reach the server. Please check your connection.',
                confirmButtonColor: '#d33',
            });
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
