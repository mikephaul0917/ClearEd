import { Request, Response } from 'express';
import { InstitutionRequest } from '../models/InstitutionRequest';
import { Institution } from '../models/Institution';
import { AuditLog } from '../models/AuditLog';
import crypto from 'crypto';
import { sendVerificationEmail, sendApprovalNotification, sendRejectionNotification } from '../utils/emailService';

// List of free email providers to block
const FREE_EMAIL_DOMAINS = [
  'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'aol.com',
  'icloud.com', 'protonmail.com', 'tutanota.com', 'zoho.com', 'yandex.com',
  'mail.com', 'gmx.com', 'inbox.com', 'mail.ru', 'qq.com', '163.com',
  'sina.com', 'sohu.com', '126.com', 'yeah.net', 'foxmail.com'
];

// Academic domain patterns that should be allowed
const ACADEMIC_DOMAIN_PATTERNS = [
  /\.edu\./,
  /\.ac\./,
  /\.sch\./,
  /\.gov\./,
  /\.edu$/,
  /\.ac$/,
  /\.sch$/,
  /\.gov$/,
  /university/,
  /college/,
  /school/,
  /institute/,
  /academy/
];

export class InstitutionRequestController {
  // Submit new institution access request
  static async submitRequest(req: Request, res: Response) {
    try {
      const {
        institutionName,
        academicDomain,
        physicalAddress,
        contactNumber,
        administratorName,
        administratorPosition,
        administratorEmail
      } = req.body;

      // Validate required fields
      const requiredFields = [
        'institutionName', 'academicDomain', 'physicalAddress',
        'contactNumber', 'administratorName', 'administratorPosition',
        'administratorEmail'
      ];

      for (const field of requiredFields) {
        if (!req.body[field] || req.body[field].trim() === '') {
          return res.status(400).json({
            success: false,
            message: `${field.replace(/([A-Z])/g, ' $1').trim()} is required`
          });
        }
      }

      // Clean and validate academic domain
      const cleanDomain = academicDomain.toLowerCase().trim().replace(/^\.+|\.+$/g, '');
      
      // Check if it's a free email domain
      if (FREE_EMAIL_DOMAINS.includes(cleanDomain)) {
        return res.status(400).json({
          success: false,
          message: 'Free email domains are not allowed. Please use your institutional domain.'
        });
      }

      // Check if domain looks academic (optional validation)
      const isAcademicDomain = ACADEMIC_DOMAIN_PATTERNS.some(pattern => pattern.test(cleanDomain));
      if (!isAcademicDomain) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid academic domain (e.g., university.edu.ph)'
        });
      }

      // Validate that administrator email matches the academic domain
      const emailDomain = administratorEmail.toLowerCase().split('@')[1];
      if (emailDomain !== cleanDomain) {
        return res.status(400).json({
          success: false,
          message: 'Administrator email must match the declared academic domain'
        });
      }

      // Check for existing institution with same domain
      const existingInstitution = await Institution.findOne({ domain: cleanDomain });
      if (existingInstitution) {
        return res.status(409).json({
          success: false,
          message: 'An institution with this domain is already registered'
        });
      }

      // Check for existing request with same domain
      const existingRequest = await InstitutionRequest.findOne({ 
        academicDomain: cleanDomain,
        status: { $in: ['PENDING_VERIFICATION', 'PENDING_APPROVAL'] }
      });
      if (existingRequest) {
        return res.status(409).json({
          success: false,
          message: 'A request for this domain is already being processed'
        });
      }

      // Generate verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Create new institution request
      const institutionRequest = new InstitutionRequest({
        institutionName: institutionName.trim(),
        academicDomain: cleanDomain,
        physicalAddress: physicalAddress.trim(),
        contactNumber: contactNumber.trim(),
        administratorName: administratorName.trim(),
        administratorPosition: administratorPosition.trim(),
        administratorEmail: administratorEmail.toLowerCase().trim(),
        verificationToken,
        verificationTokenExpires,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      await institutionRequest.save();

      // Send verification email
      try {
        await sendVerificationEmail(administratorEmail, verificationToken, institutionName);
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
        // Don't fail the request if email fails, but log it
      }

      // Log the submission
      await AuditLog.create({
        action: 'INSTITUTION_REQUEST_SUBMITTED',
        resource: 'Institution Request',
        resourceType: 'InstitutionRequest',
        resourceId: institutionRequest._id,
        details: {
          institutionName,
          academicDomain: cleanDomain,
          administratorEmail,
          ipAddress: req.ip
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.status(201).json({
        success: true,
        message: 'Institution access request submitted successfully. Please check your email for verification instructions.',
        data: {
          requestId: institutionRequest._id,
          status: institutionRequest.status
        }
      });

    } catch (error: any) {
      console.error('Error submitting institution request:', error);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error code:', error.code);
      console.error('Error stack:', error.stack);
      
      // Handle duplicate key error
      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          message: 'A request for this domain already exists'
        });
      }

      // Handle validation errors
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          message: `Validation error: ${error.message}`
        });
      }

      res.status(500).json({
        success: false,
        message: `Failed to submit institution request: ${error.message}`
      });
    }
  }

  // Verify institution request email
  static async verifyRequest(req: Request, res: Response) {
    try {
      const { token } = req.params;

      if (!token) {
        return res.status(400).json({
          success: false,
          message: 'Verification token is required'
        });
      }

      // Find request by verification token
      const institutionRequest = await InstitutionRequest.findByVerificationToken(token);

      if (!institutionRequest) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired verification token'
        });
      }

      // Check if already verified
      if (institutionRequest.status !== 'PENDING_VERIFICATION') {
        return res.status(400).json({
          success: false,
          message: 'This request has already been verified'
        });
      }

      // Mark as verified
      await institutionRequest.verifyEmail();

      // Log the verification
      await AuditLog.create({
        action: 'INSTITUTION_REQUEST_VERIFIED',
        resourceType: 'InstitutionRequest',
        resourceId: institutionRequest._id,
        details: {
          institutionName: institutionRequest.institutionName,
          academicDomain: institutionRequest.academicDomain,
          administratorEmail: institutionRequest.administratorEmail
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json({
        success: true,
        message: 'Email verified successfully. Your request is now pending review by our administrators.',
        data: {
          status: institutionRequest.status,
          institutionName: institutionRequest.institutionName
        }
      });

    } catch (error: any) {
      console.error('Error verifying institution request:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to verify request. Please try again or contact support.'
      });
    }
  }

  // Get all institution requests (for Super Admin)
  static async getAllRequests(req: Request, res: Response) {
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
        .populate('reviewedBy', 'username email');

      const total = await InstitutionRequest.countDocuments(filter);

      res.json({
        success: true,
        data: {
          requests,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit))
          }
        }
      });

    } catch (error: any) {
      console.error('Error fetching institution requests:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch institution requests'
      });
    }
  }

  // Get single institution request details
  static async getRequestById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const request = await InstitutionRequest.findById(id)
        .populate('reviewedBy', 'username email');

      if (!request) {
        return res.status(404).json({
          success: false,
          message: 'Institution request not found'
        });
      }

      res.json({
        success: true,
        data: request
      });

    } catch (error: any) {
      console.error('Error fetching institution request:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch institution request'
      });
    }
  }

  // Approve institution request
  static async approveRequest(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { notes } = req.body;
      const adminId = (req as any).user._id;

      const request = await InstitutionRequest.findById(id);
      if (!request) {
        return res.status(404).json({
          success: false,
          message: 'Institution request not found'
        });
      }

      if (request.status !== 'PENDING_APPROVAL') {
        return res.status(400).json({
          success: false,
          message: 'Request must be verified before approval'
        });
      }

      // Check if institution already exists (double-check)
      const existingInstitution = await Institution.findOne({ domain: request.academicDomain });
      if (existingInstitution) {
        return res.status(409).json({
          success: false,
          message: 'Institution with this domain already exists'
        });
      }

      // Create new institution
      const institution = new Institution({
        name: request.institutionName,
        domain: request.academicDomain,
        address: request.physicalAddress,
        contactNumber: request.contactNumber,
        administratorName: request.administratorName,
        administratorEmail: request.administratorEmail,
        administratorPosition: request.administratorPosition,
        status: 'approved',
        approvedBy: adminId,
        approvedAt: new Date()
      });

      await institution.save();

      // Update request status
      await request.approve(adminId, notes);

      // Send approval notification
      try {
        await sendApprovalNotification(
          request.administratorEmail,
          request.institutionName,
          request.academicDomain
        );
      } catch (emailError) {
        console.error('Failed to send approval notification:', emailError);
      }

      // Log the approval
      await AuditLog.create({
        action: 'INSTITUTION_REQUEST_APPROVED',
        resourceType: 'InstitutionRequest',
        resourceId: request._id,
        details: {
          institutionName: request.institutionName,
          academicDomain: request.academicDomain,
          institutionId: institution._id,
          approvedBy: adminId
        },
        userId: adminId,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json({
        success: true,
        message: 'Institution request approved successfully',
        data: {
          requestId: request._id,
          institutionId: institution._id,
          status: request.status
        }
      });

    } catch (error: any) {
      console.error('Error approving institution request:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to approve institution request'
      });
    }
  }

  // Reject institution request
  static async rejectRequest(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const adminId = (req as any).user._id;

      if (!reason || reason.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Rejection reason is required'
        });
      }

      const request = await InstitutionRequest.findById(id);
      if (!request) {
        return res.status(404).json({
          success: false,
          message: 'Institution request not found'
        });
      }

      await request.reject(adminId, reason.trim());

      // Send rejection notification
      try {
        await sendRejectionNotification(
          request.administratorEmail,
          request.institutionName,
          reason
        );
      } catch (emailError) {
        console.error('Failed to send rejection notification:', emailError);
      }

      // Log the rejection
      await AuditLog.create({
        action: 'INSTITUTION_REQUEST_REJECTED',
        resourceType: 'InstitutionRequest',
        resourceId: request._id,
        details: {
          institutionName: request.institutionName,
          academicDomain: request.academicDomain,
          rejectionReason: reason,
          rejectedBy: adminId
        },
        userId: adminId,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json({
        success: true,
        message: 'Institution request rejected successfully',
        data: {
          requestId: request._id,
          status: request.status
        }
      });

    } catch (error: any) {
      console.error('Error rejecting institution request:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to reject institution request'
      });
    }
  }

  // Request clarification for institution request
  static async requestClarification(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { clarification } = req.body;
      const adminId = (req as any).user._id;

      if (!clarification || clarification.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Clarification request is required'
        });
      }

      const request = await InstitutionRequest.findById(id);
      if (!request) {
        return res.status(404).json({
          success: false,
          message: 'Institution request not found'
        });
      }

      await request.requestClarification(adminId, clarification.trim());

      // Send clarification notification (you can implement this in emailService)
      // await sendClarificationNotification(request.administratorEmail, request.institutionName, clarification);

      // Log the clarification request
      await AuditLog.create({
        action: 'INSTITUTION_REQUEST_CLARIFICATION',
        resourceType: 'InstitutionRequest',
        resourceId: request._id,
        details: {
          institutionName: request.institutionName,
          academicDomain: request.academicDomain,
          clarificationRequest: clarification,
          requestedBy: adminId
        },
        userId: adminId,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json({
        success: true,
        message: 'Clarification requested successfully',
        data: {
          requestId: request._id,
          status: request.status
        }
      });

    } catch (error: any) {
      console.error('Error requesting clarification:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to request clarification'
      });
    }
  }

  // Get request statistics (for Super Admin dashboard)
  static async getRequestStats(req: Request, res: Response) {
    try {
      const stats = await InstitutionRequest.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      const total = await InstitutionRequest.countDocuments();
      const thisMonth = await InstitutionRequest.countDocuments({
        createdAt: {
          $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        }
      });

      res.json({
        success: true,
        data: {
          byStatus: stats.reduce((acc, stat) => {
            acc[stat._id] = stat.count;
            return acc;
          }, {}),
          total,
          thisMonth
        }
      });

    } catch (error: any) {
      console.error('Error fetching request stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch request statistics'
      });
    }
  }
}
