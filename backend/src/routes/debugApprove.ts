/**
 * Debug endpoint to test approve function
 */

import express from 'express';
import { InstitutionRequest } from '../models/InstitutionRequest';
import { Institution } from '../models/Institution';
import mongoose from 'mongoose';

const router = express.Router();

// Debug endpoint to test approve function
router.post('/test-approve/:requestId', async (req, res) => {
  try {
    const { requestId } = req.params;
    const adminId = new mongoose.Types.ObjectId('507f1f7d8f9e2c1234567890'); // Mock admin ID as ObjectId
    
    console.log(`🧪 Testing approve function for request: ${requestId}`);
    
    // Find the request
    const request = await InstitutionRequest.findById(requestId);
    
    if (!request) {
      return res.status(404).json({ 
        success: false,
        message: 'Institution request not found',
        requestId: requestId
      });
    }
    
    console.log('Request found:', {
      id: request._id,
      institutionName: request.institutionName,
      status: request.status,
      academicDomain: request.academicDomain
    });
    
    // Check if status is correct for approval
    if (request.status !== 'PENDING_APPROVAL') {
      return res.status(400).json({ 
        success: false,
        message: 'Request is not in pending approval status',
        currentStatus: request.status,
        expectedStatus: 'PENDING_APPROVAL'
      });
    }
    
    // Try to call the approve method
    console.log('Calling approve method...');
    
    try {
      // Call the instance method
      const updatedRequest = await request.approve(adminId, 'Test approval');
      
      console.log('Approve method result:', updatedRequest);
      
      res.json({
        success: true,
        message: 'Request approved successfully',
        request: updatedRequest
      });
      
    } catch (approveError: any) {
      console.error('Approve method error:', approveError);
      res.status(500).json({
        success: false,
        message: 'Failed to approve request',
        error: approveError.message
      });
    }
    
  } catch (error: any) {
    console.error('Debug approve endpoint error:', error);
    res.status(500).json({
      success: false,
      message: 'Debug endpoint error',
      error: error.message
    });
  }
});

export default router;
