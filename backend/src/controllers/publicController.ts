import { Request, Response } from 'express';
import Institution from '../models/Institution';
import User from '../models/User';
import ClearanceRequest from '../models/ClearanceRequest';

/**
 * Get public system statistics for the landing page
 */
export const getPublicStats = async (_req: Request, res: Response) => {
  try {
    const totalInstitutions = await Institution.countDocuments({ status: 'approved' });
    const studentsClearedCount = await User.countDocuments({ role: 'student', status: { $ne: 'deleted' } });
    const totalRequests = await ClearanceRequest.countDocuments();
    const processedRequests = await ClearanceRequest.countDocuments({ status: { $in: ['completed', 'approved'] } });

    // Success Rate: (Completed Approvals / Total Requests)
    const rawSuccessRate = totalRequests > 0 
      ? (processedRequests / totalRequests) * 100 
      : 0;

    const stats = {
      totalInstitutions: totalInstitutions,
      studentsClearedCount: studentsClearedCount,
      successRate: Math.round(rawSuccessRate), // Strictly real data
      processingSpeed: "15x" // For now, keep the symbolic Processing Speed
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    console.error('Error fetching public stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch public statistics'
    });
  }
};
