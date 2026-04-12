import { api } from './api';

export const clearanceService = {
    getRequirements: async (organizationId: string) => {
        const response = await api.get(`/clearance-items/requirements?organizationId=${organizationId}`);
        return response.data;
    },

    getRequirementById: async (id: string) => {
        const response = await api.get(`/clearance-items/requirements/${id}`);
        return response.data;
    },

    getSignatorySubmissions: async (requirementId: string) => {
        const response = await api.get(`/signatory/submissions/${requirementId}`);
        return response.data;
    },

    createRequirement: async (data: any) => {
        const isFormData = data instanceof FormData;
        const response = await api.post('/signatory/requirements', data, isFormData ? {
            headers: { 'Content-Type': 'multipart/form-data' }
        } : undefined);
        return response.data;
    },

    updateRequirement: async (id: string, data: any) => {
        const isFormData = data instanceof FormData;
        const response = await api.put(`/signatory/requirements/${id}`, data, isFormData ? {
            headers: { 'Content-Type': 'multipart/form-data' }
        } : undefined);
        return response.data;
    },

    deleteRequirement: async (id: string) => {
        const response = await api.delete(`/signatory/requirements/${id}`);
        return response.data;
    },

    submitRequirement: async (formData: FormData) => {
        const response = await api.post('/clearance-items/submit', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    reviewSubmission: async (submissionId: string, decision: 'approved' | 'rejected', remarks?: string) => {
        const response = await api.post(`/signatory/review/${submissionId}`, {
            decision,
            remarks
        });
        return response.data;
    },

    getOfficerRequirementSubmissions: async (requirementId: string) => {
        const response = await api.get(`/clearance-items/officer/requirement/${requirementId}`);
        return response.data;
    },

    getOfficerSubmissions: async () => {
        const response = await api.get('/clearance-items/officer/submissions');
        return response.data;
    },

    getStudentTodo: async () => {
        const response = await api.get('/student/todo');
        return response.data;
    },

    getTimeline: async () => {
        const response = await api.get('/clearance/timeline');
        return response.data;
    },

    getMyClearances: async (studentId?: string) => {
        const url = studentId ? `/clearance/my-clearances?studentId=${studentId}` : '/clearance/my-clearances';
        const response = await api.get(url);
        return response.data;
    },

    resubmitClearance: async () => {
        const response = await api.post('/clearance/resubmit', {});
        return response.data;
    },

    submitToDean: async () => {
        const response = await api.post('/clearance/submit-to-dean', {});
        return response.data;
    },

    // Poll API Endpoints
    createPoll: async (formData: FormData) => {
        const response = await api.post('/polls', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    getPolls: async (organizationId: string) => {
        const response = await api.get(`/polls/${organizationId}`);
        return response.data;
    },

    // Comment API Endpoints
    getComments: async (requirementId: string) => {
        const response = await api.get(`/comments/${requirementId}`);
        return response.data;
    },

    createComment: async (requirementId: string, content: string) => {
        const response = await api.post(`/comments/${requirementId}`, { content });
        return response.data;
    },

    getPrivateComments: async (requirementId: string, studentId: string) => {
        const response = await api.get(`/comments/${requirementId}?isPrivate=true&studentId=${studentId}`);
        return response.data;
    },

    createPrivateComment: async (requirementId: string, studentId: string, content: string) => {
        const response = await api.post(`/comments/${requirementId}`, { content, isPrivate: true, studentId });
        return response.data;
    },

    deleteComment: async (commentId: string) => {
        const response = await api.delete(`/comments/${commentId}`);
        return response.data;
    },

    markAsOfficerCleared: async (organizationId: string, studentId: string, signatureData?: string) => {
        const response = await api.post(`/signatory/organizations/${organizationId}/clear-student/${studentId}`, { signatureData });
        return response.data;
    },

    bulkMarkAsOfficerCleared: async (organizationId: string, studentIds: string[], signatureData?: string) => {
        const response = await api.post(`/signatory/organizations/${organizationId}/bulk-clear-students`, { studentIds, signatureData });
        return response.data;
    },

    getOrganizationClearanceOverview: async (organizationId: string) => {
        const response = await api.get(`/signatory/organizations/${organizationId}/clearance-overview`);
        return response.data;
    },

    revokeOfficerClearance: async (organizationId: string, studentId: string) => {
        const response = await api.post(`/signatory/organizations/${organizationId}/revoke-clearance/${studentId}`);
        return response.data;
    },

    bulkRevokeOfficerClearance: async (organizationId: string, studentIds: string[]) => {
        const response = await api.post(`/signatory/organizations/${organizationId}/bulk-revoke-clearance`, { studentIds });
        return response.data;
    }
};
