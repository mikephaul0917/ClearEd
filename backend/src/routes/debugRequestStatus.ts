/**
 * Debug endpoint to check request status
 */

import express from 'express';
import { InstitutionRequest } from '../models/InstitutionRequest';
import mongoose from 'mongoose';

const router = express.Router();

// Debug endpoint to check specific request status
router.get('/check-request/:requestId', async (req, res) => {
  try {
    const { requestId } = req.params;
    console.log(`🔍 Debug: Checking request status for ID: ${requestId}`);
    
    // Find the specific request
    const request = await InstitutionRequest.findById(requestId);
    
    if (!request) {
      return res.status(404).json({ 
        success: false,
        message: 'Request not found',
        requestId: requestId
      });
    }
    
    console.log('Request details:', {
      id: request._id,
      institutionName: request.institutionName,
      status: request.status,
      createdAt: request.createdAt,
      verifiedAt: request.verifiedAt,
      reviewedAt: request.reviewedAt,
      reviewedBy: request.reviewedBy
    });
    
    res.json({
      success: true,
      message: 'Request status retrieved',
      data: {
        id: request._id,
        institutionName: request.institutionName,
        status: request.status,
        createdAt: request.createdAt,
        verifiedAt: request.verifiedAt,
        reviewedAt: request.reviewedAt,
        reviewedBy: request.reviewedBy
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
