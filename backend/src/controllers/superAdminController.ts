/**
 * Super Admin controller for institution access request approval
 * Handles approval and rejection of institution requests with proper role enforcement
 */

import { Request, Response } from 'express';
import { InstitutionRequest } from '../models/InstitutionRequest';
import { Institution } from '../models/Institution';
import User from '../models/User';
import { AuditLog } from '../models/AuditLog';
import { sendApprovalNotification, sendRejectionNotification } from '../utils/emailService';

/**
 * Get all pending institution requests for Super Admin review
 * Only accessible by users with super_admin role
 */
export const getPendingRequests = async (req: Request, res: Response) => {
  try {
    // Get only PENDING_VERIFICATION and PENDING_APPROVAL requests (exclude APPROVED, REJECTED, etc.)
    const pendingRequests = await InstitutionRequest.find({ 
      status: { 
        $in: ['PENDING_VERIFICATION', 'PENDING_APPROVAL'] 
      }
    })
    .sort({ createdAt: -1 })
    .select('-verificationToken -verificationTokenExpires'); // Exclude sensitive fields
    
    res.json(pendingRequests);
  } catch (error: any) {
    console.error('Error fetching pending requests:', error);
    res.status(500).json({ 
      message: 'Failed to fetch pending requests',
      error: error.message 
    });
  }
};

/**
 * Approve an institution access request
 * Creates institution record, updates user role, and logs the action
 */
export const approveRequest = async (req: Request, res: Response) => {
  try {
    const { requestId } = req.params;
    const adminId = (req as any).user.id;
    const { notes } = req.body;

    // Find the institution request
    const request = await InstitutionRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: 'Institution request not found' });
    }

    if (request.status !== 'PENDING_APPROVAL') {
      return res.status(400).json({ 
        message: 'Request is not in pending approval status' 
      });
    }

    // Check if institution already exists with this domain
    const existingInstitution = await Institution.findOne({ 
      domain: request.academicDomain 
    });
    
    let institution;
    if (existingInstitution) {
      // Update existing institution instead of creating new one
      console.log('Updating existing institution with domain:', request.academicDomain);
      console.log('Existing institution ID:', existingInstitution._id);
      
      const updateResult = await Institution.updateOne(
        { domain: request.academicDomain },
        {
          $set: {
            name: request.institutionName,
            address: request.physicalAddress,
            contactNumber: request.contactNumber,
            administratorName: request.administratorName,
            administratorPosition: request.administratorPosition,
            email: request.administratorEmail,
            status: 'approved',
            updatedAt: new Date()
          }
        }
      );
      institution = existingInstitution; // Use the existing institution object
      console.log('Updated institution ID after update:', institution._id);
      console.log('Updated institution status after update:', institution.status);
    } else {
      // Create new institution record
      console.log('Creating new institution with domain:', request.academicDomain);
      
      try {
        institution = await Institution.create({
          name: request.institutionName,
          domain: request.academicDomain,
          address: request.physicalAddress,
          contactNumber: request.contactNumber,
          administratorName: request.administratorName,
          administratorPosition: request.administratorPosition,
          email: request.administratorEmail,
          status: 'approved',
          settings: {
            allowStudentRegistration: true,
            requireEmailVerification: true
          }
        });
        console.log('Created new institution ID:', institution._id);
        console.log('Created new institution status after creation:', institution.status);
      } catch (createError: any) {
        console.error('Institution creation error:', createError);
        throw createError;
      }
    }

    // Wait for institution operation to complete before using it
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Verify institution was properly created/updated
    const verifiedInstitution = await Institution.findById(institution._id);
    if (!verifiedInstitution) {
      console.error('Institution verification failed - institution not found after creation/update');
      throw new Error('Institution creation/update failed');
    }
    
    console.log('Final institution status:', verifiedInstitution?.status);

    // Update the requesting user's role to institution_admin
    await User.findOneAndUpdate(
      { email: request.administratorEmail },
      { 
        role: 'admin', // Use 'admin' role as institution_admin equivalent
        institutionId: institution._id,
        emailVerified: true
      },
      { new: true }
    );

    // Update request status
    console.log('Before approve - Request status:', request.status);
    console.log('Before approve - Request ID:', request._id);
    console.log('Before approve - Institution exists:', !!existingInstitution);
    
    try {
      await request.approve(adminId, notes);
      console.log('After approve - Request status:', request.status);
      console.log('After approve - Request reviewedAt:', request.reviewedAt);
      console.log('After approve - Request reviewedBy:', request.reviewedBy);
    } catch (approveError: any) {
      console.error('Approve method error:', approveError);
      throw approveError;
    }

    // Log the approval action
    await AuditLog.create({
      userId: adminId,
      institutionId: null, // Super Admin has no institution
      action: 'APPROVE_INSTITUTION_REQUEST',
      resource: 'Institution Request',
      details: `Approved institution request for ${request.institutionName}`,
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('User-Agent'),
      severity: 'high',
      category: 'institution_management'
    });

    // Send approval notification
    try {
      await sendApprovalNotification(
        request.administratorEmail,
        request.institutionName,
        request.academicDomain
      );
    } catch (emailError) {
      console.error('Failed to send approval email:', emailError);
      // Continue even if email fails
    }

    res.json({ 
      message: 'Institution request approved successfully',
      institution,
      request 
    });

  } catch (error: any) {
    console.error('Error approving request:', error);
    res.status(500).json({ 
      message: 'Failed to approve request',
      error: error.message 
    });
  }
};

