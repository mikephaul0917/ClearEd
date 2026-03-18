/**
 * Comprehensive debug endpoint to check institution activation issues
 */

import express from 'express';
import { Institution } from '../models/Institution';
import { InstitutionRequest } from '../models/InstitutionRequest';
import User from '../models/User';
import mongoose from 'mongoose';

const router = express.Router();

// Comprehensive debug endpoint for institution activation
router.get('/debug-institution-activation/:domain', async (req, res) => {
  try {
    const { domain } = req.params;
    console.log(`🔍 Debug: Checking institution activation for domain: ${domain}`);

    // Check institution status
    const institution = await Institution.findOne({ domain: domain.toLowerCase() });

    // Check any pending requests for this domain
    const pendingRequests = await InstitutionRequest.find({
      academicDomain: domain.toLowerCase(),
      status: { $in: ['PENDING_VERIFICATION', 'PENDING_APPROVAL'] }
    });

    // Check users trying to register with this domain
    const users = await User.find({ email: { $regex: new RegExp(`@${domain.toLowerCase()}$`, 'i') } });

    console.log('=== INSTITUTION DEBUG ===');
    console.log('Institution found:', !!institution);
    if (institution) {
      const inst = institution as any;
      console.log('Institution status:', inst.status);
      console.log('Institution approvedAt:', inst.approvedAt);
      console.log('Institution verificationToken:', inst.verificationToken);
      console.log('Institution verificationExpires:', inst.verificationExpires);
    }

    console.log('Pending requests:', pendingRequests.length);
    pendingRequests.forEach(req => {
      console.log(`Request ${req._id}: status=${req.status}, verifiedAt=${req.verifiedAt}`);
    });

    console.log('Users with this domain:', users.length);
    users.forEach(user => {
      console.log(`User ${user._id}: email=${user.email}, role=${user.role}, institutionId=${user.institutionId}, emailVerified=${user.emailVerified}`);
    });
    console.log('=== END DEBUG ===');

    res.json({
      success: true,
      message: 'Institution activation debug complete',
      data: {
        institution: institution ? {
          id: institution._id,
          name: institution.name,
          domain: institution.domain,
          status: institution.status,
          approvedAt: institution.approvedAt,
          verificationToken: (institution as any).verificationToken,
          verificationExpires: (institution as any).verificationExpires
        } : null,
        pendingRequests: pendingRequests.map(req => ({
          id: req._id,
          status: req.status,
          verifiedAt: req.verifiedAt,
          institutionName: req.institutionName
        })),
        users: users.map(user => ({
          id: user._id,
          email: user.email,
          role: user.role,
          institutionId: user.institutionId,
          emailVerified: user.emailVerified
        }))
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
