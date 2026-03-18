/**
 * Debug endpoint to check institution request status
 */

import express from 'express';
import { InstitutionRequest } from '../models/InstitutionRequest';
import mongoose from 'mongoose';

const router = express.Router();

// Debug endpoint to check all institution requests
router.get('/debug-institution-requests', async (req, res) => {
  try {
    console.log('🔍 Debug: Checking all institution requests...');
    
    // Check database connection
    const dbState = mongoose.connection.readyState;
    console.log('Database state:', dbState);
    
    // Get ALL institution requests to see their statuses
    const allRequests = await InstitutionRequest.find({})
      .sort({ createdAt: -1 })
      .select('-verificationToken -verificationTokenExpires');
    
    console.log('Total requests found:', allRequests.length);
    
    // Group by status
    const statusCounts: Record<string, number> = allRequests.reduce((acc: Record<string, number>, req: any) => {
      acc[req.status] = (acc[req.status] || 0) + 1;
      return acc;
    }, {});
    
    console.log('Status counts:', statusCounts);
    
    // Show details of each request
    const requestDetails = allRequests.map(req => ({
      id: req._id,
      institutionName: req.institutionName,
      administratorEmail: req.administratorEmail,
      status: req.status,
      createdAt: req.createdAt,
      verifiedAt: req.verifiedAt,
      reviewedAt: req.reviewedAt
    }));
    
    res.json({
      success: true,
      message: 'Institution requests debug info',
      data: {
        totalCount: allRequests.length,
        statusCounts,
        requests: requestDetails
      }
    });
    
  } catch (error: any) {
    console.error('Debug endpoint error:', error);
    res.status(500).json({
      success: false,
      message: 'Debug endpoint error',
      error: error.message
    });
  }
});

export default router;
