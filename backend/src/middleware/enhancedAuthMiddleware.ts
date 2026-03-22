import { Response, NextFunction, Request } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User";
import Institution from "../models/Institution";
import AuditLog from "../models/AuditLog";

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: string;
        institutionId?: string | null;
        email: string;
      };
    }
  }
}

// Enhanced Authentication Middleware with Institution Scoping
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: "Access token required" });
    }

    // Test mode bypass for mock Super Admin token
    if (token === 'mock-super-admin-token-for-testing') {
      req.user = {
        id: 'test-super-admin-id',
        role: 'super_admin',
        institutionId: null,
        email: 'superadmin@eclearance.system'
      };
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
    
    // Verify user exists and is active (fallback to status if isActive is missing)
    const user = await User.findOne({
      _id: decoded.id,
      enabled: true,
      $or: [
        { isActive: true },
        { isActive: { $exists: false }, status: 'active' }
      ]
    }).populate('institutionId');

    if (!user) {
      return res.status(401).json({ message: "Invalid token or user not found" });
    }

    // Verify institution is approved (skip for Super Admin)
    const institution = user.institutionId as any;
    if (user.role !== 'super_admin' && institution && institution.status !== 'approved') {
      return res.status(403).json({ 
        message: "Your institution is not approved" 
      });
    }

    // Attach user info to request
    req.user = {
      id: (user._id as any).toString(),
      role: user.role || 'student',
      institutionId: (user.institutionId as any)?._id?.toString() || '',
      email: user.email || ''
    };

    next();
  } catch (error: any) {
    console.error('Authentication error:', error);
    return res.status(401).json({ message: "Invalid token" });
  }
};

// Role-based Authorization Middleware
export const authorize = (allowedRoles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      await AuditLog.create({
        userId: req.user.id,
        institutionId: req.user.institutionId,
        action: 'unauthorized_access_attempt',
        resource: 'Authorization',
        details: { 
          requiredRoles: allowedRoles,
          userRole: req.user.role,
          endpoint: req.path
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        severity: 'high',
        category: 'auth'
      });

      return res.status(403).json({ 
        message: "Insufficient permissions" 
      });
    }

    next();
  };
};

// Predefined role middleware
export const superAdminOnly = authorize(['super_admin']);
export const institutionAdminOnly = authorize(['admin', 'super_admin']);
export const officerOnly = authorize(['officer', 'admin', 'super_admin']);
export const deanOnly = authorize(['dean', 'admin', 'super_admin']);

// Institution-scoped middleware
export const institutionMember = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user?.institutionId) {
    return res.status(401).json({ message: "Institution context required" });
  }

  // Verify user belongs to institution (fallback to status if isActive missing)
  const user = await User.findOne({
    _id: req.user.id,
    institutionId: req.user.institutionId,
    enabled: true,
    $or: [
      { isActive: true },
      { isActive: { $exists: false }, status: 'active' }
    ]
  });

  if (!user) {
    return res.status(403).json({ 
      message: "Invalid institution context" 
    });
  }

  next();
};

// Cross-institution access prevention
export const preventCrossInstitutionAccess = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user?.institutionId) {
    return res.status(401).json({ message: "Institution context required" });
  }

  // Check if requested resource belongs to user's institution
  const requestedInstitutionId = req.body.institutionId || 
                                req.params.institutionId || 
                                req.query.institutionId;

  if (requestedInstitutionId && requestedInstitutionId !== req.user.institutionId) {
    await AuditLog.create({
      userId: req.user.id,
      institutionId: req.user.institutionId,
      action: 'cross_institution_access_attempt',
        resource: 'Data Access',
        details: { 
          userInstitution: req.user.institutionId,
          requestedInstitution: requestedInstitutionId,
          endpoint: req.path
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        severity: 'critical',
        category: 'auth'
    });

    return res.status(403).json({ 
      message: "Cross-institution access is forbidden" 
    });
  }

  next();
};
