import { api } from './api';

export const studentService = {
    getProfile: async () => {
        const response = await api.get('/student/profile');
        return response.data;
    },

    updateRequirements: async (data: any) => {
        const response = await api.post('/student/requirements', data);
        return response.data;
    }
};