/**
 * Reject an institution access request
 * Updates request status with rejection reason and logs the action
 */
export const rejectRequest = async (req: Request, res: Response) => {
  try {
    const { requestId } = req.params;
    const adminId = (req as any).user.id;
    const { rejectionReason } = req.body;

    if (!rejectionReason || rejectionReason.trim().length === 0) {
      return res.status(400).json({ 
        message: 'Rejection reason is required' 
      });
    }

    // Find the institution request
    const request = await InstitutionRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: 'Institution request not found' });
    }

    console.log('Found request:', {
      id: request._id,
      institutionName: request.institutionName,
      administratorEmail: request.administratorEmail,
      administratorName: request.administratorName,
      administratorPosition: request.administratorPosition,
      physicalAddress: request.physicalAddress,
      academicDomain: request.academicDomain,
      status: request.status
    });

    if (request.status !== 'PENDING_APPROVAL' && request.status !== 'PENDING_VERIFICATION') {
      return res.status(400).json({ 
        message: 'Request is not in pending approval or verification status' 
      });
    }

    // Update request status
    await request.reject(adminId, rejectionReason);

    // Log the rejection action
    await AuditLog.create({
      userId: adminId,
      institutionId: null, // Super Admin has no institution
      action: 'REJECT_INSTITUTION_REQUEST',
      resource: 'Institution Request',
      details: `Rejected institution request for ${request.institutionName}: ${rejectionReason}`,
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('User-Agent'),
      severity: 'high',
      category: 'institution_management'
    });

    // Send rejection notification
    try {
      await sendRejectionNotification(
        request.administratorEmail,
        request.institutionName,
        rejectionReason
      );
    } catch (emailError) {
      console.error('Failed to send rejection email:', emailError);
      // Continue even if email fails
    }

    res.json({ 
      message: 'Institution request rejected successfully',
      request 
    });

  } catch (error: any) {
    console.error('Error rejecting request:', error);
    res.status(500).json({ 
      message: 'Failed to reject request',
      error: error.message 
    });
  }
};

/**
 * Get all institution requests with filtering options
 * For Super Admin dashboard and reporting
 */
export const getAllRequests = async (req: Request, res: Response) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    const filter: any = {};
    if (status) {
      filter.status = status;
    }

    const requests = await InstitutionRequest.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit) * Number(page))
      .skip((Number(page) - 1) * Number(limit))
      .select('-verificationToken -verificationTokenExpires');

    const total = await InstitutionRequest.countDocuments(filter);

    res.json({
      requests,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error: any) {
    console.error('Error fetching requests:', error);
    res.status(500).json({ 
      message: 'Failed to fetch requests',
      error: error.message 
    });
  }
};
