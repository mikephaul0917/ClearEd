import { api } from './api';

export const clearanceService = {
    getRequirements: async (organizationId: string) => {
        const response = await api.get(`/clearance-items/requirements?organizationId=${organizationId}`);
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

    getMyClearances: async () => {
        const response = await api.get('/clearance/my-clearances');
        return response.data;
    },

    resubmitClearance: async () => {
        const response = await api.post('/clearance/resubmit', {});
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

    deleteComment: async (commentId: string) => {
        const response = await api.delete(`/comments/${commentId}`);
        return response.data;
    }
};
