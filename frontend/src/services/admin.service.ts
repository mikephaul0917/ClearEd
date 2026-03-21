import { api } from './api';

export const adminService = {
    // User management
    getUsers: async () => {
        const response = await api.get('/admin/users');
        return response.data;
    },

    createUser: async (userData: any) => {
        const response = await api.post('/admin/users', userData);
        return response.data;
    },

    updateUserStatus: async (userId: string, enabled: boolean) => {
        const response = await api.put(`/admin/users/${userId}/status`, { enabled });
        return response.data;
    },

    updateUserRole: async (userId: string, role: string, organizationId?: string) => {
        const response = await api.put(`/admin/users/${userId}/role`, { role, organizationId });
        return response.data;
    },

    updateUserProfile: async (userId: string, profile: any) => {
        const response = await api.put(`/admin/users/${userId}/profile`, profile);
        return response.data;
    },

    regenerateAccessKey: async (userId: string) => {
        const response = await api.put(`/admin/users/${userId}/access-key`);
        return response.data;
    },

    // Term Management
    createTerm: async (data: { academicYear: string, semester: string }) => {
        const response = await api.post('/admin/terms', data);
        return response.data;
    },

    getTerms: async () => {
        const response = await api.get('/admin/terms');
        return response.data.data || response.data;
    },

    activateTerm: async (id: string) => {
        const response = await api.put(`/admin/terms/${id}/activate`);
        return response.data;
    },

    deleteTerm: async (id: string) => {
        const response = await api.delete(`/admin/terms/${id}`);
        return response.data;
    },

    // Requirement Management
    getRequirements: async () => {
        const response = await api.get('/admin/requirements');
        return response.data;
    },

    getDeletedRequirements: async () => {
        const response = await api.get('/admin/requirements/deleted');
        return response.data;
    },

    createRequirement: async (data: any) => {
        const response = await api.post('/admin/requirements', data);
        return response.data;
    },

    updateRequirement: async (id: string, data: any) => {
        const response = await api.put(`/admin/requirements/${id}`, data);
        return response.data;
    },

    deleteRequirement: async (id: string) => {
        const response = await api.delete(`/admin/requirements/${id}`);
        return response.data;
    },

    restoreRequirement: async (id: string) => {
        const response = await api.put(`/admin/requirements/${id}/restore`);
        return response.data;
    },

    permanentDeleteRequirement: async (id: string) => {
        const response = await api.delete(`/admin/requirements/${id}/permanent`);
        return response.data;
    },

    // Organization Management
    getOrganizations: async () => {
        const response = await api.get('/admin/organizations');
        return response.data.organizations || response.data;
    },

    getDeletedOrganizations: async () => {
        const response = await api.get('/admin/organizations/deleted');
        return response.data.organizations || response.data;
    },

    createOrganization: async (data: any) => {
        const response = await api.post('/admin/organizations', data);
        return response.data;
    },

    updateOrganization: async (id: string, data: any) => {
        const response = await api.put(`/admin/organizations/${id}`, data);
        return response.data;
    },

    deleteOrganization: async (id: string) => {
        const response = await api.patch(`/admin/organizations/${id}/archive`);
        return response.data;
    },

    restoreOrganization: async (id: string) => {
        const response = await api.put(`/admin/organizations/${id}/restore`);
        return response.data;
    },

    permanentDeleteOrganization: async (id: string) => {
        const response = await api.delete(`/admin/organizations/${id}/permanent`);
        return response.data;
    },

    // Dean Assignments
    getDeanAssignments: async (userId: string) => {
        const response = await api.get(`/admin/users/${userId}/dean-assignments`);
        return response.data;
    },
    addDeanAssignment: async (userId: string, data: { course: string; yearLevel?: string }) => {
        const response = await api.post(`/admin/users/${userId}/dean-assignments`, data);
        return response.data;
    },
    removeDeanAssignment: async (userId: string, assignmentId: string) => {
        const response = await api.delete(`/admin/users/${userId}/dean-assignments/${assignmentId}`);
        return response.data;
    },
    
    // Student Profile (Course and Year Assignment)
    getStudentProfile: async (userId: string) => {
        const response = await api.get(`/admin/users/${userId}/student-profile`);
        return response.data;
    },
    updateStudentProfile: async (userId: string, data: { isStudent: boolean; course?: string; yearLevel?: string }) => {
        const response = await api.put(`/admin/users/${userId}/student-profile`, data);
        return response.data;
    },


    // Quote Management
    getQuotes: async () => {
        const response = await api.get('/admin/quotes');
        return response.data;
    },

    createQuote: async (data: any) => {
        const response = await api.post('/admin/quotes', data);
        return response.data;
    },

    updateQuote: async (id: string, data: any) => {
        const response = await api.put(`/admin/quotes/${id}`, data);
        return response.data;
    },

    deleteQuote: async (id: string) => {
        const response = await api.delete(`/admin/quotes/${id}`);
        return response.data;
    },

    toggleQuoteStatus: async (id: string) => {
        const response = await api.put(`/admin/quotes/${id}/toggle`);
        return response.data;
    },

    // Institution Requests
    getInstitutionRequests: async (status?: string, page: number = 1, limit: number = 10) => {
        const params = new URLSearchParams();
        if (status && status !== 'all') params.append('status', status);
        params.append('page', page.toString());
        params.append('limit', limit.toString());
        const response = await api.get(`/institution-requests?${params}`);
        return response.data;
    },

    getInstitutionRequestStats: async () => {
        const response = await api.get('/institution-requests/stats');
        return response.data;
    },

    getInstitutionRequestDetails: async (id: string) => {
        const response = await api.get(`/institution-requests/${id}`);
        return response.data;
    },

    approveInstitutionRequest: async (id: string, notes?: string) => {
        const response = await api.post(`/institution-requests/${id}/approve`, { notes });
        return response.data;
    },

    rejectInstitutionRequest: async (id: string, reason: string) => {
        const response = await api.post(`/institution-requests/${id}/reject`, { reason });
        return response.data;
    },

    requestClarification: async (id: string, clarification: string) => {
        const response = await api.post(`/institution-requests/${id}/clarify`, { clarification });
        return response.data;
    },

    getInstitution: async () => {
        const response = await api.get('/admin/institution');
        return response.data;
    },

    // Audit Logs
    getAuditLogs: async (params: any) => {
        const response = await api.get('/admin/audit-logs', { params });
        return response.data;
    },

    exportAuditLogs: async (params: any) => {
        const response = await api.get('/admin/audit-logs/export', { params });
        return response.data;
    }
};
