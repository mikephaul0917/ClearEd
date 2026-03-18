/**
 * Debug endpoint to check both request and institution status
 */

import express from 'express';
import { InstitutionRequest } from '../models/InstitutionRequest';
import Institution from '../models/Institution';
import mongoose from 'mongoose';

const router = express.Router();

// Debug endpoint to check both request and institution status
router.get('/check-approval-status/:requestId', async (req, res) => {
  try {
    const { requestId } = req.params;
    console.log(`🔍 Debug: Checking approval status for request: ${requestId}`);
    
    // Find the institution request
    const request = await InstitutionRequest.findById(requestId);
    
    if (!request) {
      return res.status(404).json({ 
        success: false,
        message: 'Request not found',
        requestId: requestId
      });
    }
    
    // Find the institution
    const institution = await Institution.findOne({ 
      domain: request.academicDomain 
    });
    
    console.log('Request status:', {
      id: request._id,
      institutionName: request.institutionName,
      status: request.status,
      reviewedAt: request.reviewedAt,
      reviewedBy: request.reviewedBy
    });
    
    console.log('Institution status:', {
      id: institution?._id || 'Not found',
      name: institution?.name,
      status: institution?.status,
      domain: institution?.domain
    });
    
    res.json({
      success: true,
      message: 'Status check complete',
      data: {
        request: {
          id: request._id,
          institutionName: request.institutionName,
          status: request.status,
          reviewedAt: request.reviewedAt,
          reviewedBy: request.reviewedBy
        },
        institution: institution ? {
          id: institution._id,
          name: institution.name,
          status: institution.status,
          domain: institution.domain
        } : null
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
