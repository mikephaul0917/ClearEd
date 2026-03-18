import { api } from './api';

export interface SignatoryRequirement {
    _id: string;
    title: string;
    description: string;
    instructions?: string;
    requiredFiles: string[];
    isMandatory: boolean;
    organizationId: {
        _id: string;
        name: string;
    };
    isActive: boolean;
    createdAt: string;
}

export const signatoryService = {
    getRequirements: async () => {
        const response = await api.get('/signatory/requirements');
        return response.data;
    },

    createRequirement: async (data: Partial<SignatoryRequirement>) => {
        const response = await api.post('/signatory/requirements', data);
        return response.data;
    },

    updateRequirement: async (id: string, data: Partial<SignatoryRequirement>) => {
        const response = await api.put(`/signatory/requirements/${id}`, data);
        return response.data;
    },

    deleteRequirement: async (id: string) => {
        const response = await api.delete(`/signatory/requirements/${id}`);
        return response.data;
    }
};
