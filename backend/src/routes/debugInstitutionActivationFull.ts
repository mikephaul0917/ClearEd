/**
 * Comprehensive debug endpoint to check institution activation issues
 */

import express from 'express';
import Institution from '../models/Institution';
import { InstitutionRequest } from '../models/InstitutionRequest';
import User from '../models/User';

const router = express.Router();

// Comprehensive debug endpoint for institution activation
router.get('/debug-institution-activation-full/:domain', async (req, res) => {
  try {
    const { domain } = req.params;
    console.log(`🔍 Full Debug: Checking institution activation for domain: ${domain}`);
    
    // Step 1: Check institution status
    const institution = await Institution.findOne({ domain: domain.toLowerCase() });
    
    // Step 2: Check all requests for this domain
    const allRequests = await InstitutionRequest.find({ 
      academicDomain: domain.toLowerCase() 
    }).sort({ createdAt: -1 });
    
    // Step 3: Check users with this domain
    const users = await User.find({ 
      email: { $regex: new RegExp(`@${domain.toLowerCase()}$`, 'i') } 
    });
    
    // Step 4: Check if there are any validation issues
    let validationIssues = [];
    if (institution) {
      if (institution.status !== 'approved') {
        validationIssues.push(`Institution status is '${institution.status}' instead of 'approved'`);
      }
      if (!institution.approvedAt) {
        validationIssues.push('Institution approvedAt field is missing');
      }
    } else {
      validationIssues.push('Institution not found in database');
    }
    
    console.log('=== COMPREHENSIVE INSTITUTION DEBUG ===');
    console.log('Domain:', domain);
    console.log('Institution found:', !!institution);
    console.log('Institution status:', institution?.status || 'N/A');
    console.log('Institution approvedAt:', institution?.approvedAt || 'N/A');
    console.log('Total requests:', allRequests.length);
    console.log('Request statuses:', allRequests.map(r => ({ id: r._id, status: r.status, reviewedAt: r.reviewedAt })));
    console.log('Users with domain:', users.length);
    console.log('User institutionIds:', users.map(u => ({ email: u.email, institutionId: u.institutionId, role: u.role })));
    console.log('Validation issues:', validationIssues);
    console.log('=== END DEBUG ===');
    
    res.json({
      success: true,
      message: 'Comprehensive institution activation debug complete',
      data: {
        domain: domain,
        institution: institution ? {
          id: institution._id,
          name: institution.name,
          status: institution.status,
          approvedAt: institution.approvedAt,
          createdAt: institution.createdAt,
          updatedAt: institution.updatedAt
        } : null,
        requests: allRequests.map(req => ({
          id: req._id,
          status: req.status,
          createdAt: req.createdAt,
          reviewedAt: req.reviewedAt,
          reviewedBy: req.reviewedBy,
          institutionName: req.institutionName
        })),
        users: users.map(user => ({
          id: user._id,
          email: user.email,
          role: user.role,
          institutionId: user.institutionId,
          emailVerified: user.emailVerified
        })),
        validationIssues: validationIssues
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
