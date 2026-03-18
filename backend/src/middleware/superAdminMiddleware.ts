import { Response, NextFunction } from "express";
import { AuthRequest } from "./authMiddleware";

export const superAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'super_admin') {
    return res.status(403).json({ 
      message: "Super Admin access required" 
    });
  }
  next();
};
