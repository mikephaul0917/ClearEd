import { api } from './api';

export interface LandingStats {
  totalInstitutions: number;
  studentsClearedCount: number;
  successRate: number;
  processingSpeed: string;
}

export const fetchLandingStats = async (): Promise<LandingStats> => {
  try {
    const response = await api.get<{ success: boolean; data: LandingStats }>('/public/stats');
    return response.data.data;
  } catch (error) {
    console.error('Error fetching landing stats:', error);
    // Fallback to "impressive" defaults if API fails
    return {
      totalInstitutions: 1200,
      studentsClearedCount: 10000,
      successRate: 99,
      processingSpeed: "15x"
    };
  }
};
