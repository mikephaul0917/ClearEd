import { api } from './api';

export const authService = {
    login: async (email: string, password: string, isSuperAdmin = false) => {
        const endpoint = isSuperAdmin ? '/auth/super-admin/login' : '/auth/login';
        const response = await api.post(endpoint, { email, password });
        return response.data;
    },

    googleAuth: async (token: string) => {
        const response = await api.post('/unified-auth/google-auth', { token });
        return response.data;
    },

    register: async (userData: any) => {
        const response = await api.post('/unified-auth/create-user', userData);
        return response.data;
    },

    getPublicQuotes: async (page: string) => {
        const response = await api.get(`/quotes/${page}`);
        return response.data;
    },

    getInstitutionByDomain: async (domain: string) => {
        const response = await api.get(`/unified-auth/institution?domain=${domain}`);
        return response.data;
    },

    updateProfile: async (username: string) => {
        const response = await api.put('/auth/profile', { username });
        return response.data;
    },

    updatePassword: async (passwords: any) => {
        const response = await api.put('/auth/password', passwords);
        return response.data;
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('authToken');
        localStorage.removeItem('email');
        localStorage.removeItem('username');
    }
};
