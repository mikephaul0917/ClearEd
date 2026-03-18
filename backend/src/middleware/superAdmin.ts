/**
 * Super Admin middleware for role-based access control
 * 
 * USAGE: This is the primary super admin middleware used in routes
 * - Restricts access to users with super_admin role only
 * - Supports both token-based and populated user authentication
 * - Used in /api/super-admin routes
 * 
 * NGROK COMPATIBILITY: Works with CORS and JWT token authentication
 * - No cookie dependencies - works cross-origin
 * - Token extracted from Authorization header
 * - Compatible with ngrok tunnel access
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const superAdminOnly = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  
  // If user is not populated from basic auth middleware, check token directly
  if (!user) {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ 
        message: 'No token provided' 
      });
    }
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
      (req as any).user = decoded;
      
      // Check if user has super_admin role
      if (decoded.role !== 'super_admin') {
        return res.status(403).json({ 
          message: 'Forbidden: Super Admin access required' 
        });
      }
    } catch (error) {
      return res.status(401).json({ 
        message: 'Invalid token' 
      });
    }
  } else {
    // Check if user exists and has super_admin role
    if (user.role !== 'super_admin') {
      return res.status(403).json({ 
        message: 'Forbidden: Super Admin access required' 
      });
    }
  }
  
  next();
};
