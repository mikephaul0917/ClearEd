import { api } from './api';

export const organizationService = {
    getMyOrganizations: async () => {
        const response = await api.get('/organizations/my-organizations');
        return response.data;
    },

    getOrganization: async (id: string) => {
        const response = await api.get(`/organizations/${id}`);
        return response.data;
    },

    createOrganization: async (data: any) => {
        const response = await api.post('/organizations', data);
        return response.data;
    },

    joinOrganization: async (joinCode: string) => {
        const response = await api.post('/organizations/join', { joinCode });
        return response.data;
    },

    archiveOrganization: async (id: string) => {
        const response = await api.patch(`/organizations/${id}/archive`);
        return response.data;
    },

    getMembers: async (id: string) => {
        const response = await api.get(`/organizations/${id}/members`);
        return response.data;
    },

    removeMember: async (organizationId: string, targetUserId: string) => {
        const response = await api.post('/organizations/remove-member', {
            organizationId,
            targetUserId
        });
        return response.data;
    },

    getTerms: async () => {
        const response = await api.get('/organizations/terms/list');
        return response.data;
    },

    leaveOrganization: async (id: string) => {
        const response = await api.post(`/organizations/${id}/leave`);
        return response.data;
    },

    unarchiveOrganization: async (id: string) => {
        const response = await api.put(`/organizations/${id}/restore`);
        return response.data;
    }
};
