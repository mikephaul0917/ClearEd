import { api } from './api';

export const superAdminService = {
    // Institution Requests
    getPendingInstitutionRequests: async () => {
        const response = await api.get('/super-admin/institution-requests/pending');
        return response.data;
    },

    approveInstitutionRequest: async (id: string, data?: any) => {
        const response = await api.post(`/super-admin/institution-requests/${id}/approve`, data);
        return response.data;
    },

    rejectInstitutionRequest: async (id: string, data?: any) => {
        const response = await api.post(`/super-admin/institution-requests/${id}/reject`, data);
        return response.data;
    },

    // System Analytics
    getSystemAnalytics: async (params?: any) => {
        const response = await api.get('/super-admin/system-analytics', { params });
        return response.data;
    },

    // User & Institution Monitoring
    getUsers: async (params?: any) => {
        const response = await api.get('/super-admin/users', { params });
        return response.data;
    },

    getInstitutions: async (status?: string) => {
        const params = status ? { status } : undefined;
        const response = await api.get('/super-admin/institutions', { params });
        return response.data;
    },

    revokeInstitution: async (id: string, data: { reason: string }) => {
        const response = await api.post(`/super-admin/institutions/${id}/revoke`, data);
        return response.data;
    },

    reactivateInstitution: async (id: string) => {
        const response = await api.post(`/super-admin/institutions/${id}/reactivate`);
        return response.data;
    },

    deleteInstitution: async (id: string) => {
        const response = await api.delete(`/super-admin/institutions/${id}`);
        return response.data;
    },

    permanentDeleteInstitution: async (id: string) => {
        const response = await api.delete(`/super-admin/institutions/${id}/permanent`);
        return response.data;
    },

    getUserStats: async () => {
        const response = await api.get('/super-admin/user-stats');
        return response.data;
    },

    getInvitationHistory: async () => {
        const response = await api.get('/super-admin/invitation-history');
        return response.data;
    },

    disableUser: async (userId: string, data?: any) => {
        const response = await api.post(`/super-admin/users/${userId}/disable`, data);
        return response.data;
    },

    // Announcements
    getAnnouncements: async (params?: any) => {
        const response = await api.get('/announcements', { params });
        return response.data;
    },

    getAnnouncementStats: async () => {
        const response = await api.get('/announcements/stats');
        return response.data;
    },

    createAnnouncement: async (formData: FormData) => {
        const response = await api.post('/announcements', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    updateAnnouncement: async (id: string, formData: FormData) => {
        const response = await api.put(`/announcements/${id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    deleteAnnouncement: async (id: string) => {
        const response = await api.delete(`/announcements/${id}`);
        return response.data;
    },

    // Audit Logs
    getAuditLogs: async (params?: any) => {
        const response = await api.get('/super-admin/audit-logs', { params });
        return response.data;
    },

    exportAuditLogs: async (params?: any) => {
        const response = await api.get('/super-admin/audit-logs/export', { params });
        return response.data;
    }
};
